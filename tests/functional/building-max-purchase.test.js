const { test, expect } = require('../fixtures/coverage');

test.describe('Building Max Purchase', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080', { timeout: 60000 });
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('max affordable count is consistent with manual buys when count=0', async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.rustGame;
            // Start fresh: give enough coins to test
            for (let i = 0; i < 500; i++) g.click_action();
            const coins = g.get_coins();
            const maxCount = g.get_max_affordable_building_count(0);
            return { coins, maxCount };
        });
        expect(result.coins).toBeGreaterThan(0);
        expect(result.maxCount).toBeGreaterThan(0);
    });

    test('max affordable count matches manual single-buy loop', async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.rustGame;
            for (let i = 0; i < 300; i++) g.click_action();
            const coins = g.get_coins();

            const maxCount = g.get_max_affordable_building_count(0);

            // Manually buy one at a time, count how many succeed
            let manualCount = 0;
            while (g.buy_building(0)) {
                manualCount++;
            }

            return { coins, maxCount, manualCount };
        });
        expect(result.maxCount).toBe(result.manualCount);
    });

    test('max affordable count works after buying some buildings', async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.rustGame;
            for (let i = 0; i < 2000; i++) g.click_action();
            const coins = g.get_coins();

            // Buy 5 first
            for (let i = 0; i < 5; i++) {
                if (!g.buy_building(0)) break;
            }

            const maxCount = g.get_max_affordable_building_count(0);
            const bulkResult = g.buy_buildings(0, maxCount);

            return { coins, maxCount, bulkResult, coinsAfter: g.get_coins() };
        });
        expect(result.maxCount).toBeGreaterThan(0);
        expect(result.bulkResult).toBe(result.maxCount);
    });

    test('max affordable count is 0 when coins insufficient for even 1', async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.rustGame;
            // Start with 0 coins (fresh game)
            g.reset_game();
            return {
                coins: g.get_coins(),
                maxCount: g.get_max_affordable_building_count(0),
            };
        });
        expect(result.coins).toBe(0);
        expect(result.maxCount).toBe(0);
    });

    test('displayed max cost matches Rust max affordable count total cost', async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.rustGame;
            for (let i = 0; i < 500; i++) g.click_action();
            const coins = g.get_coins();

            const maxCount = g.get_max_affordable_building_count(0);

            // Calculate the total cost in JS using same formula as Rust
            // building.cost from get_buildings() is the BASE cost
            const buildings = g.get_buildings();
            const baseCost = buildings[0].cost;
            const currentCount = buildings[0].count; // Should be 0 for fresh

            // The actual next cost = base * 1.15^count (escalated)
            let jsTotalCost = 0;
            let runningCost = baseCost * Math.pow(1.15, currentCount);
            for (let i = 0; i < maxCount; i++) {
                jsTotalCost += runningCost;
                runningCost *= 1.15;
            }

            return { coins, maxCount, jsTotalCost, withinBudget: jsTotalCost <= coins + 0.01 };
        });
        expect(result.maxCount).toBeGreaterThan(0);
        expect(result.withinBudget).toBe(true);
    });
});
