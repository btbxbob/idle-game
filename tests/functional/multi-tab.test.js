const { test, expect } = require('../fixtures/coverage');

test('multi-tab interface should work correctly', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Check that all tabs exist
  const tabButtons = await page.locator('.tab-button');
  const tabCount = await tabButtons.count();
  expect(tabCount).toBeGreaterThanOrEqual(10);
  
  // Check tab names
  const tabTexts = await page.locator('.tab-button').allTextContents();
  expect(tabTexts).toContain('资源');
  expect(tabTexts).toContain('建筑');
  expect(tabTexts).toContain('工人');
  expect(tabTexts).toContain('设置');
  
  // Check that resources tab is active by default
  const activeTab = await page.locator('.tab-button.active');
  const activeTabText = await activeTab.textContent();
  expect(activeTabText).toBe('资源');
  
  await page.click('button[data-tab="buildings"]');
  
  const activeTabAfterSwitch = await page.locator('.tab-button.active');
  const activeTabAfterSwitchText = await activeTabAfterSwitch.textContent();
  expect(activeTabAfterSwitchText).toBe('建筑');
  
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
