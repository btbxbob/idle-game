const { test, expect } = require('../fixtures/coverage');

test.describe('WorkerManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('formatEfficiency branch coverage', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            return {
                ok: true,
                positive: window.workerManager.formatEfficiency(1.25),
                negative: window.workerManager.formatEfficiency(0.8),
                zero: window.workerManager.formatEfficiency(1.0),
                high: window.workerManager.formatEfficiency(2.0),
            };
        });
        expect(result.ok).toBe(true);
        expect(result.positive).toContain('+');
        expect(result.negative).toContain('-');
        expect(result.zero).toContain('+0%');
    });

    test('formatXP and escapeHtml branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            const xp = window.workerManager.formatXP(123.456, 500.789);
            const escaped = window.workerManager.escapeHtml('<script>alert(1)</script>"test"');
            return {
                ok: true,
                xp,
                escaped,
                hasSlash: escaped.includes('&lt;'),
            };
        });
        expect(result.ok).toBe(true);
        expect(result.xp).toContain('123');
        expect(result.hasSlash).toBe(true);
    });

    test('getGenderLabel and getHobbiesLabel branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            return {
                ok: true,
                male: window.workerManager.getGenderLabel('Male'),
                female: window.workerManager.getGenderLabel('Female'),
                other: window.workerManager.getGenderLabel('O'),
                hobbies: window.workerManager.getHobbiesLabel(['Gaming', 'Reading']),
                emptyHobbies: window.workerManager.getHobbiesLabel([]),
            };
        });
        expect(result.ok).toBe(true);
        expect(result.male).toContain('男');
        expect(result.female).toContain('女');
    });

    test('getTraitLabel branches (most uncovered traits)', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            const traits = [
                'Diligent', 'Hardworking', 'Lazy', 'Efficient', 'Slow',
                'Intelligent', 'FastLearner', 'Genius', 'SlowLearner', 'Social',
                'Loner', 'Charismatic', 'Shy', 'NightOwl', 'EarlyBird',
                'Clumsy', 'Forgetful', 'Careless', 'Careful', 'Creative',
                'Persevering', 'Optimistic'
            ];
            const labels = traits.map(t => window.workerManager.getTraitLabel(t));
            const hasDiligent = labels.some(l => l && l.label && l.label.includes('勤'));
            return { ok: true, labels, hasDiligent, labelCount: labels.filter(l => l && l.label).length };
        });
        expect(result.ok).toBe(true);
        expect(result.hasDiligent).toBe(true);
    });

    test('renderWorkers with different virtualState', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const container = document.createElement('div');
            container.id = 'workers-list';
            document.body.appendChild(container);
            
            window.workerManager.virtualState.query = 'test';
            window.workerManager.virtualState.filterBy = 'assigned';
            window.workerManager.virtualState.sortBy = 'level';
            window.workerManager.renderWorkers();
            
            const rendered = document.getElementById('workers-list');
            const htmlLength = rendered ? rendered.innerHTML.length : 0;
            
            container.remove();
            
            return {
                ok: true,
                htmlLength
            };
        });
        expect(result.ok).toBe(true);
                expect(result.htmlLength).toBeGreaterThan(10);
    });

    test('renderBuildingSelect branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const select = document.createElement('select');
            select.id = 'worker-building-select';
            document.body.appendChild(select);
            
            const validHtml = window.workerManager.renderBuildingSelect(0);
            const invalidHtml = window.workerManager.renderBuildingSelect(999);
            
            select.remove();
            
            return {
                ok: true,
                validHasOption: validHtml.includes('<option'),
                invalidHasInvalid: invalidHtml.includes('无效'),
            };
        });
        expect(result.ok).toBe(true);
        expect(result.validHasOption).toBe(true);
        expect(result.invalidHasInvalid).toBe(true);
    });

    test('showAssignmentModal and closeAssignmentModal branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const modal = document.createElement('div');
            modal.id = 'worker-assignment-modal';
            document.body.appendChild(modal);
            
            window.workerManager.showAssignmentModal(0);
            const modalContent = document.getElementById('worker-assignment-modal');
            const hasContent = modalContent && modalContent.innerHTML.length > 100;
            
            window.workerManager.closeAssignmentModal();
            const afterClose = document.getElementById('worker-assignment-modal');
            const isClosed = !afterClose || afterClose.style.display === 'none';
            
            modal.remove();
            
            return {
                ok: true,
                hasContent,
                isClosed,
            };
        });
        expect(result.ok).toBe(true);
    });

    test('getEfficiencyDetail branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            const worker = { name: 'Test', level: 5, efficiencyMultiplier: 1.3 };
            const detail = window.workerManager.getEfficiencyDetail(worker);
            return {
                ok: true,
                detail,
                hasBase: detail.includes('130%'),
                hasArrow: detail.includes('→'),
            };
        });
        expect(result.ok).toBe(true);
        expect(result.hasBase).toBe(true);
        expect(result.hasArrow).toBe(true);
    });

    test('renderToPanel and renderWorkersToList branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const panel1 = document.createElement('div');
            panel1.id = 'test-workers-panel';
            document.body.appendChild(panel1);
            
            window.workerManager.renderToPanel('test-workers-panel');
            const html1 = panel1.innerHTML;
            
            const panel2 = document.createElement('div');
            panel2.id = 'test-workers-list';
            document.body.appendChild(panel2);
            
            window.workerManager.renderWorkersToList();
            const hasWorkersList = document.getElementById('workers-list') !== null;
            
            panel1.remove();
            panel2.remove();
            
            return {
                ok: true,
                html1HasContent: html1.length > 10,
                hasWorkersList,
            };
        });
        expect(result.ok).toBe(true);
    });

    test('update/assign/getBuildings error and fallback branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }

            const originalRustGame = window.workerManager.rustGame;

            window.workerManager.rustGame = null;

            const noApiUpdate = window.workerManager.update();
            const noApiAssign = window.workerManager.assignWorker(0, 'Farm');
            const noApiBuildings = window.workerManager.getBuildings();

            window.workerManager.rustGame = {
                get_workers: () => { throw new Error('boom-workers'); },
                assign_worker: () => { throw new Error('boom-assign'); },
                get_buildings: () => { throw new Error('boom-buildings'); },
            };

            const throwUpdate = window.workerManager.update();
            const throwAssign = window.workerManager.assignWorker(1, 'Mine');
            const throwBuildings = window.workerManager.getBuildings();

            window.workerManager.rustGame = originalRustGame;

            return {
                ok: true,
                noApiUpdateLength: noApiUpdate.length,
                noApiAssign,
                noApiBuildingsLength: noApiBuildings.length,
                throwUpdateLength: throwUpdate.length,
                throwAssign,
                throwBuildingsLength: throwBuildings.length,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.noApiUpdateLength).toBe(0);
        expect(result.noApiAssign).toBe(false);
        expect(result.noApiBuildingsLength).toBe(0);
        expect(result.throwUpdateLength).toBe(0);
        expect(result.throwAssign).toBe(false);
        expect(result.throwBuildingsLength).toBe(0);
    });

    test('confirmAssignment and autoAssign branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workerManager) {
                return { ok: false, reason: 'missing manager' };
            }

            const originalAlert = window.alert;
            const originalConfirm = window.confirm;
            const originalRenderWorkers = window.workerManager.renderWorkers;
            const originalCloseModal = window.workerManager.closeAssignmentModal;
            const originalAssignWorker = window.workerManager.assignWorker;
            const originalUpdateResourceDisplay = window.updateResourceDisplay;
            const originalRustGame = window.workerManager.rustGame;

            const alerts = [];
            let renderCalls = 0;
            let closeCalls = 0;
            let updateCalls = 0;

            window.alert = (msg) => alerts.push(String(msg));
            window.confirm = () => true;
            window.workerManager.renderWorkers = () => { renderCalls += 1; };
            window.workerManager.closeAssignmentModal = () => { closeCalls += 1; };
            window.updateResourceDisplay = () => { updateCalls += 1; };

            const select = document.createElement('select');
            select.id = 'worker-building-select';
            document.body.appendChild(select);

            select.remove();
            window.workerManager.confirmAssignment(0);

            const selectSuccess = document.createElement('select');
            selectSuccess.id = 'worker-building-select';
            selectSuccess.value = 'Farm';
            const successOption = document.createElement('option');
            successOption.value = 'Farm';
            successOption.selected = true;
            selectSuccess.appendChild(successOption);
            document.body.appendChild(selectSuccess);
            window.workerManager.assignWorker = () => true;
            window.workerManager.confirmAssignment(0);

            window.workerManager.assignWorker = () => false;
            window.workerManager.confirmAssignment(0);

            selectSuccess.value = '';
            window.workerManager.confirmAssignment(0);
            selectSuccess.remove();

            window.workerManager.rustGame = null;
            window.workerManager.handleAutoAssign();

            window.workerManager.rustGame = {
                assign_worker_auto: () => 3,
            };
            window.workerManager.handleAutoAssign();

            window.workerManager.rustGame = {
                assign_worker_auto: () => { throw new Error('boom-auto'); },
            };
            window.workerManager.handleAutoAssign();

            window.alert = originalAlert;
            window.confirm = originalConfirm;
            window.workerManager.renderWorkers = originalRenderWorkers;
            window.workerManager.closeAssignmentModal = originalCloseModal;
            window.workerManager.assignWorker = originalAssignWorker;
            window.updateResourceDisplay = originalUpdateResourceDisplay;
            window.workerManager.rustGame = originalRustGame;

            return {
                ok: true,
                alerts,
                renderCalls,
                closeCalls,
                updateCalls,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.renderCalls).toBeGreaterThan(0);
        expect(result.closeCalls).toBeGreaterThan(0);
        expect(result.updateCalls).toBeGreaterThan(0);
        expect(result.alerts.length).toBeGreaterThan(2);
    });

    test('processed workers, hobbies and card rendering branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.WorkerManager({
                get_workers: () => [
                    {
                        name: 'Alpha',
                        level: 2,
                        efficiencyMultiplier: 1.3,
                        assignedBuilding: 'Farm',
                        skills: 'Mining',
                        preferences: 'Quiet',
                        background: 'Village',
                        hobbies: ['Gaming', 'UnknownHobby'],
                        primaryTrait: 'Diligent',
                        secondary_traits: ['Lazy', 'MysteryTrait'],
                        happiness: 80,
                        hunger: 10,
                        isHungry: false,
                        xp: 20,
                        xpToNextLevel: 40,
                    },
                    {
                        name: 'Beta',
                        level: 4,
                        efficiencyMultiplier: 0.8,
                        assignedBuilding: null,
                        skills: 'Cooking',
                        preferences: 'Loud',
                        background: 'Forest',
                        hobbies: [],
                        primary_trait: 'Optimistic',
                        secondaryTraits: [],
                        happiness: 40,
                        hunger: 90,
                        is_hungry: true,
                        xp: 10,
                        xpToNextLevel: 50,
                    },
                ],
            });

            manager.virtualState = { sortBy: 'name', filterBy: 'all', query: '', workers: [] };
            const allNames = manager.getProcessedWorkers(manager.update()).map((worker) => worker.name);
            manager.virtualState.filterBy = 'assigned';
            const assignedNames = manager.getProcessedWorkers(manager.update()).map((worker) => worker.name);
            manager.virtualState.filterBy = 'unassigned';
            const unassignedNames = manager.getProcessedWorkers(manager.update()).map((worker) => worker.name);
            manager.virtualState.filterBy = 'all';
            manager.virtualState.query = 'cook';
            const queryNames = manager.getProcessedWorkers(manager.update()).map((worker) => worker.name);
            manager.virtualState.query = '';
            manager.virtualState.sortBy = 'level';
            const levelSorted = manager.getProcessedWorkers(manager.update()).map((worker) => worker.name);
            manager.virtualState.sortBy = 'efficiency';
            const efficiencySorted = manager.getProcessedWorkers(manager.update()).map((worker) => worker.name);

            const grid = document.createElement('div');
            grid.id = 'workers-grid';
            document.body.appendChild(grid);
            manager.virtualState.workers = manager.update().map((worker, index) => ({ ...worker, __index: index }));
            manager.renderWorkerCards();
            const html = grid.innerHTML;
            grid.remove();

            return {
                allNames,
                assignedNames,
                unassignedNames,
                queryNames,
                levelSorted,
                efficiencySorted,
                unknownHobby: manager.getHobbyLabel('UnknownHobby'),
                skillMining: manager.getSkillLabel('Mining'),
                preferenceQuiet: manager.getPreferenceLabel('Quiet'),
                backgroundVillage: manager.getBackgroundLabel('Village'),
                html,
            };
        });

        expect(result.allNames).toEqual(['Alpha', 'Beta']);
        expect(result.assignedNames).toEqual(['Alpha']);
        expect(result.unassignedNames).toEqual(['Beta']);
        expect(result.queryNames).toEqual(['Beta']);
        expect(result.levelSorted).toEqual(['Beta', 'Alpha']);
        expect(result.efficiencySorted).toEqual(['Alpha', 'Beta']);
        expect(result.unknownHobby).toBe('UnknownHobby');
        expect(result.skillMining).toBe('采矿');
        expect(result.preferenceQuiet).toBe('安静');
        expect(result.backgroundVillage).toBe('乡村出身');
        expect(result.html).toContain('饥饿中');
        expect(result.html).toContain('状态稳定');
        expect(result.html).toContain('采矿');
        expect(result.html).toContain('安静');
        expect(result.html).toContain('乡村出身');
        expect(result.html).toContain('UnknownHobby');
        expect(result.html).toContain('MysteryTrait');
    });

    test('invalid worker modal and delayed close branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalConsoleError = console.error;
            const originalSetTimeout = window.setTimeout;
            const errors = [];
            console.error = (...args) => errors.push(args.map(String).join(' '));
            const scheduled = [];
            window.setTimeout = (fn) => {
                scheduled.push(fn);
                return scheduled.length;
            };

            window.workerManager.showAssignmentModal(999);

            const modal = document.createElement('div');
            modal.id = 'worker-assignment-modal';
            modal.className = 'show';
            document.body.appendChild(modal);
            window.workerManager.closeAssignmentModal();
            const hasShowAfterClose = modal.classList.contains('show');
            scheduled.forEach((fn) => {
                fn();
            });
            const modalStillExists = !!document.getElementById('worker-assignment-modal');

            console.error = originalConsoleError;
            window.setTimeout = originalSetTimeout;

            return {
                errors,
                hasShowAfterClose,
                modalStillExists,
            };
        });

        expect(result.errors.some((entry) => entry.includes('Worker not found'))).toBe(true);
        expect(result.hasShowAfterClose).toBe(false);
        expect(result.modalStillExists).toBe(false);
    });

    test('cancelled auto assign, name sort and missing method guard branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.WorkerManager({
                get_workers: () => [
                    { name: 'Zulu', assignedBuilding: null, level: 1, efficiencyMultiplier: 1 },
                    { name: 'Alpha', assignedBuilding: 'Farm', level: 2, efficiencyMultiplier: 1.5 },
                ],
            });

            manager.virtualState = { sortBy: 'name', filterBy: 'all', query: '', workers: [] };
            const allNames = manager.getProcessedWorkers(manager.update()).map((worker) => worker.name);

            const originalConfirm = window.confirm;
            const originalAlert = window.alert;
            const originalUpdate = window.updateResourceDisplay;
            const alerts = [];
            let updateCalls = 0;
            window.confirm = () => false;
            window.alert = (msg) => alerts.push(String(msg));
            window.updateResourceDisplay = () => { updateCalls += 1; };

            manager.rustGame = { assign_worker_auto: () => 5 };
            manager.handleAutoAssign();

            manager.rustGame = {};
            const noMethodUpdate = manager.update();
            const noMethodAssign = manager.assignWorker(0, 'Farm');
            const noMethodBuildings = manager.getBuildings();

            window.confirm = originalConfirm;
            window.alert = originalAlert;
            window.updateResourceDisplay = originalUpdate;

            return {
                allNames,
                alerts,
                updateCalls,
                noMethodUpdateLength: noMethodUpdate.length,
                noMethodAssign,
                noMethodBuildingsLength: noMethodBuildings.length,
            };
        });

        expect(result.allNames).toEqual(['Alpha', 'Zulu']);
        expect(result.alerts.length).toBe(0);
        expect(result.updateCalls).toBe(0);
        expect(result.noMethodUpdateLength).toBe(0);
        expect(result.noMethodAssign).toBe(false);
        expect(result.noMethodBuildingsLength).toBe(0);
    });

    test('status, placeholder and render helper branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.WorkerManager({
                get_workers: () => [],
            });

            const originalI18n = window.i18n;
            window.i18n = {
                t: (key) => ({
                    workersPlaceholder: '占位文案',
                    noWorkers: '没有工人',
                    stableStatus: '稳定',
                    hungryStatus: '饥饿',
                }[key] || key),
                getWorkerStatusLabel: (isHungry) => (isHungry ? 'I18N饿了' : 'I18N稳定'),
                getWorkerGenderLabel: (gender) => `G-${gender}`,
            };

            const workersList = document.createElement('div');
            workersList.id = 'workers-list';
            document.body.appendChild(workersList);

            manager.renderWorkers();
            const placeholderHtml = workersList.innerHTML;

            const statusHungry = manager.formatStatusLabel({ is_hungry: true });
            const statusStable = manager.formatStatusLabel({ isHungry: false });
            const genderOther = manager.getGenderLabel('Unknown');
            const breakdownFallback = manager.getEfficiencyBreakdown(null);
            const autoHintEmpty = manager.getAutoAssignmentHint({ assignedBuilding: 'Farm', autoAssignmentTarget: 'Mine' });
            const autoHintShown = manager.getAutoAssignmentHint({ assignedBuilding: null, autoAssignmentTarget: 'Mine' });
            const listEmpty = manager.renderWorkersToList();

            workersList.remove();
            window.i18n = originalI18n;

            return {
                placeholderLength: placeholderHtml.length,
                hungryStatusRendered: typeof statusHungry === 'string' && statusHungry.length > 0,
                stableStatusRendered: typeof statusStable === 'string' && statusStable.length > 0,
                genderOtherLength: String(genderOther || '').length,
                breakdownFallback,
                autoHintEmpty,
                autoHintShown,
                listEmptyLength: listEmpty.length,
            };
        });

        expect(result.placeholderLength).toBeGreaterThan(0);
        expect(result.hungryStatusRendered).toBe(true);
        expect(result.stableStatusRendered).toBe(true);
        expect(result.genderOtherLength).toBeGreaterThan(0);
        expect(result.breakdownFallback).toBe('基础 100%');
        expect(result.autoHintEmpty).toBe('');
        expect(result.autoHintShown).toContain('Mine');
        expect(result.listEmptyLength).toBeGreaterThan(0);
    });
});
