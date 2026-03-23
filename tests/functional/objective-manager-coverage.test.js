const { test, expect } = require('../fixtures/coverage');

test.describe('ObjectiveManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('fetch, render and reset branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            try {
                if (!window.ObjectiveManager) {
                    return { ok: false, reason: 'missing class' };
                }

                const anchor = document.getElementById('objective-panel-anchor') || document.createElement('div');
                anchor.id = 'objective-panel-anchor';
                if (!anchor.isConnected) {
                    document.body.appendChild(anchor);
                }

                const sidebar = document.getElementById('objective-sidebar') || document.createElement('div');
                sidebar.id = 'objective-sidebar';
                if (!sidebar.isConnected) {
                    document.body.appendChild(sidebar);
                }

                const noApiManager = new window.ObjectiveManager(null);
                const noApiFetch = noApiManager.fetchChain();

                const badJsonManager = new window.ObjectiveManager({
                    getCurrentObjectiveChainJson: () => '{bad-json',
                });
                const badJsonFetch = badJsonManager.fetchChain();

                const manager = new window.ObjectiveManager({
                    getCurrentObjectiveChainJson: () => JSON.stringify({
                        active: true,
                        stage_id: 'stage_workers',
                        current_objective_id: 'step-2',
                        steps: [
                            { id: 'step-1', title: '造农场', description: '先建造农场', reward: '工人 +1', completed: true, current: 1, required: 1, recommended_tab: 'buildings' },
                            { id: 'step-2', title: '分配工人', description: '给工人安排岗位', reward: '稳定度 +1', completed: false, current: 0, required: 2, recommended_tab: 'workers' },
                        ],
                    }),
                });

                manager.currentChain = null;
                manager.render();
                const hiddenDisplay = anchor.style.display;

                manager.currentChain = {
                    active: true,
                    stage_id: 'stage_workers',
                    current_objective_id: 'step-2',
                    steps: [
                        { id: 'step-1', title: '造农场', description: '先建造农场', reward: '工人 +1', completed: true, current: 1, required: 1, recommended_tab: 'buildings' },
                        { id: 'step-2', title: '分配工人', description: '给工人安排岗位', reward: '稳定度 +1', completed: false, current: 0, required: 2, recommended_tab: 'workers' },
                    ],
                };
                manager.render();

                const visibleHtml = anchor.innerHTML;
                const progressFallback = manager.renderStepProgress(null);
                const progressClamped = manager.renderStepProgress({ current: 9, required: 4 });

                manager.showCompletionToast(
                    { id: 'final', title: '最终目标', completed: true },
                    { steps: [{ id: 'final', title: '最终目标', completed: true }] }
                );
                const toastText = document.querySelector('.objective-notification')?.textContent || '';

                manager.currentChain = null;
                manager.processProgressChanges();

                const originalObjectiveManager = window.objectiveManager;
                let updateCalls = 0;
                window.objectiveManager = { update: () => { updateCalls += 1; } };
                window.updateObjectivePanel();
                window.objectiveManager = null;
                window.updateObjectivePanel();
                window.objectiveManager = originalObjectiveManager;

                return {
                    ok: true,
                    noApiFetch,
                    badJsonFetch,
                    hiddenDisplay,
                    visibleHtml,
                    progressFallback,
                    progressClamped,
                    toastText,
                    resetLastObjectiveId: manager.lastObjectiveId,
                    resetCompletedSize: manager.lastCompletedSteps.size,
                    updateCalls,
                };
            } catch (error) {
                return { ok: false, reason: String(error) };
            }
        });

        expect(result.ok).toBe(true);
        expect(result.noApiFetch).toBeNull();
        expect(result.badJsonFetch).toBeNull();
        expect(result.hiddenDisplay).toBe('none');
        expect(result.visibleHtml).toContain('PRIMARY DIRECTIVE');
        expect(result.progressFallback).toBe('0 / 0');
        expect(result.progressClamped).toBe('4 / 4');
        expect(result.toastText).toContain('当前阶段首批目标已完成');
        expect(result.resetLastObjectiveId).toBeNull();
        expect(result.resetCompletedSize).toBe(0);
        expect(result.updateCalls).toBe(1);
    });
});
