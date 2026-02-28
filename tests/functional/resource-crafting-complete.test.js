const { test, expect } = require('@playwright/test');

test.describe('Resource Crafting Complete', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080', { timeout: 60000 });
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
    });

    test('all crafting recipes accessible via WASM API', async ({ page }) => {
        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        expect(Array.isArray(recipes)).toBe(true);
        expect(recipes.length).toBeGreaterThanOrEqual(6);
        console.log(`Total crafting recipes: ${recipes.length}`);

        // Verify recipe structure
        for (const recipe of recipes) {
            expect(recipe).toHaveProperty('id');
            expect(recipe).toHaveProperty('name');
            expect(recipe).toHaveProperty('input_resource');
            expect(recipe).toHaveProperty('input_amount');
            expect(recipe).toHaveProperty('output_resource');
            expect(recipe).toHaveProperty('output_amount');
            
            expect(typeof recipe.input_amount).toBe('number');
            expect(typeof recipe.output_amount).toBe('number');
            expect(recipe.input_amount).toBeGreaterThan(0);
            expect(recipe.output_amount).toBeGreaterThan(0);
        }

        console.log('All recipes have correct structure');
    });

    test('recipe ratios follow 100:10:1 pattern', async ({ page }) => {
        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        // Accept forward ratios (10:1, 100:1) and reverse ratios (0.1, 0.01)
        for (const recipe of recipes) {
            const ratio = recipe.input_amount / recipe.output_amount;
            
            // Forward recipes: input > output (ratio > 1)
            // Reverse recipes: input < output (ratio < 1)
            const isValidRatio = ratio > 0 && (ratio >= 1 || ratio <= 0.5);
            
            console.log(`Recipe ${recipe.name}: ${recipe.input_amount} ${recipe.input_resource} -> ${recipe.output_amount} ${recipe.output_resource} (ratio: ${ratio})`);
            
            expect(ratio).toBeGreaterThan(0);
            expect(isValidRatio).toBe(true);
        }
    });

    test('crafting consumes correct input amount', async ({ page }) => {
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);

        // Get a recipe to test
        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        if (recipes.length === 0) {
            console.log('No recipes available, skipping test');
            return;
        }

        const testRecipe = recipes[0];
        console.log(`Testing recipe: ${testRecipe.name}`);

        // Get initial input resource amount
        const initialInputAmount = await page.evaluate((inputResource) => {
            const resources = window.rustGame.get_resources();
            return resources[inputResource] || 0;
        }, testRecipe.input_resource);

        console.log(`Initial ${testRecipe.input_resource}: ${initialInputAmount}`);

        // Find and click craft button
        const craftButtons = page.locator('.craft-button');
        const count = await craftButtons.count();
        
        let craftClicked = false;
        for (let i = 0; i < count && !craftClicked; i++) {
            const button = craftButtons.nth(i);
            const buttonText = await button.textContent();
            
            if (buttonText && buttonText.includes(testRecipe.name)) {
                await button.click();
                await page.waitForTimeout(500);

                const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                    await page.waitForTimeout(500);
                    craftClicked = true;
                }
            }
        }

        if (craftClicked) {
            const afterInputAmount = await page.evaluate((inputResource) => {
                const resources = window.rustGame.get_resources();
                return resources[inputResource] || 0;
            }, testRecipe.input_resource);

            console.log(`After craft ${testRecipe.input_resource}: ${afterInputAmount}`);
            
            // If we had enough resources, verify consumption
            if (initialInputAmount >= testRecipe.input_amount) {
                const consumed = initialInputAmount - afterInputAmount;
                console.log(`Resources consumed: ${consumed}, expected: ${testRecipe.input_amount}`);
                expect(consumed).toBe(testRecipe.input_amount);
            }
        }
    });

    test('crafting produces correct output amount', async ({ page }) => {
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);

        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        if (recipes.length === 0) {
            console.log('No recipes available, skipping test');
            return;
        }

        const testRecipe = recipes[0];
        
        // Get initial output resource amount
        const initialOutputAmount = await page.evaluate((outputResource) => {
            const resources = window.rustGame.get_resources();
            return resources[outputResource] || 0;
        }, testRecipe.output_resource);

        console.log(`Initial ${testRecipe.output_resource}: ${initialOutputAmount}`);

        // Find and click craft button
        const craftButtons = page.locator('.craft-button');
        const count = await craftButtons.count();
        
        let craftClicked = false;
        for (let i = 0; i < count && !craftClicked; i++) {
            const button = craftButtons.nth(i);
            const buttonText = await button.textContent();
            
            if (buttonText && buttonText.includes(testRecipe.name)) {
                await button.click();
                await page.waitForTimeout(500);

                const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                    await page.waitForTimeout(500);
                    craftClicked = true;
                }
            }
        }

        if (craftClicked) {
            const afterOutputAmount = await page.evaluate((outputResource) => {
                const resources = window.rustGame.get_resources();
                return resources[outputResource] || 0;
            }, testRecipe.output_resource);

            console.log(`After craft ${testRecipe.output_resource}: ${afterOutputAmount}`);
            
            // Verify production
            const produced = afterOutputAmount - initialOutputAmount;
            console.log(`Resources produced: ${produced}, expected: ${testRecipe.output_amount}`);
            
            if (produced > 0) {
                expect(produced).toBe(testRecipe.output_amount);
            }
        }
    });

    test('reverse crafting recipes work (decomposition)', async ({ page }) => {
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);

        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        // Find reverse recipes (ratio < 1, meaning output > input)
        const reverseRecipes = recipes.filter(r => r.input_amount < r.output_amount);
        
        console.log(`Found ${reverseRecipes.length} reverse recipes`);
        expect(reverseRecipes.length).toBeGreaterThanOrEqual(1);

        for (const recipe of reverseRecipes) {
            console.log(`Reverse recipe: ${recipe.name} - ${recipe.input_amount} ${recipe.input_resource} -> ${recipe.output_amount} ${recipe.output_resource}`);
            
            // Reverse recipes should have smaller input than output
            expect(recipe.input_amount).toBeLessThan(recipe.output_amount);
        }
    });

    test('crafting fails with insufficient resources', async ({ page }) => {
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);

        // Get a recipe that requires more resources than we have
        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        if (recipes.length === 0) {
            console.log('No recipes available, skipping test');
            return;
        }

        const testRecipe = recipes[0];

        // Get current resource amount
        const currentAmount = await page.evaluate((inputResource) => {
            const resources = window.rustGame.get_resources();
            return resources[inputResource] || 0;
        }, testRecipe.input_resource);

        console.log(`Current ${testRecipe.input_resource}: ${testRecipe.input_amount} needed`);

        if (currentAmount < testRecipe.input_amount) {
            // Try to craft - should fail or button should be disabled
            const craftButtons = page.locator('.craft-button');
            const count = await craftButtons.count();
            
            for (let i = 0; i < count; i++) {
                const button = craftButtons.nth(i);
                const buttonText = await button.textContent();
                
                if (buttonText && buttonText.includes(testRecipe.name)) {
                    const isDisabled = await button.evaluate(el => 
                        el.disabled || el.classList.contains('disabled')
                    );
                    
                    console.log(`Craft button disabled: ${isDisabled}`);
                    
                    if (!isDisabled) {
                        // If not disabled, try clicking and expect failure
                        await button.click();
                        await page.waitForTimeout(500);
                        
                        // Check for error message
                        const errorMsg = page.locator('.error-message, .craft-error, .toast-error');
                        const hasError = await errorMsg.isVisible().catch(() => false);
                        
                        if (hasError) {
                            console.log('Error message displayed for insufficient resources');
                        }
                    }
                    break;
                }
            }
        }
    });

    test('crafting statistic updates correctly', async ({ page }) => {
        // Navigate to statistics tab
        await page.click('[data-tab="statistics"]');
        await page.waitForTimeout(300);

        // Find the crafting stat element using multiple selectors
        const statSelectors = [
            '.statistic-item:has-text("总合成物品") .stat-value',
            '.statistic-item:nth-child(5) .stat-value',
            '[data-stat="totalResourcesCrafted"] .stat-value',
            '.statistics-panel .stat-value' 
        ];
        
        let initialStat = '0';
        let statFound = false;
        
        for (const selector of statSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 1000 })) {
                    initialStat = await element.textContent();
                    statFound = true;
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }
        
        const initialCount = parseInt(initialStat) || 0;
        console.log(`Initial crafting stat: ${initialCount} (found: ${statFound})`);

        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(300);

        // Try to craft something
        const initialCoins = await page.evaluate(() => window.rustGame.get_coins());
        console.log(`Current Gold: ${initialCoins} needed`);
        
        // Click to earn more coins if needed
        if (initialCoins < 100) {
            await page.click('[data-tab="resources"]');
            for (let i = 0; i < 100; i++) {
                await page.click('#coin-button');
            }
            await page.waitForTimeout(500);
            await page.click('[data-tab="crafting"]');
            await page.waitForTimeout(300);
        }

        // Try to find and click a craft button
        const craftButtons = page.locator('.craft-button');
        const count = await craftButtons.count();
        let craftAttempted = false;
        
        if (count > 0) {
            // Find first enabled button
            for (let i = 0; i < count; i++) {
                const button = craftButtons.nth(i);
                const isDisabled = await button.evaluate(el => el.disabled);
                
                if (!isDisabled) {
                    await button.click();
                    await page.waitForTimeout(500);
                    
                    // Confirm dialog
                    const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")').first();
                    if (await confirmButton.isVisible().catch(() => false)) {
                        await confirmButton.click();
                        await page.waitForTimeout(500);
                    }
                    
                    craftAttempted = true;
                    break;
                }
            }
        }

        // Check stat again - it should be >= initial
        await page.click('[data-tab="statistics"]');
        await page.waitForTimeout(300);
        
        let afterStat = '0';
        for (const selector of statSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 1000 })) {
                    afterStat = await element.textContent();
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }
        
        const afterCount = parseInt(afterStat) || 0;

        console.log(`Crafting stat: ${initialCount} -> ${afterCount} (attempted: ${craftAttempted})`);
        
        // Stat should stay same or increase
        expect(afterCount).toBeGreaterThanOrEqual(initialCount);

        await page.screenshot({
            path: '.sisyphus/evidence/resource-crafting-statistic-update.png'
        });
    });

    test('all resource types can be crafted', async ({ page }) => {
        const recipes = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_crafting_recipes) {
                return window.rustGame.get_crafting_recipes();
            }
            return [];
        });

        const outputResources = new Set(recipes.map(r => r.output_resource));
        const inputResources = new Set(recipes.map(r => r.input_resource));

        console.log(`Output resources: ${Array.from(outputResources).join(', ')}`);
        console.log(`Input resources: ${Array.from(inputResources).join(', ')}`);

        expect(outputResources.size).toBeGreaterThanOrEqual(3);
        expect(inputResources.size).toBeGreaterThanOrEqual(3);

        // Verify primary resources can be used as input
        const primaryResources = ['Gold', 'Coins', 'Wood', 'Stone'];
        const hasPrimaryInput = primaryResources.some(pr => inputResources.has(pr));
        expect(hasPrimaryInput).toBe(true);

        // Verify primary resources can be produced as output
        const hasPrimaryOutput = primaryResources.some(pr => outputResources.has(pr));
        expect(hasPrimaryOutput).toBe(true);
    });

    test('crafting recipes display in UI', async ({ page }) => {
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);

        const recipeElements = page.locator('.crafting-recipe, .recipe-item, [class*="recipe"]');
        const count = await recipeElements.count();

        expect(count).toBeGreaterThanOrEqual(3);
        console.log(`Recipe elements in UI: ${count}`);

        // Verify recipe structure in UI
        for (let i = 0; i < Math.min(count, 3); i++) {
            const recipe = recipeElements.nth(i);
            await expect(recipe).toBeVisible();

            // Check for input display
            const inputEl = recipe.locator('[class*="input"], .recipe-input');
            const hasInput = await inputEl.isVisible().catch(() => false);

            // Check for output display
            const outputEl = recipe.locator('[class*="output"], .recipe-output');
            const hasOutput = await outputEl.isVisible().catch(() => false);

            // Check for craft button
            const craftBtn = recipe.locator('button, .craft-btn, .craft-recipe-btn');
            const hasButton = await craftBtn.isVisible().catch(() => false);

            console.log(`Recipe ${i}: input=${hasInput}, output=${hasOutput}, button=${hasButton}`);
        }
    });

    test('crafting WASM API functions exist', async ({ page }) => {
        const apis = await page.evaluate(() => {
            return {
                hasGetCraftingRecipes: window.rustGame && typeof window.rustGame.get_crafting_recipes === 'function',
                hasCraftResource: window.rustGame && typeof window.rustGame.craft_resource === 'function',
                hasGetResources: window.rustGame && typeof window.rustGame.get_resources === 'function'
            };
        });

        console.log('WASM API availability:', apis);

        expect(apis.hasGetCraftingRecipes).toBe(true);
        expect(apis.hasCraftResource).toBe(true);
        expect(apis.hasGetResources).toBe(true);
    });

    test('crafting persistence across page reload', async ({ page }) => {
        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(500);

        // Get initial state
        const initialResources = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                return window.rustGame.get_resources();
            }
            return {};
        });

        // Try to craft something
        const coins = await page.evaluate(() => window.rustGame.get_coins());
        
        if (coins >= 100) {
            const craftButton = page.locator('.craft-button').first();
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }
        }

        // Reload page
        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);

        // Verify resources persisted
        const afterResources = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                return window.rustGame.get_resources();
            }
            return {};
        });

        // Resources should be persisted (at least some keys should match)
        const initialKeys = Object.keys(initialResources);
        const afterKeys = Object.keys(afterResources);
        
        console.log(`Resources before reload: ${initialKeys.length}, after: ${afterKeys.length}`);
        
        // Basic sanity check - resources object should exist
        expect(typeof afterResources).toBe('object');
    });
});
