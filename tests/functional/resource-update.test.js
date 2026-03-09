const { test, expect } = require('../fixtures/coverage');

async function readCoinsValue(page) {
  const coinCount = page.locator('#coin-count');
  if (await coinCount.count()) {
    const text = await coinCount.textContent();
    const match = String(text || '').match(/([0-9]+(?:\.[0-9]+)?)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  const coins = await page.textContent('#coins');
  return parseInt(String(coins || '').split(': ')[1], 10);
}

test('resource updates should be real-time', async ({ page, browserName }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get initial coins count
  const initialCoinsValue = await readCoinsValue(page);
  
  // Click the middle button to get some coins
  await page.click('#coin-button');
  await page.click('#coin-button');
  await page.click('#coin-button');
  
  // Wait for UI to update - wait for coins to actually change
  await page.waitForFunction(
    (expected) => {
      const coinCount = document.getElementById('coin-count');
      const legacyCoins = document.getElementById('coins');
      const text = coinCount ? coinCount.textContent : (legacyCoins ? legacyCoins.textContent : '0');
      const match = String(text || '').match(/([0-9]+(?:\.[0-9]+)?)/);
      const coinsValue = match ? parseInt(match[1], 10) : 0;
      return coinsValue > expected;
    },
    initialCoinsValue
  );
  
  // Verify coins increased immediately
  const coinsAfterClicksValue = await readCoinsValue(page);
  expect(coinsAfterClicksValue).toBeGreaterThan(initialCoinsValue);
  
  // Get enough coins for a purchase
  for (let i = 0; i < 20; i++) {
    await page.click('#coin-button');
  }
  
  // Wait for coins to update
  await page.waitForFunction(
    (expected) => {
      const coinCount = document.getElementById('coin-count');
      const legacyCoins = document.getElementById('coins');
      const text = coinCount ? coinCount.textContent : (legacyCoins ? legacyCoins.textContent : '0');
      const match = String(text || '').match(/([0-9]+(?:\.[0-9]+)?)/);
      const coinsValue = match ? parseInt(match[1], 10) : 0;
      return coinsValue > expected;
    },
    coinsAfterClicksValue
  );
  
  const coinsBeforePurchaseValue = await readCoinsValue(page);
  
  // Switch to buildings tab
  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(100);
  
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
      const coinCount = document.getElementById('coin-count');
      const legacyCoins = document.getElementById('coins');
      const text = coinCount ? coinCount.textContent : (legacyCoins ? legacyCoins.textContent : '0');
      const match = String(text || '').match(/([0-9]+(?:\.[0-9]+)?)/);
      const coinsValue = match ? parseInt(match[1], 10) : 0;
      return coinsValue < expected;
    },
    coinsBeforePurchaseValue
  );
  
  // Verify coins decreased immediately after purchase
  const coinsAfterPurchaseValue = await readCoinsValue(page);
  expect(coinsAfterPurchaseValue).toBeLessThan(coinsBeforePurchaseValue);
  
  // Verify building was purchased
  const buildingList = await page.textContent('#building-list');
  expect(buildingList).toMatch(/拥有:\s*1/);
});
