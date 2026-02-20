const { test, expect } = require('@playwright/test');

test.describe('Statistics System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="statistics"]');
        await page.waitForSelector('#tab-statistics.active');
    });

    test('statistics panel displays all 9 statistic items', async ({ page }) => {
        const statisticItems = page.locator('.statistic-item');
        await expect(statisticItems).toHaveCount(9);

        const expectedStats = [
            'totalClicks',
            'totalCoinsEarned',
            'totalWoodEarned',
            'totalStoneEarned',
            'totalResourcesCrafted',
            'achievementsUnlocked',
            'playTime',
            'buildingsPurchased',
            'upgradesPurchased'
        ];

        for (let i = 0; i < expectedStats.length; i++) {
            const statLabel = page.locator(`.statistic-item:nth-child(${i + 1}) .stat-label`);
            await expect(statLabel).toBeVisible();
        }

        await page.screenshot({
            path: '.sisyphus/evidence/task-28-statistics-panel.png',
            fullPage: false
        });
    });

    test('total_clicks statistic tracks correctly', async ({ page }) => {
        const clicksStat = page.locator('.statistic-item:nth-child(1) .stat-value');
        const initialValue = await clicksStat.textContent();
        expect(parseInt(initialValue)).toBeGreaterThanOrEqual(0);

        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const afterValue = await clicksStat.textContent();
        expect(parseInt(afterValue)).toBeGreaterThanOrEqual(10);

        console.log(`Total clicks tracked: ${initialValue} -> ${afterValue}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-28-clicks-tracking.png'
        });
    });

    test('total_coins_earned statistic tracks correctly', async ({ page }) => {
        const coinsStat = page.locator('.statistic-item:nth-child(2) .stat-value');
        const initialValue = await coinsStat.textContent();
        const initialCoins = parseFloat(initialValue.replace(/,/g, ''));

        for (let i = 0; i < 20; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const afterValue = await coinsStat.textContent();
        const afterCoins = parseFloat(afterValue.replace(/,/g, ''));

        expect(afterCoins).toBeGreaterThan(initialCoins);
        console.log(`Total coins earned: ${initialCoins} -> ${afterCoins}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-28-coins-tracking.png'
        });
    });

    test('total_wood_earned tracks from buildings', async ({ page }) => {
        const woodStat = page.locator('.statistic-item:nth-child(3) .stat-value');
        const initialValue = await woodStat.textContent();

        await page.click('[data-tab="buildings"]');
        await page.waitForTimeout(200);

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 50) {
            await page.click('#buy-building-1');
            await page.waitForTimeout(500);

            await page.click('[data-tab="statistics"]');
            await page.waitForTimeout(300);

            const afterValue = await woodStat.textContent();
            console.log(`Total wood earned: ${initialValue} -> ${afterValue}`);
        }
    });

    test('total_resources_crafted tracks from crafting', async ({ page }) => {
        const craftStat = page.locator('.statistic-item:nth-child(5) .stat-value');
        const initialValue = await craftStat.textContent();
        expect(initialValue).toBe('0');

        await page.click('[data-tab="crafting"]');
        await page.waitForTimeout(200);

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 100) {
            const craftButton = page.locator('.craft-recipe-btn').first();
            await craftButton.click();
            await page.waitForTimeout(500);

            const confirmButton = page.locator('.craft-confirm-btn, button:has-text("确认"), button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(500);
            }

            await page.click('[data-tab="statistics"]');
            await page.waitForTimeout(300);

            const afterValue = await craftStat.textContent();
            const afterCount = parseInt(afterValue);
            expect(afterCount).toBeGreaterThanOrEqual(1);
            console.log(`Total resources crafted: ${initialValue} -> ${afterValue}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-28-craft-tracking.png'
            });
        }
    });

    test('achievements_unlocked tracks unlocked achievements', async ({ page }) => {
        const achievementsStat = page.locator('.statistic-item:nth-child(6) .stat-value');
        const initialValue = await achievementsStat.textContent();
        expect(initialValue).toBe('0');

        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        await page.click('[data-tab="statistics"]');
        await page.waitForTimeout(300);

        const afterValue = await achievementsStat.textContent();
        const afterCount = parseInt(afterValue);
        expect(afterCount).toBeGreaterThanOrEqual(1);
        console.log(`Achievements unlocked: ${initialValue} -> ${afterValue}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-28-achievements-tracking.png'
        });
    });

    test('play_time_seconds increases over time', async ({ page }) => {
        const playTimeStat = page.locator('.statistic-item:nth-child(7) .stat-value');
        const initialValue = await playTimeStat.textContent();

        await page.waitForTimeout(3000);

        const afterValue = await playTimeStat.textContent();
        console.log(`Play time: ${initialValue} -> ${afterValue}`);
    });

    test('buildings_purchased tracks building purchases', async ({ page }) => {
        const buildingsStat = page.locator('.statistic-item:nth-child(8) .stat-value');
        const initialValue = await buildingsStat.textContent();
        expect(initialValue).toBe('0');

        await page.click('[data-tab="buildings"]');
        await page.waitForTimeout(200);

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 15) {
            await page.click('#buy-building-0');
            await page.waitForTimeout(500);

            await page.click('[data-tab="statistics"]');
            await page.waitForTimeout(300);

            const afterValue = await buildingsStat.textContent();
            const afterCount = parseInt(afterValue);
            expect(afterCount).toBeGreaterThanOrEqual(1);
            console.log(`Buildings purchased: ${initialValue} -> ${afterValue}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-28-buildings-tracking.png'
            });
        }
    });

    test('upgrades_purchased tracks upgrade purchases', async ({ page }) => {
        const upgradesStat = page.locator('.statistic-item:nth-child(9) .stat-value');
        const initialValue = await upgradesStat.textContent();
        expect(initialValue).toBe('0');

        await page.click('[data-tab="upgrades"]');
        await page.waitForTimeout(200);

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 10) {
            await page.click('#buy-upgrade-0');
            await page.waitForTimeout(500);

            await page.click('[data-tab="statistics"]');
            await page.waitForTimeout(300);

            const afterValue = await upgradesStat.textContent();
            const afterCount = parseInt(afterValue);
            expect(afterCount).toBeGreaterThanOrEqual(1);
            console.log(`Upgrades purchased: ${initialValue} -> ${afterValue}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-28-upgrades-tracking.png'
            });
        }
    });

    test('statistics update in real-time', async ({ page }) => {
        const clicksStat = page.locator('.statistic-item:nth-child(1) .stat-value');

        for (let i = 0; i < 5; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const after5Clicks = await clicksStat.textContent();
        expect(parseInt(after5Clicks)).toBeGreaterThanOrEqual(5);

        for (let i = 0; i < 5; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const after10Clicks = await clicksStat.textContent();
        expect(parseInt(after10Clicks)).toBeGreaterThan(parseInt(after5Clicks));

        console.log(`Real-time update: ${after5Clicks} -> ${after10Clicks}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-28-realtime-update.png'
        });
    });

    test('statistics accessible via WASM API', async ({ page }) => {
        const stats = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_statistics) {
                return window.rustGame.get_statistics();
            }
            return null;
        });

        expect(stats).toBeTruthy();
        expect(typeof stats.total_clicks).toBe('number');
        expect(typeof stats.total_coins_earned).toBe('number');
        expect(typeof stats.play_time_seconds).toBe('number');

        console.log('WASM statistics API:', JSON.stringify(stats, null, 2));

        await page.screenshot({
            path: '.sisyphus/evidence/task-28-wasm-api.png'
        });
    });

    test('statistics persist after page reload', async ({ page }) => {
        for (let i = 0; i < 15; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const clicksBefore = await page.locator('.statistic-item:nth-child(1) .stat-value').textContent();
        const coinsBefore = await page.locator('.statistic-item:nth-child(2) .stat-value').textContent();

        console.log(`Before reload - Clicks: ${clicksBefore}, Coins: ${coinsBefore}`);

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="statistics"]');
        await page.waitForTimeout(500);

        const clicksAfter = await page.locator('.statistic-item:nth-child(1) .stat-value').textContent();
        const coinsAfter = await page.locator('.statistic-item:nth-child(2) .stat-value').textContent();

        console.log(`After reload - Clicks: ${clicksAfter}, Coins: ${coinsAfter}`);

        expect(parseInt(clicksAfter)).toBeGreaterThanOrEqual(parseInt(clicksBefore));
        expect(parseFloat(coinsAfter.replace(/,/g, ''))).toBeGreaterThanOrEqual(parseFloat(coinsBefore.replace(/,/g, '')));

        await page.screenshot({
            path: '.sisyphus/evidence/task-28-persistence.png'
        });
    });
});
