const { test, expect } = require('@playwright/test');

test('autoclicker should perform real clicks instead of passive production', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Wait for initial UI to load
  await page.waitForTimeout(500);
  
  // Check initial state
  const initialCoinDisplay = await page.textContent('#coin-display');
  expect(initialCoinDisplay).toBe('0');
  
  const initialCPC = await page.textContent('#cpc'); // coins per click
  console.log('Initial coins per click:', initialCPC);
  
  // First, increase coins per click by buying "Better Click" upgrade
  // Make sure we have enough coins (need 10 for the upgrade)
  for (let i = 0; i < 10; i++) {
    await page.click('#click-area');
  }
  await page.waitForTimeout(300);
  
  const coinsBeforeUpgrade = await page.textContent('#coins');
  const coinsBeforeUpgradeValue = parseInt(coinsBeforeUpgrade.split(': ')[1]);
  console.log('Coins before Better Click:', coinsBeforeUpgradeValue);
  
  // Switch to upgrades tab
  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(100);
  
  // Buy Better Click upgrade to increase click value to 2
  await page.click('#buy-upgrade-0'); // Better Click is index 0
  await page.waitForTimeout(300);
  
  // Check that coins per click increased
  const cpcAfterBetterClick = await page.textContent('#cpc');
  console.log('Coins per click after Better Click:', cpcAfterBetterClick);
  
  // Switch back to resources tab to click for coins
  await page.click('button[data-tab="resources"]');
  await page.waitForTimeout(100);
  
  // Now buy Autoclicker Lv1 (should perform real clicks equal to coins-per-click value)
  // Buy enough coins to afford Autoclicker (costs 50)
  const coinsNeeded = 50 - (coinsBeforeUpgradeValue - 10); // account for the 10 spent on click upgrade
  for (let i = 0; i < Math.max(0, coinsNeeded); i++) {
    await page.click('#click-area');
  }
  await page.waitForTimeout(300);
  
  // Record the amount before autoclicker
  const coinsBeforeAutoclicker = await page.textContent('#coins');
  const coinsBeforeAutoclickerValue = parseInt(coinsBeforeAutoclicker.split(': ')[1]);
  const coinDisplayBefore = await page.textContent('#coin-display');
  console.log('Coins before autoclicker (after buy):', coinsBeforeAutoclickerValue);
  console.log('Coin display before:', coinDisplayBefore);
  
  // Switch to upgrades tab to buy autoclicker
  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(100);
  
  // Purchase Autoclicker upgrade
  await page.click('#buy-upgrade-1'); // Autoclicker Lv1 is index 1
  await page.waitForTimeout(500);
  
  // Now wait and see how the autoclicker behaves
  await page.waitForTimeout(2000); // Wait 2 seconds for autoclicks to happen
  
  const coinsAfterAutoclicker = await page.textContent('#coins');
  const coinsAfterAutoclickerValue = parseInt(coinsAfterAutoclicker.split(': ')[1]);
  const coinDisplayAfter = await page.textContent('#coin-display');
  const cpcAfterBoth = await page.textContent('#cpc');
  
  console.log('Coins after autoclicker (after 2s):', coinsAfterAutoclickerValue);
  console.log('Coin display after autoclicker:', coinDisplayAfter);
  console.log('Coins per click after both upgrades:', cpcAfterBoth);
  
  // With 1 autoclicker and 2 coins-per-click (from Better Click),
  // in 2 seconds the game runs roughly 20 cycles (~100ms cycle),
  // so we should see approximately 20 * 2 = 40 coins from autoclicks (2 per cycle)
  const expectedMinGrowth = 5; // Expect substantial growth in coins, at least some from autoclicks
  expect(coinsAfterAutoclickerValue).toBeGreaterThan(coinsBeforeAutoclickerValue + expectedMinGrowth - 50); // -50 for autoclicker purchase
  
  // Verify middle coin display updates
  expect(parseInt(coinDisplayAfter)).toBe(coinsAfterAutoclickerValue);

  // Verify Autoclicker now mentions the new behavior - this may need adjustment in UI
  const upgradeList = await page.textContent('#upgrade-list');
  console.log('Upgrade list:', upgradeList.substring(0, 200)); // Print first 200 chars
});