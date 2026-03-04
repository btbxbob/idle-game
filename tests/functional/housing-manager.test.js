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
            panel.id = 'housing-panel';
            document.body.appendChild(panel);
            const occupancyValue = document.createElement('span');
            occupancyValue.id = 'occupancy-value';
            document.body.appendChild(occupancyValue);

            manager.renderToPanel('housing-panel');
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
});
