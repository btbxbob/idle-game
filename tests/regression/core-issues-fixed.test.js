const { test, expect } = require('@playwright/test');

// Bug: 金币显示区不更新且列表出现 undefined，修复后用于回归验证。

test('core display issues fixed', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Test 1: Banner coin display should show correct coin amount
  const initialCoinDisplay = await page.textContent('#coins');
  expect(initialCoinDisplay).toContain('0');
  
  // Click once to get 1 coin
  await page.click('#coin-button');
  await page.waitForTimeout(300);
  
  const coinDisplayAfterClick = await page.textContent('#coins');
  const afterValue = parseFloat((coinDisplayAfterClick || '0').split(':').pop().trim());
  expect(afterValue).toBeGreaterThanOrEqual(1);
  
  // Test 2: No undefined values in building/upgrade displays
  const buildingList = await page.textContent('#building-list');
  const upgradeList = await page.textContent('#upgrade-list');
  
  // Should not contain "undefined"
  expect(buildingList).not.toContain('undefined');
  expect(upgradeList).not.toContain('undefined');
  
  // Should contain production rate unit text
  expect(buildingList).toContain('秒');
  
  expect(upgradeList).toContain('Lumberjack Efficiency');
  expect(upgradeList).toContain('Stone Mason Skill');
});
