const { test, expect } = require('../fixtures/coverage');

test('stale imported saves resume passive production on the next live tick', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);

  const seeded = await page.evaluate(() => {
    if (!window.rustGame || !window.rustGame.exportToBase64 || !window.rustGame.importFromBase64) {
      return { ok: false, reason: 'missing save import/export APIs' };
    }

    const raw = window.rustGame.exportToBase64();
    const json = JSON.parse(atob(raw));
    const now = Date.now();

    json.state.current_stage = 'Workers';
    json.state.resources.Gold = 0;
    json.state.resources.Wood = 0;
    json.state.resources.Stone = 0;
    json.state.last_update_time = now - 7_200_000;

    if (Array.isArray(json.buildings)) {
      json.buildings = json.buildings.map((building, index) => ({
        ...building,
        count: index === 0 ? 1 : 0,
      }));
    }

    window.rustGame.importFromBase64(btoa(JSON.stringify(json)));
    return { ok: true, coins: window.rustGame.get_coins() };
  });

  expect(seeded.ok).toBe(true);
  expect(seeded.coins).toBe(0);

  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    window.rustGame.game_loop();
  });

  const afterTick = await page.evaluate(() => ({
    coins: window.rustGame.get_coins(),
    cps: window.rustGame.get_coins_per_second(),
  }));

  expect(afterTick.cps).toBeGreaterThan(0);
  expect(afterTick.coins).toBeGreaterThan(0);
});
