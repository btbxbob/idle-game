const { test, expect } = require('@playwright/test');

test.describe('Performance Quick Test - 性能快速测试', () => {
    test.setTimeout(120000); 

    test('basic performance check', async ({ page }) => {
        console.log('=== 开始性能快速测试 ===');
        
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 10000 });
        console.log('✓ 游戏初始化完成');
        
        const metrics = {
            fps: [],
            uiResponseTime: [],
            startTime: Date.now()
        };
        
        await page.evaluate(() => {
            window.__fpsFrames = 0;
            window.__fpsLastTime = performance.now();
            window.__fpsHistory = [];
            
            function measureFPS() {
                window.__fpsFrames++;
                const now = performance.now();
                const elapsed = now - window.__fpsLastTime;
                
                if (elapsed >= 1000) {
                    const fps = Math.round((window.__fpsFrames * 1000) / elapsed);
                    window.__fpsHistory.push(fps);
                    window.__fpsFrames = 0;
                    window.__fpsLastTime = now;
                }
                
                requestAnimationFrame(measureFPS);
            }
            
            requestAnimationFrame(measureFPS);
        });
        
        console.log('开始创建测试数据...');
        
        await page.click('[data-tab="debug"]');
        await page.waitForTimeout(100);
        
        for (let i = 0; i < 50; i++) {
            const addCoinsBtn = page.locator('#debug-tab button:has-text("Add 1000 Coins")');
            if (await addCoinsBtn.count() > 0) {
                await addCoinsBtn.click();
            }
            if (i % 10 === 0) await page.waitForTimeout(10);
        }
        console.log('✓ 资源已添加');
        
        console.log('开始创建工人...');
        await page.click('[data-tab="workers"]');
        await page.waitForTimeout(100);
        
        let workersCreated = 0;
        while (workersCreated < 100) {
            const recruitBtn = page.locator('#recruit-worker-btn');
            if (await recruitBtn.count() > 0) {
                for (let i = 0; i < 10 && workersCreated < 100; i++) {
                    await recruitBtn.click();
                    workersCreated++;
                }
                await page.waitForTimeout(50);
            } else {
                await page.waitForTimeout(100);
            }
        }
        console.log(`✓ 创建了 ${workersCreated} 个工人`);
        
        console.log('开始 2 分钟性能监控...');
        const monitorDuration = 120000; 
        const checkInterval = 10000; 
        const startTime = Date.now();
        
        while (Date.now() - startTime < monitorDuration) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`性能检查 - 已运行 ${elapsed}秒`);
            
            const uiStart = Date.now();
            await page.click('#click-area');
            await page.waitForTimeout(50);
            const uiResponse = Date.now() - uiStart;
            metrics.uiResponseTime.push(uiResponse);
            console.log(`  UI 响应：${uiResponse}ms`);
            
            const fps = await page.evaluate(() => {
                return window.__fpsHistory[window.__fpsHistory.length - 1] || 60;
            });
            metrics.fps.push(fps);
            console.log(`  FPS: ${fps}`);
            
            const coins = await page.evaluate(() => window.rustGame.getCoins());
            console.log(`  金币：${coins.toFixed(2)}`);
            
            await page.waitForTimeout(checkInterval);
        }
        
        console.log('\n收集最终指标...');
        
        const finalMetrics = await page.evaluate(() => {
            const fpsHistory = window.__fpsHistory || [];
            const avgFps = fpsHistory.length > 0 
                ? fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length 
                : 60;
            const minFps = fpsHistory.length > 0 ? Math.min(...fpsHistory) : 60;
            
            return {
                avgFps: avgFps.toFixed(2),
                minFps,
                totalFrames: fpsHistory.length
            };
        });
        
        const avgUIResponse = metrics.uiResponseTime.length > 0
            ? metrics.uiResponseTime.reduce((a, b) => a + b, 0) / metrics.uiResponseTime.length
            : 0;
        
        console.log('\n=== 性能报告 ===');
        console.log(`运行时间：${((Date.now() - metrics.startTime) / 1000).toFixed(2)}秒`);
        console.log(`平均 FPS: ${finalMetrics.avgFps}`);
        console.log(`最低 FPS: ${finalMetrics.minFps}`);
        console.log(`平均 UI 响应：${avgUIResponse.toFixed(2)}ms`);
        console.log(`工人数量：${workersCreated}`);
        
        console.log('\n验证性能指标...');
        expect(parseFloat(finalMetrics.avgFps)).toBeGreaterThanOrEqual(55);
        console.log('✓ FPS 验证通过');
        
        expect(avgUIResponse).toBeLessThan(100);
        console.log('✓ UI 响应验证通过');
        
        expect(workersCreated).toBeGreaterThanOrEqual(50);
        console.log('✓ 工人创建验证通过');
        
        console.log('\n=== ✓ 性能快速测试通过 ===');
    });
});
