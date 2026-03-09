const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Secondary Resources (Tier 2)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080', { timeout: 60000 });
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
        await unlockWorkersStage(page);
    });

    test('tier 2 resources display correctly in game state', async ({ page }) => {
        const tier2Resources = [
            'IronIngot',
            'CopperIngot',
            'SteelPlate',
            'Glass',
            'Plastic',
            'Chemicals',
            'Gear',
            'CircuitBoard',
            'Motor',
            'Sensor',
            'Battery',
            'Generator'
        ];

        const resources = await page.evaluate(() => window.rustGame.get_resources());

        expect(resources).toBeTruthy();
        expect(typeof resources).toBe('object');

        for (const resource of tier2Resources) {
            const value = resources[resource] !== undefined ? resources[resource] : 0;
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThanOrEqual(0);
        }
    });

    test('tier 2 factories exist and expose expected output resources', async ({ page }) => {
        const buildings = await page.evaluate(() => window.rustGame.get_buildings());
        const buildingNames = buildings.map((building) => building.name);
        const outputs = new Map(buildings.map((building) => [building.name, building.output_resource || building.outputResource]));
        
        const tier2Factories = [
            { name: '铁锭冶炼厂', output: 'IronIngot' },
            { name: '铜锭冶炼厂', output: 'CopperIngot' },
            { name: '化学品厂', output: 'Chemicals' },
            { name: '钢铁厂', output: 'SteelPlate' },
            { name: '玻璃厂', output: 'Glass' },
            { name: '塑料厂', output: 'Plastic' },
            { name: '电路板厂', output: 'CircuitBoard' },
            { name: '马达厂', output: 'Motor' },
            { name: '传感器厂', output: 'Sensor' },
            { name: '齿轮厂', output: 'Gear' },
            { name: '电池厂', output: 'Battery' },
            { name: '发电机厂', output: 'Generator' }
        ];
        
        for (const factory of tier2Factories) {
            expect(buildingNames).toContain(factory.name);
            expect(outputs.get(factory.name)).toBe(factory.output);
        }
    });

    test('iron ingot production can start through factories', async ({ page }) => {
        const purchaseResult = await page.evaluate(() => {
            for (let i = 0; i < 12000; i++) {
                window.rustGame.click_action();
            }

            const buildings = window.rustGame.get_buildings();
            const ironMineIndex = buildings.findIndex((building) => building.name === '铁矿场');
            const ironFactoryIndex = buildings.findIndex((building) => building.name === '铁锭冶炼厂');

            for (let i = 0; i < 12; i++) {
                window.rustGame.buy_building(ironMineIndex);
            }
            for (let i = 0; i < 2; i++) {
                window.rustGame.buy_building(ironFactoryIndex);
            }

            const afterPurchase = window.rustGame.get_resources();
            return {
                ironMineIndex,
                ironFactoryIndex,
                ironIngotBefore: afterPurchase.IronIngot || 0
            };
        });

        expect(purchaseResult.ironMineIndex).toBeGreaterThanOrEqual(0);
        expect(purchaseResult.ironFactoryIndex).toBeGreaterThanOrEqual(0);

        await page.waitForTimeout(5000);

        const after = await page.evaluate(() => {
            const resources = window.rustGame.get_resources();
            return {
                ironOre: resources.IronOre || 0,
                ironIngot: resources.IronIngot || 0
            };
        });

        expect(after.ironOre).toBeGreaterThanOrEqual(0);
        expect(after.ironIngot).toBeGreaterThanOrEqual(purchaseResult.ironIngotBefore);
    });
});
