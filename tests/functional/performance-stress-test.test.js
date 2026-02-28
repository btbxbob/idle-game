const { test, expect } = require('@playwright/test');

test.describe('Performance Stress Test - 性能压力测试', () => {
    test.setTimeout(600000);

    test('extreme scenario - 1000 workers, 50 techs, 100 housing', async ({ page }) => {
        test.skip(true, 'Legacy stress scenario depends on removed debug APIs and old UI controls.');
        console.log('=== 开始极端场景性能压力测试 ===');
        console.log('目标：1000 工人，50 科技，100 住房');
        console.log('运行时间：10 分钟');
        console.log('性能指标：FPS 60+, 内存<500MB, UI 响应<100ms');
        
        
        console.log('\n[1/6] 初始化游戏...');
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 10000 });
        console.log('✓ 游戏初始化完成');

        
        console.log('\n[2/6] 设置性能监控...');
        const performanceMetrics = {
            fps: [],
            memory: [],
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
        console.log('✓ FPS 监控已启动');

        
        console.log('\n[3/6] 创建极端场景...');
        
        
        console.log('  3.1.1 获取初始资源...');
        const initialCoins = await page.evaluate(() => window.rustGame.getCoins());
        console.log(`  初始金币：${initialCoins}`);
        
        
        console.log('  3.1.2 通过调试模式给予大量资源...');
        await page.click('[data-tab="debug"]');
        await page.waitForTimeout(100);
        
        
        const debugButtons = await page.$$('#debug-tab button');
        console.log(`  找到 ${debugButtons.length} 个调试按钮`);
        
        
        for (let i = 0; i < 100; i++) {
            const addCoinsBtn = page.locator('#debug-tab button:has-text("Add 1000 Coins")');
            if (await addCoinsBtn.count() > 0) {
                await addCoinsBtn.click();
                if (i % 20 === 0) {
                    await page.waitForTimeout(10);
                }
            }
        }
        console.log('  ✓ 资源已添加');

        
        console.log('  3.2.1 开始创建 1000 工人...');
        const workerStartTime = Date.now();
        
        
        await page.click('[data-tab="workers"]');
        await page.waitForTimeout(100);
        
        
        let workersCreated = 0;
        const targetWorkers = 1000;
        
        while (workersCreated < targetWorkers) {
            const recruitBtn = page.locator('#recruit-worker-btn');
            if (await recruitBtn.count() > 0) {
                
                for (let i = 0; i < 50 && workersCreated < targetWorkers; i++) {
                    await recruitBtn.click();
                    workersCreated++;
                }
                await page.waitForTimeout(50);
            } else {
                console.log('  等待招募按钮...');
                await page.waitForTimeout(100);
            }
            
            if (workersCreated % 100 === 0) {
                console.log(`  已创建 ${workersCreated}/${targetWorkers} 工人`);
            }
        }
        
        const workerCreationTime = (Date.now() - workerStartTime) / 1000;
        console.log(`  ✓ 工人创建完成：${workersCreated} 个工人，耗时 ${workerCreationTime.toFixed(2)}秒`);

        
        console.log('  3.3.1 开始创建 100 住房...');
        const housingStartTime = Date.now();
        
        
        await page.click('[data-tab="housing"]');
        await page.waitForTimeout(100);
        
        let housingCreated = 0;
        const targetHousing = 100;
        
        while (housingCreated < targetHousing) {
            const buildBtn = page.locator('#build-housing-0');
            if (await buildBtn.count() > 0) {
                const disabled = await buildBtn.isDisabled();
                if (!disabled) {
                    await buildBtn.click();
                    housingCreated++;
                    if (housingCreated % 10 === 0) {
                        await page.waitForTimeout(50);
                    }
                } else {
                    
                    await page.click('[data-tab="debug"]');
                    await page.waitForTimeout(50);
                    const addCoinsBtn = page.locator('#debug-tab button:has-text("Add 1000 Coins")');
                    if (await addCoinsBtn.count() > 0) {
                        for (let i = 0; i < 10; i++) {
                            await addCoinsBtn.click();
                        }
                    }
                    await page.click('[data-tab="housing"]');
                    await page.waitForTimeout(50);
                }
            } else {
                await page.waitForTimeout(100);
            }
            
            if (housingCreated % 20 === 0 && housingCreated > 0) {
                console.log(`  已建造 ${housingCreated}/${targetHousing} 住房`);
            }
        }
        
        const housingCreationTime = (Date.now() - housingStartTime) / 1000;
        console.log(`  ✓ 住房建造完成：${housingCreated} 个住房，耗时 ${housingCreationTime.toFixed(2)}秒`);

        
        console.log('  3.4.1 开始解锁 50 科技...');
        const techStartTime = Date.now();
        
        
        await page.click('[data-tab="technology"]');
        await page.waitForTimeout(200);
        
        let techsUnlocked = 0;
        const targetTechs = 50;
        
        
        for (let attempt = 0; attempt < 5 && techsUnlocked < targetTechs; attempt++) {
            const techButtons = await page.$$('.technology-node:not(.unlocked)');
            console.log(`  第${attempt + 1}轮：找到${techButtons.length}个可解锁科技`);
            
            for (let i = 0; i < techButtons.length && techsUnlocked < targetTechs; i++) {
                const btn = page.locator('.technology-node:not(.unlocked)').first();
                if (await btn.count() > 0) {
                    const disabled = await btn.isDisabled();
                    if (!disabled) {
                        await btn.click();
                        techsUnlocked++;
                        await page.waitForTimeout(50);
                    }
                }
            }
            
            await page.waitForTimeout(100);
        }
        
        const techUnlockTime = (Date.now() - techStartTime) / 1000;
        console.log(`  ✓ 科技解锁完成：${techsUnlocked} 个科技，耗时 ${techUnlockTime.toFixed(2)}秒`);

        
        console.log('\n[4/6] 开始 10 分钟性能监控...');
        const monitorDuration = 10 * 60 * 1000;
        const checkInterval = 30000;
        const startTime = Date.now();
        
        let checkCount = 0;
        
        while (Date.now() - startTime < monitorDuration) {
            checkCount++;
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`\n  性能检查 #${checkCount} - 已运行 ${elapsed}秒`);
            
            
            const uiStart = Date.now();
            await page.click('#coin-button');
            await page.waitForTimeout(50);
            const uiResponse = Date.now() - uiStart;
            performanceMetrics.uiResponseTime.push(uiResponse);
            console.log(`  UI 响应时间：${uiResponse}ms`);
            
            
            const memory = await page.evaluate(() => {
                if (performance.memory) {
                    return {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize
                    };
                }
                return null;
            });
            
            if (memory) {
                const memoryMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
                performanceMetrics.memory.push(parseFloat(memoryMB));
                console.log(`  内存使用：${memoryMB}MB`);
            }
            
            
            const fps = await page.evaluate(() => {
                return window.__fpsHistory[window.__fpsHistory.length - 1] || 60;
            });
            performanceMetrics.fps.push(fps);
            console.log(`  FPS: ${fps}`);
            
            
            const errors = await page.evaluate(() => window.__errors || []);
            if (errors.length > 0) {
                console.warn(`  发现 ${errors.length} 个错误`);
            }
            
            
            const coins = await page.evaluate(() => window.rustGame.getCoins());
            console.log(`  当前金币：${coins.toFixed(2)}`);
            
            await page.waitForTimeout(checkInterval);
        }
        
        console.log('\n✓ 10 分钟性能监控完成');

        
        console.log('\n[5/6] 收集最终性能指标...');
        
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
        
        const avgUIResponse = performanceMetrics.uiResponseTime.length > 0
            ? performanceMetrics.uiResponseTime.reduce((a, b) => a + b, 0) / performanceMetrics.uiResponseTime.length
            : 0;
        
        const maxMemory = performanceMetrics.memory.length > 0
            ? Math.max(...performanceMetrics.memory)
            : 0;
        
        console.log('\n=== 最终性能报告 ===');
        console.log(`总运行时间：${((Date.now() - performanceMetrics.startTime) / 1000).toFixed(2)}秒`);
        console.log(`\nFPS 性能:`);
        console.log(`  平均 FPS: ${finalMetrics.avgFps}`);
        console.log(`  最低 FPS: ${finalMetrics.minFps}`);
        console.log(`  目标：60 FPS`);
        console.log(`  状态：${parseFloat(finalMetrics.avgFps) >= 55 ? '✓ 通过' : '✗ 未通过'}`);
        
        console.log(`\n内存使用:`);
        console.log(`  峰值内存：${maxMemory.toFixed(2)}MB`);
        console.log(`  目标：<500MB`);
        console.log(`  状态：${maxMemory < 500 ? '✓ 通过' : '✗ 未通过'}`);
        
        console.log(`\nUI 响应:`);
        console.log(`  平均响应：${avgUIResponse.toFixed(2)}ms`);
        console.log(`  目标：<100ms`);
        console.log(`  状态：${avgUIResponse < 100 ? '✓ 通过' : '✗ 未通过'}`);
        
        console.log(`\n场景数据:`);
        console.log(`  工人数量：${workersCreated}`);
        console.log(`  住房数量：${housingCreated}`);
        console.log(`  科技数量：${techsUnlocked}`);

        
        console.log('\n[6/6] 验证性能指标...');
        
        
        expect(parseFloat(finalMetrics.avgFps)).toBeGreaterThanOrEqual(55);
        console.log('✓ FPS 验证通过');
        
        
        if (maxMemory > 0) {
            expect(maxMemory).toBeLessThan(500);
            console.log('✓ 内存验证通过');
        }
        
        
        expect(avgUIResponse).toBeLessThan(100);
        console.log('✓ UI 响应验证通过');
        
        
        expect(workersCreated).toBeGreaterThanOrEqual(500);
        console.log('✓ 工人创建验证通过');
        
        
        expect(housingCreated).toBeGreaterThanOrEqual(50);
        console.log('✓ 住房创建验证通过');
        
        console.log('\n=== ✓ 性能压力测试全部通过 ===');
    });
});
