const { test, expect } = require('../fixtures/coverage');

test('click should work after failed purchase', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get initial coins
  const initialCoins = await page.textContent('#coins');
  const initialCoinsValue = parseInt(initialCoins.split(': ')[1]);
  console.log('Initial coins:', initialCoinsValue);
  expect(initialCoinsValue).toBe(0);
  
  // Click once to get at least 1 coin
  await page.click('#coin-button');
  
  await page.waitForTimeout(200);
  
  const coinsAfterClick = await page.textContent('#coins');
  const coinsAfterClickValue = parseInt(coinsAfterClick.split(': ')[1]);
  console.log('Coins after 1 click:', coinsAfterClickValue);
  expect(coinsAfterClickValue).toBeGreaterThanOrEqual(1);
  
  // Switch to buildings tab
  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(100);
  
  // Try to buy Coin Mine (cost: 15) with insufficient coins (1 < 15)
  await page.click('#buy-building-0');
  
  await page.waitForTimeout(300);
  
  // Verify purchase failed but coins should remain unchanged
  const coinsAfterFailedPurchase = await page.textContent('#coins');
  const coinsAfterFailedPurchaseValue = parseInt(coinsAfterFailedPurchase.split(': ')[1]);
  console.log('Coins after failed purchase:', coinsAfterFailedPurchaseValue);
  expect(coinsAfterFailedPurchaseValue).toBe(coinsAfterClickValue);
  
  // Click again - should work regardless of current tab
  await page.click('#coin-button');
  
  await page.waitForTimeout(300);
  
  const coinsAfterClickPostFailure = await page.textContent('#coins');
  const coinsAfterClickPostFailureValue = parseInt(coinsAfterClickPostFailure.split(': ')[1]);
  console.log('Coins after click post-failure:', coinsAfterClickPostFailureValue);
  
  console.log('Expected increase after post-failure click, Actual:', coinsAfterClickPostFailureValue);
  expect(coinsAfterClickPostFailureValue).toBeGreaterThan(coinsAfterFailedPurchaseValue);
});
