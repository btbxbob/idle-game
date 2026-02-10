const { test, expect } = require('@playwright/test');

test('multi-tab interface should work correctly', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Check that all tabs exist
  const tabButtons = await page.locator('.tab-button');
  const tabCount = await tabButtons.count();
  expect(tabCount).toBe(5);
  
  // Check tab names
  const tabTexts = await page.locator('.tab-button').allTextContents();
  expect(tabTexts).toEqual(['资源', '升级', '建筑', '工人', '设置']);
  
  // Check that resources tab is active by default
  const activeTab = await page.locator('.tab-button.active');
  const activeTabText = await activeTab.textContent();
  expect(activeTabText).toBe('资源');
  
  // Switch to upgrades tab
  await page.click('button[data-tab="upgrades"]');
  
  // Check that upgrades tab is now active
  const activeTabAfterSwitch = await page.locator('.tab-button.active');
  const activeTabAfterSwitchText = await activeTabAfterSwitch.textContent();
  expect(activeTabAfterSwitchText).toBe('升级');
  
  // Test settings tab
  await page.click('button[data-tab="settings"]');
  const settingsActive = await page.locator('.tab-button.active').textContent();
  expect(settingsActive).toBe('设置');
  
  // Test reset button exists
  const resetButton = await page.locator('#reset-game');
  expect(await resetButton.isVisible()).toBe(true);
  
  // Test workers tab
  await page.click('button[data-tab="workers"]');
  const workersActive = await page.locator('.tab-button.active').textContent();
  expect(workersActive).toBe('工人');
});