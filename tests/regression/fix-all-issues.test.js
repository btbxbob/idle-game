const { test, expect } = require('../fixtures/coverage');

async function getCoins(page) {
  return page.evaluate(() => {
    if (window.rustGame && typeof window.rustGame.get_coins === 'function') {
      return window.rustGame.get_coins();
    }
    return parseFloat(document.getElementById('coin-count')?.textContent || '0') || 0;
  });
}

test('fix all display and functionality issues', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(300);

  const initialCoins = await getCoins(page);

  await page.click('#coin-button');
  await page.waitForTimeout(200);

  const afterCoins = await getCoins(page);
  expect(afterCoins).toBeGreaterThan(initialCoins);

  const buildingList = await page.textContent('#building-list');
  expect(buildingList).not.toContain('undefined');
});
