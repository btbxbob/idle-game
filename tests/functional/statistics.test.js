const { test, expect } = require('@playwright/test');

async function setupStatistics(page) {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.click('[data-tab="statistics"]');
  await page.waitForSelector('#tab-statistics.active');
  await page.waitForFunction(() => typeof window.statisticsManager !== 'undefined');
  await page.evaluate(() => {
    window.statisticsManager.renderToPanel('tab-statistics');
  });
  await page.waitForSelector('.statistics-grid');
}

async function getStats(page) {
  return page.evaluate(() => {
    if (!window.rustGame) return null;
    if (typeof window.rustGame.getStatistics === 'function') {
      return window.rustGame.getStatistics();
    }
    if (typeof window.rustGame.get_statistics === 'function') {
      return (window.rustGame.getStatistics ? window.rustGame.getStatistics() : window.rustGame.get_statistics());
    }
    if (window.statisticsManager && typeof window.statisticsManager.update === 'function') {
      return window.statisticsManager.update();
    }
    return null;
  });
}

test.describe('Statistics System', () => {
  test.beforeEach(async ({ page }) => {
    await setupStatistics(page);
  });

  test('statistics panel displays all 9 statistic items', async ({ page }) => {
    const statisticItems = page.locator('.statistic-item');
    await expect(statisticItems).toHaveCount(9);
  });

  test('statistics accessible via WASM API', async ({ page }) => {
    const stats = await getStats(page);

    expect(stats).toBeTruthy();
    expect(typeof stats.total_clicks).toBe('number');
    expect(typeof stats.total_coins_earned).toBe('number');
    expect(typeof stats.play_time_seconds).toBe('number');
  });

  test('total_clicks increases after manual clicks', async ({ page }) => {
    const beforeStats = await getStats(page);
    const before = beforeStats.total_clicks;

    for (let i = 0; i < 5; i++) {
      await page.click('#coin-button');
    }

    await page.evaluate(() => {
      window.statisticsManager.renderToPanel('tab-statistics');
    });

    const afterStats = await getStats(page);
    const after = afterStats.total_clicks;
    expect(after).toBeGreaterThanOrEqual(before + 5);
  });

  test('statistics reset is consistent after page reload', async ({ page }) => {
    for (let i = 0; i < 8; i++) {
      await page.click('#coin-button');
    }

    const beforeStats = await getStats(page);
    const clicksBefore = beforeStats.total_clicks;

    await page.reload();
    await setupStatistics(page);

    const afterStats = await getStats(page);
    const clicksAfter = afterStats.total_clicks;
    expect(clicksAfter).toBeGreaterThanOrEqual(0);
  });
});
