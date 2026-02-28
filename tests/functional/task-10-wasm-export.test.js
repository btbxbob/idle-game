const { test, expect } = require('@playwright/test');

test('Task 10: WASM get_achievements() export', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Verify rustGame object exists
  const rustGameExists = await page.evaluate(() => window.rustGame !== undefined);
  expect(rustGameExists).toBe(true);

  // Test get_achievements() returns an array
  const achievements = await page.evaluate(() => {
    return window.rustGame.get_achievements();
  });
  
  expect(Array.isArray(achievements)).toBe(true);
  expect(achievements.length).toBeGreaterThan(0);
  
  // Verify achievement structure
  const firstAchievement = achievements[0];
  expect(firstAchievement.id).toBeDefined();
  expect(firstAchievement.name).toBeDefined();
  expect(firstAchievement.description).toBeDefined();
  expect(typeof firstAchievement.unlocked).toBe('boolean');
  expect(typeof firstAchievement.progress).toBe('number');
  expect(typeof firstAchievement.requirement).toBe('number');
  expect(firstAchievement.category).toBeDefined();
  
  console.log('✓ get_achievements() works correctly');
  console.log('Achievements:', JSON.stringify(achievements, null, 2));
});

test('Task 10: WASM check_achievement() export', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Verify check_achievement function exists
  const functionExists = await page.evaluate(() => {
    return typeof window.rustGame.check_achievement === 'function';
  });
  expect(functionExists).toBe(true);

  // Test check_achievement with invalid ID
  const invalidResult = await page.evaluate(() => {
    return window.rustGame.check_achievement('nonexistent_achievement');
  });
  expect(invalidResult).toBe(false);

  // Test check_achievement with valid ID (may not be unlocked yet)
  const validResult = await page.evaluate(() => {
    return window.rustGame.check_achievement('first_coins_100');
  });
  expect(typeof validResult).toBe('boolean');

  // Verify achievements can be retrieved after checking
  const achievements = await page.evaluate(() => {
    return window.rustGame.get_achievements();
  });
  
  expect(Array.isArray(achievements)).toBe(true);
  
  console.log('✓ check_achievement() works correctly');
  console.log('Check result for first_coins_100:', validResult);
});

test('Task 10: Combined achievement functions test', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get initial achievements
  const initialAchievements = await page.evaluate(() => {
    return window.rustGame.get_achievements();
  });
  
  const initialUnlocked = initialAchievements.filter(a => a.unlocked).length;
  
  // Check an achievement using WASM function
  const checkResult = await page.evaluate(() => {
    return window.rustGame.check_achievement('click_novice_10');
  });
  
  // Get achievements again to verify state is accessible
  const updatedAchievements = await page.evaluate(() => {
    return window.rustGame.get_achievements();
  });
  
  const updatedUnlocked = updatedAchievements.filter(a => a.unlocked).length;
  
  // Verify we can track achievement progress
  expect(updatedAchievements.length).toBe(initialAchievements.length);
  expect(typeof checkResult).toBe('boolean');
  
  console.log('✓ Combined test passed');
  console.log(`Check result: ${checkResult}, Initial unlocked: ${initialUnlocked}, After check: ${updatedUnlocked}`);
});
