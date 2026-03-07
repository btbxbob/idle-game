const { test, expect } = require('../fixtures/coverage');

test.describe('LifecycleManager Coverage Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
    });

    test('getMaggotFactoryCount branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.lifecycleManager) return { ok: false, reason: 'missing manager' };

            const originalGame = window.lifecycleManager.rustGame;

            // Test without rustGame
            window.lifecycleManager.rustGame = null;
            const noGame = window.lifecycleManager.getMaggotFactoryCount();

            // Test without get_buildings function
            window.lifecycleManager.rustGame = {};
            const noFunc = window.lifecycleManager.getMaggotFactoryCount();

            // Test with get_buildings returning non-array
            window.lifecycleManager.rustGame = { get_buildings: () => 'not array' };
            const notArray = window.lifecycleManager.getMaggotFactoryCount();

            // Test with get_buildings returning empty array
            window.lifecycleManager.rustGame = { get_buildings: () => [] };
            const emptyArray = window.lifecycleManager.getMaggotFactoryCount();

            // Test with get_buildings returning buildings without match
            window.lifecycleManager.rustGame = {
                get_buildings: () => [
                    { name: 'Other Building', count: 5 },
                    { name: 'Farm', count: 3 },
                ]
            };
            const noMatch = window.lifecycleManager.getMaggotFactoryCount();

            // Test with get_buildings returning building with match
            window.lifecycleManager.rustGame = {
                get_buildings: () => [
                    { name: 'Other Building', count: 5 },
                    { name: '蛆虫工厂', count: 7 },
                ]
            };
            const withMatch = window.lifecycleManager.getMaggotFactoryCount();

            // Test with exception
            window.lifecycleManager.rustGame = {
                get_buildings: () => { throw new Error('boom'); }
            };
            const withError = window.lifecycleManager.getMaggotFactoryCount();

            window.lifecycleManager.rustGame = originalGame;

            return {
                ok: true,
                noGame,
                noFunc,
                notArray,
                emptyArray,
                noMatch,
                withMatch,
                withError,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.noGame).toBe(0);
        expect(result.noFunc).toBe(0);
        expect(result.notArray).toBe(0);
        expect(result.emptyArray).toBe(0);
        expect(result.noMatch).toBe(0);
        expect(result.withMatch).toBe(7);
        expect(result.withError).toBe(0);
    });

    test('renderToPanel branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.lifecycleManager) return { ok: false, reason: 'missing manager' };

            // Test without panel element
            const missingPanel = document.createElement('div');
            missingPanel.id = 'missing-panel-xyz';
            document.body.appendChild(missingPanel);

            window.lifecycleManager.renderToPanel('definitely-missing-panel-id');
            const missingPanelResult = missingPanel.innerHTML;

            missingPanel.remove();

            // Test with panel but no update (null return)
            const panel = document.createElement('div');
            panel.id = 'lifecycle-panel';
            document.body.appendChild(panel);

            const originalGame = window.lifecycleManager.rustGame;
            window.lifecycleManager.rustGame = null;

            window.lifecycleManager.renderToPanel('lifecycle-panel');
            const nullResult = panel.innerHTML;

            window.lifecycleManager.rustGame = originalGame;
            panel.remove();

            return {
                ok: true,
                missingPanelResult,
                nullResult,
            };
        });

        expect(result.ok).toBe(true);
    });

    test('renderResourceWidget branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.lifecycleManager) return { ok: false, reason: 'missing manager' };

            const originalGame = window.lifecycleManager.rustGame;

            // Test without panel
            window.lifecycleManager.renderResourceWidget('nonexistent-widget');
            const noPanel = true; // Just ensures no exception

            // Test with null update result
            const panel2 = document.createElement('div');
            panel2.id = 'lifecycle-resource-widget';
            document.body.appendChild(panel2);

            window.lifecycleManager.rustGame = null;
            window.lifecycleManager.renderResourceWidget('lifecycle-resource-widget');
            const nullResult = panel2.innerHTML;

            window.lifecycleManager.rustGame = originalGame;
            panel2.remove();

            return {
                ok: true,
                noPanel,
                nullResult,
            };
        });

        expect(result.ok).toBe(true);
    });

    test('processMaggotNow button interaction', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.lifecycleManager) return { ok: false, reason: 'missing manager' };

            const originalGame = window.lifecycleManager.rustGame;
            let gameLoopCalled = 0;

            window.lifecycleManager.rustGame = {
                getProgressionStateJson: () => JSON.stringify({ current_stage_id: 'stage_maggot' }),
                get_lifecycle_status_json: () => JSON.stringify({
                    workers: 5,
                    hungry_workers: 0,
                    queue_workers: 2,
                    housing_capacity: 10,
                    food: 100,
                    corpses: 0,
                    maggots: 30,
                    dark_cycle_revealed: true,
                    coexistence_revealed: false,
                }),
                get_buildings: () => [{ name: '蛆虫工厂', count: 3 }],
                game_loop: () => { gameLoopCalled++; },
            };

            const widget = document.createElement('div');
            widget.id = 'lifecycle-resource-widget';
            document.body.appendChild(widget);

            window.lifecycleManager.renderResourceWidget('lifecycle-resource-widget');

            const btn = document.getElementById('process-maggot-now');
            const btnExists = !!btn;
            const btnDisabled = btn?.disabled;

            // Click button if exists
            if (btn) {
                btn.click();
            }

            widget.remove();
            window.lifecycleManager.rustGame = originalGame;

            return {
                ok: true,
                btnExists,
                btnDisabled,
                gameLoopCalled: btn ? gameLoopCalled : -1,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.btnExists).toBe(true);
        expect(result.btnDisabled).toBe(false);
        expect(result.gameLoopCalled).toBe(1);
    });

    test('update function error handling', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.lifecycleManager) return { ok: false, reason: 'missing manager' };

            const originalGame = window.lifecycleManager.rustGame;

            // Test without rustGame
            window.lifecycleManager.rustGame = null;
            const noGame = window.lifecycleManager.update();

            // Test without get_lifecycle_status_json
            window.lifecycleManager.rustGame = {};
            const noFunc = window.lifecycleManager.update();

            // Test with JSON parse error
            window.lifecycleManager.rustGame = {
                get_lifecycle_status_json: () => 'invalid json{'
            };
            const parseError = window.lifecycleManager.update();

            // Test with valid JSON
            window.lifecycleManager.rustGame = {
                get_lifecycle_status_json: () => JSON.stringify({ workers: 5 })
            };
            const valid = window.lifecycleManager.update();

            window.lifecycleManager.rustGame = originalGame;

            return {
                ok: true,
                noGame,
                noFunc,
                parseError,
                valid,
                validWorkers: valid?.workers,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.noGame).toBe(null);
        expect(result.noFunc).toBe(null);
        expect(result.parseError).toBe(null);
        expect(result.validWorkers).toBe(5);
    });

    test('global updateLifecyclePanel function branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalManager = window.lifecycleManager;

            // Without manager
            window.lifecycleManager = null;
            let error = null;
            try {
                window.updateLifecyclePanel();
            } catch (e) {
                error = e.message;
            }
            const noManagerError = error;

            // Create test elements
            const lifecycleTab = document.createElement('div');
            lifecycleTab.id = 'tab-lifecycle';
            document.body.appendChild(lifecycleTab);

            const resourcesTab = document.createElement('div');
            resourcesTab.id = 'tab-resources';
            document.body.appendChild(resourcesTab);

            const lifecyclePanel = document.createElement('div');
            lifecyclePanel.id = 'lifecycle-panel';
            document.body.appendChild(lifecyclePanel);

            const resourceWidget = document.createElement('div');
            resourceWidget.id = 'lifecycle-resource-widget';
            document.body.appendChild(resourceWidget);

            // Test with manager but no active tabs
            window.lifecycleManager = originalManager;
            window.updateLifecyclePanel();
            const noActiveTabs = lifecyclePanel.innerHTML.length > 0 || resourceWidget.innerHTML.length > 0;

            // Test with active lifecycle tab
            lifecycleTab.classList.add('active');
            window.updateLifecyclePanel();
            const lifecycleActive = lifecyclePanel.innerHTML.length > 0;

            // Test with active resources tab
            lifecycleTab.classList.remove('active');
            resourcesTab.classList.add('active');
            window.updateLifecyclePanel();
            const resourcesActive = resourceWidget.innerHTML.length > 0;

            lifecycleTab.remove();
            resourcesTab.remove();
            lifecyclePanel.remove();
            resourceWidget.remove();

            return {
                ok: true,
                noManagerError,
                noActiveTabs,
                lifecycleActive,
                resourcesActive,
            };
        });

        expect(result.ok).toBe(true);
    });
});