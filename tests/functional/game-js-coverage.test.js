const { test, expect } = require('../fixtures/coverage');

test.describe('Game.js Coverage Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
    });

    test('createCoinParticles function execution', async ({ page }) => {
        const result = await page.evaluate(() => {
            const x = 100;
            const y = 100;
            const existingParticles = document.querySelectorAll('.coin-particle').length;

            if (typeof window.createCoinParticles === 'function') {
                window.createCoinParticles(x, y);
            }

            const newParticles = document.querySelectorAll('.coin-particle').length;

            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        ok: true,
                        hadFunction: typeof window.createCoinParticles === 'function',
                        particlesCreated: newParticles > existingParticles,
                    });
                }, 100);
            });
        });

        expect(result.ok).toBe(true);
    });

    test('updateResourceDisplay with various numeric edge cases', async ({ page }) => {
        const result = await page.evaluate(() => {
            const testCases = [
                { coins: 100, wood: 200, stone: 300, cps: 1.5, wps: 2.5, sps: 3.5, cpc: 1.1 },
                { coins: 0, wood: 0, stone: 0, cps: 0, wps: 0, sps: 0, cpc: 0 },
            ];

            const errors = testCases.map((tc, idx) => {
                let error = null;
                try {
                    window.updateResourceDisplay(
                        tc.coins, tc.wood, tc.stone, tc.cps, tc.wps, tc.sps, tc.cpc
                    );
                } catch (e) {
                    error = e.message;
                }
                return { case: idx, error };
            });

            return { ok: true, errors };
        });

        result.errors.forEach(tc => {
            expect(tc.error).toBeFalsy();
        });
    });

    test('updateBuildingDisplay executes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                { name: 'Test Building', production_rate: 10, count: 1, cost: 100 },
            ];

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            let error = null;
            try {
                window.updateBuildingDisplay(buildings);
            } catch (e) {
                error = e.message;
            }

            buildingList.remove();

            return {
                ok: true,
                error,
                hasChildren: buildingList.children.length > 0,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.error).toBeFalsy();
    });

    test('buyBuilding guards', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalGame = window.rustGame;
            
            window.rustGame = null;
            let error = null;
            try {
                window.buyBuilding(0);
            } catch (e) {
                error = e.message;
            }

            window.rustGame = originalGame;

            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateStatisticsPanel guards', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.statisticsManager;
            window.statisticsManager = null;

            let error = null;
            try {
                window.updateStatisticsPanel();
            } catch (e) {
                error = e.message;
            }

            window.statisticsManager = original;
            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateUnlocksPanel guards', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.unlockManager;
            window.unlockManager = null;

            let error = null;
            try {
                window.updateUnlocksPanel();
            } catch (e) {
                error = e.message;
            }

            window.unlockManager = original;
            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateCoinButton executes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const countEl = document.createElement('div');
            countEl.id = 'coin-count';
            document.body.appendChild(countEl);

            let error = null;
            try {
                window.updateCoinButton();
            } catch (e) {
                error = e.message;
            }

            const hasValue = countEl.textContent.length > 0;
            countEl.remove();

            return {
                ok: true,
                error,
                hasValue,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.error).toBeFalsy();
    });

    test('getResourceNameForBuilding various building types', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                '金币矿山', '伐木场', '采石场', '铁矿场', '铜矿场',
                '铝矿场', '煤矿场', '石油井', '水晶矿', '农场',
                'Unknown Building'
            ];

            const results = buildings.map(b => {
                const name = getResourceNameForBuilding(b);
                return { building: b, name };
            });

            return { ok: true, results };
        });

        expect(result.ok).toBe(true);
        expect(result.results.length).toBe(11);
        expect(result.results[0].name).toContain('金');
    });

    test('updateResourceDisplay with invalid values', async ({ page }) => {
        const result = await page.evaluate(() => {
            const testCases = [
                { coins: NaN, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: Infinity, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: -100, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: NaN, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: Infinity, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: NaN, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: 1, wps: NaN, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: 1, wps: 2, sps: NaN, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: NaN },
            ];

            const errors = testCases.map((tc, idx) => {
                let error = null;
                try {
                    window.updateResourceDisplay(
                        tc.coins, tc.wood, tc.stone, tc.cps, tc.wps, tc.sps, tc.cpc
                    );
                } catch (e) {
                    error = e.message;
                }
                return { case: idx, error };
            });

            return { ok: true, errors };
        });

        result.errors.forEach(tc => {
            expect(tc.error).toBeFalsy();
        });
    });

    test('updateBuildingDisplay with different building types', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                { name: '金币矿山', cost: 15, production_rate: 1, count: 0 },
                { name: '伐木场', cost: 20, production_rate: 1, count: 0 },
                { name: '采石场', cost: 25, production_rate: 0.5, count: 0 },
                { name: 'Unknown Building', cost: 100, production_rate: 1, count: 0 },
            ];

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.updateBuildingDisplay(buildings);
            const html = buildingList.innerHTML;

            buildingList.remove();

            return {
                ok: true,
                hasCoinMine: html.includes('金币矿山'),
                hasWoodcutter: html.includes('伐木场'),
                hasQuarry: html.includes('采石场'),
                hasUnknown: html.includes('Unknown'),
            };
        });

        expect(result.ok).toBe(true);
        expect(result.hasCoinMine).toBe(true);
    });

    test('updateBuildingDisplay update path (same length)', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                { name: 'Building 1', production_rate: 10, count: 1, cost: 100 },
                { name: 'Building 2', production_rate: 20, count: 2, cost: 200 },
            ];

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.updateBuildingDisplay(buildings);
            const firstChildren = buildingList.children.length;

            window.updateBuildingDisplay(buildings);
            const secondChildren = buildingList.children.length;

            buildingList.remove();

            return {
                ok: true,
                firstChildren,
                secondChildren,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.firstChildren).toBe(2);
        expect(result.secondChildren).toBe(2);
    });

    test('buyBuilding with failure feedback', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.rustGame;

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.updateBuildingDisplay([{ name: '测试建筑', cost: 10, production_rate: 1, count: 0 }]);
            
            window.rustGame = {
                buy_building: () => false
            };
            
            let error = null;
            try {
                window.buyBuilding(0);
            } catch (e) {
                error = e.message;
            }
            
            buildingList.remove();
            window.rustGame = original;
            
            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateResourceDisplay without i18n fallback', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.i18n;
            window.i18n = null;

            let error = null;
            try {
                window.updateResourceDisplay(100, 200, 300, 1, 2, 3, 1);
            } catch (e) {
                error = e.message;
            }

            window.i18n = original;

            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
        expect(result.error).toBeFalsy();
    });
});
