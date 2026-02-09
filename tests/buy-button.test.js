const { test, expect } = require('@playwright/test');

test('buy buttons should have real-time response', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get initial coins count
  const initialCoins = await page.textContent('#coins');
  const initialCoinsValue = parseInt(initialCoins.replace('Coins: ', ''));
  console.log('Initial coins:', initialCoinsValue);
  
  // Click the middle button to get enough coins for both purchases
  // Need: 15 (Coin Mine) + 10 (Better Click) = 25 coins
  for (let i = 0; i < 30; i++) {
    await page.click('#click-area');
  }
  
  // Wait a bit for UI to update
  await page.waitForTimeout(200);
  
  // Verify coins increased
  const coinsAfterClicks = await page.textContent('#coins');
  const coinsAfterClicksValue = parseInt(coinsAfterClicks.replace('Coins: ', ''));
  console.log('Coins after clicks:', coinsAfterClicksValue);
  expect(coinsAfterClicksValue).toBeGreaterThan(initialCoinsValue);
  
  // Buy Coin Mine first
  const coinMineButton = page.locator('#buy-building-0');
  
  await coinMineButton.click();
  
  // Wait for UI to update
  await page.waitForTimeout(300);
  
  // Verify purchase was successful - coins should decrease
  const coinsAfterPurchase = await page.textContent('#coins');
  const coinsAfterPurchaseValue = parseInt(coinsAfterPurchase.replace('Coins: ', ''));
  console.log('Coins after Coin Mine purchase:', coinsAfterPurchaseValue);
  expect(coinsAfterPurchaseValue).toBeLessThan(coinsAfterClicksValue);
  
  // Verify building count was updated
  const buildingListAfter = await page.textContent('#building-list');
  console.log('Building list after:', buildingListAfter);
  expect(buildingListAfter).toContain('Owned: 1');
  
  // Test upgrade purchase as well
  const betterClickButton = page.locator('#buy-upgrade-0');
  
  // Get current coins per click
  const cpcTextBefore = await page.textContent('#cpc');
  const cpcValueBefore = parseFloat(cpcTextBefore.replace('Coins/click: ', ''));
  console.log('CPC before upgrade:', cpcValueBefore);
  
  await betterClickButton.click();
  
  // Wait for UI to update
  await page.waitForTimeout(300);
  
  // Verify upgrade purchase success
  const coinsAfterUpgrade = await page.textContent('#coins');
  const coinsAfterUpgradeValue = parseInt(coinsAfterUpgrade.replace('Coins: ', ''));
  console.log('Coins after Better Click upgrade:', coinsAfterUpgradeValue);
  expect(coinsAfterUpgradeValue).toBeLessThan(coinsAfterPurchaseValue);
  
  // Verify coins per click increased
  const cpcTextAfter = await page.textContent('#cpc');
  const cpcValueAfter = parseFloat(cpcTextAfter.replace('Coins/click: ', ''));
  console.log('CPC after upgrade:', cpcValueAfter);
  expect(cpcValueAfter).toBeGreaterThan(cpcValueBefore);
});