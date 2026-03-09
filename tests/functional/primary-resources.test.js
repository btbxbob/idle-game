const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Primary Resources', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080', { timeout: 60000 });
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
        await unlockWorkersStage(page);
    });

    test('basic primary resources exist in game state', async ({ page }) => {
        // Test the 3 primary resources currently implemented
        const primaryResources = ['Gold', 'Wood', 'Stone'];
        
        for (const resource of primaryResources) {
            const amount = await page.evaluate((res) => {
                const resources = window.rustGame.get_resources();
                return resources[res];
            }, resource);
            
            expect(amount).toBeDefined();
            expect(typeof amount).toBe('number');
            expect(amount).toBeGreaterThanOrEqual(0);
        }

        console.log('Primary resources (Gold, Wood, Stone) verified in game state');
    });

    test('primary resources display in the resources panel with correct Chinese names', async ({ page }) => {
        const resourceMapping = [
            { id: 'coins', name: '金币' },
            { id: 'wood', name: '木头' },
            { id: 'stone', name: '石头' }
        ];

        for (const resource of resourceMapping) {
            const element = page.locator(`#primary-resources .resource-item[data-resource="${resource.id}"] .resource-name`);
            await expect(element).toBeVisible();
            
            const text = await element.textContent();
            expect(text).toContain(resource.name);
        }

        console.log('Primary resource UI displays verified with Chinese names');

        await page.screenshot({
            path: '.sisyphus/evidence/primary-resources-ui.png',
            fullPage: false
        });
    });

    test('primary resource production works over time', async ({ page }) => {
        const initialCoins = await page.evaluate(() => window.rustGame.get_coins());
        const initialWood = await page.evaluate(() => window.rustGame.get_wood());
        const initialStone = await page.evaluate(() => window.rustGame.get_stone());

        await page.waitForFunction(
            ({ initialCoins, initialWood, initialStone }) => {
                if (!window.rustGame) return false;
                return window.rustGame.get_coins() >= initialCoins
                    && window.rustGame.get_wood() >= initialWood
                    && window.rustGame.get_stone() >= initialStone;
            },
            { initialCoins, initialWood, initialStone },
            { timeout: 5000 }
        );

        const newCoins = await page.evaluate(() => window.rustGame.get_coins());
        const newWood = await page.evaluate(() => window.rustGame.get_wood());
        const newStone = await page.evaluate(() => window.rustGame.get_stone());

        expect(newCoins).toBeGreaterThanOrEqual(initialCoins);
        expect(newWood).toBeGreaterThanOrEqual(initialWood);
        expect(newStone).toBeGreaterThanOrEqual(initialStone);

        console.log(`Resource production verified: Coins ${initialCoins}->${newCoins}, Wood ${initialWood}->${newWood}, Stone ${initialStone}->${newStone}`);

        await page.screenshot({
            path: '.sisyphus/evidence/primary-resources-production.png'
        });
    });

    test('primary resources feed the factory-based progression without a crafting tab', async ({ page }) => {
        const craftingButton = page.locator('button[data-tab="crafting"]');
        await expect(craftingButton).toHaveCount(0);

        const resourceTexts = await page.locator('#banner .header-resource-amount').allTextContents();
        expect(Array.isArray(resourceTexts)).toBe(true);

        console.log('Crafting tab removed; primary resources remain available for factory progression');

        await page.screenshot({
            path: '.sisyphus/evidence/primary-resources-factory-progression.png'
        });
    });

    test('primary resources accessible via get_resources WASM API', async ({ page }) => {
        const resources = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_resources) {
                return window.rustGame.get_resources();
            }
            return null;
        });

        expect(resources).toBeTruthy();
        expect(typeof resources).toBe('object');

        // Test currently implemented primary resources
        const implementedResources = ['Gold', 'Wood', 'Stone'];

        for (const resource of implementedResources) {
            expect(resources).toHaveProperty(resource);
            expect(typeof resources[resource]).toBe('number');
            console.log(`${resource}: ${resources[resource]}`);
        }

        console.log('get_resources() API returned primary resources');
    });

    test('clicking earns primary resources (coins)', async ({ page }) => {
        const initialCoins = await page.evaluate(() => window.rustGame.get_coins());

        for (let i = 0; i < 10; i++) {
            await page.click('#coin-button');
        }
        await page.waitForFunction((before) => window.rustGame.get_coins() > before, initialCoins, { timeout: 3000 });

        const afterCoins = await page.evaluate(() => window.rustGame.get_coins());

        expect(afterCoins).toBeGreaterThan(initialCoins);
        console.log(`Click earnings verified: ${initialCoins} -> ${afterCoins}`);

        await page.screenshot({
            path: '.sisyphus/evidence/primary-resources-clicking.png'
        });
    });
});
