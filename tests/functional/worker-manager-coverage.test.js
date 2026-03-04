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
});
