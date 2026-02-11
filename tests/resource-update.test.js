const { test, expect } = require('@playwright/test');

test('resource updates should be real-time', async ({ page, browserName }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get initial coins count
  const initialCoins = await page.textContent('#coins');
  const initialCoinsValue = parseInt(initialCoins.split(': ')[1]);
  
  // Click the middle button to get some coins
  await page.click('#click-area');
  await page.click('#click-area');
  await page.click('#click-area');
  
  // Wait for UI to update - wait for coins to actually change
  await page.waitForFunction(
    (expected) => {
      const coinsText = document.getElementById('coins').textContent;
      const coinsValue = parseInt(coinsText.split(': ')[1]);
      return coinsValue > expected;
    },
    initialCoinsValue
  );
  
  // Verify coins increased immediately
  const coinsAfterClicks = await page.textContent('#coins');
  const coinsAfterClicksValue = parseInt(coinsAfterClicks.split(': ')[1]);
  expect(coinsAfterClicksValue).toBeGreaterThan(initialCoinsValue);
  
  // Get enough coins for a purchase
  for (let i = 0; i < 20; i++) {
    await page.click('#click-area');
  }
  
  // Wait for coins to update
  await page.waitForFunction(
    (expected) => {
      const coinsText = document.getElementById('coins').textContent;
      const coinsValue = parseInt(coinsText.split(': ')[1]);
      return coinsValue > expected;
    },
    coinsAfterClicksValue
  );
  
  const coinsBeforePurchase = await page.textContent('#coins');
  const coinsBeforePurchaseValue = parseInt(coinsBeforePurchase.split(': ')[1]);
  
  // Buy Coin Mine - use different strategy for Webkit
  if (browserName === 'webkit') {
    // For Webkit, use evaluate to call the function directly
    await page.evaluate(() => window.buyBuilding(0));
  } else {
    // For other browsers, click the button normally
    await page.click('#buy-building-0');
  }
  
  // Wait for coins to decrease after purchase
  await page.waitForFunction(
    (expected) => {
      const coinsText = document.getElementById('coins').textContent;
      const coinsValue = parseInt(coinsText.split(': ')[1]);
      return coinsValue < expected;
    },
    coinsBeforePurchaseValue
  );
  
  // Verify coins decreased immediately after purchase
  const coinsAfterPurchase = await page.textContent('#coins');
  const coinsAfterPurchaseValue = parseInt(coinsAfterPurchase.split(': ')[1]);
  expect(coinsAfterPurchaseValue).toBeLessThan(coinsBeforePurchaseValue);
  
  // Verify building was purchased
  const buildingList = await page.textContent('#building-list');
  expect(buildingList).toContain('Owned: 1');
});