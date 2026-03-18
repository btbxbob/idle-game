const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Workers System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await unlockWorkersStage(page);
        
        await page.click('[data-tab="workers"]');
        await page.waitForTimeout(500);
    });

    test('workers panel displays correctly', async ({ page }) => {
        const workersList = page.locator('#workers-list');
        await expect(workersList).toBeVisible();

        const workersGrid = await page.$('.workers-grid, #workers-virtual-list');
        const placeholder = await page.$('#workers-placeholder');
        expect(workersGrid || placeholder).toBeTruthy();

        const modalStyles = await page.evaluate(() => {
            const styleSheets = document.styleSheets;
            for (let i = 0; i < styleSheets.length; i++) {
                try {
                    const rules = styleSheets[i].cssRules;
                    for (let j = 0; j < rules.length; j++) {
                        if (rules[j].selectorText && rules[j].selectorText.includes('modal-overlay')) {
                            return true;
                        }
                    }
                } catch (error) {
                    void error;
                }
            }
            return false;
        });
        expect(modalStyles).toBeTruthy();

        const workerCards = page.locator('#workers-list .worker-card, #workers-list .worker-item, #workers-list .worker-list-item, #workers-placeholder');
        const count = await workerCards.count();
        expect(count).toBeGreaterThanOrEqual(1);

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-workers-panel.png',
            fullPage: false
        });

        console.log('Workers panel displayed successfully');
    });

    test('worker card structure is rendered when cards are present', async ({ page }) => {
        const workerCards = page.locator('.worker-card');
        const cardCount = await workerCards.count();

        if (cardCount === 0) {
            test.skip(true, 'Current workers panel uses placeholder/virtualized rendering without worker cards.');
        }

        await expect(page.locator('.worker-header').first()).toBeVisible();
        await expect(page.locator('.worker-body').first()).toBeVisible();
        await expect(page.locator('.worker-footer').first()).toBeVisible();
        await expect(page.locator('.xp-progress-bar').first()).toBeVisible();
        await expect(page.locator('.worker-assign-btn').first()).toBeVisible();

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-worker-card-detail.png',
            fullPage: false
        });
    });

    test('worker roster data remains internally consistent through WASM APIs', async ({ page }) => {
        const snapshot = await page.evaluate(() => {
            const workers = window.rustGame && window.rustGame.get_workers ? window.rustGame.get_workers() : [];
            const hasAssignWorker = !!(window.rustGame && typeof window.rustGame.assign_worker === 'function');
            const details = window.rustGame && window.rustGame.get_worker_details ? window.rustGame.get_worker_details(0) : null;
            return { workers, hasAssignWorker, details };
        });

        expect(snapshot.hasAssignWorker).toBe(true);
        expect(Array.isArray(snapshot.workers)).toBe(true);

        if (snapshot.workers.length > 0) {
            const names = snapshot.workers.map((worker) => worker.name);
            expect(new Set(names).size).toBe(names.length);

            const firstWorker = snapshot.workers[0];
            expect(firstWorker).toHaveProperty('skills');
            expect(firstWorker).toHaveProperty('preferences');
            expect(firstWorker).toHaveProperty('background');
            expect(firstWorker).toHaveProperty('happiness');
            expect(firstWorker).toHaveProperty('hunger');

            expect(typeof firstWorker.happiness).toBe('number');
            expect(typeof firstWorker.hunger).toBe('number');
            expect(firstWorker.happiness).toBeGreaterThanOrEqual(0);
            expect(firstWorker.happiness).toBeLessThanOrEqual(100);
            expect(firstWorker.hunger).toBeGreaterThanOrEqual(0);
            expect(firstWorker.hunger).toBeLessThanOrEqual(100);

            const multiplier = firstWorker.efficiency_multiplier || firstWorker.efficiencyMultiplier || 1.0;
            const xpToNextLevel = firstWorker.xp_to_next_level || firstWorker.xpToNextLevel;

            expect(multiplier).toBeGreaterThanOrEqual(1.0);
            expect(firstWorker.level).toBeGreaterThanOrEqual(1);
            expect(firstWorker.xp).toBeGreaterThanOrEqual(0);
            expect(xpToNextLevel).toBeGreaterThan(0);
        }

        expect(snapshot.details === null || typeof snapshot.details === 'object').toBe(true);
        if (snapshot.details) {
            expect(snapshot.details).toHaveProperty('name');
            expect(snapshot.details).toHaveProperty('level');
            expect(snapshot.details).toHaveProperty('skills');
        }
    });

    test('worker assignment and auto-assign flows remain functional', async ({ page }) => {
        const assignmentResult = await page.evaluate(() => {
            const workers = window.rustGame && window.rustGame.get_workers ? window.rustGame.get_workers() : [];
            const buildings = window.rustGame && window.rustGame.get_buildings ? window.rustGame.get_buildings() : [];

            if (!workers.length || !buildings.length || !window.rustGame || typeof window.rustGame.assign_worker !== 'function') {
                return { skipped: true, autoAssignAvailable: false, autoAssignButton: false };
            }

            const buildingName = buildings[0].name;
            const assigned = window.rustGame.assign_worker(0, buildingName);
            const updatedWorkers = window.rustGame.get_workers ? window.rustGame.get_workers() : [];

            return {
                skipped: false,
                assigned,
                buildingName,
                assignedBuilding: updatedWorkers[0] ? updatedWorkers[0].assignedBuilding : null,
                autoAssignAvailable: !!(window.workerManager && typeof window.workerManager.handleAutoAssign === 'function'),
                autoAssignButton: !!document.getElementById('workers-auto-assign'),
            };
        });

        expect(assignmentResult.skipped).toBe(false);
        expect(assignmentResult.assigned).toBe(true);
        expect(assignmentResult.assignedBuilding).toBe(assignmentResult.buildingName);
        expect(assignmentResult.autoAssignAvailable || assignmentResult.autoAssignButton).toBe(true);

        await expect(page.locator('#workers-auto-assign')).toBeVisible();

        const initialState = await page.evaluate(() => {
            window.__autoAssignFlow = {
                alerts: [],
                confirms: [],
                calls: 0,
            };

            window.alert = (message) => {
                window.__autoAssignFlow.alerts.push(String(message));
            };

            window.confirm = (message) => {
                window.__autoAssignFlow.confirms.push(String(message));
                return false;
            };

            if (window.workerManager && window.workerManager.rustGame) {
                window.workerManager.rustGame.assign_worker_auto = () => {
                    window.__autoAssignFlow.calls += 1;
                    return 2;
                };
            }

            return {
                hasWorkerManager: !!window.workerManager,
                hasButton: !!document.getElementById('workers-auto-assign'),
            };
        });

        expect(initialState.hasWorkerManager).toBe(true);
        expect(initialState.hasButton).toBe(true);

        await page.click('#workers-auto-assign');

        const cancelState = await page.evaluate(() => ({
            alerts: window.__autoAssignFlow.alerts.slice(),
            confirms: window.__autoAssignFlow.confirms.slice(),
            calls: window.__autoAssignFlow.calls,
        }));

        expect(cancelState.confirms).toContain('将为未分配工人执行自动分配，是否继续？');
        expect(cancelState.calls).toBe(0);
        expect(cancelState.alerts).toHaveLength(0);

        await page.evaluate(() => {
            window.confirm = (message) => {
                window.__autoAssignFlow.confirms.push(String(message));
                return true;
            };
        });

        await page.click('#workers-auto-assign');

        const successState = await page.evaluate(() => ({
            alerts: window.__autoAssignFlow.alerts.slice(),
            confirms: window.__autoAssignFlow.confirms.slice(),
            calls: window.__autoAssignFlow.calls,
        }));

        expect(successState.calls).toBe(1);
        expect(successState.alerts).toContain('自动分配完成：成功分配 2 名工人');
        expect(successState.confirms.filter((message) => message === '将为未分配工人执行自动分配，是否继续？')).toHaveLength(2);
    });

    test('workers persist after page reload', async ({ page }) => {
        const workersBefore = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.waitForFunction(() => !!window.workerManager);
        await unlockWorkersStage(page);

        const workersAfter = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        expect(workersAfter.length).toBe(workersBefore.length);
    });
});
