const { test, expect } = require('../fixtures/coverage');

test('buy buttons should have real-time response', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get initial coins count
  const initialCoins = await page.textContent('#coins');
  const initialCoinsValue = parseInt(initialCoins.split(': ')[1]);
  console.log('Initial coins:', initialCoinsValue);
  
  for (let i = 0; i < 30; i++) {
    await page.click('#coin-button');
  }
  
  // Wait a bit for UI to update
  await page.waitForTimeout(200);
  
  // Verify coins increased
  const coinsAfterClicks = await page.textContent('#coins');
  const coinsAfterClicksValue = parseInt(coinsAfterClicks.split(': ')[1]);
  console.log('Coins after clicks:', coinsAfterClicksValue);
  expect(coinsAfterClicksValue).toBeGreaterThan(initialCoinsValue);
  
  // Switch to buildings tab first
  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(100);
  
  // Buy Coin Mine first
  const coinMineButton = page.locator('#buy-building-0');
  
  await coinMineButton.click();
  
  // Wait for UI to update
  await page.waitForTimeout(300);
  
  // Verify purchase was successful - coins should decrease
  const coinsAfterPurchase = await page.textContent('#coins');
  const coinsAfterPurchaseValue = parseInt(coinsAfterPurchase.split(': ')[1]);
  console.log('Coins after Coin Mine purchase:', coinsAfterPurchaseValue);
  expect(coinsAfterPurchaseValue).toBeLessThan(coinsAfterClicksValue);
  
  // Verify building count was updated
  const buildingListAfter = await page.textContent('#building-list');
  console.log('Building list after:', buildingListAfter);
  expect(buildingListAfter).toMatch(/拥有:\s*1/);
  
  // Get current coins per click
  const cpcValueBefore = await page.evaluate(() => window.rustGame?.get_coins_per_click?.() ?? 0);
  console.log('CPC before building click bonus:', cpcValueBefore);
  
  await page.click('#buy-building-0');
  
  // Wait for UI to update
  await page.waitForTimeout(300);
  
  const coinsAfterSecondBuilding = await page.textContent('#coins');
  const coinsAfterSecondBuildingValue = parseInt(coinsAfterSecondBuilding.split(': ')[1]);
  console.log('Coins after second Coin Mine purchase:', coinsAfterSecondBuildingValue);
  expect(coinsAfterSecondBuildingValue).toBeLessThan(coinsAfterPurchaseValue);
  
  // Verify coins per click increased
  const cpcValueAfter = await page.evaluate(() => window.rustGame?.get_coins_per_click?.() ?? 0);
  console.log('CPC after building click bonus:', cpcValueAfter);
  expect(cpcValueAfter).toBeGreaterThan(cpcValueBefore);
});
