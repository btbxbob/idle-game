const { test, expect } = require('../fixtures/coverage');

async function getCoins(page) {
  return page.evaluate(() => {
    if (window.rustGame && typeof window.rustGame.get_coins === 'function') {
      return window.rustGame.get_coins();
    }
    return parseFloat(document.getElementById('coin-count')?.textContent || '0') || 0;
  });
}

test('click should work after failed purchase', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get initial coins
  const initialCoinsValue = await getCoins(page);
  console.log('Initial coins:', initialCoinsValue);
  expect(initialCoinsValue).toBe(0);
  
  // Click once to get at least 1 coin
  await page.click('#coin-button');
  
  await page.waitForTimeout(200);
  
  const coinsAfterClickValue = await getCoins(page);
  console.log('Coins after 1 click:', coinsAfterClickValue);
  expect(coinsAfterClickValue).toBeGreaterThanOrEqual(1);
  
  // Switch to buildings tab
  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(100);
  
  const failedPurchase = await page.evaluate(() => window.rustGame.buy_building(0));
  
  await page.waitForTimeout(300);
  
  // Verify purchase failed but coins should remain unchanged
  const coinsAfterFailedPurchaseValue = await getCoins(page);
  console.log('Coins after failed purchase:', coinsAfterFailedPurchaseValue);
  expect(failedPurchase).toBe(false);
  expect(coinsAfterFailedPurchaseValue).toBe(coinsAfterClickValue);
  
  // Click again - should work regardless of current tab
  await page.click('#coin-button');
  
  await page.waitForTimeout(300);
  
  const coinsAfterClickPostFailureValue = await getCoins(page);
  console.log('Coins after click post-failure:', coinsAfterClickPostFailureValue);
  
  console.log('Expected increase after post-failure click, Actual:', coinsAfterClickPostFailureValue);
  expect(coinsAfterClickPostFailureValue).toBeGreaterThan(coinsAfterFailedPurchaseValue);
});
