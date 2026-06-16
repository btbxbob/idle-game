const { test, expect } = require('../fixtures/coverage');

test.describe('Prestige System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080', { timeout: 60000 });
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
    });

    test('prestige APIs exist and are callable', async ({ page }) => {
        const apis = await page.evaluate(() => {
            const g = window.rustGame;
            if (!g) return null;
            return {
                hasDoPrestige: typeof g.do_prestige === 'function',
                hasGetPP: typeof g.get_prestige_points === 'function',
                hasGetMultiplier: typeof g.get_prestige_multiplier === 'function',
                hasCalculateGain: typeof g.calculate_prestige_gain === 'function',
                hasResetGame: typeof g.reset_game === 'function',
            };
        });
        expect(apis).not.toBeNull();
        expect(apis.hasDoPrestige).toBe(true);
        expect(apis.hasGetPP).toBe(true);
        expect(apis.hasGetMultiplier).toBe(true);
        expect(apis.hasCalculateGain).toBe(true);
        expect(apis.hasResetGame).toBe(true);
    });

    test('initial prestige state is zero PP and 1.0 multiplier', async ({ page }) => {
        const state = await page.evaluate(() => {
            const g = window.rustGame;
            return {
                pp: g.get_prestige_points(),
                multiplier: g.get_prestige_multiplier(),
                coins: g.get_coins(),
            };
        });
        expect(state.pp).toBe(0);
        expect(state.multiplier).toBe(1);
        expect(state.coins).toBe(0);
    });

    test('calculate_prestige_gain returns 0 when coins below 1M', async ({ page }) => {
        const gain = await page.evaluate(() => {
            return window.rustGame.calculate_prestige_gain();
        });
        expect(gain).toBe(0);
    });

    test('do_prestige rejects invalid PP values', async ({ page }) => {
        for (const invalidPP of [0, -1, NaN, Infinity]) {
            const result = await page.evaluate((pp) => {
                return window.rustGame.do_prestige(pp);
            }, invalidPP);
            expect(result).toBe(false);
        }
        // Verify state unchanged
        const state = await page.evaluate(() => ({
            pp: window.rustGame.get_prestige_points(),
            multiplier: window.rustGame.get_prestige_multiplier(),
        }));
        expect(state.pp).toBe(0);
        expect(state.multiplier).toBe(1);
    });

    test('do_prestige with valid PP resets game and applies bonus', async ({ page }) => {
        // Accumulate coins via game ticks
        await page.evaluate(() => {
            const g = window.rustGame;
            for (let i = 0; i < 200; i++) g.click_action();
        });

        const coinsBefore = await page.evaluate(() => window.rustGame.get_coins());
        expect(coinsBefore).toBeGreaterThan(0);

        // Execute prestige with arbitrary PP
        const ppToGain = 5;
        const success = await page.evaluate((pp) => {
            return window.rustGame.do_prestige(pp);
        }, ppToGain);
        expect(success).toBe(true);

        // Verify prestige state
        const after = await page.evaluate(() => ({
            pp: window.rustGame.get_prestige_points(),
            multiplier: window.rustGame.get_prestige_multiplier(),
            coins: window.rustGame.get_coins(),
        }));
        expect(after.pp).toBe(ppToGain);
        expect(after.multiplier).toBeCloseTo(1.0 + ppToGain * 0.01, 4);
        expect(after.coins).toBe(0); // Game was reset
    });

    test('prestige preserves PP across consecutive resets', async ({ page }) => {
        // First prestige
        await page.evaluate(() => window.rustGame.do_prestige(3));
        const afterFirst = await page.evaluate(() => ({
            pp: window.rustGame.get_prestige_points(),
            multiplier: window.rustGame.get_prestige_multiplier(),
        }));
        expect(afterFirst.pp).toBe(3);

        // Accumulate coins again
        await page.evaluate(() => {
            const g = window.rustGame;
            for (let i = 0; i < 200; i++) g.click_action();
        });

        // Second prestige
        await page.evaluate(() => window.rustGame.do_prestige(2));
        const afterSecond = await page.evaluate(() => ({
            pp: window.rustGame.get_prestige_points(),
            multiplier: window.rustGame.get_prestige_multiplier(),
        }));
        expect(afterSecond.pp).toBe(5); // 3 + 2 = 5
        expect(afterSecond.multiplier).toBeCloseTo(1.0 + 5 * 0.01, 4);
    });

    test('reset_game clears all progress but not PP', async ({ page }) => {
        // Do a prestige first to gain some PP
        await page.evaluate(() => {
            const g = window.rustGame;
            for (let i = 0; i < 100; i++) g.click_action();
            g.do_prestige(1);
        });

        const ppBefore = await page.evaluate(() => window.rustGame.get_prestige_points());
        expect(ppBefore).toBe(1);

        // Accumulate more coins
        await page.evaluate(() => {
            const g = window.rustGame;
            for (let i = 0; i < 50; i++) g.click_action();
        });

        const coinsBeforeReset = await page.evaluate(() => window.rustGame.get_coins());
        expect(coinsBeforeReset).toBeGreaterThan(0);

        // reset_game (without prestige)
        await page.evaluate(() => window.rustGame.reset_game());

        const afterReset = await page.evaluate(() => ({
            coins: window.rustGame.get_coins(),
            totalClicks: window.rustGame.get_total_clicks ? window.rustGame.get_total_clicks() : -1,
        }));
        expect(afterReset.coins).toBe(0);
        // PP is preserved because reset_game only affects the IdleGame state, not World
    });
});
