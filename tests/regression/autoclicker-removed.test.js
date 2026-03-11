const { test, expect } = require('../fixtures/coverage');

async function getCoins(page) {
  return page.evaluate(() => {
    if (window.rustGame && typeof window.rustGame.get_coins === 'function') {
      return window.rustGame.get_coins();
    }
    return parseFloat(document.getElementById('coin-count')?.textContent || '0') || 0;
  });
}

test('autoclicker completely removed from codebase', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(500);

  const autoclickerButton = page.locator('button:has-text("autoclicker"), button:has-text("Autoclicker"), button:has-text("自动点击器")');
  const autoclickerButtonCount = await autoclickerButton.count();
  expect(autoclickerButtonCount).toBe(0);

  const autoclickCountDisplay = page.locator('#autoclick-count, .autoclick-count, [data-autoclick]');
  const autoclickCountCount = await autoclickCountDisplay.count();
  expect(autoclickCountCount).toBe(0);

  const autoclickElements = page.locator('[id*="autoclick"], [class*="autoclick"], [name*="autoclick"]');
  const autoclickElementsCount = await autoclickElements.count();
  expect(autoclickElementsCount).toBe(0);

  const hasAutoclickCount = await page.evaluate(() => {
    if (window.rustGame && typeof window.rustGame.get_autoclick_count === 'function') {
      try {
        window.rustGame.get_autoclick_count();
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  expect(hasAutoclickCount).toBe(false);
});

test('verify no passive auto-income from autoclicker', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(500);

  const initialCoinsValue = await getCoins(page);

  for (let i = 0; i < 5; i++) {
    await page.click('#coin-button');
  }

  await page.waitForTimeout(300);

  const coinsAfterClicksValue = await getCoins(page);

  expect(coinsAfterClicksValue).toBeGreaterThan(initialCoinsValue);

  await page.waitForTimeout(2000);

  const coinsAfterWaitValue = await getCoins(page);

  expect(coinsAfterWaitValue).toBe(coinsAfterClicksValue);
});
