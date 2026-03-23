const { test, expect } = require('../fixtures/coverage');
const { importStageSnapshot } = require('../fixtures/stage-helpers');

test.describe('Bulk Buy Mode Bug Regression', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
    });

    test('selecting max mode and buying should not hide all buildings', async ({ page }) => {
        await importStageSnapshot(page, {
            stage: 'Workers',
            resources: {
                Gold: 1000000,
            },
            technologies: [
                'BasicMining',
            ],
        });

        const buildingsBefore = await page.evaluate(() => {
            return window.rustGame.get_buildings().map(b => b.name);
        });
        expect(buildingsBefore.length).toBeGreaterThan(0);

        await page.evaluate(() => {
            const select = document.getElementById('building-buy-mode');
            if (select) {
                select.value = 'max';
                select.dispatchEvent(new Event('change'));
            }
        });

        const selectedMode = await page.evaluate(() => {
            const select = document.getElementById('building-buy-mode');
            return select ? select.value : null;
        });
        expect(selectedMode).toBe('max');

        const buildingListBefore = await page.evaluate(() => {
            const el = document.getElementById('building-list');
            return el ? el.children.length : 0;
        });
        expect(buildingListBefore).toBeGreaterThan(0);

        const buyResult = await page.evaluate(() => {
            const firstBuilding = window.rustGame.get_buildings()[0];
            if (!firstBuilding) return { ok: false, reason: 'no buildings' };

            const index = firstBuilding.index !== undefined ? firstBuilding.index : 0;
            const coinsBefore = window.rustGame.get_coins();
            
            const allBuildingListsBefore = document.querySelectorAll('#building-list');
            const childrenBefore = allBuildingListsBefore.length > 0 
                ? Array.from(allBuildingListsBefore).map(el => el.children.length)
                : [];

            // Call window.buyBuilding like the UI does
            if (typeof window.buyBuilding === 'function') {
                window.buyBuilding(index);
            }

            const coinsAfter = window.rustGame.get_coins();
            
            const allBuildingListsAfter = document.querySelectorAll('#building-list');
            const childrenAfter = allBuildingListsAfter.length > 0 
                ? Array.from(allBuildingListsAfter).map(el => el.children.length)
                : [];
            
            const buyMode = window.getBuildingBuyMode ? window.getBuildingBuyMode() : 'not found';
            
            // Get fresh buildings from WASM
            const freshBuildings = window.rustGame.get_buildings();

            return {
                ok: true,
                coinsBefore,
                coinsAfter,
                buyMode,
                numberOfBuildingLists: allBuildingListsAfter.length,
                childrenBefore,
                childrenAfter,
                totalBuildings: freshBuildings.length,
                firstBuildingIndex: index,
                firstBuildingName: firstBuilding.name,
            };
        });

        expect(buyResult.ok).toBe(true);
        expect(buyResult.childrenAfter[0]).toBeGreaterThan(0);
        expect(buyResult.totalBuildings).toBeGreaterThan(0);
    });

    test('x10 mode should not hide all buildings', async ({ page }) => {
        await importStageSnapshot(page, {
            stage: 'Workers',
            resources: {
                Gold: 1000000,
            },
            technologies: [
                'BasicMining',
            ],
        });

        await page.evaluate(() => {
            const select = document.getElementById('building-buy-mode');
            if (select) {
                select.value = '10';
                select.dispatchEvent(new Event('change'));
            }
        });

        const buyResult = await page.evaluate(() => {
            const firstBuilding = window.rustGame.get_buildings()[0];
            if (!firstBuilding) return { ok: false, reason: 'no buildings' };

            const index = firstBuilding.index !== undefined ? firstBuilding.index : 0;

            if (typeof window.buyBuilding === 'function') {
                window.buyBuilding(index);
            }

            const buildingList = document.getElementById('building-list');
            return {
                ok: true,
                buildingListChildren: buildingList ? buildingList.children.length : -1,
                totalBuildings: window.rustGame.get_buildings().length,
            };
        });

        expect(buyResult.ok).toBe(true);
        expect(buyResult.buildingListChildren).toBeGreaterThan(0);
    });
});
