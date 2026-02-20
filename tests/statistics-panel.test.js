const { test, expect } = require('@playwright/test');

test('Statistics panel displays 9 statistic items', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  await page.click('[data-tab="statistics"]');
  await page.waitForSelector('#tab-statistics.active');
  await page.waitForSelector('.statistics-grid');
  
  const statisticItems = page.locator('.statistic-item');
  await expect(statisticItems).toHaveCount(9);
  
  const firstStatValue = page.locator('.statistic-item:first-child .stat-value');
  await expect(firstStatValue).toBeVisible();
});
