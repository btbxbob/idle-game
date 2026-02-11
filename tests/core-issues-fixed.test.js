const { test, expect } = require('@playwright/test');

test('core display issues fixed', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Test 1: Middle coin display should show correct coin amount
  const initialCoinDisplay = await page.textContent('#coin-display');
  expect(initialCoinDisplay).toBe('0');
  
  // Click once to get 1 coin
  await page.click('#click-area');
  await page.waitForTimeout(300);
  
  const coinDisplayAfterClick = await page.textContent('#coin-display');
  expect(coinDisplayAfterClick).toBe('1'); // Should show 1, not 0
  
  // Test 2: No undefined values in building/upgrade displays
  const buildingList = await page.textContent('#building-list');
  const upgradeList = await page.textContent('#upgrade-list');
  
  // Should not contain "undefined"
  expect(buildingList).not.toContain('undefined');
  expect(upgradeList).not.toContain('undefined');
  
  // Should contain proper production rates for buildings
  expect(buildingList).toMatch(/\d+(\.\d+)?\/秒/);
  
  expect(upgradeList).toContain('Autoclicker');
  expect(upgradeList).toContain('金币/点击');
});