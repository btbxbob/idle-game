const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test('multi-tab interface should work correctly', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Genesis stage only exposes the core tab set.
  const visibleTabTexts = await page.locator('.tab-button:visible').allTextContents();
  expect(visibleTabTexts.length).toBeGreaterThanOrEqual(4);
  expect(visibleTabTexts).toContain('资源');
  expect(visibleTabTexts).toContain('建筑');
  expect(visibleTabTexts).toContain('解锁');
  expect(visibleTabTexts).toContain('设置');
  expect(visibleTabTexts).not.toContain('工人');
  
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
  
  // Unlock workers stage and verify gated tabs become available.
  await unlockWorkersStage(page);
  await expect(page.locator('button[data-tab="workers"]')).toBeVisible();
  await page.click('button[data-tab="workers"]');
  const workersActive = await page.locator('.tab-button.active').textContent();
  expect(workersActive).toBe('工人');
});
