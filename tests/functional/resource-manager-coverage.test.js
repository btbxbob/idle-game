const { test, expect } = require('../fixtures/coverage');

test.describe('ResourceManager branch coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('resource key/category/amount/rate branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.ResourceManager) {
                return { ok: false, reason: 'missing class' };
            }

            const formatterOk = Boolean(window.NumberFormatter && typeof window.NumberFormatter.formatResource === 'function');
            const scientific = formatterOk ? window.NumberFormatter.formatResource(123456789) : null;
            const parsedScientific = formatterOk ? window.NumberFormatter.parseDisplayedNumber(scientific) : null;

            const manager = new window.ResourceManager(
                {
                    get_resources: () => ({
                        coins: 10,
                        copperOre: 22,
                        Gold: 77,
                        CoinsPerSecond: 3.5,
                        woodPerSecond: 1.2,
                        aluminumOrePerSecond: 0.4,
                    }),
                },
                { t: (key) => `T_${key}` }
            );

            const keysPrimary = manager.getResourceKeysByCategory('primary').length;
            const keysSecondary = manager.getResourceKeysByCategory('secondary').length;
            const keysAdvanced = manager.getResourceKeysByCategory('advanced').length;
            const keysUnknown = manager.getResourceKeysByCategory('unknown').length;
            const totalKeys = manager.resourceKeys.length;

            const resources = {
                coins: 12,
                copperOre: 34,
                Gold: 56,
                woodPerSecond: 1.5,
                CoinsPerSecond: 2.6,
                AluminumOrePerSecond: 0.2,
            };

            const exact = manager.getResourceAmount(resources, 'coins');
            const camel = manager.getResourceAmount(resources, 'copperOre');
            const rustMapped = manager.getResourceAmount(resources, 'wood');
            const fallbackZero = manager.getResourceAmount(resources, 'mystery');

            const rateCoins = manager.getResourceRate(resources, 'coins');
            const rateWood = manager.getResourceRate(resources, 'wood');
            const rateCustom = manager.getResourceRate(resources, 'aluminumOre');
            const rateUnknown = manager.getResourceRate(resources, 'nanobot');

            return {
                ok: true,
                keysPrimary,
                keysSecondary,
                keysAdvanced,
                keysUnknown,
                totalKeys,
                exact,
                camel,
                rustMapped,
                fallbackZero,
                rateCoins,
                rateWood,
                rateCustom,
                rateUnknown,
                formatterOk,
                scientific,
                parsedScientific,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.keysPrimary).toBe(10);
        expect(result.keysSecondary).toBe(40);
        expect(result.keysAdvanced).toBe(result.totalKeys - 50);
        expect(result.keysUnknown).toBe(0);
        expect(result.keysPrimary + result.keysSecondary + result.keysAdvanced).toBe(result.totalKeys);
        expect(result.exact).toBe(12);
        expect(result.camel).toBe(34);
        expect(result.rustMapped).toBe(0);
        expect(result.fallbackZero).toBe(0);
        expect(result.rateCoins).toBe(2.6);
        expect(result.rateWood).toBe(1.5);
        expect(result.rateCustom).toBe(0.2);
        expect(result.rateUnknown).toBe(0);
        expect(result.formatterOk).toBe(true);
        expect(result.scientific).toBe('1.234568e8');
        expect(result.parsedScientific).toBe(123456800);
    });

    test('initialize/switch/update/render/global updateResourcePanel branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.ResourceManager) {
                return { ok: false, reason: 'missing class' };
            }

            const panelPrimary = document.getElementById('primary-resources');
            const panelSecondary = document.getElementById('secondary-resources');
            const tabSecondary = document.querySelector('.category-tab-button[data-category="secondary"]');

            if (!panelPrimary || !panelSecondary || !tabSecondary) {
                return { ok: false, reason: 'missing resource DOM structure' };
            }

            const manager = new window.ResourceManager(
                {
                    get_resources: () => ({
                        coins: 123.9,
                        CoinsPerSecond: 2.7,
                        coinsPerClick: 4.4,
                    }),
                },
                { t: (key) => `TXT_${key}` }
            );

            manager.initialize();
            manager.switchCategory('secondary');

            const bannerCoinsEl = document.getElementById('banner-coins');
            const bannerCoinsRateEl = document.getElementById('banner-coins-rate');
            const coinsPanelAmount = document.querySelector('#primary-resources .resource-item[data-resource="coins"] .resource-amount');

            const currentCategory = manager.currentCategory;
            const primaryDisplay = panelPrimary.style.display;
            const secondaryDisplay = panelSecondary.style.display;
            const bannerCoinsText = bannerCoinsEl ? bannerCoinsEl.textContent || '' : '';
            const bannerCoinsRateText = bannerCoinsRateEl ? bannerCoinsRateEl.textContent || '' : '';
            const coinsPanelText = coinsPanelAmount ? coinsPanelAmount.textContent || '' : '';

            const guardManager = new window.ResourceManager(null, { t: (key) => key });
            const guardNull = guardManager.update();

            const throwManager = new window.ResourceManager(
                {
                    get_resources: () => {
                        throw new Error('boom');
                    },
                },
                { t: (key) => key }
            );
            const throwResult = throwManager.update();

            const originalResourceManager = window.resourceManager;
            const resourcesTab = document.getElementById('tab-resources');
            const wasActive = resourcesTab ? resourcesTab.classList.contains('active') : false;
            let updateCalls = 0;

            window.resourceManager = {
                update: () => {
                    updateCalls += 1;
                },
            };

            if (resourcesTab) {
                resourcesTab.classList.remove('active');
            }
            window.updateResourcePanel();

            if (resourcesTab) {
                resourcesTab.classList.add('active');
            }
            window.updateResourcePanel();

            if (resourcesTab) {
                resourcesTab.classList.toggle('active', wasActive);
            }
            window.resourceManager = originalResourceManager;

            return {
                ok: true,
                currentCategory,
                primaryDisplay,
                secondaryDisplay,
                bannerCoinsText,
                bannerCoinsRateText,
                coinsPanelText,
                guardNull,
                throwResult,
                updateCalls,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.currentCategory).toBe('secondary');
        expect(result.primaryDisplay).toBe('none');
        expect(result.secondaryDisplay).toBe('block');
        expect(result.bannerCoinsText).toContain('TXT_coins');
        expect(result.bannerCoinsRateText).toContain('+2.7/s');
        expect(result.coinsPanelText).toBe('123');
        expect(result.guardNull).toBe(null);
        expect(result.throwResult).toBe(null);
        expect(result.updateCalls).toBe(2);
    });

    test('header resources keep updating when resources tab is inactive', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const resourcesTab = document.getElementById('tab-resources');
            const buildingsButton = document.querySelector('.tab-button[data-tab="buildings"]');
            if (!resourcesTab || !buildingsButton || !window.rustGame || !window.resourceManager) {
                return { ok: false };
            }

            window.rustGame.click_action();
            window.resourceManager.update();
            const before = document.getElementById('banner-coins')?.textContent || '';

            buildingsButton.click();
            await new Promise((resolve) => setTimeout(resolve, 100));

            window.rustGame.click_action();
            window.updateResourcePanel();
            const after = document.getElementById('banner-coins')?.textContent || '';

            return {
                ok: true,
                resourcesActive: resourcesTab.classList.contains('active'),
                before,
                after,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.resourcesActive).toBe(false);
        expect(result.before).not.toBe(result.after);
        expect(result.after).toContain('金币');
    });
});
