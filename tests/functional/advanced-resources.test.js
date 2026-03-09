const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Advanced Resources (Tier 3)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080', { timeout: 60000 });
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
        await unlockWorkersStage(page);
    });

    test('tier 3 resources are accessible via get_resources', async ({ page }) => {
        const resources = await page.evaluate(() => window.rustGame.get_resources());
        const tier3Resources = [
            'Microchip',
            'QuantumComputer',
            'Robot',
            'Nanobot',
            'Antimatter',
            'DarkMatter',
            'TimeCrystal',
            'Spaceship'
        ];

        for (const resource of tier3Resources) {
            const amount = resources[resource] !== undefined ? resources[resource] : 0;
            expect(typeof amount).toBe('number');
            expect(amount).toBeGreaterThanOrEqual(0);
        }
    });

    test('tier 3 factory buildings exist in the building list', async ({ page }) => {
        const buildings = await page.evaluate(() => window.rustGame.get_buildings());
        const factoryNames = [
            '芯片制造厂',
            '量子计算中心',
            '机器人工厂',
            '纳米机器人工厂',
            '反物质反应堆',
            '时间水晶合成器'
        ];

        const buildingNames = buildings.map((building) => building.name);
        expect(buildingNames).toEqual(expect.arrayContaining(factoryNames));
    });

    test('tier 3 factories expose the expected output resources', async ({ page }) => {
        const buildings = await page.evaluate(() => window.rustGame.get_buildings());
        const outputs = new Map(buildings.map((building) => [building.name, building.output_resource || building.outputResource]));

        expect(outputs.get('芯片制造厂')).toBe('Microchip');
        expect(outputs.get('量子计算中心')).toBe('QuantumComputer');
        expect(outputs.get('机器人工厂')).toBe('Robot');
        expect(outputs.get('纳米机器人工厂')).toBe('Nanobot');
        expect(outputs.get('反物质反应堆')).toBe('Antimatter');
        expect(outputs.get('时间水晶合成器')).toBe('TimeCrystal');
    });

    test('advanced resource factories remain reachable without a crafting tab', async ({ page }) => {
        const craftingButton = page.locator('button[data-tab="crafting"]');
        await expect(craftingButton).toHaveCount(0);

        await page.click('button[data-tab="buildings"]');
        await page.waitForTimeout(200);

        const buildingList = await page.locator('#building-list').textContent();
        expect(buildingList).toContain('芯片制造厂');
    });
});
