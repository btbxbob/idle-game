const { test, expect } = require('../fixtures/coverage');

test('升级花费更新 - 修复 Rust 递归借用错误', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(800);
  
  // 初始状态检查
  const initialCost = await page.locator('#upgrade-item-1 span').textContent();
  expect(initialCost.replace(':', '：').replace('： ', '：')).toBe('花费：20');
  
  // 点击赚取金币
  for (let i = 0; i < 60; i++) {
    await page.click('#coin-button');
  }
  await page.waitForTimeout(300);
  
  const coins = await page.evaluate(() => window.rustGame.get_coins());
  expect(coins).toBeGreaterThanOrEqual(20);
  
  // 购买第二项升级（Lumberjack Efficiency）
  const success = await page.evaluate(() => window.rustGame.buy_upgrade(1));
  expect(success).toBe(true);
  
  await page.waitForTimeout(600);
  
  // 验证花费已更新 (20 * 1.5 = 30)
  const updatedCost = await page.locator('#upgrade-item-1 span').textContent();
  expect(updatedCost.replace(':', '：').replace('： ', '：')).toBe('花费：30');
  
  // 验证所有升级项的花费都正确显示
  const allCosts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.upgrade-item span')).map(s => s.textContent);
  });
  
  expect(allCosts).toHaveLength(3);
  expect(allCosts[0].replace(':', '：').replace('： ', '：')).toBe('花费：10');
  expect(allCosts[1].replace(':', '：').replace('： ', '：')).toBe('花费：30'); // 已更新
  expect(allCosts[2].replace(':', '：').replace('： ', '：')).toBe('花费：25');
  
  // 再次购买，验证连续更新
  const coins2 = await page.evaluate(() => window.rustGame.get_coins());
  const secondSuccess = await page.evaluate(() => window.rustGame.buy_upgrade(1));
  await page.waitForTimeout(600);
  
  const finalCost = await page.locator('#upgrade-item-1 span').textContent();
  // 30 * 1.5 = 45
  expect(finalCost.replace(':', '：').replace('： ', '：')).toBe('花费：45');
});

test('升级 forEach 循环遍历所有项目', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(800);
  
  // 验证所有升级项都存在
  const upgradeCount = await page.locator('.upgrade-item').count();
  expect(upgradeCount).toBeGreaterThanOrEqual(3);
  
  // 验证每个升级项都有正确的 ID
  const ids = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.upgrade-item')).map(el => el.id);
  });
  
  expect(ids).toContain('upgrade-item-0');
  expect(ids).toContain('upgrade-item-1');
  expect(ids).toContain('upgrade-item-2');
  
  // 验证每个升级项都有 span 元素
  const spans = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.upgrade-item')).map(item => {
      const span = item.querySelector('span');
      return span !== null;
    });
  });
  
  expect(spans.every(Boolean)).toBe(true);
});
