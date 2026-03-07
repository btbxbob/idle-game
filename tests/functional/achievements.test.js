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

  test('clicking updates at least one achievement progress signal', async ({ page }) => {
    const before = await page.locator('.achievement-item').first().textContent();
    for (let i = 0; i < 12; i++) {
      await page.click('#coin-button');
    }
    await page.waitForTimeout(500);
    const after = await page.locator('.achievement-item').first().textContent();
    expect(after).not.toEqual(before);
  });
});
