async function unlockWorkersStage(page) {
  const result = await page.evaluate(() => {
    if (!window.rustGame) {
      return { ok: false, reason: 'missing rustGame' };
    }

    const progressionRaw =
      typeof window.rustGame.getProgressionStateJson === 'function'
        ? window.rustGame.getProgressionStateJson()
        : null;
    if (progressionRaw) {
      const progression = JSON.parse(progressionRaw);
      if (progression.current_stage_id && progression.current_stage_id !== 'stage_genesis') {
        return { ok: true, alreadyUnlocked: true, stage: progression.current_stage_id };
      }
    }

    for (let i = 0; i < 60; i++) {
      window.rustGame.click_action();
    }

    for (let i = 0; i < 3; i++) {
      window.rustGame.buy_building(0);
    }

    const unlocked = window.rustGame.unlock_feature('stage_workers');
    if (typeof window.rustGame.update_ui === 'function') {
      window.rustGame.update_ui();
    }
    if (window.updateUnlocksPanel) {
      window.updateUnlocksPanel();
    }

    const afterRaw =
      typeof window.rustGame.getProgressionStateJson === 'function'
        ? window.rustGame.getProgressionStateJson()
        : null;
    const after = afterRaw ? JSON.parse(afterRaw) : null;

    return {
      ok: unlocked || after?.current_stage_id === 'stage_workers' || after?.current_stage_id === 'stage_maggot' || after?.current_stage_id === 'stage_hybrid' || after?.current_stage_id === 'stage_collective',
      unlocked,
      stage: after?.current_stage_id || null,
      coins: typeof window.rustGame.get_coins === 'function' ? window.rustGame.get_coins() : null,
      buildings: typeof window.rustGame.get_buildings === 'function' ? window.rustGame.get_buildings().length : null,
    };
  });

  if (!result.ok) {
    throw new Error(`Failed to unlock workers stage: ${JSON.stringify(result)}`);
  }

  await page.waitForFunction(() => {
    if (!window.rustGame || typeof window.rustGame.getProgressionStateJson !== 'function') {
      return false;
    }

    const progressionRaw = window.rustGame.getProgressionStateJson();
    if (!progressionRaw) {
      return false;
    }

    const progression = JSON.parse(progressionRaw);
    return Boolean(progression.current_stage_id && progression.current_stage_id !== 'stage_genesis');
  }, null, { timeout: 2000 });

  return result;
}

async function unlockMaggotStage(page) {
  await unlockWorkersStage(page);

  const result = await page.evaluate(() => {
    if (!window.rustGame || !window.rustGame.exportToBase64 || !window.rustGame.importFromBase64) {
      return { ok: false, reason: 'missing save import/export APIs' };
    }

    const raw = window.rustGame.exportToBase64();
    const json = JSON.parse(atob(raw));
    const now = Date.now();

    json.state.current_stage = 'Workers';
    json.state.resources = json.state.resources || {};
    json.state.resources.Food = 0;
    json.state.resources.Corpse = 1;
    json.state.resources.Maggot = 1;
    json.state.last_update_time = now - 6000;
    json.last_food_consumption_time = now - 6000;

    if (Array.isArray(json.workers) && json.workers.length > 0) {
      json.workers[0].is_hungry = true;
      json.workers[0].hunger = 100;
      json.workers[0].starvation_start_time = now - 31000;
    }

    window.rustGame.importFromBase64(btoa(JSON.stringify(json)));
    if (typeof window.rustGame.game_loop === 'function') {
      window.rustGame.game_loop();
      window.rustGame.game_loop();
    }

    const progressionRaw = typeof window.rustGame.getProgressionStateJson === 'function'
      ? window.rustGame.getProgressionStateJson()
      : null;
    const progression = progressionRaw ? JSON.parse(progressionRaw) : null;

    return {
      ok: progression?.current_stage_id === 'stage_maggot' || progression?.current_stage_id === 'stage_hybrid' || progression?.current_stage_id === 'stage_collective',
      stage: progression?.current_stage_id || null,
      maggots: json.state.resources.Maggot,
    };
  });

  if (!result.ok) {
    throw new Error(`Failed to unlock maggot stage: ${JSON.stringify(result)}`);
  }

  return result;
}

