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

  await page.waitForTimeout(300);
  return result;
}

module.exports = {
  unlockWorkersStage,
};
