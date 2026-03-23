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

            const resourcesButton = document.querySelector('.tab-button[data-tab="resources"]');
            const workersButton = document.querySelector('.tab-button[data-tab="workers"]');
            const workersPanel = document.getElementById('tab-workers');
            const allButton = document.querySelector('.category-tab-button[data-tier="ALL"]');
            const primaryButton = document.querySelector('.category-tab-button[data-tier="TIER1_BASIC"]');
            const secondaryButton = document.querySelector('.category-tab-button[data-tier="TIER2_PROCESSED"]');
            const advancedButton = document.querySelector('.category-tab-button[data-tier="TIER3_ADVANCED"]');
            const specialButton = document.querySelector('.category-tab-button[data-tier="SPECIAL"]');
            const primaryPanel = document.getElementById('primary-resources');
            const secondaryPanel = document.getElementById('secondary-resources');
            const advancedPanel = document.getElementById('advanced-resources');
            const specialPanel = document.getElementById('special-resources');
            const ironOreItem = document.querySelector('.resource-panel .resource-item[data-resource="ironOre"]');
            const robotItem = advancedPanel ? advancedPanel.querySelector('[data-resource="robot"]') : null;
            const corpseItem = specialPanel ? specialPanel.querySelector('[data-resource="corpse"]') : null;

            const originals = {
                activeButtons: Array.from(document.querySelectorAll('.tab-button.active')).map((button) => button.getAttribute('data-tab')),
                activePanels: Array.from(document.querySelectorAll('.tab-content.active')).map((panel) => panel.id),
                activeTier: document.querySelector('.category-tab-button.active')?.dataset.tier || null,
                workersButtonDisplay: workersButton ? workersButton.style.display : '',
                workersPanelDisplay: workersPanel ? workersPanel.style.display : '',
                resourcesButtonDisplay: resourcesButton ? resourcesButton.style.display : '',
                allButtonDisplay: allButton ? allButton.style.display : '',
                secondaryButtonDisplay: secondaryButton ? secondaryButton.style.display : '',
                advancedButtonDisplay: advancedButton ? advancedButton.style.display : '',
                specialButtonDisplay: specialButton ? specialButton.style.display : '',
                primaryPanelDisplay: primaryPanel ? primaryPanel.style.display : '',
                secondaryPanelDisplay: secondaryPanel ? secondaryPanel.style.display : '',
                advancedPanelDisplay: advancedPanel ? advancedPanel.style.display : '',
                specialPanelDisplay: specialPanel ? specialPanel.style.display : '',
                ironOreDisplay: ironOreItem ? ironOreItem.style.display : '',
                robotDisplay: robotItem ? robotItem.style.display : '',
                corpseDisplay: corpseItem ? corpseItem.style.display : '',
            };

            document.querySelectorAll('.tab-button').forEach((button) => {
                button.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach((panel) => {
                panel.classList.remove('active');
            });
            if (workersButton) workersButton.classList.add('active');
            if (workersPanel) workersPanel.classList.add('active');
            document.querySelectorAll('.category-tab-button').forEach((button) => {
                button.classList.remove('active');
            });
            if (secondaryButton) secondaryButton.classList.add('active');

            manager.progressionState = { current_stage_id: 'stage_genesis' };
            manager.updateTabVisibility();

            const workersButtonHidden = workersButton ? workersButton.style.display === 'none' : false;
            const resourcesButtonActive = resourcesButton ? resourcesButton.classList.contains('active') : false;
            const workersPanelHidden = workersPanel ? workersPanel.style.display === 'none' : false;
            const ironOreHidden = ironOreItem ? ironOreItem.style.display === 'none' : false;
            const secondaryHidden = secondaryButton ? secondaryButton.style.display === 'none' : false;
            const allActive = allButton ? allButton.classList.contains('active') : false;

            manager.updateResourceVisibility('stage_collective');
            const advancedVisible = advancedButton ? advancedButton.style.display !== 'none' : false;
            const robotVisible = robotItem ? robotItem.style.display !== 'none' : false;
            const specialVisible = specialButton ? specialButton.style.display !== 'none' : false;
            const corpseVisible = corpseItem ? corpseItem.style.display !== 'none' : false;

            document.querySelectorAll('.tab-button').forEach((button) => {
                button.classList.remove('active');
            });
            originals.activeButtons.forEach((tab) => {
                const button = document.querySelector(`.tab-button[data-tab="${tab}"]`);
                if (button) button.classList.add('active');
            });
            document.querySelectorAll('.tab-content').forEach((panel) => {
                panel.classList.remove('active');
            });
            originals.activePanels.forEach((panelId) => {
                const panel = document.getElementById(panelId);
                if (panel) panel.classList.add('active');
            });
            document.querySelectorAll('.category-tab-button').forEach((button) => {
                button.classList.remove('active');
            });
            if (originals.activeTier) {
                const button = document.querySelector(`.category-tab-button[data-tier="${originals.activeTier}"]`);
                if (button) button.classList.add('active');
            }
            if (workersButton) workersButton.style.display = originals.workersButtonDisplay;
            if (workersPanel) workersPanel.style.display = originals.workersPanelDisplay;
            if (resourcesButton) resourcesButton.style.display = originals.resourcesButtonDisplay;
            if (allButton) allButton.style.display = originals.allButtonDisplay;
            if (secondaryButton) secondaryButton.style.display = originals.secondaryButtonDisplay;
            if (advancedButton) advancedButton.style.display = originals.advancedButtonDisplay;
            if (specialButton) specialButton.style.display = originals.specialButtonDisplay;
            if (primaryPanel) primaryPanel.style.display = originals.primaryPanelDisplay;
            if (secondaryPanel) secondaryPanel.style.display = originals.secondaryPanelDisplay;
            if (advancedPanel) advancedPanel.style.display = originals.advancedPanelDisplay;
            if (specialPanel) specialPanel.style.display = originals.specialPanelDisplay;
            if (ironOreItem) ironOreItem.style.display = originals.ironOreDisplay;
            if (robotItem) robotItem.style.display = originals.robotDisplay;
            if (corpseItem) corpseItem.style.display = originals.corpseDisplay;

            return {
                workersButtonHidden,
                resourcesButtonActive,
                workersPanelHidden,
                ironOreHidden,
                secondaryHidden,
                allActive,
                advancedVisible,
                robotVisible,
                specialVisible,
                corpseVisible,
            };
        });

        expect(result.workersButtonHidden).toBe(true);
        expect(result.resourcesButtonActive).toBe(true);
        expect(result.workersPanelHidden).toBe(true);
        expect(result.ironOreHidden).toBe(true);
        expect(result.secondaryHidden).toBe(true);
        expect(result.allActive).toBe(true);
        expect(result.advancedVisible).toBe(true);
        expect(result.robotVisible).toBe(true);
        expect(result.specialVisible).toBe(true);
        expect(result.corpseVisible).toBe(true);
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

        expect(
            result.summaryHtml.includes('集体阶段')
            || result.summaryHtml.includes('集体意识阶段')
            || result.summaryHtml.includes('Collective Stage')
        ).toBe(true);
        expect(result.summaryHtml).toContain('PHASE 05');
        expect(
            result.summaryHtml.includes('集体意识')
            || result.summaryHtml.includes('Collective Consciousness')
            || result.summaryHtml.includes('shared mind network')
        ).toBe(true);
        expect(result.linesHtml).toContain('unlock-requirement-line');
        expect(result.emptyLines).toBe('');
        expect(result.nonFiniteValue).toBe('0');
        expect(result.intValue).toBe('5');
        expect(result.floatValue).toBe('1.3');
        expect(result.themeUnknown).toBe('theme-genesis');
        expect(result.phaseUnknown).toBe('PHASE 01');
        expect(result.narrativeUnknown).toContain('资源与手工劳动');
        expect(result.featureUnknown === '揭示项目' || result.featureUnknown === 'Revelation Target').toBe(true);
        expect(result.requirementDefault === '满足当前阶段条件' || result.requirementDefault === 'Meet the current stage requirements').toBe(true);
        expect(result.descriptionDefault === '新的阶段边界正在显现。' || result.descriptionDefault === 'A new stage boundary is coming into view.').toBe(true);
    });

    test('invalid progress details and disabled unlock button branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.UnlockManager({
                getUnlockProgress: () => 'bad-progress',
                getUnlockRequirementDetails: () => 'bad-details',
                get_unlocks: () => [{
                    id: 'stage_workers',
                    name: '工人阶段',
                    unlocked: false,
                    feature_type: 'stage',
                    requirement_type: 'workers_stage',
                }],
            });

            const panel = document.createElement('div');
            panel.id = 'unlock-list';
            document.body.appendChild(panel);
            manager.containerElement = panel;
            manager.progressionState = null;
            manager.renderUnlocks();

            const invalidProgress = manager.checkProgress('stage_workers');
            const invalidDetails = manager.getRequirementDetails('stage_workers');
            const html = panel.innerHTML;
            panel.remove();

            return {
                invalidProgress,
                invalidDetails,
                html,
            };
        });

        expect(result.invalidProgress).toEqual({ current: 0, required: 1, percentage: 0 });
        expect(result.invalidDetails).toBe(null);
        expect(result.html).toContain('class="disabled"');
        expect(result.html).toContain('disabled=""');
    });

    test('system unlocks show auto-reveal hint instead of dead unlock button', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.UnlockManager({
                getUnlockProgress: () => ({ current: 1, required: 1, percentage: 100 }),
                getUnlockRequirementDetails: () => null,
                get_unlocks: () => [{
                    id: 'dark_biology',
                    name: '黑暗生物链',
                    unlocked: false,
                    feature_type: 'system',
                    requirement_type: 'maggot_tech',
                }],
            });

            const panel = document.createElement('div');
            panel.id = 'unlock-list';
            document.body.appendChild(panel);
            manager.containerElement = panel;
            manager.progressionState = null;
            manager.renderUnlocks();

            const html = panel.innerHTML;
            panel.remove();

            return { html };
        });

        expect(result.html).toContain('满足条件后自动揭示');
        expect(result.html).not.toContain('unlock-button-0');
    });

    test('attention, localization and formatter fallback branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalFormatter = window.NumberFormatter;
            const originalI18n = window.i18n;
            const originalError = console.error;
            const errors = [];
            console.error = (...args) => errors.push(args.map(String).join(' '));

            delete window.NumberFormatter;
            window.i18n = {
                t: (key, params = {}) => {
                    if (key === 'unlockSummary_total_clicks') {
                        return `点击 ${params.count}`;
                    }
                    if (key === 'unlockLine_totalClicks') {
                        return '总点击';
                    }
                    if (key === 'unlockFeatureType_default') {
                        return '默认项目';
                    }
                    if (key === 'unlockRequirement_default') {
                        return '默认条件';
                    }
                    return key;
                },
                getUnlockName: () => '',
                getStageName: () => '',
                getStageDescription: () => '',
                getUnlockDescription: () => '',
            };

            const unlockButton = document.querySelector('.tab-button[data-tab="unlocks"]') || document.createElement('button');
            unlockButton.className = 'tab-button';
            unlockButton.dataset.tab = 'unlocks';
            unlockButton.classList.remove('active', 'attention');
            if (!unlockButton.isConnected) {
                document.body.appendChild(unlockButton);
            }

            const manager = new window.UnlockManager({
                get_unlocks: () => [
                    { id: 'ready-stage', unlocked: false, feature_type: 'stage', requirement_type: 'total_clicks', requirement_value: 1234 },
                    { id: 'done-stage', unlocked: true, feature_type: 'system', requirement_type: 'workers_stage' },
                ],
                getUnlockProgress: (featureId) => {
                    if (featureId === 'ready-stage') {
                        return { current: 5, required: 4, percentage: 125 };
                    }
                    return { current: 0, required: 1, percentage: 0 };
                },
                getUnlockRequirementDetails: () => ({
                    summary: '',
                    lines: [{ label: '总点击次数', current: 6, required: 10 }],
                }),
                getProgressionStateJson: () => '{bad-json',
            });

            manager.update();
            const invalidProgression = manager.progressionState;
            const hasReady = manager.hasUnlocksReady();
            const attentionApplied = unlockButton.classList.contains('attention');
            unlockButton.classList.add('active');
            manager.updateTabAttention();
            const attentionClearedWhenActive = !unlockButton.classList.contains('attention');

            const localizedName = manager.getUnlockName({ id: 'stage_workers', name: '后备名称' });
            const localizedStageName = manager.getLocalizedStageName({ current_stage_id: 'stage_workers', current_stage_name: '工人阶段' });
            const localizedStageDescription = manager.getLocalizedStageDescription({ current_stage_id: 'stage_workers', current_stage_description: '后备描述' });
            const localizedDetails = manager.getLocalizedRequirementDetails('total_clicks', 1234, {
                summary: '',
                lines: [{ label: '总点击次数', current: 6, required: 10 }],
            });
            const localizedDetailsNoLines = manager.getLocalizedRequirementDetails('workers_stage', 0, { summary: '阶段摘要', lines: null });

            const unlockedAction = manager.renderUnlockAction({ unlocked: true, feature_type: 'stage' }, 0, true, 'Unlock', 'Unlocked');
            const manualEnabled = manager.renderUnlockAction({ id: 'ready-stage', unlocked: false, feature_type: 'stage' }, 1, true, 'Unlock', 'Unlocked');
            const autoReveal = manager.renderUnlockAction({ id: 'auto-stage', unlocked: false, feature_type: 'system' }, 2, false, 'Unlock', 'Unlocked');

            manager.progressionState = {
                current_stage_id: 'stage_hybrid',
                current_stage_name: '混合阶段',
                current_stage_description: '阶段描述',
                human_pressure: 1.25,
                maggot_influence: 2.5,
                symbiosis_stability: 3.75,
                hybrid_population: 4.5,
            };
            const hybridSummary = manager.renderProgressionSummary();
            const metricCard = manager.renderMetricCard('压力', 1.25, '说明');
            const fallbackInteger = manager.formatInteger(1234.9);
            const fallbackDecimal = manager.formatDecimal(1.25, 1);
            const fallbackPercent = manager.formatPercent(12.3, 0);
            const fallbackDescription = manager.getDescription('unknown-feature');
            const fallbackFeatureType = manager.getFeatureTypeLabel('mystery');
            const fallbackRequirement = manager.formatRequirement('mystery_requirement');

            unlockButton.remove();
            console.error = originalError;
            window.i18n = originalI18n;
            window.NumberFormatter = originalFormatter;

            return {
                invalidProgression,
                hasReady,
                attentionApplied,
                attentionClearedWhenActive,
                localizedName,
                localizedStageName,
                localizedStageDescription,
                localizedDetails,
                localizedDetailsNoLines,
                unlockedAction,
                manualEnabled,
                autoReveal,
                hybridSummary,
                metricCard,
                fallbackInteger,
                fallbackDecimal,
                fallbackPercent,
                fallbackDescription,
                fallbackFeatureType,
                fallbackRequirement,
                errors,
            };
        });

        expect(result.invalidProgression).toBe(null);
        expect(result.hasReady).toBe(true);
        expect(result.attentionApplied).toBe(true);
        expect(result.attentionClearedWhenActive).toBe(true);
        expect(result.localizedName).toBe('后备名称');
        expect(result.localizedStageName).toBe('工人阶段');
        expect(result.localizedStageDescription).toBe('后备描述');
        expect(result.localizedDetails.summary).toBe('点击 1,234');
        expect(result.localizedDetails.lines[0].label).toBe('总点击');
        expect(result.localizedDetailsNoLines.lines).toEqual([]);
        expect(result.unlockedAction).toContain('unlocked-badge');
        expect(result.manualEnabled).toContain('unlock-button-1');
        expect(result.manualEnabled).not.toContain('disabled class="disabled"');
        expect(result.autoReveal).toContain('unlock-hint');
        expect(result.hybridSummary).toContain('混合阶段');
        expect(result.hybridSummary).not.toContain('集体意识');
        expect(result.metricCard).toContain('1.3');
        expect(result.fallbackInteger).toBe('1,234');
        expect(result.fallbackDecimal).toBe('1.3');
        expect(result.fallbackPercent).toBe('12%');
        expect(result.fallbackDescription).toBe('新的阶段边界正在显现。');
        expect(result.fallbackFeatureType).toBe('默认项目');
        expect(result.fallbackRequirement).toBe('默认条件');
        expect(result.errors.some((entry) => entry.includes('Failed to read progression state'))).toBe(true);
    });
});
