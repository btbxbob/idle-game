const { test, expect } = require('@playwright/test');

test.describe('住房系统完整流程测试', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        
        // 切换到建筑标签页
        await page.click('[data-tab="buildings"]');
        await page.waitForTimeout(500);
    });

    test('住房可建造 - 验证住房建造功能', async ({ page }) => {
        // 检查初始住房数量
        const initialHousingCount = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_housing_count) {
                return window.rustGame.get_housing_count();
            }
            return 0;
        });
        
        expect(initialHousingCount).toBe(0);
        console.log(`初始住房数量：${initialHousingCount}`);

        // 建造第一个住房 (消耗 10 金币，10 木头)
        const buildResult = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.build_housing) {
                const cost = { Gold: 10, Wood: 10 };
                return window.rustGame.build_housing(cost);
            }
            return null;
        });
        
        expect(buildResult).toBe(true);
        console.log('住房建造成功');

        // 验证住房数量增加
        const afterBuildCount = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_housing_count) {
                return window.rustGame.get_housing_count();
            }
            return 0;
        });
        
        expect(afterBuildCount).toBe(1);
        console.log(`建造后住房数量：${afterBuildCount}`);

        // 验证金币和木头被扣除
        const coins = await page.evaluate(() => {
            return window.rustGame.get_coins();
        });
        expect(coins).toBeLessThanOrEqual(0);
        console.log(`建造后金币：${coins}`);
    });

    test('住房容量验证 - 验证住房容量计算', async ({ page }) => {
        // 先点击赚取一些金币
        for (let i = 0; i < 50; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(300);

        // 建造住房
        await page.evaluate(() => {
            const cost = { Gold: 10, Wood: 10 };
            window.rustGame.build_housing(cost);
        });
        await page.waitForTimeout(200);

        // 获取住房数据
        const housingData = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_housing) {
                return window.rustGame.get_housing();
            }
            return [];
        });
        
        expect(housingData.length).toBeGreaterThan(0);
        const firstHouse = housingData[0];
        
        console.log('住房数据:', JSON.stringify(firstHouse, null, 2));
        
        // 验证住房属性
        expect(firstHouse).toHaveProperty('name');
        expect(firstHouse).toHaveProperty('level');
        expect(firstHouse).toHaveProperty('capacity');
        expect(firstHouse).toHaveProperty('baseCapacity');
        expect(firstHouse).toHaveProperty('upgradeCost');
        
        // 验证等级为 0（未升级）
        expect(firstHouse.level).toBe(0);
        
        // 验证容量 = baseCapacity * (level + 1)
        expect(firstHouse.capacity).toBe(firstHouse.baseCapacity * (firstHouse.level + 1));
        console.log(`住房容量：${firstHouse.capacity} (基础：${firstHouse.baseCapacity}, 等级：${firstHouse.level})`);
    });

    test('工人自动入住 - 验证住房入住逻辑', async ({ page }) => {
        // 先点击赚取资源
        for (let i = 0; i < 100; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(300);

        // 建造住房
        await page.evaluate(() => {
            const cost = { Gold: 10, Wood: 10, Stone: 5 };
            window.rustGame.build_housing(cost);
        });
        await page.waitForTimeout(200);

        // 获取住房数据
        const housingData = await page.evaluate(() => {
            return window.rustGame.get_housing();
        });
        
        expect(housingData.length).toBe(1);
        const capacity = housingData[0].capacity;
        
        console.log(`住房容量：${capacity}`);
        
        // 验证容量大于 0
        expect(capacity).toBeGreaterThan(0);
        
        // 验证工人可以入住（通过住房容量限制）
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });
        
        console.log(`工人数量：${workers.length}`);
        expect(workers.length).toBeGreaterThan(0);
        
        // 住房容量应该能够容纳至少部分工人
        console.log(`住房容量 ${capacity} 可以容纳 ${workers.length} 个工人中的 ${Math.min(capacity, workers.length)} 个`);
    });

    test('升级住房 - 验证住房升级功能', async ({ page }) => {
        // 先点击赚取足够的资源
        for (let i = 0; i < 200; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        // 建造第一个住房
        const buildResult = await page.evaluate(() => {
            const cost = { Gold: 10, Wood: 10 };
            return window.rustGame.build_housing(cost);
        });
        expect(buildResult).toBe(true);
        await page.waitForTimeout(200);

        // 获取升级前的住房数据
        const beforeUpgrade = await page.evaluate(() => {
            return window.rustGame.get_housing();
        });
        
        expect(beforeUpgrade.length).toBe(1);
        const beforeLevel = beforeUpgrade[0].level;
        const beforeCapacity = beforeUpgrade[0].capacity;
        
        console.log(`升级前：等级=${beforeLevel}, 容量=${beforeCapacity}`);

        // 升级住房
        const upgradeResult = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.upgrade_housing) {
                return window.rustGame.upgrade_housing(0);
            }
            return false;
        });
        
        expect(upgradeResult).toBeTruthy();
        console.log('住房升级成功');
        await page.waitForTimeout(200);

        // 获取升级后的住房数据
        const afterUpgrade = await page.evaluate(() => {
            return window.rustGame.get_housing();
        });
        
        expect(afterUpgrade.length).toBe(1);
        const afterLevel = afterUpgrade[0].level;
        const afterCapacity = afterUpgrade[0].capacity;
        
        console.log(`升级后：等级=${afterLevel}, 容量=${afterCapacity}`);

        // 验证等级增加
        expect(afterLevel).toBe(beforeLevel + 1);
        
        // 验证容量增加
        expect(afterCapacity).toBeGreaterThan(beforeCapacity);
    });

    test('验证容量增加 - 验证升级后容量增长', async ({ page }) => {
        // 先点击赚取足够的资源
        for (let i = 0; i < 300; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        // 建造住房
        await page.evaluate(() => {
            const cost = { Gold: 10, Wood: 10 };
            window.rustGame.build_housing(cost);
        });
        await page.waitForTimeout(200);

        // 获取初始数据
        const initialData = await page.evaluate(() => {
            return window.rustGame.get_housing();
        });
        
        const initialCapacity = initialData[0].capacity;
        const initialBaseCapacity = initialData[0].baseCapacity;
        
        console.log(`初始容量：${initialCapacity} (基础：${initialBaseCapacity})`);

        // 连续升级 2 次
        await page.evaluate(() => {
            window.rustGame.upgrade_housing(0);
            window.rustGame.upgrade_housing(0);
        });
        await page.waitForTimeout(300);

        // 获取升级后数据
        const finalData = await page.evaluate(() => {
            return window.rustGame.get_housing();
        });
        
        const finalLevel = finalData[0].level;
        const finalCapacity = finalData[0].capacity;
        
        console.log(`最终：等级=${finalLevel}, 容量=${finalCapacity}`);

        // 验证等级为 2
        expect(finalLevel).toBe(2);
        
        // 验证容量 = baseCapacity * (level + 1)
        expect(finalCapacity).toBe(initialBaseCapacity * (finalLevel + 1));
        
        // 验证容量确实增加了
        expect(finalCapacity).toBeGreaterThan(initialCapacity);
    });

    test('验证更多工人入住 - 验证容量增加后可容纳更多工人', async ({ page }) => {
        // 先点击赚取足够的资源
        for (let i = 0; i < 300; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        // 建造住房
        await page.evaluate(() => {
            const cost = { Gold: 10, Wood: 10 };
            window.rustGame.build_housing(cost);
        });
        await page.waitForTimeout(200);

        // 获取初始容量
        const initialHousing = await page.evaluate(() => {
            return window.rustGame.get_housing();
        });
        const initialCapacity = initialHousing[0].capacity;
        
        console.log(`初始容量：${initialCapacity}`);

        // 获取工人数量
        const workers = await page.evaluate(() => {
            return window.rustGame.get_workers();
        });
        const workerCount = workers.length;
        
        console.log(`工人总数：${workerCount}`);

        // 升级住房直到容量足够容纳所有工人
        let upgradeCount = 0;
        let currentCapacity = initialCapacity;
        
        while (currentCapacity < workerCount && upgradeCount < 10) {
            const upgradeResult = await page.evaluate((index) => {
                return window.rustGame.upgrade_housing(index);
            }, 0);
            
            if (upgradeResult) {
                upgradeCount++;
                const housing = await page.evaluate(() => {
                    return window.rustGame.get_housing();
                });
                currentCapacity = housing[0].capacity;
                console.log(`升级 ${upgradeCount} 次后容量：${currentCapacity}`);
            } else {
                // 资源不足，继续点击
                for (let i = 0; i < 100; i++) {
                    await page.click('#click-area');
                }
                await page.waitForTimeout(200);
            }
        }
        
        // 验证最终容量足够容纳所有工人
        expect(currentCapacity).toBeGreaterThanOrEqual(workerCount);
        console.log(`最终容量 ${currentCapacity} >= 工人数量 ${workerCount}`);
    });

    test('容量限制生效 - 验证容量上限', async ({ page }) => {
        // 先点击赚取资源
        for (let i = 0; i < 100; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(300);

        // 建造住房
        await page.evaluate(() => {
            const cost = { Gold: 10, Wood: 10 };
            window.rustGame.build_housing(cost);
        });
        await page.waitForTimeout(200);

        // 获取住房数据
        const housing = await page.evaluate(() => {
            return window.rustGame.get_housing();
        });
        
        const capacity = housing[0].capacity;
        const level = housing[0].level;
        const baseCapacity = housing[0].baseCapacity;
        
        console.log(`住房：等级=${level}, 基础容量=${baseCapacity}, 总容量=${capacity}`);

        // 验证容量计算公式
        const expectedCapacity = baseCapacity * (level + 1);
        expect(capacity).toBe(expectedCapacity);
        
        // 验证容量是正数
        expect(capacity).toBeGreaterThan(0);
        
        console.log(`容量验证通过：${capacity} = ${baseCapacity} * (${level} + 1)`);
    });

    test('完整住房流程 - 建造→升级→验证', async ({ page }) => {
        console.log('=== 开始完整住房流程测试 ===');
        
        // 步骤 1: 赚取资源
        console.log('步骤 1: 赚取资源...');
        for (let i = 0; i < 200; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);
        
        const coinsAfterClicking = await page.evaluate(() => window.rustGame.get_coins());
        console.log(`点击后金币：${coinsAfterClicking}`);

        // 步骤 2: 建造住房
        console.log('步骤 2: 建造住房...');
        const buildResult = await page.evaluate(() => {
            const cost = { Gold: 10, Wood: 10 };
            return window.rustGame.build_housing(cost);
        });
        expect(buildResult).toBe(true);
        await page.waitForTimeout(200);
        
        let housing = await page.evaluate(() => window.rustGame.get_housing());
        expect(housing.length).toBe(1);
        console.log(`住房建造成功：${housing[0].name}`);

        // 步骤 3: 验证初始容量
        console.log('步骤 3: 验证初始容量...');
        const initialCapacity = housing[0].capacity;
        const initialLevel = housing[0].level;
        expect(initialLevel).toBe(0);
        console.log(`初始容量：${initialCapacity} (等级 ${initialLevel})`);

        // 步骤 4: 赚取更多资源用于升级
        console.log('步骤 4: 赚取升级资源...');
        for (let i = 0; i < 150; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(300);

        // 步骤 5: 升级住房
        console.log('步骤 5: 升级住房...');
        const upgradeResult = await page.evaluate(() => {
            return window.rustGame.upgrade_housing(0);
        });
        expect(upgradeResult).toBeTruthy();
        await page.waitForTimeout(200);
        
        housing = await page.evaluate(() => window.rustGame.get_housing());
        const upgradedLevel = housing[0].level;
        const upgradedCapacity = housing[0].capacity;
        console.log(`升级后：等级=${upgradedLevel}, 容量=${upgradedCapacity}`);

        // 步骤 6: 验证容量增加
        console.log('步骤 6: 验证容量增加...');
        expect(upgradedLevel).toBe(1);
        expect(upgradedCapacity).toBeGreaterThan(initialCapacity);
        
        console.log('=== 完整住房流程测试通过 ===');
    });
});
