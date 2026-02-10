const { test, expect } = require('@playwright/test');

test('fix all display and functionality issues', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Wait for initial UI to load
  await page.waitForTimeout(500);
  
  // Test 1: Middle coin display should show correct coin amount
  const initialCoinDisplay = await page.textContent('#coin-display');
  console.log('Initial coin display:', initialCoinDisplay);
  expect(initialCoinDisplay).toBe('0');
  
  // Click once to get 1 coin
  await page.click('#click-area');
  await page.waitForTimeout(300);
  
  const coinDisplayAfterClick = await page.textContent('#coin-display');
  console.log('Coin display after click:', coinDisplayAfterClick);
  expect(coinDisplayAfterClick).toBe('1'); // Should show 1, not 0
  
  // Test 2: No undefined values in building/upgrade displays
  const buildingList = await page.textContent('#building-list');
  const upgradeList = await page.textContent('#upgrade-list');
  
  console.log('Building list:', buildingList);
  console.log('Upgrade list:', upgradeList);
  
  // Should not contain "undefined"
  expect(buildingList).not.toContain('undefined');
  expect(upgradeList).not.toContain('undefined');
  
  // Test 3: Autoclicker should produce correct amount of coins
  // First, get enough coins to buy Autoclicker Lv1 (cost: 50)
  for (let i = 0; i < 50; i++) {
    await page.click('#click-area');
  }
  await page.waitForTimeout(500);
  
  const coinsBeforeAutoclicker = await page.textContent('#coins');
  const coinsBeforeAutoclickerValue = parseInt(coinsBeforeAutoclicker.replace('金币: ', ''));
  console.log('Coins before autoclicker:', coinsBeforeAutoclickerValue);
  expect(coinsBeforeAutoclickerValue).toBeGreaterThanOrEqual(50);
  
  // Buy Autoclicker Lv1
  await page.click('#buy-upgrade-1'); // Autoclicker Lv1 is index 1
  await page.waitForTimeout(500);
  
  // Wait for some time to see autoclicker production
  await page.waitForTimeout(2000);
  
  const coinsAfterAutoclicker = await page.textContent('#coins');
  const coinsAfterAutoclickerValue = parseInt(coinsAfterAutoclicker.replace('金币: ', ''));
  console.log('Coins after autoclicker (2s):', coinsAfterAutoclickerValue);
  
  // Should have generated some coins from autoclicker (1 coin/sec * 2 seconds = ~2 coins)
  // But since we floor the display, it should be at least 1 more than before
  expect(coinsAfterAutoclickerValue).toBeGreaterThan(coinsBeforeAutoclickerValue - 50); // -50 for purchase cost
  
  // Also verify middle coin display updates with autoclicker
  const coinDisplayAfterAutoclicker = await page.textContent('#coin-display');
  const coinDisplayAfterAutoclickerValue = parseInt(coinDisplayAfterAutoclicker);
  console.log('Coin display after autoclicker:', coinDisplayAfterAutoclickerValue);
  expect(coinDisplayAfterAutoclickerValue).toBe(coinsAfterAutoclickerValue);
});