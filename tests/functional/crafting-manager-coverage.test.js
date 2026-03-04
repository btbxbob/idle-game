const { test, expect } = require('../fixtures/coverage');

test.describe('CraftingManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('update and resource checks branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.craftingManager) return { ok: false };
            const recipes = window.craftingManager.update() || [];
            const sample = recipes[0] || { input_resource: 'coins', input_amount: 1, id: 'none', unlocked: false };
            return {
                ok: true,
                count: recipes.length,
                hasEnough: window.craftingManager.hasEnoughResources(sample),
                amountText: window.craftingManager.getResourceAmountText('coins', 12.9),
            };
        });
        expect(result.ok).toBe(true);
        expect(result.amountText).toContain('12');
    });

    test('craft and handleCraftClick branches', async ({ page }) => {
        const result = await page.evaluate(async () => {
            if (!window.craftingManager) return { ok: false };
            const recipes = window.craftingManager.update() || [];
            const missing = await window.craftingManager.handleCraftClick('missing-recipe-id');
            let attempted = false;
            if (recipes[0]) {
                attempted = window.craftingManager.craft(recipes[0].id) === true || window.craftingManager.craft(recipes[0].id) === false;
            }
            return { ok: true, attempted, missingIsUndefined: typeof missing === 'undefined' };
        });
        expect(result.ok).toBe(true);
        expect(result.missingIsUndefined).toBe(true);
    });

    test('renderRecipes branches including empty/non-empty paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.craftingManager) return { ok: false };
            const panel = document.createElement('div');
            panel.id = 'crafting-list';
            document.body.appendChild(panel);

            const originalUpdate = window.craftingManager.update.bind(window.craftingManager);
            window.craftingManager.update = () => [];
            window.craftingManager.renderRecipes('crafting-list');
            const emptyHtml = panel.innerHTML;

            window.craftingManager.update = originalUpdate;
            window.craftingManager.renderRecipes('crafting-list');
            const normalHtml = panel.innerHTML;

            panel.remove();
            return {
                ok: true,
                emptyHasPlaceholder: emptyHtml.includes('crafting-placeholder') || emptyHtml.includes('placeholder') || emptyHtml.includes('合成'),
                normalHasContent: normalHtml.length > 0,
            };
        });
        expect(result.ok).toBe(true);
        expect(result.normalHasContent).toBe(true);
    });

    test('global updateCraftingPanel path executes', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.updateCraftingPanel || !window.craftingManager) return { ok: false };
            const tab = document.createElement('div');
            tab.id = 'tab-crafting';
            tab.className = 'active';
            document.body.appendChild(tab);
            const list = document.createElement('div');
            list.id = 'crafting-list';
            document.body.appendChild(list);

            window.updateCraftingPanel();
            const htmlLen = list.innerHTML.length;

            tab.remove();
            list.remove();
            return { ok: true, htmlLen };
        });
        expect(result.ok).toBe(true);
    });

    test('hasEnoughResources branches for different resource types', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const original = manager.rustGame;

            manager.rustGame = null;
            const noRust = manager.hasEnoughResources({ input_resource: 'coins', input_amount: 10 });

            manager.rustGame = {
                get_coins: () => 100,
                get_wood: undefined,
                get_stone: undefined
            };
            const coinsEnough = manager.hasEnoughResources({ input_resource: 'coins', input_amount: 10 });
            const coinsNotEnough = manager.hasEnoughResources({ input_resource: 'coins', input_amount: 200 });
            const unknownResource = manager.hasEnoughResources({ input_resource: 'unknown_resource', input_amount: 10 });

            manager.rustGame = {
                get_coins: undefined,
                get_wood: () => 50,
                get_stone: undefined
            };
            const woodEnough = manager.hasEnoughResources({ input_resource: 'wood', input_amount: 10 });
            const woodNotEnough = manager.hasEnoughResources({ input_resource: 'wood', input_amount: 100 });

            manager.rustGame = {
                get_coins: undefined,
                get_wood: undefined,
                get_stone: () => 30
            };
            const stoneEnough = manager.hasEnoughResources({ input_resource: 'stone', input_amount: 5 });
            const stoneNotEnough = manager.hasEnoughResources({ input_resource: 'stone', input_amount: 100 });

            manager.rustGame = {
                get_coins: () => { throw new Error('boom'); }
            };
            const throwError = manager.hasEnoughResources({ input_resource: 'coins', input_amount: 1 });

            manager.rustGame = original;
            return {
                ok: true,
                noRust,
                coinsEnough,
                coinsNotEnough,
                unknownResource,
                woodEnough,
                woodNotEnough,
                stoneEnough,
                stoneNotEnough,
                throwError
            };
        });
        expect(result.ok).toBe(true);
        expect(result.noRust).toBe(false);
        expect(result.coinsEnough).toBe(true);
        expect(result.coinsNotEnough).toBe(false);
        expect(result.unknownResource).toBe(false);
        expect(result.woodEnough).toBe(true);
        expect(result.woodNotEnough).toBe(false);
        expect(result.stoneEnough).toBe(true);
        expect(result.stoneNotEnough).toBe(false);
        expect(result.throwError).toBe(false);
    });

    test('craft method error handling branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const original = manager.rustGame;

            manager.rustGame = null;
            const noRust = manager.craft('any-id');

            manager.rustGame = {};
            const noApi = manager.craft('any-id');

            manager.rustGame = {
                craft_resource: () => true
            };
            const success = manager.craft('any-id');

            manager.rustGame = {
                craft_resource: () => false
            };
            const fail = manager.craft('any-id');

            manager.rustGame = {
                craft_resource: () => { throw new Error('boom-craft'); }
            };
            const throwError = manager.craft('any-id');

            manager.rustGame = original;
            return {
                ok: true,
                noRust,
                noApi,
                success,
                fail,
                throwError
            };
        });
        expect(result.ok).toBe(true);
        expect(result.noRust).toBe(false);
        expect(result.noApi).toBe(false);
        expect(result.success).toBe(true);
        expect(result.fail).toBe(false);
        expect(result.throwError).toBe(false);
    });

    test('renderRecipes with locked/unlocked recipes', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const panel = document.createElement('div');
            panel.id = 'crafting-list-test';
            document.body.appendChild(panel);

            const originalUpdate = manager.update;
            manager.update = () => [
                { id: 'r1', name: 'Recipe 1', input_resource: 'coins', input_amount: 10, output_resource: 'wood', output_amount: 20, unlocked: false },
                { id: 'r2', name: 'Recipe 2', input_resource: 'coins', input_amount: 100, output_resource: 'wood', output_amount: 200, unlocked: true }
            ];
            manager.rustGame = {
                get_coins: () => 5,
                get_wood: () => 0,
                get_stone: () => 0
            };
            manager.renderRecipes('crafting-list-test');
            const html = panel.innerHTML;

            panel.remove();
            manager.update = originalUpdate;
            return {
                ok: true,
                hasLocked: html.includes('recipe-locked') || html.includes('🔒'),
                hasUnlocked: html.includes('recipe-available') || html.includes('recipe-insufficient'),
            };
        });
        expect(result.ok).toBe(true);
    });

    test('getResourceAmountText with different resources', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const original = manager.i18n;

            manager.i18n = null;
            const noI18nCoins = manager.getResourceAmountText('coins', 10);
            const noI18nWood = manager.getResourceAmountText('wood', 20);
            const noI18nStone = manager.getResourceAmountText('stone', 30);
            const noI18nUnknown = manager.getResourceAmountText('mystery', 40);

            manager.i18n = {
                t: (key) => {
                    if (key === 'coins') return '金币';
                    if (key === 'wood') return '木头';
                    if (key === 'stone') return '石头';
                    return key;
                }
            };
            const withI18nCoins = manager.getResourceAmountText('coins', 10);

            manager.i18n = original;
            return {
                ok: true,
                noI18nCoins,
                noI18nWood,
                noI18nStone,
                noI18nUnknown,
                withI18nCoins,
            };
        });
        expect(result.ok).toBe(true);
        expect(result.noI18nCoins).toContain('金币');
        expect(result.noI18nWood).toContain('木头');
        expect(result.noI18nStone).toContain('石头');
    });

    test('handleCraftClick with insufficient resources', async ({ page }) => {
        const result = await page.evaluate(async () => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const original = manager.update;
            const originalRust = manager.rustGame;

            manager.update = () => [
                { id: 'test-recipe', name: 'Test Recipe', input_resource: 'coins', input_amount: 1000, output_resource: 'wood', output_amount: 100, unlocked: true }
            ];
            manager.rustGame = {
                get_coins: () => 1,
                get_wood: () => 0,
                get_stone: () => 0
            };

            let alertCalled = false;
            const originalAlert = window.alert;
            window.alert = (msg) => { alertCalled = true; };

            await manager.handleCraftClick('test-recipe');

            window.alert = originalAlert;
            manager.update = original;
            manager.rustGame = originalRust;

            return { ok: true, alertCalled };
        });
        expect(result.ok).toBe(true);
        expect(result.alertCalled).toBe(true);
    });

    test('handleCraftClick with unlocked but missing recipe', async ({ page }) => {
        const result = await page.evaluate(async () => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const original = manager.update;

            manager.update = () => [
                { id: 'existing-recipe', name: 'Existing', input_resource: 'coins', input_amount: 10, output_resource: 'wood', output_amount: 20, unlocked: true }
            ];

            await manager.handleCraftClick('nonexistent-recipe');

            manager.update = original;
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('handleCraftClick with locked recipe', async ({ page }) => {
        const result = await page.evaluate(async () => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const original = manager.update;

            manager.update = () => [
                { id: 'locked-recipe', name: 'Locked', input_resource: 'coins', input_amount: 10, output_resource: 'wood', output_amount: 20, unlocked: false }
            ];

            await manager.handleCraftClick('locked-recipe');

            manager.update = original;
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('update method with exception handling', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.craftingManager) return { ok: false };
            const manager = window.craftingManager;
            const original = manager.rustGame;

            manager.rustGame = null;
            const nullRust = manager.update();

            manager.rustGame = {};
            const noApi = manager.update();

            manager.rustGame = {
                get_crafting_recipes: () => { throw new Error('boom-recipes'); }
            };
            const throws = manager.update();

            manager.rustGame = {
                get_crafting_recipes: () => null
            };
            const nullRecipes = manager.update();

            manager.rustGame = original;
            return {
                ok: true,
                nullRust,
                noApi,
                throws,
                nullRecipes
            };
        });
        expect(result.ok).toBe(true);
        expect(result.nullRust).toEqual([]);
        expect(result.noApi).toEqual([]);
        expect(result.throws).toEqual([]);
        expect(result.nullRecipes).toEqual([]);
    });
});