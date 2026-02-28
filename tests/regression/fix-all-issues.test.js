const { test, expect } = require('@playwright/test');

test('fix all display and functionality issues', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(300);

  const initialCoinsText = await page.textContent('#coins');
  const initialCoins = parseFloat((initialCoinsText || '0').split(':').pop().trim());

  await page.click('#coin-button');
  await page.waitForTimeout(200);

  const afterCoinsText = await page.textContent('#coins');
  const afterCoins = parseFloat((afterCoinsText || '0').split(':').pop().trim());
  expect(afterCoins).toBeGreaterThan(initialCoins);

  const buildingList = await page.textContent('#building-list');
  const upgradeList = await page.textContent('#upgrade-list');
  expect(buildingList).not.toContain('undefined');
  expect(upgradeList).not.toContain('undefined');
});
