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
  expect(buildingList).toMatch(/\d+(\.\d+)?\/秒/);
  
  expect(upgradeList).toMatch(/Better Click|Lumberjack Efficiency|Stone Mason Skill|Autoclicker/);
  
  // Specifically check Autoclicker shows click-based description
  expect(upgradeList).toContain('金币/点击');
});