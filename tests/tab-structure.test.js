const { test, expect } = require('@playwright/test');

test('new tabs structure verification', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(1000);
  
  // Verify all 9 tab buttons exist
  const tabButtons = await page.locator('.tab-button').count();
  console.log(`Total tab buttons: ${tabButtons}`);
  expect(tabButtons).toBe(9);
  
  // Verify specific new tab buttons exist
  const statisticsButton = await page.locator('button[data-tab="statistics"]');
  await expect(statisticsButton).toBeVisible();
  expect(await statisticsButton.textContent()).toBe('统计');
  
  const achievementsButton = await page.locator('button[data-tab="achievements"]');
  await expect(achievementsButton).toBeVisible();
  expect(await achievementsButton.textContent()).toBe('成就');
  
  const craftingButton = await page.locator('button[data-tab="crafting"]');
  await expect(craftingButton).toBeVisible();
  expect(await craftingButton.textContent()).toBe('合成');
  
  const unlocksButton = await page.locator('button[data-tab="unlocks"]');
  await expect(unlocksButton).toBeVisible();
  expect(await unlocksButton.textContent()).toBe('解锁');
  
  // Verify all 9 tab content divs exist
  const tabContents = await page.locator('.tab-content').count();
  console.log(`Total tab content divs: ${tabContents}`);
  expect(tabContents).toBe(9);
  
  // Verify specific new tab content divs exist (they exist but are hidden when not active)
  const statisticsTab = await page.locator('#tab-statistics');
  await expect(statisticsTab).toHaveCount(1);
  
  const achievementsTab = await page.locator('#tab-achievements');
  await expect(achievementsTab).toHaveCount(1);
  
  const craftingTab = await page.locator('#tab-crafting');
  await expect(craftingTab).toHaveCount(1);
  
  const unlocksTab = await page.locator('#tab-unlocks');
  await expect(unlocksTab).toHaveCount(1);
  
  // Test tab switching for new tabs
  console.log('Testing statistics tab switching...');
  await statisticsButton.click();
  await page.waitForTimeout(200);
  const activeTabAfterStats = await page.locator('.tab-button.active').textContent();
  expect(activeTabAfterStats).toBe('统计');
  const statisticsTabActive = await statisticsTab.evaluate(el => el.classList.contains('active'));
  expect(statisticsTabActive).toBe(true);
  
  console.log('Testing achievements tab switching...');
  await achievementsButton.click();
  await page.waitForTimeout(200);
  const activeTabAfterAchievements = await page.locator('.tab-button.active').textContent();
  expect(activeTabAfterAchievements).toBe('成就');
  
  console.log('Testing crafting tab switching...');
  await craftingButton.click();
  await page.waitForTimeout(200);
  const activeTabAfterCrafting = await page.locator('.tab-button.active').textContent();
  expect(activeTabAfterCrafting).toBe('合成');
  
  console.log('Testing unlocks tab switching...');
  await unlocksButton.click();
  await page.waitForTimeout(200);
  const activeTabAfterUnlocks = await page.locator('.tab-button.active').textContent();
  expect(activeTabAfterUnlocks).toBe('解锁');
  
  console.log('All new tab structure tests passed!');
});
