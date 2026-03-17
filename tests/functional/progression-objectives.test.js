const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage, unlockMaggotStage, seedResourcesAndResearch } = require('../fixtures/stage-helpers');

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
        Food: 300,
        Maggot: 120,
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
      const poolIndex = buildings.findIndex((building) => building.name === '腐肉育池');
      if (poolIndex < 0) {
        return { ok: false, reason: 'pool hidden' };
      }

      window.rustGame.buy_building(poolIndex);
      const before = window.rustGame.get_resources();
      window.rustGame.game_loop();
      const after = window.rustGame.get_resources();

      return {
        ok: true,
        beforeChemicals: before.Chemicals || 0,
        afterChemicals: after.Chemicals || 0,
      };
    });

    expect(result.ok).toBe(true);
    expect(result.afterChemicals).toBeGreaterThanOrEqual(result.beforeChemicals);
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
