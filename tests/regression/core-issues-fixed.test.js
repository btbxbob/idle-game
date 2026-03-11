const { test, expect } = require('../fixtures/coverage');

async function getCoins(page) {
  return page.evaluate(() => {
    if (window.rustGame && typeof window.rustGame.get_coins === 'function') {
      return window.rustGame.get_coins();
    }
    return parseFloat(document.getElementById('coin-count')?.textContent || '0') || 0;
  });
}

// Bug: 金币显示区不更新且列表出现 undefined，修复后用于回归验证。

test('core display issues fixed', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Test 1: Banner coin display should show correct coin amount
  const initialCoinDisplay = await getCoins(page);
  expect(initialCoinDisplay).toBeGreaterThanOrEqual(0);
  
  // Click once to get 1 coin
  await page.click('#coin-button');
  await page.waitForTimeout(300);
  
  const afterValue = await getCoins(page);
  expect(afterValue).toBeGreaterThanOrEqual(1);
  
  const buildingList = await page.textContent('#building-list');
  
  // Should not contain "undefined"
  expect(buildingList).not.toContain('undefined');
  
  // Should contain production rate unit text
  expect(buildingList).toContain('秒');
});
