const { test, expect } = require('../fixtures/coverage');

test('DEBUG: 诊断升级花费更新问题', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);

  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(300);

  const upgradeCount = await page.locator('.upgrade-item').count();
  console.log('升级项数量:', upgradeCount);
  expect(upgradeCount).toBeGreaterThan(0);

  for (let i = 0; i < Math.min(upgradeCount, 3); i++) {
    const itemId = await page.locator('.upgrade-item').nth(i).getAttribute('id');
    const costText = await page.locator(`#${itemId} > div:last-child span`).first().textContent();
    console.log(`升级 #${i} 花费:`, costText);
    expect(costText).toContain('花费');
  }

  for (let i = 0; i < 3; i++) {
    await page.click('#coin-button');
  }
  await page.waitForTimeout(300);

  const firstCostAfter = await page.locator('.upgrade-item').first().locator('span').last().textContent();
  expect(firstCostAfter).toContain('花费');
});
