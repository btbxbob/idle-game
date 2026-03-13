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
                name: '小屋',
                level: 1,
                capacity: 10,
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
                renderedListContainsItem: renderedList.includes('housing-item')
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
                    { name: '小屋A', level: 1, capacity: 5, upgradeCost: { coins: 10 } },
                    { name: '小屋B', level: 1, capacity: 6, upgradeCost: { coins: 10 } },
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
            const buildingsTab = document.getElementById('tab-buildings');
            const originalBuildingsTabClass = buildingsTab ? buildingsTab.className : '';
            if (buildingsTab) buildingsTab.className = 'tab-content active';

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
                get_housing: () => [{ name: '回退小屋', level: 1, capacity: 4, upgradeCost: { coins: 1 } }],
                get_resources: () => ({ Gold: 10, Wood: 0, Stone: 0 }),
            });
            let renderCalls = 0;
            fallbackManager.renderToPanel = () => { renderCalls += 1; };
            fallbackManager.renderHousingList();

            const originalManager = window.housingManager;
            let updateCalls = 0;
            window.housingManager = { renderToPanel: () => { updateCalls += 1; } };
            window.updateHousingPanel();
            if (buildingsTab) buildingsTab.classList.remove('active');
            window.updateHousingPanel();
            window.housingManager = originalManager;

            if (panel) panel.innerHTML = originalPanelHtml;
            if (buildingsTab) buildingsTab.className = originalBuildingsTabClass;

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
        expect(result.panelHtml).toContain('currentOccupancy');
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
});
