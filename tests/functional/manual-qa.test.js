const { test, expect } = require('../fixtures/coverage');

test('Manual QA - Click and Buy Building', async ({ page }) => {
  // Capture console messages
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));
  
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true, { timeout: 30000 });
  
  // Wait a bit more for WASM to fully load
  await page.waitForTimeout(2000);
  
  // Get initial coins via Rust
  const initialCoins = await page.evaluate(() => window.rustGame.get_coins());
  console.log('Initial coins:', initialCoins);
  
  // Click the coin button (now #coin-button instead of #click-area)
  const coinButton = page.locator('#coin-button');
  await expect(coinButton).toBeVisible();
  
  // Click 10 times
  for (let i = 0; i < 10; i++) {
    await coinButton.click();
    await page.waitForTimeout(50);
  }
  
  // Get coins after clicking
  const afterClickCoins = await page.evaluate(() => window.rustGame.get_coins());
  console.log('Coins after clicking:', afterClickCoins);
  
  // Verify coins increased
  expect(afterClickCoins).toBeGreaterThan(initialCoins);
  console.log('Click action works - coins increased from', initialCoins, 'to', afterClickCoins);
  
  // Navigate to buildings tab
  await page.click('[data-tab="buildings"]');
  await page.waitForTimeout(500);
  
  // Try to buy building 0
  const buyResult = await page.evaluate(() => window.rustGame.buy_building(0));
  console.log('Buy building result:', buyResult);
  
  // Get coins after purchase
  const afterBuyCoins = await page.evaluate(() => window.rustGame.get_coins());
  console.log('Coins after purchase:', afterBuyCoins);
  
  // Verify coins decreased (building purchased)
  if (buyResult) {
    expect(afterBuyCoins).toBeLessThan(afterClickCoins);
    console.log('Building purchase works - coins decreased from', afterClickCoins, 'to', afterBuyCoins);
  } else {
    console.log('Building purchase failed - not enough coins');
  }
});
