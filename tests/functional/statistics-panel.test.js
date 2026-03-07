const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

async function openAndRenderStatistics(page) {
  await unlockWorkersStage(page);
  await page.click('[data-tab="statistics"]');
  await page.waitForSelector('#tab-statistics.active');
  await page.waitForFunction(() => typeof window.statisticsManager !== 'undefined');
  await page.evaluate(() => {
    window.statisticsManager.renderToPanel('tab-statistics');
  });
  await page.waitForSelector('.statistics-grid');
}

test('Statistics panel displays 9 statistic items', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);

  await openAndRenderStatistics(page);
  
  const statisticItems = page.locator('.statistic-item');
  await expect(statisticItems).toHaveCount(9);
  
  const firstStatValue = page.locator('.statistic-item:first-child .stat-value');
  await expect(firstStatValue).toBeVisible();
});
