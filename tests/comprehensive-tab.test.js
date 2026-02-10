const { test, expect } = require('@playwright/test');

test('comprehensive tab switching and functionality test', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Test 1: Resources tab should be active by default
  await page.waitForTimeout(500);
  const resourcesDisplay = await page.locator('#tab-resources').evaluate(el => 
    window.getComputedStyle(el).display
  );
  expect(resourcesDisplay).toBe('grid');
  
  // Test 2: Switch to upgrades tab
  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(100);
  
  const upgradesDisplay = await page.locator('#tab-upgrades').evaluate(el => 
    window.getComputedStyle(el).display
  );
  const resourcesDisplayAfterSwitch = await page.locator('#tab-resources').evaluate(el => 
    window.getComputedStyle(el).display
  );
  
  expect(upgradesDisplay).toBe('flex');
  expect(resourcesDisplayAfterSwitch).toBe('none');
  
  // Test 3: Verify upgrade list is populated
  const upgradeList = await page.locator('#upgrade-list');
  const upgradeCount = await upgradeList.locator('.upgrade-item').count();
  expect(upgradeCount).toBeGreaterThan(0);
  
  // Test 4: Switch to buildings tab
  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(100);
  
  const buildingsDisplay = await page.locator('#tab-buildings').evaluate(el => 
    window.getComputedStyle(el).display
  );
  expect(buildingsDisplay).toBe('flex');
  
  // Test 5: Verify building list is populated
  const buildingList = await page.locator('#building-list');
  const buildingCount = await buildingList.locator('.building-item').count();
  expect(buildingCount).toBeGreaterThan(0);
  
  // Test 6: Switch to workers tab
  await page.click('button[data-tab="workers"]');
  await page.waitForTimeout(100);
  
  const workersDisplay = await page.locator('#tab-workers').evaluate(el => 
    window.getComputedStyle(el).display
  );
  expect(workersDisplay).toBe('flex');
  
  // Test 7: Workers placeholder should be visible
  const workersPlaceholder = await page.locator('#workers-placeholder');
  expect(await workersPlaceholder.isVisible()).toBe(true);
  
  // Test 8: Switch to settings tab
  await page.click('button[data-tab="settings"]');
  await page.waitForTimeout(100);
  
  const settingsDisplay = await page.locator('#tab-settings').evaluate(el => 
    window.getComputedStyle(el).display
  );
  expect(settingsDisplay).toBe('flex');
  
  // Test 9: Settings elements should be visible
  const resetButton = await page.locator('#reset-game');
  const languageSelect = await page.locator('#language-select-setting');
  expect(await resetButton.isVisible()).toBe(true);
  expect(await languageSelect.isVisible()).toBe(true);
  
  // Test 10: Switch back to resources and test core functionality
  await page.click('button[data-tab="resources"]');
  await page.waitForTimeout(100);
  
  const resourcesDisplayFinal = await page.locator('#tab-resources').evaluate(el => 
    window.getComputedStyle(el).display
  );
  expect(resourcesDisplayFinal).toBe('grid');
  
  // Click to earn coins
  await page.click('#click-area');
  await page.waitForTimeout(300);
  
  const coinDisplay = await page.textContent('#coin-display');
  expect(coinDisplay).toBe('1');
});