const { test, expect } = require('../fixtures/coverage');

test('building display should not show undefined', async ({ page }) => {
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
  
  // Verify that production rates are displayed correctly
  expect(buildingList).toContain('秒');
});
