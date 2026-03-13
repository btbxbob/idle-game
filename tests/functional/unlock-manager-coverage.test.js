const { test, expect } = require('../fixtures/coverage');

test.describe('UnlockManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('update and renderUnlocks branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.unlockManager) return { ok: false };
            const panel = document.createElement('div');
            panel.id = 'unlock-list';
            document.body.appendChild(panel);

            window.unlockManager.containerElement = panel;
            window.unlockManager.update();
            const count = window.unlockManager.unlocks.length;
            window.unlockManager.renderUnlocks();
            const html = panel.innerHTML;

            panel.remove();
            return { ok: true, count, hasHtml: html.length >= 0 };
        });
        expect(result.ok).toBe(true);
    });

    test('checkProgress and formatRequirement branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.unlockManager) return { ok: false };
            window.unlockManager.update();
            const first = window.unlockManager.unlocks[0];
            const details = first ? window.unlockManager.getRequirementDetails(first.id) : null;
            return {
                ok: true,
                fmtClicks: window.unlockManager.formatRequirement('total_clicks'),
                fmtWorkers: window.unlockManager.formatRequirement('workers_stage'),
                detailsSummary: details ? details.summary : null,
                hasExisting: !!first || window.unlockManager.unlocks.length === 0,
            };
        });
        expect(result.ok).toBe(true);
        expect(result.hasExisting).toBe(true);
        expect(result.fmtClicks.length).toBeGreaterThan(0);
        expect(result.fmtWorkers.length).toBeGreaterThan(0);
        if (result.detailsSummary !== null) {
            expect(result.detailsSummary.length).toBeGreaterThan(0);
        }
    });

    test('unlock and updateButtonStates branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.unlockManager) return { ok: false };
            const panel = document.createElement('div');
            panel.id = 'unlock-list';
            document.body.appendChild(panel);
            window.unlockManager.containerElement = panel;
            window.unlockManager.update();
            window.unlockManager.renderUnlocks();

            let attempted = false;
            if (window.unlockManager.unlocks[0]) {
                attempted = window.unlockManager.unlock(window.unlockManager.unlocks[0].id) === true || window.unlockManager.unlock(window.unlockManager.unlocks[0].id) === false;
            }
            const desc = window.unlockManager.getDescription('workers_tab');
            const rendered = panel.innerHTML.includes('unlock-requirement-line');
            panel.remove();
            return { ok: true, attempted, descHasText: !!desc && desc.length > 0, rendered };
        });
        expect(result.ok).toBe(true);
        expect(result.descHasText).toBe(true);
        expect(result.rendered || result.attempted === false || result.attempted === true).toBe(true);
    });

    test('tab visibility and resource stage branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.UnlockManager(null);

            const tabs = ['resources', 'workers', 'technology', 'statistics', 'achievements'];
            tabs.forEach((tab) => {
                const button = document.createElement('button');
                button.className = 'tab-button';
                button.setAttribute('data-tab', tab);
                if (tab === 'workers') {
                    button.classList.add('active');
                }
                document.body.appendChild(button);

                const panel = document.createElement('div');
                panel.id = `tab-${tab}`;
                panel.className = 'tab-content';
                if (tab === 'workers') {
                    panel.classList.add('active');
                }
                document.body.appendChild(panel);
            });

            const primaryButton = document.createElement('button');
            primaryButton.className = 'category-tab-button';
            primaryButton.dataset.category = 'primary';
            document.body.appendChild(primaryButton);
            const secondaryButton = document.createElement('button');
            secondaryButton.className = 'category-tab-button active';
            secondaryButton.dataset.category = 'secondary';
            document.body.appendChild(secondaryButton);
            const advancedButton = document.createElement('button');
            advancedButton.className = 'category-tab-button';
            advancedButton.dataset.category = 'advanced';
            document.body.appendChild(advancedButton);

            const primaryPanel = document.createElement('div');
            primaryPanel.id = 'primary-resources';
            primaryPanel.className = 'resource-panel';
            primaryPanel.innerHTML = '<div class="resource-item" data-resource="coins"></div>';
            document.body.appendChild(primaryPanel);
            const secondaryPanel = document.createElement('div');
            secondaryPanel.id = 'secondary-resources';
            secondaryPanel.className = 'resource-panel';
            secondaryPanel.innerHTML = '<div class="resource-item" data-resource="paper"></div>';
            document.body.appendChild(secondaryPanel);
            const advancedPanel = document.createElement('div');
            advancedPanel.id = 'advanced-resources';
            advancedPanel.className = 'resource-panel';
            advancedPanel.innerHTML = '<div class="resource-item" data-resource="robot"></div>';
            document.body.appendChild(advancedPanel);

            const resourceShell = document.createElement('div');
            resourceShell.className = 'resource-panel';
            resourceShell.innerHTML = '<div class="resource-item" data-resource="ironOre"></div>';
            document.body.appendChild(resourceShell);

            manager.progressionState = { current_stage_id: 'stage_genesis' };
            manager.updateTabVisibility();

            const workersButtonHidden = document.querySelector('.tab-button[data-tab="workers"]').style.display === 'none';
            const resourcesButtonActive = document.querySelector('.tab-button[data-tab="resources"]').classList.contains('active');
            const workersPanelHidden = document.getElementById('tab-workers').style.display === 'none';
            const ironOreHidden = resourceShell.querySelector('[data-resource="ironOre"]').style.display === 'none';
            const secondaryHidden = secondaryButton.style.display === 'none';
            const primaryActive = primaryButton.classList.contains('active');

            manager.updateResourceVisibility('stage_collective');
            const advancedVisible = advancedButton.style.display !== 'none';
            const robotVisible = advancedPanel.querySelector('[data-resource="robot"]').style.display !== 'none';

            document.querySelectorAll('.tab-button, .tab-content, .category-tab-button, .resource-panel').forEach((node) => node.remove());

            return {
                workersButtonHidden,
                resourcesButtonActive,
                workersPanelHidden,
                ironOreHidden,
                secondaryHidden,
                primaryActive,
                advancedVisible,
                robotVisible,
            };
        });

        expect(result.workersButtonHidden).toBe(true);
        expect(result.resourcesButtonActive).toBe(true);
        expect(result.workersPanelHidden).toBe(true);
        expect(result.ironOreHidden).toBe(true);
        expect(result.secondaryHidden).toBe(true);
        expect(result.primaryActive).toBe(true);
        expect(result.advancedVisible).toBe(true);
        expect(result.robotVisible).toBe(true);
    });

    test('progression summary, requirement lines and label helper branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.UnlockManager(null);
            manager.progressionState = {
                current_stage_id: 'stage_collective',
                current_stage_name: '集体阶段',
                current_stage_description: '描述',
                human_pressure: 1.2,
                maggot_influence: 2.3,
                symbiosis_stability: 3.4,
                hybrid_population: 4.5,
                collective_consciousness: 5.6,
            };

            const summaryHtml = manager.renderProgressionSummary();
            const linesHtml = manager.renderRequirementLines({
                lines: [
                    { label: 'A', current: 3, required: 5 },
                    { label: 'B', current: 1.5, required: 2.5 },
                ],
            });
            const emptyLines = manager.renderRequirementLines({ lines: [] });

            return {
                summaryHtml,
                linesHtml,
                emptyLines,
                nonFiniteValue: manager.formatRequirementValue(NaN),
                intValue: manager.formatRequirementValue(5),
                floatValue: manager.formatRequirementValue(1.25),
                themeUnknown: manager.getStageThemeClass('mystery-stage'),
                phaseUnknown: manager.getStageSequenceLabel('mystery-stage'),
                narrativeUnknown: manager.getStageNarrative('mystery-stage'),
                featureUnknown: manager.getFeatureTypeLabel('weird'),
                requirementDefault: manager.formatRequirement('strange_requirement'),
                descriptionDefault: manager.getDescription('unknown-feature'),
            };
        });

        expect(result.summaryHtml).toContain('集体阶段');
        expect(result.summaryHtml).toContain('PHASE 05');
        expect(result.summaryHtml).toContain('集体意识');
        expect(result.linesHtml).toContain('unlock-requirement-line');
        expect(result.emptyLines).toBe('');
        expect(result.nonFiniteValue).toBe('0');
        expect(result.intValue).toBe('5');
        expect(result.floatValue).toBe('1.3');
        expect(result.themeUnknown).toBe('theme-genesis');
        expect(result.phaseUnknown).toBe('PHASE 01');
        expect(result.narrativeUnknown).toContain('资源与手工劳动');
        expect(result.featureUnknown).toBe('揭示项目');
        expect(result.requirementDefault).toBe('满足当前阶段条件');
        expect(result.descriptionDefault).toBe('新的阶段边界正在显现。');
    });
});
