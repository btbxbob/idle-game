const { test, expect } = require('../fixtures/coverage');

test.describe('Unlock System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await page.click('[data-tab="unlocks"]');
    await page.waitForSelector('#tab-unlocks.active');
  });

  test('unlocks panel renders with unlock items', async ({ page }) => {
    const unlockItems = page.locator('.unlock-feature, .unlock-item, [class*="unlock"]');
    expect(await unlockItems.count()).toBeGreaterThanOrEqual(1);
  });

  test('unlock API is callable and returns list', async ({ page }) => {
    const unlocks = await page.evaluate(() => {
      if (!window.rustGame || typeof window.rustGame.get_unlocks !== 'function') return [];
      return window.rustGame.get_unlocks();
    });

    expect(Array.isArray(unlocks)).toBe(true);
    expect(unlocks.length).toBeGreaterThanOrEqual(1);

    const firstUnlock = unlocks[0];
    expect(firstUnlock.id).toBeDefined();
    expect(firstUnlock.name).toBeDefined();
    expect(firstUnlock.feature_type).toBeDefined();
    expect(typeof firstUnlock.unlocked).toBe('boolean');
  });

  test('unlock card shows requirement/progress text blocks', async ({ page }) => {
    const firstUnlock = page.locator('.unlock-feature, .unlock-item').first();
    await expect(firstUnlock).toBeVisible();

    const text = (await firstUnlock.textContent()) || '';
    expect(text.length).toBeGreaterThan(0);
  });

  test('unlock_feature is callable even when requirements are unmet', async ({ page }) => {
    const unlockResult = await page.evaluate(() => {
      if (!window.rustGame || typeof window.rustGame.unlock_feature !== 'function') {
        return null;
      }

      return window.rustGame.unlock_feature('statistics_panel');
    });

    expect(typeof unlockResult).toBe('boolean');
  });
});
