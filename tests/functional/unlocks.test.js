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
  });

  test('unlock card shows requirement/progress text blocks', async ({ page }) => {
    const firstUnlock = page.locator('.unlock-feature, .unlock-item').first();
    await expect(firstUnlock).toBeVisible();

    const text = (await firstUnlock.textContent()) || '';
    expect(text.length).toBeGreaterThan(0);
  });
});
