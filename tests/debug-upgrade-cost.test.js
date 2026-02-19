const { test, expect } = require('@playwright/test');

test('DEBUG: 诊断升级花费更新问题', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // 监听控制台消息
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]')) {
      console.log('  [Console]', text);
    }
  });
  
  // 切换到升级标签页
  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(500);
  
  // 检查升级列表
  const upgradeCount = await page.locator('.upgrade-item').count();
  console.log('升级项数量:', upgradeCount);
  
  expect(upgradeCount).toBeGreaterThan(0);
  
  // 获取所有升级项的 ID
  for (let i = 0; i < upgradeCount; i++) {
    const itemId = await page.locator('.upgrade-item').nth(i).getAttribute('id');
    console.log(`升级 #${i} ID:`, itemId);
    
    // 检查 DOM 结构
    const divCount = await page.locator(`#${itemId} div`).count();
    console.log(`  div 数量:`, divCount);
    
    // 获取第二个 div 中的 span 文本
    if (divCount > 1) {
      const spans = await page.locator(`#${itemId} div`).nth(1).locator('span').all();
      if (spans.length > 0) {
        const spanText = await spans[0].textContent();
        console.log(`  第二个 div 的 span:`, spanText);
      }
    }
    
    // 检查花费显示
    const costSpan = await page.locator(`#${itemId} > div:last-child span`).first();
    const costText = await costSpan.textContent();
    console.log(`  花费显示:`, costText);
  }
  
  // 点击几次增加金币，触发更新
  console.log('\n点击增加金币...');
  await page.click('#click-area');
  await page.click('#click-area');
  await page.click('#click-area');
  await page.waitForTimeout(500);
  
  // 再次检查花费显示
  console.log('\n点击后再次检查:');
  for (let i = 0; i < upgradeCount; i++) {
    const itemId = await page.locator('.upgrade-item').nth(i).getAttribute('id');
    const costSpan = await page.locator(`#${itemId} > div:last-child span`).first();
    const costText = await costSpan.textContent();
    console.log(`升级 #${i} 花费:`, costText);
  }
});
