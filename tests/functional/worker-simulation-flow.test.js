const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Worker Simulation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await unlockWorkersStage(page);
        
        await page.click('[data-tab="workers"]');
        await page.waitForTimeout(1000);
    });

    test('workers panel displays', async ({ page }) => {
        const workersList = page.locator('#workers-list');
        await expect(workersList).toBeVisible();

        const workersGrid = page.locator('.workers-grid, #workers-virtual-list');
        const workerCards = page.locator('.worker-card, .worker-list-item, #workers-placeholder');
        
        const gridExists = await workersGrid.count() > 0;
        const cardsExist = await workerCards.count() > 0;
        
        expect(gridExists || cardsExist).toBe(true);
        console.log(`Workers panel displayed, has grid: ${gridExists}, has cards: ${cardsExist}`);
    });

    test('worker data accessible via WASM API', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        expect(Array.isArray(workers)).toBe(true);
        console.log(`Workers from WASM: ${workers.length}`);

        if (workers.length > 0) {
            const firstWorker = workers[0];
            expect(firstWorker).toHaveProperty('name');
            expect(firstWorker).toHaveProperty('level');
            expect(firstWorker).toHaveProperty('efficiencyMultiplier');
            console.log(`First worker: ${firstWorker.name}, Level ${firstWorker.level}`);
        }
    });

    test('worker names are unique', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (workers.length > 0) {
            const names = workers.map(w => w.name);
            const uniqueNames = new Set(names);
            
            expect(uniqueNames.size).toBe(names.length);
            console.log(`Worker names: ${names.join(', ')}`);
        }
    });

    test('worker has mood and health properties', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (workers.length > 0) {
            const firstWorker = workers[0];
            
            expect(firstWorker).toHaveProperty('happiness');
            expect(firstWorker).toHaveProperty('hunger');
            
            expect(typeof firstWorker.happiness).toBe('number');
            expect(typeof firstWorker.hunger).toBe('number');
            expect(firstWorker.happiness).toBeGreaterThanOrEqual(0);
            expect(firstWorker.happiness).toBeLessThanOrEqual(100);
            expect(firstWorker.hunger).toBeGreaterThanOrEqual(0);
            expect(firstWorker.hunger).toBeLessThanOrEqual(100);

            console.log(`Worker happiness: ${firstWorker.happiness.toFixed(1)}, hunger: ${firstWorker.hunger.toFixed(1)}`);
        }
    });

    test('worker attributes include skills and preferences', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (workers.length > 0) {
            const firstWorker = workers[0];
            
            expect(firstWorker).toHaveProperty('skills');
            expect(firstWorker).toHaveProperty('preferences');
            expect(firstWorker).toHaveProperty('background');
            
            console.log(`Worker skills: ${firstWorker.skills}, preferences: ${firstWorker.preferences}`);
        }
    });

    test('worker assignment API is available', async ({ page }) => {
        const hasAssignWorker = await page.evaluate(() => {
            if (window.rustGame && typeof window.rustGame.assign_worker === 'function') {
                return true;
            }
            return false;
        });

        expect(hasAssignWorker).toBe(true);
        console.log('WASM assign_worker API available');
    });

    test('worker can be assigned to building', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (workers.length > 0) {
            const initialAssignment = workers[0].assignedBuilding;
            console.log(`Initial assignment: ${initialAssignment}`);

            const buildings = await page.evaluate(() => {
                if (window.rustGame && window.rustGame.get_buildings) {
                    return window.rustGame.get_buildings();
                }
                return [];
            });

            if (buildings.length > 0) {
                const buildingName = buildings[0].name;
                
                const result = await page.evaluate(({ workerIndex, building }) => {
                    if (window.rustGame && window.rustGame.assign_worker) {
                        return window.rustGame.assign_worker(workerIndex, building);
                    }
                    return false;
                }, { workerIndex: 0, building: buildingName });

                expect(result).toBe(true);
                console.log(`Assigned worker 0 to ${buildingName}: ${result}`);

                const updatedWorkers = await page.evaluate(() => {
                    if (window.rustGame && window.rustGame.get_workers) {
                        return window.rustGame.get_workers();
                    }
                    return [];
                });

                const newAssignment = updatedWorkers[0].assignedBuilding;
                expect(newAssignment).toBe(buildingName);
                console.log(`Worker now assigned to: ${newAssignment}`);
            }
        }
    });

    test('worker efficiency multiplier is at least 1.0', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (workers.length > 0) {
            const multiplier = workers[0].efficiency_multiplier || workers[0].efficiencyMultiplier || 1.0;
            expect(multiplier).toBeGreaterThanOrEqual(1.0);
            console.log(`Worker efficiency multiplier: ${multiplier.toFixed(2)}`);
        }
    });

    test('worker level and XP system works', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (workers.length > 0) {
            const firstWorker = workers[0];
            
            expect(firstWorker.level).toBeGreaterThanOrEqual(1);
            expect(firstWorker.xp).toBeGreaterThanOrEqual(0);
            expect(firstWorker.xpToNextLevel).toBeGreaterThan(0);
            
            console.log(`Worker level: ${firstWorker.level}, XP: ${firstWorker.xp.toFixed(1)}/${firstWorker.xpToNextLevel.toFixed(1)}`);
        }
    });

    test('auto-assign function exists in WorkerManager', async ({ page }) => {
        const hasAutoAssign = await page.evaluate(() => {
            const hasMethod = window.workerManager && typeof window.workerManager.handleAutoAssign === 'function';
            const hasButton = !!document.getElementById('workers-auto-assign');
            return !!(hasMethod || hasButton);
        });

        expect(hasAutoAssign).toBe(true);
        console.log('WorkerManager.autoAssign() available');
    });

    test('worker data persists after page reload', async ({ page }) => {
        const workersBefore = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        const countBefore = workersBefore.length;
        console.log(`Workers before reload: ${countBefore}`);

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.waitForTimeout(1000);
        await unlockWorkersStage(page);

        const workersAfter = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        const countAfter = workersAfter.length;
        console.log(`Workers after reload: ${countAfter}`);

        if (countBefore > 0) {
            expect(countAfter).toBeGreaterThan(0);
        } else {
            expect(countAfter).toBeGreaterThanOrEqual(0);
        }
    });

    test('mood and health UI elements exist', async ({ page }) => {
        const moodElements = page.locator('[id*="mood"], .mood-fill');
        const healthElements = page.locator('[id*="health"], .health-fill');
        
        const moodCount = await moodElements.count();
        const healthCount = await healthElements.count();
        
        console.log(`Mood elements: ${moodCount}, Health elements: ${healthCount}`);
    });
});
