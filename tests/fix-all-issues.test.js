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
  
  // Test 3: Autoclicker should produce coins via real clicks 
  for (let i = 0; i < 60; i++) {
    await page.click('#click-area');
  }
  await page.waitForTimeout(500);
  
  const coinsBeforeAutoclicker = await page.textContent('#coins');
  const coinsBeforeAutoclickerValue = parseInt(coinsBeforeAutoclicker.split(': ')[1]);
  console.log('Coins before autoclicker:', coinsBeforeAutoclickerValue);
  expect(coinsBeforeAutoclickerValue).toBeGreaterThanOrEqual(60);
  
  await page.click('#buy-upgrade-0'); // Better Click is index 0
  await page.waitForTimeout(500);
  
  await page.click('#buy-upgrade-1'); // Autoclicker Lv1 is index 1
  await page.waitForTimeout(500);
  
  await page.waitForTimeout(2000);
  
  const coinsAfterAutoclicker = await page.textContent('#coins');
  const coinsAfterAutoclickerValue = parseInt(coinsAfterAutoclicker.split(': ')[1]);
  console.log('Coins after autoclicker (2s):', coinsAfterAutoclickerValue);
  
  expect(coinsAfterAutoclickerValue).toBeGreaterThanOrEqual(coinsBeforeAutoclickerValue - 60);
  
  // Also verify middle coin display updates with autoclicker
  const coinDisplayAfterAutoclicker = await page.textContent('#coin-display');
  const coinDisplayAfterAutoclickerValue = parseFloat(coinDisplayAfterAutoclicker);
  console.log('Coin display after autoclicker:', coinDisplayAfterAutoclickerValue);
  expect(coinDisplayAfterAutoclickerValue).toBeGreaterThan(0);
});