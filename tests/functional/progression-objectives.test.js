const { test, expect } = require('../fixtures/coverage');
const {
  importStageSnapshot,
  unlockWorkersStage,
  unlockMaggotStage,
  unlockHybridStage,
  unlockCollectiveStage,
  seedResourcesAndResearch,
} = require('../fixtures/stage-helpers');

test.describe('Progression Objectives', () => {
  test('worker stage shows objective panel and recommended first technology', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockWorkersStage(page);

    await expect(page.locator('#objective-panel-anchor')).toBeVisible();
    await expect(page.locator('.objective-title')).toContainText('农场');

    await page.click('[data-tab="technology"]');
    await expect(page.locator('.tech-card.recommended').first()).toBeVisible();

    const recommended = await page.locator('.tech-card.recommended').first().getAttribute('data-tech-id');
    expect(recommended).toBe('BasicAgriculture');
  });

  test('objective sidebar keeps current goal in a dedicated right rail with vertically stacked steps', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockWorkersStage(page);

    const layout = await page.evaluate(() => {
      const shell = document.getElementById('main-shell');
      const sidebar = document.getElementById('objective-sidebar');
      const anchor = document.getElementById('objective-panel-anchor');
      const steps = Array.from(document.querySelectorAll('.objective-step'));
      const shellStyle = shell ? window.getComputedStyle(shell) : null;
      const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
      const mainRect = document.getElementById('main-content')?.getBoundingClientRect() || null;
      const tops = steps.map((step) => step.getBoundingClientRect().top);

      return {
        hasShell: !!shell,
        hasSidebar: !!sidebar,
        anchorVisible: !!anchor && window.getComputedStyle(anchor).display !== 'none',
        shellDisplay: shellStyle ? shellStyle.display : null,
        sidebarHasWidth: !!sidebarRect && sidebarRect.width >= 240,
        stepCount: steps.length,
        verticalStack: tops.every((top, index) => index === 0 || top > tops[index - 1]),
      };
    });

    expect(layout.hasShell).toBe(true);
    expect(layout.hasSidebar).toBe(true);
    expect(layout.anchorVisible).toBe(true);
    expect(layout.shellDisplay).toBe('flex');
    expect(layout.sidebarHasWidth).toBe(true);
    expect(layout.stepCount).toBeGreaterThan(1);
    expect(layout.verticalStack).toBe(true);
  });

  test('maggot buildings stay hidden until dark technology is researched', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockWorkersStage(page);

    const before = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      return buildings.some((building) => building.name === '蛆虫工厂');
    });
    expect(before).toBe(false);

    await unlockMaggotStage(page);

    const hiddenInMaggot = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const progression = JSON.parse(window.rustGame.getProgressionStateJson());
      return {
        stage: progression.current_stage_id,
        hasFactory: buildings.some((building) => building.name === '蛆虫工厂'),
      };
    });

    expect(hiddenInMaggot.stage).toBe('stage_maggot');
    expect(hiddenInMaggot.hasFactory).toBe(false);

    await seedResourcesAndResearch(page, {
      resources: {
        Gold: 5000,
        Wood: 200,
        Food: 200,
        Maggot: 30,
      },
      technologies: ['BasicAgriculture', 'MaggotBreeding'],
    });

    const afterResearch = await page.evaluate(() =>
      window.rustGame.get_buildings().some((building) => building.name === '蛆虫工厂')
    );

    expect(afterResearch).toBe(true);
  });

  test('dark conversion objective waits for an actual maggot processing event', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockMaggotStage(page);

    const objective = await page.evaluate(() => {
      const chain = JSON.parse(window.rustGame.getCurrentObjectiveChainJson());
      return chain.steps.find((step) => step.id === 'complete_dark_conversion');
    });

    expect(objective).toBeTruthy();
    expect(objective.completed).toBe(false);
    expect(objective.current).toBe(0);
  });

  test('maggot objective chain recommends dark research before maggot factory construction', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockMaggotStage(page);

    const chain = await page.evaluate(() => JSON.parse(window.rustGame.getCurrentObjectiveChainJson()));

    expect(chain.current_objective_id).toBe('research_maggot_tech');

    const stepOrder = chain.steps.map((step) => step.id);
    expect(stepOrder.indexOf('research_maggot_tech')).toBeGreaterThan(-1);
    expect(stepOrder.indexOf('build_maggot_facility')).toBeGreaterThan(-1);
    expect(stepOrder.indexOf('research_maggot_tech')).toBeLessThan(stepOrder.indexOf('build_maggot_facility'));
  });

  test('collective objective chain requires consciousness upload before first ship launch', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);

    const chain = await page.evaluate(() => {
      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      json.state.current_stage = 'Collective';
      json.state.resources = json.state.resources || {};
      json.state.resources.DarkMatter = 0;
      json.state.resources.Spaceship = 0;
      window.rustGame.importFromBase64(btoa(JSON.stringify(json)));
      return JSON.parse(window.rustGame.getCurrentObjectiveChainJson());
    });

    expect(chain.current_objective_id).toBe('awaken_collective');

    const stepOrder = chain.steps.map((step) => step.id);
    expect(stepOrder.indexOf('upload_consciousness')).toBeGreaterThan(-1);
    expect(stepOrder.indexOf('launch_first_ship')).toBeGreaterThan(-1);
    expect(stepOrder.indexOf('upload_consciousness')).toBeLessThan(stepOrder.indexOf('launch_first_ship'));
  });

  test('stage objective matrix exposes the expected first blocker for each major stage', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);

    await unlockWorkersStage(page);
    const workerChain = await page.evaluate(() => JSON.parse(window.rustGame.getCurrentObjectiveChainJson()));

    await unlockMaggotStage(page);
    const maggotChain = await page.evaluate(() => JSON.parse(window.rustGame.getCurrentObjectiveChainJson()));

    await unlockHybridStage(page);
    const hybridChain = await page.evaluate(() => JSON.parse(window.rustGame.getCurrentObjectiveChainJson()));

    await unlockCollectiveStage(page);
    const collectiveChain = await page.evaluate(() => JSON.parse(window.rustGame.getCurrentObjectiveChainJson()));

    expect(workerChain.stage_id).toBe('stage_workers');
    expect(workerChain.current_objective_id).toBe('build_farm');

    expect(maggotChain.stage_id).toBe('stage_maggot');
    expect(maggotChain.current_objective_id).toBe('research_maggot_tech');

    expect(hybridChain.stage_id).toBe('stage_hybrid');
    expect(hybridChain.current_objective_id).toBe('gain_hybrid_population');

    expect(collectiveChain.stage_id).toBe('stage_collective');
    expect(collectiveChain.current_objective_id).toBe('awaken_collective');
  });

  test('hybrid stage matrix reveals chamber after host tech and recommends hive mind after the first chamber is built', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockHybridStage(page);

    const before = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const chain = JSON.parse(window.rustGame.getCurrentObjectiveChainJson());
      return {
        stage: chain.stage_id,
        currentObjectiveId: chain.current_objective_id,
        hasChamber: buildings.some((building) => building.name === '共生培育舱'),
      };
    });

    expect(before.stage).toBe('stage_hybrid');
    expect(before.currentObjectiveId).toBe('gain_hybrid_population');
    expect(before.hasChamber).toBe(false);

    await importStageSnapshot(page, {
      stage: 'Hybrid',
      resources: {
        Gold: 50000,
      },
      technologies: ['SymbioticHosts'],
      coexistence: {
        hybrid_population: 2,
        symbiosis_stability: 60,
      },
    });

    const purchase = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const chamber = buildings.find((building) => building.name === '共生培育舱');
      if (!chamber) {
        return { ok: false, reason: 'missing chamber' };
      }

      const ok = window.rustGame.buy_building(chamber.index);
      const refreshed = window.rustGame.get_buildings();
      const refreshedChamber = refreshed.find((building) => building.name === '共生培育舱');
      return {
        ok,
        count: refreshedChamber ? refreshedChamber.count : 0,
      };
    });

    expect(purchase.ok).toBe(true);
    expect(purchase.count).toBeGreaterThan(0);

    const after = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const chain = JSON.parse(window.rustGame.getCurrentObjectiveChainJson());
      return {
        currentObjectiveId: chain.current_objective_id,
        hasChamber: buildings.some((building) => building.name === '共生培育舱'),
      };
    });

    expect(after.hasChamber).toBe(true);
    expect(after.currentObjectiveId).toBe('research_hive_mind');

    await page.click('[data-tab="technology"]');
    await expect(page.locator('.tech-card.recommended').first()).toBeVisible();
    const recommended = await page.locator('.tech-card.recommended').first().getAttribute('data-tech-id');
    expect(recommended).toBe('HiveMindProtocol');
  });

  test('collective stage matrix reveals spires in two steps and recommends consciousness upload before ships', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockCollectiveStage(page);

    const before = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const chain = JSON.parse(window.rustGame.getCurrentObjectiveChainJson());
      return {
        stage: chain.stage_id,
        currentObjectiveId: chain.current_objective_id,
        hasNeuralSpire: buildings.some((building) => building.name === '神经尖塔'),
        hasDeepSpaceHatchery: buildings.some((building) => building.name === '深空孵化港'),
      };
    });

    expect(before.stage).toBe('stage_collective');
    expect(before.currentObjectiveId).toBe('awaken_collective');
    expect(before.hasNeuralSpire).toBe(false);
    expect(before.hasDeepSpaceHatchery).toBe(false);

    await importStageSnapshot(page, {
      stage: 'Collective',
      technologies: ['CollectiveAwakening'],
      resources: {
        DarkMatter: 2,
        Spaceship: 0,
      },
    });

    const afterAwakening = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const chain = JSON.parse(window.rustGame.getCurrentObjectiveChainJson());
      return {
        currentObjectiveId: chain.current_objective_id,
        hasNeuralSpire: buildings.some((building) => building.name === '神经尖塔'),
        hasDeepSpaceHatchery: buildings.some((building) => building.name === '深空孵化港'),
      };
    });

    expect(afterAwakening.hasNeuralSpire).toBe(true);
    expect(afterAwakening.hasDeepSpaceHatchery).toBe(false);
    expect(afterAwakening.currentObjectiveId).toBe('upload_consciousness');

    await page.click('[data-tab="technology"]');
    await expect(page.locator('.tech-card.recommended').first()).toBeVisible();
    const recommended = await page.locator('.tech-card.recommended').first().getAttribute('data-tech-id');
    expect(recommended).toBe('ConsciousnessUpload');

    await importStageSnapshot(page, {
      stage: 'Collective',
      technologies: ['CollectiveAwakening', 'ConsciousnessUpload'],
      resources: {
        DarkMatter: 2,
      },
    });

    const afterUpload = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const chain = JSON.parse(window.rustGame.getCurrentObjectiveChainJson());
      return {
        currentObjectiveId: chain.current_objective_id,
        hasNeuralSpire: buildings.some((building) => building.name === '神经尖塔'),
        hasDeepSpaceHatchery: buildings.some((building) => building.name === '深空孵化港'),
      };
    });

    expect(afterUpload.hasNeuralSpire).toBe(true);
    expect(afterUpload.hasDeepSpaceHatchery).toBe(true);
    expect(afterUpload.currentObjectiveId).toBe('launch_first_ship');
  });

  test('collective resource chain produces dark matter before upload and spaceships after upload', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockCollectiveStage(page);

    await importStageSnapshot(page, {
      stage: 'Collective',
      technologies: ['CollectiveAwakening'],
      resources: {
        Gold: 200000,
        DarkMatter: 0,
        Spaceship: 0,
      },
    });

    const beforeUploadSetup = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const spire = buildings.find((building) => building.name === '神经尖塔');
      if (!spire) {
        return { ok: false, reason: 'missing spire' };
      }

      const purchases = [window.rustGame.buy_building(spire.index), window.rustGame.buy_building(spire.index)];
      const refreshedSpire = window.rustGame.get_buildings().find((building) => building.name === '神经尖塔');
      return {
        ok: purchases.every(Boolean),
        count: refreshedSpire ? refreshedSpire.count : 0,
      };
    });

    expect(beforeUploadSetup.ok).toBe(true);
    expect(beforeUploadSetup.count).toBeGreaterThanOrEqual(2);

    const beforeUpload = await page.evaluate(() => {
      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      json.state.last_update_time = Date.now() - 10000;
      window.rustGame.importFromBase64(btoa(JSON.stringify(json)));

      const before = window.rustGame.get_resources();
      window.rustGame.game_loop();
      const after = window.rustGame.get_resources();

      return {
        beforeDarkMatter: before.DarkMatter || 0,
        afterDarkMatter: after.DarkMatter || 0,
        beforeSpaceship: before.Spaceship || 0,
        afterSpaceship: after.Spaceship || 0,
      };
    });

    expect(beforeUpload.afterDarkMatter).toBeGreaterThan(beforeUpload.beforeDarkMatter);
    expect(beforeUpload.afterSpaceship).toBe(beforeUpload.beforeSpaceship);

    await importStageSnapshot(page, {
      stage: 'Collective',
      technologies: ['CollectiveAwakening', 'ConsciousnessUpload'],
      resources: {
        Gold: 200000,
      },
    });

    const afterUploadSetup = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const spire = buildings.find((building) => building.name === '神经尖塔');
      const hatchery = buildings.find((building) => building.name === '深空孵化港');
      if (!spire || !hatchery) {
        return { ok: false, reason: 'missing collective buildings' };
      }

      const purchases = [
        window.rustGame.buy_building(spire.index),
        window.rustGame.buy_building(spire.index),
        window.rustGame.buy_building(hatchery.index),
        window.rustGame.buy_building(hatchery.index),
      ];
      const refreshed = window.rustGame.get_buildings();
      const refreshedSpire = refreshed.find((building) => building.name === '神经尖塔');
      const refreshedHatchery = refreshed.find((building) => building.name === '深空孵化港');
      return {
        ok: purchases.every(Boolean),
        spires: refreshedSpire ? refreshedSpire.count : 0,
        hatcheries: refreshedHatchery ? refreshedHatchery.count : 0,
      };
    });

    expect(afterUploadSetup.ok).toBe(true);
    expect(afterUploadSetup.spires).toBeGreaterThanOrEqual(2);
    expect(afterUploadSetup.hatcheries).toBeGreaterThanOrEqual(2);

    const afterUpload = await page.evaluate(() => {
      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      json.state.last_update_time = Date.now() - 10000;
      window.rustGame.importFromBase64(btoa(JSON.stringify(json)));

      const before = window.rustGame.get_resources();
      window.rustGame.game_loop();
      const after = window.rustGame.get_resources();

      return {
        beforeSpaceship: before.Spaceship || 0,
        afterSpaceship: after.Spaceship || 0,
      };
    });

    expect(afterUpload.afterSpaceship).toBeGreaterThan(afterUpload.beforeSpaceship);
  });

  test('collective buildings surface visible linkage cues in the buildings tab', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockCollectiveStage(page);

    await importStageSnapshot(page, {
      stage: 'Collective',
      technologies: ['CollectiveAwakening', 'ConsciousnessUpload'],
      resources: {
        Gold: 200000,
      },
    });

    await page.evaluate(() => {
      if (typeof window.updateBuildingDisplay === 'function' && window.rustGame?.get_buildings) {
        window.updateBuildingDisplay(window.rustGame.get_buildings(), window.rustGame.get_coins?.());
      }
    });

    await page.click('[data-tab="buildings"]');

    const buildingPanel = page.locator('#building-list');
    await expect(buildingPanel).toContainText('神经尖塔');
    await expect(buildingPanel).toContainText('由集体觉醒驱动，开始产出暗物质');
    await expect(buildingPanel).toContainText('深空孵化港');
    await expect(buildingPanel).toContainText('由意识上传驱动，开始产出太空船');
  });

  test('hybrid resource chain grows population and stability when host tech powers chambers', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockHybridStage(page);

    await importStageSnapshot(page, {
      stage: 'Hybrid',
      technologies: ['SymbioticHosts'],
      resources: {
        Food: 200,
        Maggot: 160,
      },
      coexistence: {
        human_pressure: 18,
        maggot_influence: 42,
        symbiosis_stability: 28,
        hybrid_population: 0,
        collective_consciousness: 0,
      },
      buildings: {
        '共生培育舱': 2,
      },
    });

    const result = await page.evaluate(() => {
      const beforeLifecycle = JSON.parse(window.rustGame.get_lifecycle_status_json());
      const beforeResources = window.rustGame.get_resources();

      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      json.state.last_update_time = Date.now() - 10000;
      window.rustGame.importFromBase64(btoa(JSON.stringify(json)));

      window.rustGame.game_loop();

      const afterLifecycle = JSON.parse(window.rustGame.get_lifecycle_status_json());
      const afterResources = window.rustGame.get_resources();

      return {
        beforeHybridPopulation: beforeLifecycle.hybrid_population || 0,
        afterHybridPopulation: afterLifecycle.hybrid_population || 0,
        beforeStability: beforeLifecycle.symbiosis_stability || 0,
        afterStability: afterLifecycle.symbiosis_stability || 0,
        beforeFood: beforeResources.Food || 0,
        afterFood: afterResources.Food || 0,
      };
    });

    expect(result.afterHybridPopulation).toBeGreaterThan(result.beforeHybridPopulation);
    expect(result.afterStability).toBeGreaterThan(result.beforeStability);
    expect(result.afterFood).toBeGreaterThan(result.beforeFood);
  });

  test('necrotic recycling unlocks corpse pool and produces chemicals', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockMaggotStage(page);

    await seedResourcesAndResearch(page, {
      resources: {
        Gold: 10000,
        Wood: 500,
        Stone: 500,
        Coal: 500,
        Oil: 200,
        IronOre: 200,
        Food: 300,
        Maggot: 120,
        Chemicals: 120,
        Corpse: 16,
      },
      technologies: [
        'BasicAgriculture',
        'BasicMining',
        'BasicSmelting',
        'BasicRefining',
        'BasicChemistry',
        'MaggotBreeding',
        'NecroticRecycling',
      ],
    });

    const result = await page.evaluate(() => {
      const buildings = window.rustGame.get_buildings();
      const pool = buildings.find((building) => building.name === '腐肉育池');
      if (!pool || !Number.isInteger(pool.index)) {
        return { ok: false, reason: 'pool hidden' };
      }

      window.rustGame.buy_building(pool.index);

      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      json.state.resources = json.state.resources || {};
      json.state.resources.Corpse = Math.max(json.state.resources.Corpse || 0, 16);
      json.state.last_update_time = Date.now() - 5000;
      window.rustGame.importFromBase64(btoa(JSON.stringify(json)));

      const before = window.rustGame.get_resources();
      window.rustGame.game_loop();
      const after = window.rustGame.get_resources();

      return {
        ok: true,
        beforeChemicals: before.Chemicals || 0,
        afterChemicals: after.Chemicals || 0,
        beforeCorpses: before.Corpse || 0,
        afterCorpses: after.Corpse || 0,
      };
    });

    expect(result.ok).toBe(true);
    expect(result.afterChemicals).toBeGreaterThan(result.beforeChemicals);
    expect(result.afterCorpses).toBeLessThan(result.beforeCorpses);
  });

  test('worker auto assignment exposes recommendation context', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockWorkersStage(page);
    await page.click('[data-tab="workers"]');

    const workerSnapshot = await page.evaluate(() => {
      const workers = window.rustGame.get_workers();
      return workers[0];
    });

    expect(Array.isArray(workerSnapshot.efficiencyBreakdown)).toBe(true);
    expect(workerSnapshot.efficiencyBreakdown.length).toBeGreaterThan(0);
    expect(workerSnapshot).toHaveProperty('autoAssignmentTarget');
  });
});
