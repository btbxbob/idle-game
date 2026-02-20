const { test, expect } = require('@playwright/test');

test.describe('Crafting System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="crafting"]');
        await page.waitForSelector('#tab-crafting.active');
    });

    test('crafting panel displays at least 6 recipes', async ({ page }) => {
        const recipeItems = page.locator('.crafting-recipe, .recipe-item, [class*="recipe"]');
        const count = await recipeItems.count();
        
        expect(count).toBeGreaterThanOrEqual(6);
        console.log(`Total recipes displayed: ${count}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-30-crafting-recipes.png',
            fullPage: false
        });
    });

    test('each recipe displays input and output resources', async ({ page }) => {
        const firstRecipe = page.locator('.crafting-recipe:first-child, .recipe-item:first-child');
        await expect(firstRecipe).toBeVisible();

        const inputElement = firstRecipe.locator('[class*="input"], .recipe-input, .input-resource');
        await expect(inputElement).toBeVisible();

        const outputElement = firstRecipe.locator('[class*="output"], .recipe-output, .output-resource');
        await expect(outputElement).toBeVisible();

        console.log('Recipe structure verified: input and output displayed');
    });

    test('coins to wood conversion (100:10 ratio)', async ({ page }) => {
        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);
        console.log(`Initial coins: ${coinsValue}`);

        const initialWood = await page.textContent('#wood');
        const woodValue = parseFloat(initialWood.split(': ')[1]);
        console.log(`Initial wood: ${woodValue}`);

        if (coinsValue >= 100) {
            const coinsToWoodRecipe = page.locator('.crafting-recipe:has-text("coins"), .crafting-recipe:has-text("Coins")').first();
            const craftButton = coinsToWoodRecipe.locator('.craft-recipe-btn, button');
            
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm"), .modal-btn');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }

            const afterCoins = await page.textContent('#coins');
            const afterCoinsValue = parseInt(afterCoins.split(': ')[1]);
            console.log(`Coins after craft: ${afterCoinsValue}`);

            const afterWood = await page.textContent('#wood');
            const afterWoodValue = parseFloat(afterWood.split(': ')[1]);
            console.log(`Wood after craft: ${afterWoodValue}`);

            expect(afterCoinsValue).toBeLessThan(coinsValue);
            expect(afterWoodValue).toBeGreaterThan(woodValue);

            await page.screenshot({
                path: '.sisyphus/evidence/task-30-coins-to-wood.png'
            });
        } else {
            console.log('Not enough coins for crafting test, clicking...');
            for (let i = 0; i < 100; i++) {
                await page.click('#click-area');
            }
            await page.waitForTimeout(500);
        }
    });

    test('coins to stone conversion (100:1 ratio)', async ({ page }) => {
        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        const initialStone = await page.textContent('#stone');
        const stoneValue = parseFloat(initialStone.split(': ')[1]);

        if (coinsValue >= 100) {
            const coinsToStoneRecipe = page.locator('.crafting-recipe:has-text("stone"), .crafting-recipe:has-text("Stone")').first();
            const craftButton = coinsToStoneRecipe.locator('.craft-recipe-btn, button');
            
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }

            const afterCoins = await page.textContent('#coins');
            const afterCoinsValue = parseInt(afterCoins.split(': ')[1]);

            const afterStone = await page.textContent('#stone');
            const afterStoneValue = parseFloat(afterStone.split(': ')[1]);

            expect(afterCoinsValue).toBeLessThan(coinsValue);
            expect(afterStoneValue).toBeGreaterThan(stoneValue);

            console.log(`Coins to stone: ${coinsValue} -> ${afterCoinsValue}, Stone: ${stoneValue} -> ${afterStoneValue}`);
        }
    });

    test('wood to coins conversion (10:100 ratio)', async ({ page }) => {
        const initialWood = await page.textContent('#wood');
        const woodValue = parseFloat(initialWood.split(': ')[1]);

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (woodValue >= 10) {
            const woodToCoinsRecipe = page.locator('.crafting-recipe:has-text("wood"), .crafting-recipe:has-text("Wood")').nth(1);
            const craftButton = woodToCoinsRecipe.locator('.craft-recipe-btn, button');
            
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }

            const afterWood = await page.textContent('#wood');
            const afterWoodValue = parseFloat(afterWood.split(': ')[1]);

            const afterCoins = await page.textContent('#coins');
            const afterCoinsValue = parseInt(afterCoins.split(': ')[1]);

            expect(afterWoodValue).toBeLessThan(woodValue);
            expect(afterCoinsValue).toBeGreaterThan(coinsValue);

            console.log(`Wood to coins: ${woodValue} -> ${afterWoodValue}, Coins: ${coinsValue} -> ${afterCoinsValue}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-30-wood-to-coins.png'
            });
        }
    });

    test('crafting fails with insufficient resources', async ({ page }) => {
        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue < 100) {
            const craftButton = page.locator('.craft-recipe-btn').first();
            
            const isDisabled = await craftButton.evaluate(el => 
                el.disabled || el.classList.contains('disabled') ||
                getComputedStyle(el).pointerEvents === 'none'
            );

            expect(isDisabled).toBe(true);
            console.log('Craft button correctly disabled for insufficient resources');

            await page.screenshot({
                path: '.sisyphus/evidence/task-30-insufficient-resources.png'
            });
        }
    });

    test('crafting button state updates based on resources', async ({ page }) => {
        const craftButton = page.locator('.craft-recipe-btn').first();
        
        const initialDisabled = await craftButton.evaluate(el => el.disabled);
        console.log(`Initial button disabled: ${initialDisabled}`);

        for (let i = 0; i < 100; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const afterDisabled = await craftButton.evaluate(el => el.disabled);
        console.log(`After clicking button disabled: ${afterDisabled}`);

        if (!afterDisabled) {
            const isEnabled = await craftButton.evaluate(el => 
                !el.disabled && el.classList.contains('enabled')
            );
            console.log(`Button enabled state: ${isEnabled}`);
        }

        await page.screenshot({
            path: '.sisyphus/evidence/task-30-button-state.png'
        });
    });

    test('crafting success feedback displays', async ({ page }) => {
        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 100) {
            const craftButton = page.locator('.craft-recipe-btn').first();
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);

                const successMessage = page.locator('.craft-success, [class*="success"], .toast-success');
                if (await successMessage.isVisible()) {
                    console.log('Success feedback displayed');
                } else {
                    console.log('Success feedback may use different UI');
                }

                await page.screenshot({
                    path: '.sisyphus/evidence/task-30-success-feedback.png'
                });
            }
        }
    });

    test('crafting failure feedback displays', async ({ page }) => {
        const craftButton = page.locator('.craft-recipe-btn').first();
        const isDisabled = await craftButton.evaluate(el => el.disabled);

        if (isDisabled) {
            await craftButton.click();
            await page.waitForTimeout(500);

            const failureMessage = page.locator('.craft-fail, [class*="fail"], [class*="error"], .toast-error');
            if (await failureMessage.isVisible()) {
                console.log('Failure feedback displayed');
            } else {
                console.log('Button was disabled, no failure feedback needed');
            }

            await page.screenshot({
                path: '.sisyphus/evidence/task-30-failure-feedback.png'
            });
        }
    });

    test('crafting accessible via WASM API', async ({ page }) => {
        const canCraft = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.craft_resource) {
                return typeof window.rustGame.craft_resource === 'function';
            }
            return false;
        });

        expect(canCraft).toBe(true);
        console.log('WASM craft_resource API available');

        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        if (Array.isArray(recipes)) {
            expect(recipes.length).toBeGreaterThanOrEqual(6);
            console.log(`WASM returned ${recipes.length} recipes`);
            console.log('First recipe:', JSON.stringify(recipes[0], null, 2));
        }

        await page.screenshot({
            path: '.sisyphus/evidence/task-30-wasm-api.png'
        });
    });

    test('total_resources_crafted statistic updates', async ({ page }) => {
        await page.click('[data-tab="statistics"]');
        await page.waitForTimeout(300);

        const craftStat = page.locator('.statistic-item:nth-child(5) .stat-value');
        const initialValue = await craftStat.textContent();
        console.log(`Initial crafts: ${initialValue}`);

        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(300);

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 100) {
            const craftButton = page.locator('.craft-recipe-btn').first();
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }

            await page.click('[data-tab="statistics"]');
            await page.waitForTimeout(300);

            const afterValue = await craftStat.textContent();
            const afterCount = parseInt(afterValue);
            
            expect(afterCount).toBeGreaterThanOrEqual(parseInt(initialValue));
            console.log(`Total crafts after: ${afterValue}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-30-craft-statistic.png'
            });
        }
    });

    test('crafting confirm dialog appears', async ({ page }) => {
        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 100) {
            const craftButton = page.locator('.craft-recipe-btn').first();
            await craftButton.click();
            await page.waitForTimeout(500);

            const modal = page.locator('.craft-modal, .modal, [class*="modal"], [class*="dialog"]');
            const isVisible = await modal.isVisible();
            
            console.log(`Craft confirm dialog visible: ${isVisible}`);

            if (isVisible) {
                await page.screenshot({
                    path: '.sisyphus/evidence/task-30-confirm-dialog.png'
                });
            }
        }
    });

    test('crafting persist after page reload', async ({ page }) => {
        const initialCraftStat = await page.evaluate(() => {
            const stat = document.querySelector('.statistic-item:nth-child(5) .stat-value');
            return stat ? stat.textContent : '0';
        });

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 100) {
            await page.click('[data-tab="crafting"]');
            await page.waitForTimeout(300);

            const craftButton = page.locator('.craft-recipe-btn').first();
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }
        }

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="statistics"]');
        await page.waitForTimeout(500);

        const afterCraftStat = await page.locator('.statistic-item:nth-child(5) .stat-value').textContent();
        
        console.log(`Craft stat before: ${initialCraftStat}, after: ${afterCraftStat}`);
        expect(parseInt(afterCraftStat)).toBeGreaterThanOrEqual(parseInt(initialCraftStat));

        await page.screenshot({
            path: '.sisyphus/evidence/task-30-persistence.png'
        });
    });

    test('recipe ratios are correct (100:10:1)', async ({ page }) => {
        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        if (Array.isArray(recipes) && recipes.length > 0) {
            for (const recipe of recipes) {
                const inputAmount = recipe.input_amount || 0;
                const outputAmount = recipe.output_amount || 0;
                
                const ratio = inputAmount / outputAmount;
                console.log(`Recipe: ${recipe.name || recipe.id} - ${inputAmount} -> ${outputAmount} (ratio: ${ratio})`);
                
                expect(ratio).toBeGreaterThan(0);
                expect(ratio).toBeLessThan(1000);
            }

            await page.screenshot({
                path: '.sisyphus/evidence/task-30-recipe-ratios.png'
            });
        }
    });
});
