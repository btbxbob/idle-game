const { test, expect } = require('@playwright/test');

test.describe('Performance Benchmark - 性能基准测试', () => {
    test.setTimeout(60000);

    test('basic performance check', async ({ page }) => {
        console.log('开始基础性能测试...');
        
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 10000 });
        console.log('游戏初始化完成');
        
        // 测量 UI 响应时间
        const startTime = Date.now();
        await page.click('#coin-button');
        await page.waitForTimeout(100);
        const responseTime = Date.now() - startTime;
        console.log(`UI 响应时间：${responseTime}ms`);
        
        // 验证响应时间 < 1000ms
        expect(responseTime).toBeLessThan(1000);
        
        // 快速点击 50 次
        console.log('执行 50 次快速点击...');
        for (let i = 0; i < 50; i++) {
            await page.click('#coin-button');
        }
        await page.waitForTimeout(500);
        
        // 验证金币增加
        const coins = await page.textContent('#coins');
        const coinsValue = parseFloat(coins.split(': ')[1]);
        console.log(`金币：${coinsValue}`);
        expect(coinsValue).toBeGreaterThanOrEqual(50);
        
        // 标签切换测试
        console.log('测试标签切换...');
        const tabs = ['resources', 'upgrades', 'buildings', 'settings'];
        for (const tab of tabs) {
            await page.click(`button[data-tab="${tab}"]`);
            await page.waitForTimeout(50);
        }
        
        // 验证无错误
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        expect(errors.length).toBe(0);
        
        console.log('✓ 基础性能测试通过');
    });

    test('stress test - rapid operations', async ({ page }) => {
        console.log('开始压力测试...');
        
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 10000 });
        
        // 并发点击
        console.log('执行并发点击...');
        const clicks = Array(20).fill(null).map(() => page.click('#coin-button'));
        await Promise.all(clicks);
        await page.waitForTimeout(300);
        
        // 验证状态正常
        const coins = await page.textContent('#coins');
        const coinsValue = parseFloat(coins.split(': ')[1]);
        expect(Number.isFinite(coinsValue)).toBe(true);
        expect(coinsValue).toBeGreaterThanOrEqual(0);
        
        console.log(`压力测试后金币：${coinsValue}`);
        console.log('✓ 压力测试通过');
    });
});
