const { test, expect } = require('@playwright/test');

test('升级花费更新 - 修复 Rust 递归借用错误', async ({ page }) => {
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  // 初始状态检查
  const initialCost = await page.locator('#upgrade-item-1 span').textContent();
  expect(initialCost).toBe('花费：50');
  
  // 点击赚取金币
  for (let i = 0; i < 60; i++) {
    await page.click('#click-area');
  }
  await page.waitForTimeout(300);
  
  const coins = await page.evaluate(() => window.rustGame.get_coins());
  expect(coins).toBeGreaterThanOrEqual(50);
  
  // 购买第二项升级（Autoclicker Lv1）
  const success = await page.evaluate(() => window.rustGame.buy_upgrade(1));
  expect(success).toBe(true);
  
  await page.waitForTimeout(600);
  
  // 验证花费已更新 (50 * 1.5 = 75)
  const updatedCost = await page.locator('#upgrade-item-1 span').textContent();
  expect(updatedCost).toBe('花费：75');
  
  // 验证所有升级项的花费都正确显示
  const allCosts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.upgrade-item span')).map(s => s.textContent);
  });
  
  expect(allCosts).toHaveLength(4);
  expect(allCosts[0]).toBe('花费：10');
  expect(allCosts[1]).toBe('花费：75'); // 已更新
  expect(allCosts[2]).toBe('花费：20');
  expect(allCosts[3]).toBe('花费：25');
  
  // 再次购买，验证连续更新
  const coins2 = await page.evaluate(() => window.rustGame.get_coins());
  const secondSuccess = await page.evaluate(() => window.rustGame.buy_upgrade(1));
  await page.waitForTimeout(600);
  
  const finalCost = await page.locator('#upgrade-item-1 span').textContent();
  // 75 * 1.5 = 112.5，向下取整为 112
  expect(finalCost).toBe('花费：112');
});

test('升级 forEach 循环遍历所有项目', async ({ page }) => {
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  // 验证所有升级项都存在
  const upgradeCount = await page.locator('.upgrade-item').count();
  expect(upgradeCount).toBe(4);
  
  // 验证每个升级项都有正确的 ID
  const ids = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.upgrade-item')).map(el => el.id);
  });
  
  expect(ids).toEqual([
    'upgrade-item-0',
    'upgrade-item-1',
    'upgrade-item-2',
    'upgrade-item-3'
  ]);
  
  // 验证每个升级项都有 span 元素
  const spans = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.upgrade-item')).map(item => {
      const span = item.querySelector('span');
      return span !== null;
    });
  });
  
  expect(spans.every(Boolean)).toBe(true);
});
