const { test, expect } = require('../fixtures/coverage');
const { unlockMaggotStage, unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Workers System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await unlockWorkersStage(page);
        
        await page.click('[data-tab="workers"]');
        await expect(page.locator('#tab-workers')).toHaveClass(/active/);
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
            expect(firstWorker).toHaveProperty('focus');
            expect(firstWorker).toHaveProperty('fatigue');
            expect(firstWorker).toHaveProperty('stress');
            expect(firstWorker).toHaveProperty('missingLimbs');
            expect(firstWorker).toHaveProperty('maggotLimbs');

            expect(typeof firstWorker.happiness).toBe('number');
            expect(typeof firstWorker.hunger).toBe('number');
            expect(firstWorker.happiness).toBeGreaterThanOrEqual(0);
            expect(firstWorker.happiness).toBeLessThanOrEqual(100);
            expect(firstWorker.hunger).toBeGreaterThanOrEqual(0);
            expect(firstWorker.hunger).toBeLessThanOrEqual(100);
            expect(firstWorker.focus).toBeGreaterThanOrEqual(0);
            expect(firstWorker.focus).toBeLessThanOrEqual(100);
            expect(firstWorker.fatigue).toBeGreaterThanOrEqual(0);
            expect(firstWorker.fatigue).toBeLessThanOrEqual(100);
            expect(firstWorker.stress).toBeGreaterThanOrEqual(0);
            expect(firstWorker.stress).toBeLessThanOrEqual(100);
            expect(Array.isArray(firstWorker.missingLimbs)).toBe(true);
            expect(Array.isArray(firstWorker.maggotLimbs)).toBe(true);

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
            expect(snapshot.details).toHaveProperty('missingLimbs');
            expect(snapshot.details).toHaveProperty('maggotLimbs');
        }
    });

    test('maggot limb surgery converts missing limbs into maggot limbs', async ({ page }) => {
        await unlockMaggotStage(page);
        await page.click('[data-tab="workers"]');

        const result = await page.evaluate(() => {
            const ensureWorkersPresent = () => {
                const existing = window.rustGame.get_workers();
                if (Array.isArray(existing) && existing.length > 0) {
                    return existing;
                }

                const seedRaw = window.rustGame.exportToBase64();
                const seedJson = JSON.parse(atob(seedRaw));
                seedJson.state = seedJson.state || {};
                seedJson.state.current_stage = 'Maggot';
                seedJson.last_worker_spawn_time = 0;
                seedJson.state.last_update_time = Date.now() - 1000;
                window.rustGame.importFromBase64(btoa(JSON.stringify(seedJson)));
                if (typeof window.rustGame.game_loop === 'function') {
                    window.rustGame.game_loop();
                }
                return window.rustGame.get_workers();
            };

            const existingWorkers = ensureWorkersPresent();
            const raw = window.rustGame.exportToBase64();
            const json = JSON.parse(atob(raw));

            json.state = json.state || {};
            json.state.current_stage = 'Maggot';
            json.state.resources = json.state.resources || {};
            json.state.resources.Maggot = 60;
            json.last_worker_spawn_time = 0;

            if (!Array.isArray(existingWorkers) || existingWorkers.length === 0 || !Array.isArray(json.workers) || json.workers.length === 0) {
                return { ok: false, reason: 'missing workers' };
            }

            json.workers[0].missing_limbs = ['LeftArm', 'RightLeg'];
            json.workers[0].maggot_limbs = [];

            window.rustGame.importFromBase64(btoa(JSON.stringify(json)));
            if (typeof window.rustGame.game_loop === 'function') {
                window.rustGame.game_loop();
            }

            const before = window.rustGame.get_workers()[0];
            const beforeResources = window.rustGame.get_resources();
            const surgeryResult = window.rustGame.perform_maggot_limb_surgery(0);
            const after = window.rustGame.get_workers()[0];
            const afterResources = window.rustGame.get_resources();

            return {
                ok: true,
                beforeMissing: before.missingLimbs,
                beforeMaggot: before.maggotLimbs,
                surgeryResult,
                afterMissing: after.missingLimbs,
                afterMaggot: after.maggotLimbs,
                beforeMaggotCount: beforeResources.Maggot,
                afterMaggotCount: afterResources.Maggot,
                surgeryCost: before.maggotSurgeryCost,
                canBefore: before.canMaggotSurgery,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.canBefore).toBe(true);
        expect(result.beforeMissing).toEqual(expect.arrayContaining(['左手', '右腿']));
        expect(result.beforeMaggot).toEqual([]);
        expect(result.surgeryResult).toBe(true);
        expect(result.afterMissing).toEqual([]);
        expect(result.afterMaggot).toEqual(expect.arrayContaining(['左手', '右腿']));
        expect(result.beforeMaggotCount - result.afterMaggotCount).toBe(result.surgeryCost);

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await unlockMaggotStage(page);
        await page.click('[data-tab="workers"]');

        const modalResult = await page.evaluate(() => {
            const ensureWorkersPresent = () => {
                const existing = window.rustGame.get_workers();
                if (Array.isArray(existing) && existing.length > 0) {
                    return existing;
                }

                const seedRaw = window.rustGame.exportToBase64();
                const seedJson = JSON.parse(atob(seedRaw));
                seedJson.state = seedJson.state || {};
                seedJson.state.current_stage = 'Maggot';
                seedJson.last_worker_spawn_time = 0;
                seedJson.state.last_update_time = Date.now() - 1000;
                window.rustGame.importFromBase64(btoa(JSON.stringify(seedJson)));
                if (typeof window.rustGame.game_loop === 'function') {
                    window.rustGame.game_loop();
                }
                return window.rustGame.get_workers();
            };

            const existingWorkers = ensureWorkersPresent();
            const raw = window.rustGame.exportToBase64();
            const json = JSON.parse(atob(raw));
            json.state.current_stage = 'Maggot';
            json.state.resources = json.state.resources || {};
            json.state.resources.Maggot = 60;
            json.last_worker_spawn_time = 0;
            if (!Array.isArray(existingWorkers) || existingWorkers.length === 0 || !Array.isArray(json.workers) || json.workers.length === 0) {
                return false;
            }
            json.workers[0].missing_limbs = ['LeftArm'];
            json.workers[0].maggot_limbs = [];
            window.rustGame.importFromBase64(btoa(JSON.stringify(json)));
            if (typeof window.rustGame.game_loop === 'function') {
                window.rustGame.game_loop();
            }
            window.workerManager.renderWorkers();
            window.workerManager.showAssignmentModal(0);
            return true;
        });

        expect(modalResult).toBe(true);
        await expect(page.locator('#worker-assignment-modal')).toContainText('肢体状态');
        await expect(page.locator('#worker-assignment-modal')).toContainText('蛆虫肢体手术');
        await expect(page.locator('#worker-assignment-modal')).toContainText('左手');
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

        expect(cancelState.confirms).toContain('将重新为全部工人执行自动安排，并优先选择效率最高且仍有空位的岗位，是否继续？');
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
        expect(successState.alerts).toContain('自动安排完成：已为 2 名工人选择当前最佳且仍有空位的岗位');
        expect(successState.confirms.filter((message) => message === '将重新为全部工人执行自动安排，并优先选择效率最高且仍有空位的岗位，是否继续？')).toHaveLength(2);
    });

    test('worker assignment respects building slot capacity', async ({ page }) => {
        const result = await page.evaluate(() => {
            const workers = window.rustGame.get_workers();
            const buildings = window.rustGame.get_buildings();
            const singleSlotBuilding = buildings.find((building) => Number(building.count || 0) === 1);

            if (!workers || workers.length < 2 || !singleSlotBuilding) {
                return { skipped: true };
            }

            const first = window.rustGame.assign_worker(0, singleSlotBuilding.name);
            const second = window.rustGame.assign_worker(1, singleSlotBuilding.name);
            const updatedWorkers = window.rustGame.get_workers();
            const assignedToBuilding = updatedWorkers.filter((worker) => worker.assignedBuilding === singleSlotBuilding.name).length;

            return {
                skipped: false,
                building: singleSlotBuilding.name,
                first,
                second,
                assignedToBuilding,
                capacity: singleSlotBuilding.count,
            };
        });

        if (result.skipped) {
            test.skip(true, 'No single-slot building available for capacity validation.');
        }

        expect(result.first).toBe(true);
        expect(result.second).toBe(false);
        expect(result.assignedToBuilding).toBe(result.capacity);
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
