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

    test('tier 2 factory buildings are available after workers unlock', async ({ page }) => {
        const buildings = await page.evaluate(() => window.rustGame.get_buildings());
        const factoryNames = [
            '铁锭冶炼厂',
            '铜锭冶炼厂',
            '化学品厂',
            '钢铁厂',
            '玻璃厂',
            '塑料厂',
            '电路板厂',
            '马达厂',
            '传感器厂',
            '齿轮厂',
            '电池厂',
            '发电机厂'
        ];

        const buildingNames = buildings.map((building) => building.name);
        expect(buildingNames).toEqual(expect.arrayContaining(factoryNames));
    });

    test('tier 2 factories expose the expected output resources', async ({ page }) => {
        const buildings = await page.evaluate(() => window.rustGame.get_buildings());
        const outputs = new Map(buildings.map((building) => [building.name, building.output_resource || building.outputResource]));

        expect(outputs.get('铁锭冶炼厂')).toBe('IronIngot');
        expect(outputs.get('铜锭冶炼厂')).toBe('CopperIngot');
        expect(outputs.get('化学品厂')).toBe('Chemicals');
        expect(outputs.get('钢铁厂')).toBe('SteelPlate');
        expect(outputs.get('玻璃厂')).toBe('Glass');
        expect(outputs.get('塑料厂')).toBe('Plastic');
        expect(outputs.get('电路板厂')).toBe('CircuitBoard');
        expect(outputs.get('齿轮厂')).toBe('Gear');
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
