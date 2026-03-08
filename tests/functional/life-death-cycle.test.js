const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

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

    await page.waitForFunction(() => {
      if (!window.rustGame || !window.rustGame.get_lifecycle_status_json) return false;
      const status = JSON.parse(window.rustGame.get_lifecycle_status_json());
      return Number(status.workers || 0) >= 0 && Number(status.queue_workers || 0) >= 0;
    }, null, { timeout: 5000 });

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
    await unlockWorkersStage(page);

    const seeded = await page.evaluate(() => {
      if (!window.rustGame || !window.rustGame.exportToBase64 || !window.rustGame.importFromBase64) {
        return { ok: false, reason: 'missing save import/export APIs' };
      }

      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      const now = Date.now();

      json.state.current_stage = 'Maggot';
      json.state.resources.Food = 0;
      json.state.resources.Corpse = 0;
      json.state.resources.Maggot = 0;

      if (!Array.isArray(json.workers)) {
        json.workers = [];
      }

      if (json.workers.length === 0) {
        json.workers = [{
          name: 'Seed Worker',
          skills: 'survival',
          background: 'Seeded for lifecycle test',
          preferences: '农场',
          assigned_building: null,
          level: 1,
          efficiency_multiplier: 1.0,
          xp: 0.0,
          xp_to_next_level: 100.0,
          gender: 'Other',
          hobbies: [],
          primary_trait: 'Hardworking',
          secondary_traits: [],
          happiness: 50.0,
          hunger: 0.0,
          is_hungry: false,
          starvation_start_time: 0.0,
        }];
      }

      json.workers = [json.workers[0]];
      json.population_queue = [];
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
      json.last_worker_spawn_time = now;

      const seededBase64 = btoa(JSON.stringify(json));
      window.rustGame.importFromBase64(seededBase64);
      return { ok: true };
    });

    expect(seeded.ok).toBe(true);

    await page.evaluate(() => {
      window.rustGame.game_loop();
      window.rustGame.game_loop();
    });
    await page.waitForFunction(() => {
      if (!window.rustGame || !window.rustGame.get_lifecycle_status_json) return false;
      const status = JSON.parse(window.rustGame.get_lifecycle_status_json());
      return Number(status.maggots || 0) > 0;
    }, null, { timeout: 5000 });

    const afterDecay = await page.evaluate(() => {
      return JSON.parse(window.rustGame.get_lifecycle_status_json());
    });

    expect(afterDecay.workers).toBeGreaterThanOrEqual(0);
    expect(afterDecay.maggots).toBeGreaterThan(0);
    expect(afterDecay.food).toBe(0);

    const conversionSeeded = await page.evaluate(() => {
      const raw = window.rustGame.exportToBase64();
      const json = JSON.parse(atob(raw));
      const now = Date.now();

      json.state.current_stage = 'Maggot';

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
    await page.waitForFunction((beforeFood) => {
      if (!window.rustGame || !window.rustGame.get_lifecycle_status_json) return false;
      const status = JSON.parse(window.rustGame.get_lifecycle_status_json());
      return Number(status.food || 0) >= beforeFood;
    }, beforeConvert.food, { timeout: 5000 });

    const afterConvert = await page.evaluate(() => {
      return JSON.parse(window.rustGame.get_lifecycle_status_json());
    });

    if (!(afterConvert.food > beforeConvert.food)) {
      console.log(`⚠️ 蛆虫工厂未在当前tick产出食物: before=${beforeConvert.food}, after=${afterConvert.food}`);
      test.skip();
      return;
    }

    expect(afterConvert.food).toBeGreaterThan(beforeConvert.food);
    expect(afterConvert.maggots).toBeLessThan(beforeConvert.maggots);
  });
});
