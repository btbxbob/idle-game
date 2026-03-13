const { test, expect } = require('../fixtures/coverage');

test.describe('WASM wrapper coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('versioned and unversioned wrappers cover init cache, type guards, and moved-value branches', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const exerciseModule = async (modulePath) => {
                const mod = await import(modulePath);
                await mod.default();
                await mod.default();

                const game = mod.init_game();
                const typeErrors = [];
                const movedErrors = [];

                const capture = (label, fn, bucket) => {
                    try {
                        fn();
                    } catch (error) {
                        bucket.push(`${label}:${String(error && error.message ? error.message : error)}`);
                    }
                };

                capture('assign_worker_num', () => game.assign_worker('bad-index', 'Farm'), typeErrors);
                capture('assign_worker_string', () => game.assign_worker(0, 123), typeErrors);
                capture('check_unlock_string', () => game.check_unlock(123), typeErrors);

                const beforeFreeCoins = game.get_coins();
                const beforeFreeBuildings = Array.isArray(game.get_buildings());
                const beforeFreeStats = typeof game.getStatistics() === 'object';

                game.free();

                [
                    ['get_coins', () => game.get_coins()],
                    ['get_buildings', () => game.get_buildings()],
                    ['buy_building', () => game.buy_building(0)],
                    ['assign_worker_auto', () => game.assign_worker_auto()],
                    ['exportToBase64', () => game.exportToBase64()],
                    ['getProgressionStateJson', () => game.getProgressionStateJson()],
                    ['getUnlockProgress', () => game.getUnlockProgress('stage_workers')],
                    ['check_achievement', () => game.check_achievement('first_click')],
                ].forEach(([label, fn]) => capture(label, fn, movedErrors));

                return {
                    beforeFreeCoins,
                    beforeFreeBuildings,
                    beforeFreeStats,
                    typeErrors,
                    movedErrors,
                };
            };

            const versioned = await exerciseModule('/pkg/idle_game.v0.6.7.js');
            const unversioned = await exerciseModule('/pkg/idle_game.js');

            return { versioned, unversioned };
        });

        for (const wrapper of [result.versioned, result.unversioned]) {
            expect(typeof wrapper.beforeFreeCoins).toBe('number');
            expect(wrapper.beforeFreeBuildings).toBe(true);
            expect(wrapper.beforeFreeStats).toBe(true);
            expect(wrapper.typeErrors.some((entry) => entry.includes('expected a number argument'))).toBe(true);
            expect(wrapper.typeErrors.some((entry) => entry.includes('expected a string argument'))).toBe(true);
            expect(wrapper.movedErrors.length).toBe(8);
            expect(wrapper.movedErrors.every((entry) => entry.includes('Attempt to use a moved value'))).toBe(true);
        }
    });
});
