const { test, expect } = require('@playwright/test');

test('DEBUG: 检查升级花费更新 - 购买第二项', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // 监听控制台消息
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]') || text.includes('[DEBUG forEach]') || text.includes('[DEBUG Rust]')) {
      consoleMessages.push(text);
      console.log('  [Console]', text);
    }
  });
  
  // 切换到升级标签页
  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(500);
  
  // 获取升级项数量
  const upgradeCount = await page.locator('.upgrade-item').count();
  console.log('升级项数量:', upgradeCount);
  
  if (upgradeCount < 2) {
    console.log('升级项不足 2 个，测试跳过');
    return;
  }
  
  // 获取第二项升级的初始信息
  const secondUpgradeId = await page.locator('.upgrade-item').nth(1).getAttribute('id');
  console.log('第二项升级 ID:', secondUpgradeId);
  
  const secondUpgradeName = await page.locator('.upgrade-item').nth(1).locator('strong').textContent();
  console.log('第二项升级名称:', secondUpgradeName);
  
  const initialCostText = await page.locator('.upgrade-item').nth(1).locator('span').textContent();
  console.log('第二项升级初始花费:', initialCostText);
  
  // 检查第二项升级的按钮是否可用
  const secondButton = page.locator('#buy-upgrade-1');
  const isDisabled = await secondButton.isDisabled();
  console.log('第二项升级按钮是否禁用:', isDisabled);
  
  if (isDisabled) {
    console.log('第二项升级按钮禁用，先点击增加金币');
    for (let i = 0; i < 10; i++) {
      await page.click('#click-area');
    }
    await page.waitForTimeout(300);
  }
  
  // 购买第二项升级
  console.log('\n=== 购买第二项升级 ===');
  await secondButton.click();
  await page.waitForTimeout(500);
  
  // 检查控制台消息
  console.log('\n=== 控制台 DEBUG 消息 ===');
  consoleMessages.forEach(msg => console.log('  ', msg));
  
  // 检查购买后的花费
  const afterCostText = await page.locator('.upgrade-item').nth(1).locator('span').textContent();
  console.log('\n第二项升级购买后花费:', afterCostText);
  
  // 验证花费是否更新
  const costMatch = afterCostText.match(/花费:\s*(\d+)/);
  if (costMatch) {
    const cost = parseInt(costMatch[1]);
    console.log('解析后的花费:', cost);
    
    // 如果花费增加了（乘以 1.5），说明更新成功
    const initialCostMatch = initialCostText.match(/花费:\s*(\d+)/);
    if (initialCostMatch) {
      const initialCost = parseInt(initialCostMatch[1]);
      console.log('初始花费:', initialCost);
      console.log('花费变化:', initialCost, '->', cost);
      
      if (cost > initialCost) {
        console.log('✅ 花费更新成功！');
      } else {
        console.log('❌ 花费没有更新！');
      }
    }
  }
  
  // 验证 forEach 是否遍历了所有项
  const forEachMessages = consoleMessages.filter(m => m.includes('[DEBUG forEach]'));
  console.log('\n=== forEach 遍历的升级项 ===');
  forEachMessages.forEach(msg => console.log('  ', msg));
  
  // 检查是否处理了第二项
  const hasSecondItem = forEachMessages.some(m => m.includes('#1') || m.includes('index: 1'));
  console.log('是否处理了第二项 (#1):', hasSecondItem);
});
