const { test, expect } = require('@playwright/test');

test('unlock_feature and get_unlocks are callable', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Verify get_unlocks is callable and returns data
  const unlocks = await page.evaluate(() => {
    return window.rustGame.get_unlocks();
  });
  
  expect(unlocks).toBeDefined();
  expect(Array.isArray(unlocks)).toBe(true);
  expect(unlocks.length).toBeGreaterThan(0);
  
  // Verify first unlock feature exists and has expected structure
  const firstUnlock = unlocks[0];
  expect(firstUnlock.id).toBeDefined();
  expect(firstUnlock.name).toBeDefined();
  expect(firstUnlock.feature_type).toBeDefined();
  expect(typeof firstUnlock.unlocked).toBe('boolean');
  
  // Verify unlock_feature is callable (will return false since requirements not met)
  const unlockResult = await page.evaluate(() => {
    // Try to unlock - will return false since requirements not met
    return window.rustGame.unlock_feature('statistics_panel');
  });
  
  // Function is callable - it returns false because requirement (10 clicks) not met
  expect(typeof unlockResult).toBe('boolean');
});