async function importStageSnapshot(page, { stage, resources = {}, coexistence = {}, technologies = [], buildings = {} } = {}) {
  const result = await page.evaluate(({ stage: targetStage, resources: resourceSeed, coexistence: coexistenceSeed, technologies: technologyIds, buildings: buildingSeed }) => {
    if (!window.rustGame || !window.rustGame.exportToBase64 || !window.rustGame.importFromBase64) {
      return { ok: false, reason: 'missing save import/export APIs' };
    }

    const raw = window.rustGame.exportToBase64();
    const json = JSON.parse(atob(raw));
    json.state = json.state || {};
    json.state.resources = json.state.resources || {};
    json.state.coexistence = json.state.coexistence || {};

    if (targetStage) {
      json.state.current_stage = targetStage;
    }

    for (const [resourceKey, amount] of Object.entries(resourceSeed || {})) {
      json.state.resources[resourceKey] = amount;
    }

    for (const [key, value] of Object.entries(coexistenceSeed || {})) {
      json.state.coexistence[key] = value;
    }

    json.technology_tree = json.technology_tree || {};
    json.technology_tree.technologies = json.technology_tree.technologies || {};
    json.technology_tree.unlocked = Array.isArray(json.technology_tree.unlocked)
      ? json.technology_tree.unlocked
      : [];

    for (const techId of technologyIds || []) {
      if (json.technology_tree.technologies[techId]) {
        json.technology_tree.technologies[techId].purchased = true;
      }
      if (!json.technology_tree.unlocked.includes(techId)) {
        json.technology_tree.unlocked.push(techId);
      }
    }

    if (Array.isArray(json.buildings)) {
      for (const [buildingName, count] of Object.entries(buildingSeed || {})) {
        const building = json.buildings.find((item) => item && item.name === buildingName);
        if (building) {
          building.count = count;
        }
      }
    }

    window.rustGame.importFromBase64(btoa(JSON.stringify(json)));

    const progressionRaw = typeof window.rustGame.getProgressionStateJson === 'function'
      ? window.rustGame.getProgressionStateJson()
      : null;
    const progression = progressionRaw ? JSON.parse(progressionRaw) : null;

    return {
      ok: true,
      stage: progression?.current_stage_id || null,
    };
  }, { stage, resources, coexistence, technologies, buildings });

  if (!result.ok) {
    throw new Error(`Failed to import stage snapshot: ${JSON.stringify(result)}`);
  }

  return result;
}

async function unlockHybridStage(page) {
  await unlockMaggotStage(page);

  return importStageSnapshot(page, {
    stage: 'Hybrid',
    resources: {
      Food: 180,
      Maggot: 120,
      Chemicals: 60,
      DarkMatter: 0,
      Spaceship: 0,
    },
    coexistence: {
      human_pressure: 24,
      maggot_influence: 34,
      symbiosis_stability: 22,
      hybrid_population: 0,
      collective_consciousness: 0,
    },
  });
}

async function unlockCollectiveStage(page) {
  await unlockHybridStage(page);

  return importStageSnapshot(page, {
    stage: 'Collective',
    resources: {
      DarkMatter: 0,
      Spaceship: 0,
    },
    coexistence: {
      collective_consciousness: 0,
    },
  });
}

async function seedResourcesAndResearch(page, { resources = {}, technologies = [] } = {}) {
  const result = await page.evaluate(({ resources: resourceSeed, technologies: techIds }) => {
    if (!window.rustGame || !window.rustGame.exportToBase64 || !window.rustGame.importFromBase64) {
      return { ok: false, reason: 'missing save import/export APIs' };
    }

    const raw = window.rustGame.exportToBase64();
    const json = JSON.parse(atob(raw));
    json.state.resources = json.state.resources || {};

    for (const [resourceKey, amount] of Object.entries(resourceSeed || {})) {
      json.state.resources[resourceKey] = Math.max(json.state.resources[resourceKey] || 0, amount);
    }

    window.rustGame.importFromBase64(btoa(JSON.stringify(json)));

    const researched = [];
    for (const techId of techIds || []) {
      try {
        window.rustGame.research_technology(techId);
        researched.push(techId);
      } catch (error) {
        return {
          ok: false,
          reason: 'research_failed',
          techId,
          researched,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return { ok: true, researched };
  }, { resources, technologies });

  if (!result.ok) {
    throw new Error(`Failed to seed resources/research technologies: ${JSON.stringify(result)}`);
  }

  return result;
}

async function unlockIndustrialBase(page) {
  await unlockWorkersStage(page);

  return seedResourcesAndResearch(page, {
    resources: {
      Gold: 10000,
      Wood: 1500,
      Stone: 1500,
      Coal: 1200,
      Oil: 500,
      IronOre: 500,
      CopperOre: 250,
      CopperIngot: 600,
      Glass: 300,
      Plastic: 200,
    },
    technologies: [
      'BasicMining',
      'BasicLogging',
      'BasicQuarrying',
      'BasicSmelting',
      'BasicRefining',
      'BasicChemistry',
      'BasicEngineering',
      'Electronics',
    ],
  });
}

module.exports = {
  importStageSnapshot,
  unlockWorkersStage,
  unlockMaggotStage,
  unlockHybridStage,
  unlockCollectiveStage,
  seedResourcesAndResearch,
  unlockIndustrialBase,
};
