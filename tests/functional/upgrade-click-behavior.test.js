const { test, expect } = require('../fixtures/coverage');

test('coin mine purchase increases click value', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);

  const before = await page.evaluate(() => window.rustGame?.get_coins_per_click?.() ?? 0);

  for (let i = 0; i < 12; i++) {
    await page.click('#coin-button');
  }

  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(150);
  await page.click('#buy-building-0');
  await page.waitForTimeout(250);

  const after = await page.evaluate(() => window.rustGame?.get_coins_per_click?.() ?? 0);
  expect(after).toBeGreaterThan(before);
});
