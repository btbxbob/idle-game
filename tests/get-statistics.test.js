const { test, expect } = require('@playwright/test');

test('get_statistics is callable from JavaScript and returns correct data', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  await page.waitForFunction(() => window.gameInitialized === true);
  
  const totalClicks = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.total_clicks;
  });
  
  const totalCoinsEarned = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.total_coins_earned;
  });
  
  const totalWoodEarned = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.total_wood_earned;
  });
  
  const totalStoneEarned = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.total_stone_earned;
  });
  
  const totalResourcesCrafted = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.total_resources_crafted;
  });
  
  const achievementsUnlockedCount = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.achievements_unlocked_count;
  });
  
  const playTimeSeconds = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.play_time_seconds;
  });
  
  const buildingsPurchased = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.buildings_purchased;
  });
  
  const upgradesPurchased = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.upgrades_purchased;
  });
  
  expect(totalClicks).toBe(0);
  expect(totalCoinsEarned).toBe(0);
  expect(totalWoodEarned).toBe(0);
  expect(totalStoneEarned).toBe(0);
  expect(totalResourcesCrafted).toBe(0);
  expect(achievementsUnlockedCount).toBe(0);
  expect(playTimeSeconds).toBe(0);
  expect(buildingsPurchased).toBe(0);
  expect(upgradesPurchased).toBe(0);
  
  await page.click('#click-area');
  await page.click('#click-area');
  await page.click('#click-area');
  
  await page.waitForTimeout(200);
  
  const updatedTotalClicks = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.total_clicks;
  });
  
  const updatedTotalCoinsEarned = await page.evaluate(() => {
    const stats = window.rustGame.get_statistics();
    return stats.total_coins_earned;
  });
  
  expect(updatedTotalClicks).toBe(3);
  expect(updatedTotalCoinsEarned).toBeGreaterThan(0);
});
