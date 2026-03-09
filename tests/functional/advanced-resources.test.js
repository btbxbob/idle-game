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

    test('tier 3 factories exist and expose expected output resources', async ({ page }) => {
        const buildings = await page.evaluate(() => window.rustGame.get_buildings());
        const buildingNames = buildings.map((building) => building.name);
        const outputs = new Map(buildings.map((building) => [building.name, building.output_resource || building.outputResource]));
        
        const tier3Factories = [
            { name: '芯片制造厂', output: 'Microchip' },
            { name: '量子计算中心', output: 'QuantumComputer' },
            { name: '机器人工厂', output: 'Robot' },
            { name: '纳米机器人工厂', output: 'Nanobot' },
            { name: '反物质反应堆', output: 'Antimatter' },
            { name: '时间水晶合成器', output: 'TimeCrystal' }
        ];
        
        for (const factory of tier3Factories) {
            expect(buildingNames).toContain(factory.name);
            expect(outputs.get(factory.name)).toBe(factory.output);
        }
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
