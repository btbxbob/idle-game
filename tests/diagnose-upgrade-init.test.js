const { test, expect } = require('@playwright/test');

test('诊断：升级列表初始化问题', async ({ page }) => {
  // 捕获所有控制台消息
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  page.on('pageerror', err => {
    logs.push({
      type: 'error',
      text: err.message
    });
  });
  
  console.log('\n=== 1. 加载页面 ===');
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);
  
  console.log('控制台日志数量:', logs.length);
  logs.forEach(log => {
    if (log.type === 'error' || log.text.includes('upgrade') || log.text.includes('DEBUG')) {
      console.log(`  [${log.type}]`, log.text);
    }
  });
  
  // 检查游戏初始化状态
  console.log('\n=== 2. 检查游戏状态 ===');
  const initState = await page.evaluate(() => {
    return {
      gameInitialized: window.gameInitialized,
      rustGameExists: !!window.rustGame,
      rustGame: window.rustGame ? {
        update_ui_exists: typeof window.rustGame.update_ui === 'function',
        get_upgrades_exists: typeof window.rustGame.get_upgrades === 'function',
        get_coins_exists: typeof window.rustGame.get_coins === 'function'
      } : null,
      updateUpgradeButtonsExists: typeof window.updateUpgradeButtons === 'function'
    };
  });
  console.log('初始化状态:', JSON.stringify(initState, null, 2));
  
  // 检查 upgrade-list DOM
  console.log('\n=== 3. 检查 upgrade-list DOM ===');
  const upgradeListState = await page.evaluate(() => {
    const list = document.getElementById('upgrade-list');
    if (!list) return { exists: false };
    
    return {
      exists: true,
      childrenCount: list.children.length,
      innerHTML: list.innerHTML.substring(0, 100),
      upgradeItemCount: list.querySelectorAll('.upgrade-item').length
    };
  });
  console.log('upgrade-list 状态:', JSON.stringify(upgradeListState, null, 2));
  
  // 尝试手动调用 Rust 的 update_ui
  console.log('\n=== 4. 手动调用 update_ui ===');
  const updateUiResult = await page.evaluate(() => {
    if (window.rustGame && typeof window.rustGame.update_ui === 'function') {
      window.rustGame.update_ui();
      return 'called';
    }
    return 'not called';
  });
  console.log('update_ui 调用结果:', updateUiResult);
  
  await page.waitForTimeout(500);
  
  // 再次检查 upgrade-list
  console.log('\n=== 5. 再次检查 upgrade-list ===');
  const upgradeListState2 = await page.evaluate(() => {
    const list = document.getElementById('upgrade-list');
    if (!list) return { exists: false };
    
    return {
      exists: true,
      childrenCount: list.children.length,
      upgradeItemCount: list.querySelectorAll('.upgrade-item').length,
      ids: Array.from(list.querySelectorAll('.upgrade-item')).map(el => el.id)
    };
  });
  console.log('upgrade-list 状态 2:', JSON.stringify(upgradeListState2, null, 2));
  
  // 获取 Rust upgrades 数据
  console.log('\n=== 6. 获取 Rust upgrades 数据 ===');
  const rustUpgrades = await page.evaluate(() => {
    if (window.rustGame) {
      // 尝试直接访问内部数据（如果可能）
      try {
        // 通过调用 buy_upgrade 来间接测试
        const coins = window.rustGame.get_coins();
        return { coins };
      } catch (e) {
        return { error: e.message };
      }
    }
    return null;
  });
  console.log('Rust 数据:', JSON.stringify(rustUpgrades, null, 2));
  
  // 检查日志中是否有 upgradeUpgradeButtons 调用
  const upgradeCalls = logs.filter(l => 
    l.text.includes('updateUpgradeButtons') || 
    l.text.includes('upgrade')
  );
  console.log('\n=== 7. upgrade 相关日志 ===');
  upgradeCalls.forEach(log => {
    console.log(`  [${log.type}]`, log.text);
  });
  
  // 断言
  expect(initState.gameInitialized).toBe(true);
  expect(initState.rustGameExists).toBe(true);
});
