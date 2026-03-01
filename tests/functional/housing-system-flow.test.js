const { test, expect } = require('../fixtures/coverage');

test.describe('Housing system flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
  });

  test('housing wasm exports are callable', async ({ page }) => {
    const result = await page.evaluate(() => {
      if (!window.rustGame) return null;
      return {
        capacity: window.rustGame.get_housing_capacity ? window.rustGame.get_housing_capacity() : -1,
        occupied: window.rustGame.get_housing_occupied ? window.rustGame.get_housing_occupied() : -1,
        queue: window.rustGame.get_population_queue_json ? window.rustGame.get_population_queue_json() : '',
      };
    });

    expect(result).toBeTruthy();
    expect(result.capacity).toBeGreaterThanOrEqual(0);
    expect(result.occupied).toBeGreaterThanOrEqual(0);
    expect(typeof result.queue).toBe('string');
  });

  // Construction-flow test is deferred until deterministic resource seeding API is exported.
});
