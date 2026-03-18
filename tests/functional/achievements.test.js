const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Achievement System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await unlockWorkersStage(page);
    await page.click('[data-tab="achievements"]');
    await page.waitForSelector('#tab-achievements.active');
    await page.waitForTimeout(300);
  });

  test('achievements list renders and has items', async ({ page }) => {
    const items = page.locator('.achievement-item');
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('achievement API returns structured data', async ({ page }) => {
    const achievements = await page.evaluate(() =>
      window.rustGame && window.rustGame.get_achievements ? window.rustGame.get_achievements() : []
    );
    expect(Array.isArray(achievements)).toBe(true);
    expect(achievements.length).toBeGreaterThanOrEqual(10);
    expect(achievements[0]).toHaveProperty('id');
    expect(achievements[0]).toHaveProperty('name');
    expect(achievements[0]).toHaveProperty('unlocked');
  });

  test('WASM achievement exports stay callable and structured', async ({ page }) => {
    const result = await page.evaluate(() => {
      const game = window.rustGame;
      if (!game) {
        return { ok: false, reason: 'missing rustGame' };
      }

      const achievements = typeof game.get_achievements === 'function' ? game.get_achievements() : [];
      const first = achievements[0] || null;

      return {
        ok: true,
        hasGetAchievements: typeof game.get_achievements === 'function',
        hasCheckAchievement: typeof game.check_achievement === 'function',
        count: achievements.length,
        first,
        invalidResult: game.check_achievement('nonexistent_achievement'),
        validResultType: typeof game.check_achievement('first_coins_100'),
        followupCount: game.get_achievements().length,
      };
    });

    expect(result.ok).toBe(true);
    expect(result.hasGetAchievements).toBe(true);
    expect(result.hasCheckAchievement).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    expect(result.first).toHaveProperty('id');
    expect(result.first).toHaveProperty('name');
    expect(result.first).toHaveProperty('description');
    expect(result.first).toHaveProperty('category');
    expect(typeof result.first.unlocked).toBe('boolean');
    expect(typeof result.first.progress).toBe('number');
    expect(typeof result.first.requirement).toBe('number');
    expect(result.invalidResult).toBe(false);
    expect(result.validResultType).toBe('boolean');
    expect(result.followupCount).toBe(result.count);
  });

  test('clicking updates at least one achievement progress signal', async ({ page }) => {
    const before = await page.evaluate(() =>
      window.rustGame && window.rustGame.get_achievements ? window.rustGame.get_achievements() : []
    );
    for (let i = 0; i < 12; i++) {
      await page.click('#coin-button');
    }
    await page.waitForTimeout(500);
    const after = await page.evaluate(() =>
      window.rustGame && window.rustGame.get_achievements ? window.rustGame.get_achievements() : []
    );

    const changed = after.some((achievement, index) => {
      const previous = before[index];
      return previous && (
        achievement.progress !== previous.progress ||
        achievement.unlocked !== previous.unlocked
      );
    });

    expect(changed).toBe(true);
  });
});
