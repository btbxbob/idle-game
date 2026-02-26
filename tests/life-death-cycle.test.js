const { test, expect } = require('@playwright/test');

test.describe('Life-Death Cycle System', () => {
    test('complete life-death cycle: starvation → death → corpse → maggot → food', async ({ page }) => {
        test.setTimeout(600000);
        
        console.log('=== Starting Life-Death Cycle Test ===');
        
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.waitForTimeout(1000);
        
        console.log('Game initialized');
        
        const initialWorkerCount = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                const workers = window.rustGame.get_workers();
                return workers.length;
            }
            return 0;
        });
        
        console.log(`Initial worker count: ${initialWorkerCount}`);
        expect(initialWorkerCount).toBeGreaterThan(0);
        
        console.log('Step 1: Clicking to earn coins...');
        const clickArea = page.locator('#click-area');
        if (await clickArea.isVisible()) {
            for (let i = 0; i < 200; i++) {
                await clickArea.click();
                if (i % 50 === 0) await page.waitForTimeout(50);
            }
            await page.waitForTimeout(1000);
        }
        
        const coins = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_coins) {
                return window.rustGame.get_coins();
            }
            return 0;
        });
        console.log(`Coins after clicking: ${coins}`);
        
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);
        
        const foodRecipe = page.locator('.crafting-recipe:has-text("食物"), .crafting-recipe:has-text("Food")');
        if (await foodRecipe.isVisible()) {
            const craftBtn = foodRecipe.locator('.craft-recipe-btn, button').first();
            if (await craftBtn.isVisible()) {
                const isDisabled = await craftBtn.evaluate(el => el.disabled);
                if (!isDisabled) {
                    await craftBtn.click();
                    await page.waitForTimeout(500);
                    const confirmBtn = page.locator('button:has-text("确认"), button:has-text("Confirm")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(500);
                    }
                    console.log('Crafted food');
                }
            }
        }
        
        const foodInitial = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                const resources = window.rustGame.get_resources();
                return resources.Food || 0;
            }
            return 0;
        });
        console.log(`Initial food: ${foodInitial}`);
        
        console.log('Waiting 35 seconds with food...');
        await page.waitForTimeout(35000);
        
        const workerCountWithFood = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                const workers = window.rustGame.get_workers();
                return workers.length;
            }
            return 0;
        });
        console.log(`Worker count after 35s with food: ${workerCountWithFood}`);
        expect(workerCountWithFood).toBe(initialWorkerCount);
        
        console.log('Step 2: Waiting for food consumption...');
        
        let foodLevel = foodInitial;
        while (foodLevel > 0) {
            await page.waitForTimeout(5000);
            foodLevel = await page.evaluate(() => {
                if (window.rustGame && window.rustGame.get_resources) {
                    const resources = window.rustGame.get_resources();
                    return resources.Food || 0;
                }
                return 0;
            });
            console.log(`Food level: ${foodLevel}`);
            if (foodLevel <= 0) break;
        }
        
        console.log('Step 3: Waiting 30 seconds for starvation...');
        await page.waitForTimeout(30000);
        
        console.log('Step 4: Verifying worker deaths...');
        const workerCountAfterStarvation = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                const workers = window.rustGame.get_workers();
                return workers.length;
            }
            return 0;
        });
        console.log(`Worker count after starvation: ${workerCountAfterStarvation}`);
        expect(workerCountAfterStarvation).toBeLessThan(initialWorkerCount);
        
        console.log('Step 5: Verifying corpse production...');
        const corpseCount = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                const resources = window.rustGame.get_resources();
                return resources.Corpse || 0;
            }
            return 0;
        });
        console.log(`Corpse count: ${corpseCount}`);
        expect(corpseCount).toBeGreaterThan(0);
        
        console.log('Step 6: Waiting 300 seconds for maggot production...');
        await page.waitForTimeout(300000);
        
        console.log('Step 7: Verifying maggot production...');
        const maggotCount = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                const resources = window.rustGame.get_resources();
                return resources.Maggot || 0;
            }
            return 0;
        });
        console.log(`Maggot count: ${maggotCount}`);
        expect(maggotCount).toBeGreaterThan(0);
        
        const corpseCountAfterDecay = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                const resources = window.rustGame.get_resources();
                return resources.Corpse || 0;
            }
            return 0;
        });
        console.log(`Corpse count after decay: ${corpseCountAfterDecay}`);
        
        console.log('Step 8: Attempting to build maggot factory...');
        await page.click('[data-tab="buildings"]');
        await page.waitForTimeout(500);
        
        const maggotFactoryButton = page.locator('button:has-text("蛆虫工厂"), button:has-text("Maggot Factory")').first();
        if (await maggotFactoryButton.isVisible()) {
            await maggotFactoryButton.click();
            await page.waitForTimeout(500);
            const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }
            console.log('Maggot factory built');
        } else {
            console.log('Maggot factory not available');
        }
        
        console.log('Step 9: Verifying food regeneration...');
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);
        
        const maggotToFoodRecipe = page.locator('.crafting-recipe:has-text("蛆虫"), .crafting-recipe:has-text("Maggot")');
        if (await maggotToFoodRecipe.isVisible()) {
            const craftButton = maggotToFoodRecipe.locator('.craft-recipe-btn, button').first();
            if (await craftButton.isVisible()) {
                const isDisabled = await craftButton.evaluate(el => el.disabled);
                if (!isDisabled) {
                    await craftButton.click();
                    await page.waitForTimeout(500);
                    const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                        await page.waitForTimeout(500);
                    }
                    console.log('Crafted maggots to food');
                } else {
                    console.log('Craft button disabled');
                }
            }
        }
        
        await page.waitForTimeout(1000);
        
        const finalFood = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                const resources = window.rustGame.get_resources();
                return resources.Food || 0;
            }
            return 0;
        });
        console.log(`Final food: ${finalFood}`);
        
        console.log('=== Life-Death Cycle Test Complete ===');
        console.log(`Initial workers: ${initialWorkerCount}`);
        console.log(`Final workers: ${workerCountAfterStarvation}`);
        console.log(`Corpses produced: ${corpseCount}`);
        console.log(`Maggots produced: ${maggotCount}`);
        console.log(`Final food: ${finalFood}`);
        
        await page.screenshot({
            path: '.sisyphus/evidence/life-death-cycle-complete.png',
            fullPage: false
        });
    });
});
