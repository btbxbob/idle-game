const { test, expect } = require('@playwright/test');

test('building and upgrade displays should not show undefined', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Wait for initial UI to load
  await page.waitForTimeout(500);
  
  // Check building list for undefined values
  const buildingList = await page.textContent('#building-list');
  console.log('Building list content:', buildingList);
  
  // Should not contain "undefined"
  expect(buildingList).not.toContain('undefined');
  
  // Check upgrade list for undefined values  
  const upgradeList = await page.textContent('#upgrade-list');
  console.log('Upgrade list content:', upgradeList);
  
  // Should not contain "undefined"
  expect(upgradeList).not.toContain('undefined');
  
  // Verify that production rates are displayed correctly
  // Building should show something like "0.1/sec" not "undefined/sec"
  expect(buildingList).toMatch(/\d+(\.\d+)?\/秒/); // Chinese format
  expect(buildingList).toMatch(/\d+(\.\d+)?\/sec/); // English format
  
  // Upgrade should show something like "+1.0/sec per building" not "+1.0undefined per building"
  expect(upgradeList).toMatch(/\+\d+(\.\d+)?\/秒 每建筑/); // Chinese format
  expect(upgradeList).toMatch(/\+\d+(\.\d+)?\/sec per building/); // English format
});