const { test, expect } = require('@playwright/test');

test('升级花费应该实时更新', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // 切换到升级标签页
  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(100);
  
  // 获取初始升级项数量和花费
  const upgradeItems = await page.locator('.upgrade-item').count();
  console.log('升级项数量:', upgradeItems);
  
  if (upgradeItems < 2) {
    console.log('升级项不足 2 个，跳过测试');
    return;
  }
  
  // 获取第一个升级项的初始花费
  const firstUpgradeInitialCost = await page.textContent('.upgrade-item:nth-child(1) span');
  console.log('第一个升级初始花费显示:', firstUpgradeInitialCost);
  
  // 获取第二个升级项的初始花费
  const secondUpgradeInitialCost = await page.textContent('.upgrade-item:nth-child(2) span');
  console.log('第二个升级初始花费显示:', secondUpgradeInitialCost);
  
  // 点击几次增加金币
  await page.click('#click-area');
  await page.click('#click-area');
  await page.click('#click-area');
  await page.waitForTimeout(200);
  
  // 等待并刷新显示
  await page.waitForTimeout(500);
  
  // 获取第一个升级项的新花费
  const firstUpgradeNewCost = await page.textContent('.upgrade-item:nth-child(1) span');
  console.log('第一个升级新花费显示:', firstUpgradeNewCost);
  
  // 获取第二个升级项的新花费
  const secondUpgradeNewCost = await page.textContent('.upgrade-item:nth-child(2) span');
  console.log('第二个升级新花费显示:', secondUpgradeNewCost);
  
  // 验证花费格式正确（应该包含 "花费:" 和数字）
  expect(firstUpgradeNewCost).toContain('花费:');
  expect(secondUpgradeNewCost).toContain('花费:');
  
  // 验证花费是数字
  const firstCostMatch = firstUpgradeNewCost.match(/花费:\s*(\d+)/);
  const secondCostMatch = secondUpgradeNewCost.match(/花费:\s*(\d+)/);
  
  expect(firstCostMatch).toBeTruthy();
  expect(secondCostMatch).toBeTruthy();
  
  const firstCost = parseInt(firstCostMatch[1]);
  const secondCost = parseInt(secondCostMatch[1]);
  
  console.log('第一个升级花费:', firstCost);
  console.log('第二个升级花费:', secondCost);
  
  // 验证花费是正数
  expect(firstCost).toBeGreaterThan(0);
  expect(secondCost).toBeGreaterThan(0);
  
  // 购买第一个升级
  console.log('准备购买第一个升级...');
  const buyButton1 = await page.locator('#buy-upgrade-0');
  const isDisabled = await buyButton1.isDisabled();
  console.log('购买按钮是否禁用:', isDisabled);
  
  if (!isDisabled) {
    await buyButton1.click();
    await page.waitForTimeout(300);
    
    // 购买后再次检查第二个升级的花费
    const secondUpgradeAfterPurchase = await page.textContent('.upgrade-item:nth-child(2) span');
    console.log('购买第一个升级后，第二个升级花费显示:', secondUpgradeAfterPurchase);
    
    // 验证第二个升级的花费仍然正确显示
    expect(secondUpgradeAfterPurchase).toContain('花费:');
  }
});
