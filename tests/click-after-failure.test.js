const { test, expect } = require('@playwright/test');

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
  
  // Click once to get 1 coin
  await page.click('#click-area');
  
  await page.waitForTimeout(200);
  
  const coinsAfterClick = await page.textContent('#coins');
  const coinsAfterClickValue = parseInt(coinsAfterClick.split(': ')[1]);
  console.log('Coins after 1 click:', coinsAfterClickValue);
  expect(coinsAfterClickValue).toBe(1);
  
  // Switch to buildings tab
  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(100);
  
  // Try to buy Coin Mine (cost: 15) with insufficient coins (1 < 15)
  await page.click('#buy-building-0');
  
  await page.waitForTimeout(300);
  
  // Verify purchase failed but coins should still be 1
  const coinsAfterFailedPurchase = await page.textContent('#coins');
  const coinsAfterFailedPurchaseValue = parseInt(coinsAfterFailedPurchase.split(': ')[1]);
  console.log('Coins after failed purchase:', coinsAfterFailedPurchaseValue);
  expect(coinsAfterFailedPurchaseValue).toBe(1);
  
  // Switch back to resources tab to access click area
  await page.click('button[data-tab="resources"]');
  await page.waitForTimeout(100);
  
  // Now try to click again - this should work if the bug doesn't exist
  await page.click('#click-area');
  
  await page.waitForTimeout(300);
  
  const coinsAfterClickPostFailure = await page.textContent('#coins');
  const coinsAfterClickPostFailureValue = parseInt(coinsAfterClickPostFailure.split(': ')[1]);
  console.log('Coins after click post-failure:', coinsAfterClickPostFailureValue);
  
  // If the bug exists, this will still be 1 (click didn't work)
  // If the bug is fixed, this should be 2
  console.log('Expected: 2, Actual:', coinsAfterClickPostFailureValue);
  
  // This expectation will fail if the bug exists
  expect(coinsAfterClickPostFailureValue).toBe(2);
});