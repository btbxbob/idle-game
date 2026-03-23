const { test, expect } = require('../fixtures/coverage');

test.describe('HousingManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('core housing manager branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.HousingManager) {
                return { ok: false, reason: 'missing class' };
            }

            const resources = { Gold: 9999, Wood: 9999, Stone: 9999 };
            const sampleHousing = [{
                name: '棚屋',
                level: 1,
                capacity: 10,
                baseCapacity: 10,
                description: '测试住房',
                icon: '🏠',
                requiredTechnology: 'BasicLogging',
                upgradeCost: { gold: 100, wood: 50 }
            }];

            const mockGame = {
                get_housing_capacity: () => 20,
                get_housing_occupied: () => 8,
                get_population_queue_json: () => JSON.stringify({ length: 3 }),
                get_housing: () => sampleHousing,
                upgrade_housing: () => true,
                get_resources: () => resources
            };

            const manager = new window.HousingManager(mockGame);

            const overview = manager.getHousingOverview();
            const list = manager.getHousing();
            const canAfford = manager.canAffordUpgrade(sampleHousing[0].upgradeCost);
            const renderedList = manager.renderHousingToList();

            const panel = document.createElement('div');
            panel.id = 'housing-panel-test';
            document.body.appendChild(panel);
            const occupancyValue = document.createElement('span');
            occupancyValue.id = 'occupancy-value';
            document.body.appendChild(occupancyValue);

            manager.renderToPanel('housing-panel-test');
            manager.handleOccupancyChange('75');
            manager.handleBulkUpgrade();
            const upgraded = manager.upgradeHousing(0);

            const renderHtml = panel.innerHTML;
            panel.remove();
            occupancyValue.remove();

            return {
                ok: true,
                totalCapacity: overview.totalCapacity,
                occupied: overview.occupied,
                queue: overview.queue,
                listLength: list.length,
                canAfford,
                upgraded,
                renderedListContainsItem: renderedList.includes('housing-item'),
                renderedListContainsTech: renderedList.includes('Basic Logging') || renderedList.includes('基础伐木')
            };
        });

        expect(result.ok).toBe(true);
        expect(result.totalCapacity).toBe(20);
        expect(result.occupied).toBe(8);
        expect(result.queue).toBe(3);
        expect(result.listLength).toBe(1);
        expect(result.canAfford).toBe(true);
        expect(result.upgraded).toBe(true);
        expect(result.renderedListContainsItem).toBe(true);
        expect(result.renderedListContainsTech).toBe(true);
    });

    test('fallback, affordability and occupancy clamp branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.HousingManager) {
                return { ok: false, reason: 'missing class' };
            }

            const noGameManager = new window.HousingManager(null);
            const fallbackOverview = noGameManager.getHousingOverview();

            const managerNoFuncs = new window.HousingManager({});
            const noFuncOverview = managerNoFuncs.getHousingOverview();

            const managerQueueArray = new window.HousingManager({
                get_housing_capacity: () => 12,
                get_housing_occupied: () => 8,
                get_population_queue_json: () => JSON.stringify([{ id: 1 }, { id: 2 }]),
                get_housing: () => [],
                get_resources: () => ({ Gold: 50, Wood: 10, Stone: 0 }),
            });
            const arrayQueueOverview = managerQueueArray.getHousingOverview();

            const managerBadQueue = new window.HousingManager({
                get_housing_capacity: () => 10,
                get_housing_occupied: () => 5,
                get_population_queue_json: () => '{bad-json',
                get_housing: () => [],
                get_resources: () => ({ Gold: 999, Wood: 999, Stone: 999 }),
            });
            const badQueueOverview = managerBadQueue.getHousingOverview();

            const affordEnough = managerQueueArray.canAffordUpgrade({ coins: 20, wood: 5 });
            const affordNotEnough = managerQueueArray.canAffordUpgrade({ coins: 999 });
            const affordUnknown = managerQueueArray.canAffordUpgrade({ uranium: 1 });
            const affordNoCost = managerQueueArray.canAffordUpgrade(null);

            managerQueueArray.setOccupancyRate(-20);
            const lowClamp = managerQueueArray.occupancyRate;
            managerQueueArray.setOccupancyRate(120);
            const highClamp = managerQueueArray.occupancyRate;
            managerQueueArray.setOccupancyRate(75);
            const occupants = managerQueueArray.calculateOccupants(11);

            return {
                ok: true,
                fallbackOverview,
                noFuncOverview,
                arrayQueueOverview,
                badQueueOverview,
                affordEnough,
                affordNotEnough,
                affordUnknown,
                affordNoCost,
                lowClamp,
                highClamp,
                occupants,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.fallbackOverview.totalCapacity).toBe(0);
        expect(result.noFuncOverview.totalCapacity).toBe(0);
        expect(result.arrayQueueOverview.queue).toBe(2);
        expect(result.badQueueOverview.queue).toBe(0);
        expect(result.affordEnough).toBe(true);
        expect(result.affordNotEnough).toBe(false);
        expect(result.affordUnknown).toBe(false);
        expect(result.affordNoCost).toBe(false);
        expect(result.lowClamp).toBe(0);
        expect(result.highClamp).toBe(100);
        expect(result.occupants).toBe(8);
    });

    test('bulk upgrade failure alert and empty list render branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.HousingManager) {
                return { ok: false, reason: 'missing class' };
            }

            const originalAlert = window.alert;
            const alerts = [];
            window.alert = (msg) => alerts.push(String(msg));

            const manager = new window.HousingManager({
                get_housing: () => [
                    { name: '棚屋', level: 1, capacity: 5, baseCapacity: 5, upgradeCost: { coins: 10 } },
                    { name: '木梁小屋', level: 1, capacity: 6, baseCapacity: 6, upgradeCost: { coins: 10 } },
                ],
                upgrade_housing: () => false,
                get_resources: () => ({ Gold: 0 }),
            });

            const bulk = manager.bulkUpgrade();
            manager.handleBulkUpgrade();

            const emptyManager = new window.HousingManager({
                get_housing: () => [],
                get_resources: () => ({ Gold: 0 }),
            });
            const emptyHtml = emptyManager.renderHousingToList();

            window.alert = originalAlert;

            return {
                ok: true,
                bulk,
                alerts,
                emptyHasText: emptyHtml.includes('暂无住房建筑') || emptyHtml.includes('noHousing'),
            };
        });

        expect(result.ok).toBe(true);
        expect(result.bulk.successCount).toBe(0);
        expect(result.bulk.failures).toBe(2);
        expect(result.bulk.total).toBe(2);
        expect(result.alerts.length).toBeGreaterThan(0);
        expect(result.emptyHasText).toBe(true);
    });

    test('render list, full warning, fallback list rendering and update panel branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const panel = document.getElementById('housing-panel');
            const originalPanelHtml = panel ? panel.innerHTML : '';
            const housingTab = document.getElementById('tab-housing');
            const originalHousingTabClass = housingTab ? housingTab.className : '';
            if (housingTab) housingTab.className = 'tab-content active';

            const manager = new window.HousingManager({
                get_housing_capacity: () => 10,
                get_housing_occupied: () => 10,
                get_population_queue_json: () => JSON.stringify({ length: 2 }),
                get_housing: () => [
                    { name: '满员小屋', level: 2, capacity: 10, upgradeCost: { coins: 1 } },
                    { name: '昂贵小屋', level: 1, capacity: 8, upgradeCost: { coins: 999 } },
                ],
                get_resources: () => ({ Gold: 5, Wood: 0, Stone: 0 }),
            });

            const listHtml = manager.renderHousingToList();
            manager.renderToPanel('housing-panel');
            const panelHtml = panel ? panel.innerHTML : '';

            const fallbackManager = new window.HousingManager({
                get_housing: () => [{ name: '棚屋', level: 1, capacity: 4, baseCapacity: 4, upgradeCost: { coins: 1 } }],
                get_resources: () => ({ Gold: 10, Wood: 0, Stone: 0 }),
            });
            let renderCalls = 0;
            fallbackManager.renderToPanel = () => { renderCalls += 1; };
            fallbackManager.renderHousingList();

            const originalManager = window.housingManager;
            let updateCalls = 0;
            window.housingManager = { renderToPanel: () => { updateCalls += 1; } };
            window.updateHousingPanel();
            if (housingTab) housingTab.classList.remove('active');
            window.updateHousingPanel();
            window.housingManager = originalManager;

            if (panel) panel.innerHTML = originalPanelHtml;
            if (housingTab) housingTab.className = originalHousingTabClass;

            return {
                listHtml,
                panelHtml,
                renderCalls,
                updateCalls,
            };
        });

        expect(result.listHtml).toContain('housing-item-full');
        expect(result.listHtml).toContain('disabled');
        expect(result.panelHtml).toContain('housing-full-warning');
        expect(result.panelHtml.includes('当前入住') || result.panelHtml.includes('currentOccupancy')).toBe(true);
        expect(result.renderCalls).toBe(1);
        expect(result.updateCalls).toBe(1);
    });

    test('format cost and affordability error branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.HousingManager({
                get_resources: () => { throw new Error('boom-resources'); },
            });

            return {
                noCostText: manager.formatUpgradeCost(null),
                mappedCostText: manager.formatUpgradeCost({ gold: 12, stone: 3, gems: 2 }),
                affordError: manager.canAffordUpgrade({ coins: 1 }),
            };
        });

        expect(result.noCostText).toBe('');
        expect(result.mappedCostText).toContain('12');
        expect(result.mappedCostText).toContain('石头');
        expect(result.mappedCostText).toContain('gems');
        expect(result.affordError).toBe(false);
    });

    test('map-based housing upgrade costs render and evaluate correctly', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.HousingManager({
                get_resources: () => ({ Gold: 150, Wood: 80, Stone: 0 }),
            });

            const mapCost = new Map([
                ['Gold', 100],
                ['Wood', 50],
            ]);

            return {
                formattedCost: manager.formatUpgradeCost(mapCost),
                canAfford: manager.canAffordUpgrade(mapCost),
                cannotAfford: manager.canAffordUpgrade(new Map([['Gold', 200]])),
            };
        });

        expect(result.formattedCost).toContain('100');
        expect(result.formattedCost).toContain('50');
        expect(result.formattedCost).toContain('金币');
        expect(result.formattedCost).toContain('木头');
        expect(result.canAfford).toBe(true);
        expect(result.cannotAfford).toBe(false);
    });

    test('resource helper, formatter and upgrade error branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalInfo = console.info;
            const originalError = console.error;
            const originalWarn = console.warn;
            const infos = [];
            const errors = [];
            const warnings = [];
            console.info = (...args) => infos.push(args.map(String).join(' '));
            console.error = (...args) => errors.push(args.map(String).join(' '));
            console.warn = (...args) => warnings.push(args.map(String).join(' '));

            const originalFormatter = window.NumberFormatter;
            window.NumberFormatter = {
                formatInteger: (value) => `FMT:${Math.floor(Number(value) || 0)}`,
            };

            const originalUpdateResourceDisplay = window.updateResourceDisplay;
            let resourceUpdates = 0;
            window.updateResourceDisplay = () => { resourceUpdates += 1; };

            const manager = new window.HousingManager({
                upgrade_housing: () => { throw new Error('Insufficient coins'); },
                get_resources: () => ({ coins: 20, Gold: 30, wood: 5, Stone: 4, IronOre: 2 }),
            });

            const insufficientUpgrade = manager.upgradeHousing(0);
            manager.rustGame.upgrade_housing = () => { throw new Error('boom-upgrade'); };
            const genericUpgrade = manager.upgradeHousing(1);

            manager.rustGame.upgrade_housing = () => true;
            const panel = document.createElement('div');
            panel.id = 'housing-panel';
            document.body.appendChild(panel);
            const successUpgrade = manager.upgradeHousing(2);

            manager.renderToPanel('missing-housing-panel');

            const helperValues = {
                normalizeBlank: manager.normalizeResourceKey(''),
                normalizeGold: manager.normalizeResourceKey('Gold'),
                normalizeLowerAlias: manager.normalizeResourceKey('ironore'),
                normalizeFallback: manager.normalizeResourceKey('CrystalShard'),
                amountCoins: manager.getResourceAmount({ coins: 7 }, 'Gold'),
                amountRustMap: manager.getResourceAmount({ Gold: 11 }, 'coins'),
                amountPascal: manager.getResourceAmount({ Wood: 9 }, 'wood'),
                amountMissing: manager.getResourceAmount(null, 'Gold'),
                labelGold: manager.getResourceLabel('Gold'),
                labelUnknown: manager.getResourceLabel('mysteryResource'),
                entriesArrayLength: manager.getCostEntries([['coins', 1], ['wood', 2]]).length,
                entriesInvalidLength: manager.getCostEntries('bad-cost').length,
                formattedInteger: manager.formatInteger(8.9),
                arrayCostText: manager.formatUpgradeCost([['coins', 3], ['Stone', 2]]),
            };

            panel.remove();
            window.NumberFormatter = originalFormatter;
            window.updateResourceDisplay = originalUpdateResourceDisplay;
            console.info = originalInfo;
            console.error = originalError;
            console.warn = originalWarn;

            return {
                insufficientUpgrade,
                genericUpgrade,
                successUpgrade,
                resourceUpdates,
                infos,
                errors,
                warnings,
                helperValues,
            };
        });

        expect(result.insufficientUpgrade).toBe(false);
        expect(result.genericUpgrade).toBe(false);
        expect(result.successUpgrade).toBe(true);
        expect(result.resourceUpdates).toBe(1);
        expect(result.infos.some((entry) => entry.includes('Skipped housing upgrade'))).toBe(true);
        expect(result.errors.some((entry) => entry.includes('Failed to upgrade housing'))).toBe(true);
        expect(result.warnings.some((entry) => entry.includes('missing-housing-panel'))).toBe(true);
        expect(result.helperValues.normalizeBlank).toBe('');
        expect(result.helperValues.normalizeGold).toBe('coins');
        expect(result.helperValues.normalizeLowerAlias).toBe('ironOre');
        expect(result.helperValues.normalizeFallback).toBe('crystalShard');
        expect(result.helperValues.amountCoins).toBe(7);
        expect(result.helperValues.amountRustMap).toBe(11);
        expect(result.helperValues.amountPascal).toBe(9);
        expect(result.helperValues.amountMissing).toBe(0);
        expect(result.helperValues.labelGold).toContain('金');
        expect(result.helperValues.labelUnknown).toBe('mysteryResource');
        expect(result.helperValues.entriesArrayLength).toBe(2);
        expect(result.helperValues.entriesInvalidLength).toBe(0);
        expect(result.helperValues.formattedInteger).toBe('FMT:8');
        expect(result.helperValues.arrayCostText).toContain('3');
        expect(result.helperValues.arrayCostText).toContain('2');
    });

    test('auto purchase loop covers no-op, insufficient and mixed success branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalAlert = window.alert;
            const originalUpdate = window.updateResourceDisplay;
            const originalError = console.error;
            const alerts = [];
            const errors = [];
            let updateCalls = 0;
            window.alert = (msg) => alerts.push(String(msg));
            window.updateResourceDisplay = () => { updateCalls += 1; };
            console.error = (...args) => errors.push(args.map(String).join(' '));

            const noApiManager = new window.HousingManager(null);
            noApiManager.handleAutoPurchase();

            let renderCalls = 0;
            const dryManager = new window.HousingManager({
                get_housing: () => [
                    { name: '棚屋', level: 1, capacity: 5, baseCapacity: 5, upgradeCost: { coins: 10 } },
                ],
                upgrade_housing: () => { throw new Error('Insufficient coins'); },
            });
            dryManager.renderToPanel = () => { renderCalls += 1; };
            dryManager.handleAutoPurchase();

            const responses = [true, true, new Error('boom-auto'), new Error('Insufficient wood'), false];
            let callIndex = 0;
            const mixedManager = new window.HousingManager({
                get_housing: () => [
                    { name: '棚屋', level: 1, capacity: 5, baseCapacity: 5, upgradeCost: { coins: 10 } },
                    { name: '木梁小屋', level: 2, capacity: 8, baseCapacity: 4, upgradeCost: { coins: 20 } },
                ],
                upgrade_housing: () => {
                    const next = responses[Math.min(callIndex, responses.length - 1)];
                    callIndex += 1;
                    if (next instanceof Error) {
                        throw next;
                    }
                    return next;
                },
            });
            mixedManager.renderToPanel = () => { renderCalls += 1; };
            mixedManager.handleAutoPurchase();

            window.alert = originalAlert;
            window.updateResourceDisplay = originalUpdate;
            console.error = originalError;

            return {
                alerts,
                updateCalls,
                renderCalls,
                errors,
            };
        });

        expect(result.renderCalls).toBeGreaterThanOrEqual(2);
        expect(result.updateCalls).toBeGreaterThanOrEqual(2);
        expect(result.alerts.some((entry) => entry.includes('无法自动购买住房'))).toBe(true);
        expect(result.alerts.some((entry) => entry.includes('自动购买完成') || entry.includes('共升级'))).toBe(true);
        expect(result.errors.some((entry) => entry.includes('Failed to auto purchase housing'))).toBe(true);
    });
});
