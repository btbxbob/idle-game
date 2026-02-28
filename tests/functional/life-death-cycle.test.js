const { test, expect } = require('@playwright/test');

test.describe('Life-Death Cycle System', () => {
  test('lifecycle status and decay pipeline are accessible', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);

    const statusBefore = await page.evaluate(() => {
      if (!window.rustGame || !window.rustGame.get_lifecycle_status_json) return null;
      return JSON.parse(window.rustGame.get_lifecycle_status_json());
    });

    expect(statusBefore).toBeTruthy();
    expect(statusBefore).toHaveProperty('workers');
    expect(statusBefore).toHaveProperty('food');
    expect(statusBefore).toHaveProperty('corpses');
    expect(statusBefore).toHaveProperty('maggots');

    await page.waitForTimeout(1500);

    const statusAfter = await page.evaluate(() => {
      if (!window.rustGame || !window.rustGame.get_lifecycle_status_json) return null;
      return JSON.parse(window.rustGame.get_lifecycle_status_json());
    });

    expect(statusAfter).toBeTruthy();
    expect(statusAfter.workers).toBeGreaterThanOrEqual(0);
    expect(statusAfter.queue_workers).toBeGreaterThanOrEqual(0);
  });

  test('food shortage triggers death, corpse->maggot decay, then maggot factory restores food', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);

    const seeded = await page.evaluate(() => {
      if (!window.rustGame || !window.rustGame.exportToBase64 || !window.rustGame.importFromBase64) {
        return { ok: false, reason: 'missing save import/export APIs' };
      }

      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      const now = Date.now();

      json.state.resources.Food = 0;
      json.state.resources.Corpse = 0;
      json.state.resources.Maggot = 0;

      if (!Array.isArray(json.workers) || json.workers.length === 0) {
        return { ok: false, reason: 'no workers in save' };
      }

      json.workers = [json.workers[0]];
      json.workers[0].is_hungry = true;
      json.workers[0].starvation_start_time = now - 31_000;
      json.workers[0].hunger = 100;

      if (Array.isArray(json.buildings)) {
        json.buildings = json.buildings.map((b) => {
          if (b && b.name === '蛆虫工厂') {
            return { ...b, count: 0 };
          }
          return b;
        });
      }

      json.state.last_update_time = now - 6_000;
      json.last_food_consumption_time = now - 6_000;

      const seededBase64 = btoa(JSON.stringify(json));
      window.rustGame.importFromBase64(seededBase64);
      return { ok: true };
    });

    expect(seeded.ok).toBe(true);

    await page.evaluate(() => {
      window.rustGame.game_loop();
    });

    const afterDecay = await page.evaluate(() => {
      return JSON.parse(window.rustGame.get_lifecycle_status_json());
    });

    expect(afterDecay.workers).toBe(0);
    expect(afterDecay.corpses).toBe(0);
    expect(afterDecay.maggots).toBeGreaterThan(0);
    expect(afterDecay.food).toBe(0);

    const conversionSeeded = await page.evaluate(() => {
      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      const now = Date.now();

      if (Array.isArray(json.buildings)) {
        json.buildings = json.buildings.map((b) => {
          if (b && b.name === '蛆虫工厂') {
            return { ...b, count: 1 };
          }
          return b;
        });
      }

      json.state.last_update_time = now - 6_000;
      const seededBase64 = btoa(JSON.stringify(json));
      window.rustGame.importFromBase64(seededBase64);

      return true;
    });

    expect(conversionSeeded).toBe(true);

    const beforeConvert = await page.evaluate(() => {
      return JSON.parse(window.rustGame.get_lifecycle_status_json());
    });

    await page.evaluate(() => {
      window.rustGame.game_loop();
    });

    const afterConvert = await page.evaluate(() => {
      return JSON.parse(window.rustGame.get_lifecycle_status_json());
    });

    expect(afterConvert.food).toBeGreaterThan(beforeConvert.food);
    expect(afterConvert.maggots).toBeLessThan(beforeConvert.maggots);
  });
});
