class UnlockManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.unlocks = [];
        this.containerElement = null;
        this.progressionState = null;
    }

    update() {
        if (!this.rustGame || typeof this.rustGame.get_unlocks !== 'function') {
            this.unlocks = [];
            this.progressionState = null;
            this.updateTabAttention();
            return;
        }

        try {
            const unlocksData = this.rustGame.get_unlocks();
            this.unlocks = Array.isArray(unlocksData) ? unlocksData : [];
        } catch (error) {
            console.error('UnlockManager: Error fetching unlocks:', error);
            this.unlocks = [];
        }

        this.progressionState = this.getProgressionState();
        this.updateTabVisibility();
        this.updateTabAttention();
    }

    hasUnlocksReady() {
        return this.unlocks.some((unlock) => {
            if (!unlock || unlock.unlocked) {
                return false;
            }

            const progress = this.checkProgress(unlock.id);
            return (progress.current || 0) >= (progress.required || 1);
        });
    }

    updateTabAttention() {
        const unlockTabButton = document.querySelector('.tab-button[data-tab="unlocks"]');
        if (!unlockTabButton) {
            return;
        }

        const isActive = unlockTabButton.classList.contains('active');
        unlockTabButton.classList.toggle('attention', !isActive && this.hasUnlocksReady());
    }

    getProgressionState() {
        if (!this.rustGame || typeof this.rustGame.getProgressionStateJson !== 'function') {
            return null;
        }
        try {
            return JSON.parse(this.rustGame.getProgressionStateJson());
        } catch (error) {
            console.error('UnlockManager: Failed to read progression state:', error);
            return null;
        }
    }

    updateTabVisibility() {
        const stageId = this.progressionState ? this.progressionState.current_stage_id : 'stage_genesis';
        const visibleTabs = new Set(['resources', 'buildings', 'unlocks', 'settings']);

        if (stageId !== 'stage_genesis') {
            ['workers', 'technology', 'work', 'housing', 'lifecycle', 'statistics', 'achievements'].forEach((tab) => {
                visibleTabs.add(tab);
            });
        }

        document.querySelectorAll('.tab-button').forEach((button) => {
            const tabName = button.getAttribute('data-tab');
            button.style.display = visibleTabs.has(tabName) ? '' : 'none';
        });

        document.querySelectorAll('.tab-content').forEach((panel) => {
            const tabName = panel.id.replace('tab-', '');
            if (visibleTabs.has(tabName)) {
                panel.style.display = '';
            } else {
                panel.style.display = 'none';
                panel.classList.remove('active');
            }
        });

        this.updateResourceVisibility(stageId);

        const activeButton = document.querySelector('.tab-button.active');
        if (activeButton && activeButton.style.display === 'none') {
            const resourcesButton = document.querySelector('.tab-button[data-tab="resources"]');
            const resourcesPanel = document.getElementById('tab-resources');
            document.querySelectorAll('.tab-button').forEach((button) => {
                button.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach((panel) => {
                panel.classList.remove('active');
            });
            if (resourcesButton) {
                resourcesButton.classList.add('active');
            }
            if (resourcesPanel) {
                resourcesPanel.classList.add('active');
            }
        }
    }

    updateResourceVisibility(stageId) {
        const resourceStages = {
            coins: 'stage_genesis',
            wood: 'stage_genesis',
            stone: 'stage_genesis',
            ironOre: 'stage_workers',
            copperOre: 'stage_workers',
            aluminumOre: 'stage_workers',
            coal: 'stage_workers',
            oil: 'stage_workers',
            crystal: 'stage_workers',
            food: 'stage_workers',
            ironIngot: 'stage_workers',
            copperIngot: 'stage_workers',
            aluminumIngot: 'stage_workers',
            steelPlate: 'stage_workers',
            copperPlate: 'stage_workers',
            aluminumPlate: 'stage_workers',
            glass: 'stage_workers',
            plastic: 'stage_workers',
            chemicals: 'stage_workers',
            fuel: 'stage_workers',
            paper: 'stage_hybrid',
            ink: 'stage_hybrid',
            cloth: 'stage_hybrid',
            leather: 'stage_hybrid',
            ceramic: 'stage_hybrid',
            cement: 'stage_hybrid',
            brick: 'stage_hybrid',
            rebar: 'stage_hybrid',
            wire: 'stage_workers',
            pipe: 'stage_hybrid',
            valve: 'stage_hybrid',
            gear: 'stage_hybrid',
            bearing: 'stage_hybrid',
            spring: 'stage_hybrid',
            screw: 'stage_hybrid',
            nut: 'stage_hybrid',
            washer: 'stage_hybrid',
            pump: 'stage_hybrid',
            motor: 'stage_hybrid',
            sensor: 'stage_hybrid',
            circuitBoard: 'stage_workers',
            capacitor: 'stage_hybrid',
            resistor: 'stage_hybrid',
            diode: 'stage_hybrid',
            transistor: 'stage_hybrid',
            transformer: 'stage_hybrid',
            generator: 'stage_hybrid',
            compressor: 'stage_hybrid',
            battery: 'stage_workers',
            microchip: 'stage_collective',
            engine: 'stage_collective',
            robot: 'stage_collective',
            satellite: 'stage_collective',
            spaceship: 'stage_collective',
            quantumComputer: 'stage_collective',
            antimatter: 'stage_collective',
            darkMatter: 'stage_collective',
            timeCrystal: 'stage_collective',
            nanobot: 'stage_collective',
            corpse: 'stage_maggot',
            maggot: 'stage_maggot'
        };
        const stageOrder = ['stage_genesis', 'stage_workers', 'stage_maggot', 'stage_hybrid', 'stage_collective'];
        const currentIndex = stageOrder.indexOf(stageId);

        document.querySelectorAll('.resource-panel .resource-item').forEach((item) => {
            const resource = item.getAttribute('data-resource');
            if (!resource) {
                return;
            }
            const requiredStage = resourceStages[resource] || 'stage_collective';
            const requiredIndex = stageOrder.indexOf(requiredStage);
            item.style.display = requiredIndex <= currentIndex ? '' : 'none';
        });

        const categories = [
            { tier: 'TIER1_BASIC', button: document.querySelector('.category-tab-button[data-tier="TIER1_BASIC"]'), panel: document.getElementById('primary-resources') },
            { tier: 'TIER2_PROCESSED', button: document.querySelector('.category-tab-button[data-tier="TIER2_PROCESSED"]'), panel: document.getElementById('secondary-resources') },
            { tier: 'TIER3_ADVANCED', button: document.querySelector('.category-tab-button[data-tier="TIER3_ADVANCED"]'), panel: document.getElementById('advanced-resources') },
            { tier: 'SPECIAL', button: document.querySelector('.category-tab-button[data-tier="SPECIAL"]'), panel: document.getElementById('special-resources') }
        ];
        const allButton = document.querySelector('.category-tab-button[data-tier="ALL"]');

        categories.forEach(({ button, panel }) => {
            if (!button || !panel) {
                return;
            }
            const hasVisibleItems = Array.from(panel.querySelectorAll('.resource-item')).some((item) => item.style.display !== 'none');
            button.style.display = hasVisibleItems ? '' : 'none';
            if (!hasVisibleItems) {
                panel.style.display = 'none';
                button.classList.remove('active');
            }
        });

        if (allButton) {
            allButton.style.display = categories.some(({ button }) => button && button.style.display !== 'none') ? '' : 'none';
        }

        const activeCategoryButton = document.querySelector('.category-tab-button.active');
        if (!activeCategoryButton || activeCategoryButton.style.display === 'none') {
            const fallbackButton = allButton || document.querySelector('.category-tab-button[data-tier="TIER1_BASIC"]');
            const primaryPanel = document.getElementById('primary-resources');
            document.querySelectorAll('.category-tab-button').forEach((button) => {
                button.classList.remove('active');
            });
            document.querySelectorAll('.resource-panel').forEach((panel) => {
                if (panel.id !== 'resources-panel') {
                    panel.style.display = 'none';
                }
            });
            if (fallbackButton) {
                fallbackButton.classList.add('active');
            }
            if (fallbackButton === allButton) {
                categories.forEach(({ panel }) => {
                    if (panel && Array.from(panel.querySelectorAll('.resource-item')).some((item) => item.style.display !== 'none')) {
                        panel.style.display = '';
                    }
                });
            } else if (primaryPanel) {
                primaryPanel.style.display = '';
            }
        }
    }

    unlock(featureId) {
        if (!this.rustGame || typeof this.rustGame.unlock_feature !== 'function') {
            return false;
        }

        try {
            const success = this.rustGame.unlock_feature(featureId);
            if (success) {
                this.update();
                this.renderUnlocks();
                if (window.rustGame && typeof window.rustGame.update_ui === 'function') {
                    window.rustGame.update_ui();
                }
            }
            return success;
        } catch (error) {
            console.error('UnlockManager: Error unlocking feature:', error);
            return false;
        }
    }

    checkProgress(featureId) {
        if (!this.rustGame || typeof this.rustGame.getUnlockProgress !== 'function') {
            return { current: 0, required: 1, percentage: 0 };
        }

        try {
            const progress = this.rustGame.getUnlockProgress(featureId);
            return progress && typeof progress === 'object'
                ? progress
                : { current: 0, required: 1, percentage: 0 };
        } catch (error) {
            console.error('UnlockManager: Failed to get unlock progress:', error);
            return { current: 0, required: 1, percentage: 0 };
        }
    }

    getRequirementDetails(featureId) {
        if (!this.rustGame || typeof this.rustGame.getUnlockRequirementDetails !== 'function') {
            return null;
        }

        try {
            const details = this.rustGame.getUnlockRequirementDetails(featureId);
            return details && typeof details === 'object' ? details : null;
        } catch (error) {
            console.error('UnlockManager: Failed to get unlock requirement details:', error);
            return null;
        }
    }

    t(key, fallback = key, params = {}) {
        if (!window.i18n || typeof window.i18n.t !== 'function') {
            return fallback;
        }

        const translated = window.i18n.t(key, params);
        return translated === key ? fallback : translated;
    }

    getUnlockName(unlock) {
        const fallback = unlock?.name || unlock?.id || '';
        if (window.i18n && typeof window.i18n.getUnlockName === 'function') {
            return window.i18n.getUnlockName(unlock?.id, fallback);
        }
        return fallback;
    }

    getLocalizedStageName(stage) {
        const fallback = stage?.current_stage_name || stage?.current_stage_id || '';
        if (window.i18n && typeof window.i18n.getStageName === 'function') {
            return window.i18n.getStageName(stage?.current_stage_id, fallback);
        }
        return fallback;
    }

    getLocalizedStageDescription(stage) {
        const fallback = stage?.current_stage_description || '';
        if (window.i18n && typeof window.i18n.getStageDescription === 'function') {
            return window.i18n.getStageDescription(stage?.current_stage_id, fallback);
        }
        return fallback;
    }

    getLocalizedRequirementDetails(requirementType, requirementValue, requirementDetails) {
        if (!requirementDetails) {
            return null;
        }

        const lineKeyByLabel = {
            '已购买建筑': 'unlockLine_buildingsPurchased',
            '饥饿工人': 'unlockLine_hungryWorkers',
            '尸体': 'unlockLine_corpses',
            '蛆虫异动': 'unlockLine_maggotActivity',
            '蛆虫育种': 'unlockLine_maggotBreeding',
            '黑暗科技准备度': 'unlockLine_darkTechReadiness',
            '蛆虫影响': 'unlockLine_maggotInfluence',
            '共生稳定度': 'unlockLine_symbiosisStability',
            '集体意识': 'unlockLine_collectiveConsciousness',
            '混合人口': 'unlockLine_hybridPopulation',
            '关键科技': 'unlockLine_keyTechnology',
            '总点击次数': 'unlockLine_totalClicks',
        };
        const summaryKey = `unlockSummary_${requirementType}`;
        const summaryFallback = requirementDetails.summary || this.formatRequirement(requirementType);
        const summaryParams = requirementType === 'total_clicks'
            ? { count: this.formatInteger(requirementValue || 0) }
            : {};

        return {
            ...requirementDetails,
            summary: this.t(summaryKey, summaryFallback, summaryParams),
            lines: Array.isArray(requirementDetails.lines)
                ? requirementDetails.lines.map((line) => ({
                    ...line,
                    label: this.t(lineKeyByLabel[line.label], line.label),
                }))
                : [],
        };
    }

    renderProgressionSummary() {
        if (!this.progressionState) {
            return '';
        }

        const stage = this.progressionState;
        const stageClass = this.getStageThemeClass(stage.current_stage_id);
        const showCoexistence = stage.current_stage_id === 'stage_hybrid' || stage.current_stage_id === 'stage_collective';
        const metricCards = [];

        if (showCoexistence) {
            metricCards.push(this.renderMetricCard(
                this.t('progressionMetric_humanPressure', '人类压力'),
                stage.human_pressure,
                this.t('progressionMetric_humanPressureNote', '人类秩序对异化的反制强度')
            ));
            metricCards.push(this.renderMetricCard(
                this.t('progressionMetric_maggotInfluence', '蛆虫影响'),
                stage.maggot_influence,
                this.t('progressionMetric_maggotInfluenceNote', '腐化生态正在渗透聚落的程度')
            ));
            metricCards.push(this.renderMetricCard(
                this.t('progressionMetric_symbiosisStability', '共生稳定度'),
                stage.symbiosis_stability,
                this.t('progressionMetric_symbiosisStabilityNote', '决定混合社会是否还能保持运转')
            ));
            metricCards.push(this.renderMetricCard(
                this.t('progressionMetric_hybridPopulation', '混合人口'),
                stage.hybrid_population,
                this.t('progressionMetric_hybridPopulationNote', '已经参与生产的蛆虫人规模')
            ));
            if (stage.current_stage_id === 'stage_collective') {
                metricCards.push(this.renderMetricCard(
                    this.t('progressionMetric_collectiveConsciousness', '集体意识'),
                    stage.collective_consciousness,
                    this.t('progressionMetric_collectiveConsciousnessNote', '共享思维网络对终局产能的聚合程度')
                ));
            }
        }

        return `
            <section class="progression-summary ${stageClass}">
                <div class="progression-summary-header">
                    <div>
                        <div class="progression-kicker">${this.t('progressionKicker', '当前阶段')}</div>
                        <div class="unlock-title">${this.getLocalizedStageName(stage)}</div>
                    </div>
                    <div class="stage-chip">${this.getStageSequenceLabel(stage.current_stage_id)}</div>
                </div>
                <div class="unlock-description progression-lead">${this.getLocalizedStageDescription(stage)}</div>
                <div class="progression-narrative">${this.getStageNarrative(stage.current_stage_id)}</div>
                ${metricCards.length > 0 ? `<div class="progression-metrics">${metricCards.join('')}</div>` : ''}
            </section>
        `;
    }

    renderUnlocks() {
        if (!this.containerElement) {
            this.containerElement = document.getElementById('unlock-list');
            if (!this.containerElement) {
                return;
            }
        }

        this.update();
        this.updateTabAttention();
        this.containerElement.innerHTML = this.renderProgressionSummary();
        this.containerElement.innerHTML += `<div class="unlock-section-label">${this.t('unlockSectionLabel', '下一次揭示')}</div>`;

        if (this.unlocks.length === 0) {
            this.containerElement.innerHTML += `<p class="no-unlocks">${this.t('noUnlocksAvailable', '目前没有新的可观测异常，边界暂时保持稳定。')}</p>`;
            return;
        }

        const unlockText = window.i18n ? window.i18n.t('unlock') : 'Unlock';
        const unlockedText = window.i18n ? window.i18n.t('unlocked') : 'Unlocked';

        this.unlocks.forEach((unlock, index) => {
            const progress = this.checkProgress(unlock.id);
            const requirementDetails = this.getLocalizedRequirementDetails(
                unlock.requirement_type,
                unlock.requirement_value,
                this.getRequirementDetails(unlock.id)
            );
            const progressBarWidth = `${Math.max(0, Math.min(100, progress.percentage || 0))}%`;
            const canUnlock = !unlock.unlocked && (progress.current || 0) >= (progress.required || 1);
            const actionMarkup = this.renderUnlockAction(unlock, index, canUnlock, unlockText, unlockedText);
            const unlockDiv = document.createElement('div');
            unlockDiv.className = `unlock-feature ${unlock.unlocked ? 'unlocked' : 'locked'} feature-${unlock.feature_type}`;
            unlockDiv.id = `unlock-feature-${index}`;
            unlockDiv.innerHTML = `
                <div class="unlock-card-header">
                    <div class="unlock-icon">${unlock.unlocked ? '✓' : '>'}</div>
                    <div>
                        <div class="unlock-type-label">${this.getFeatureTypeLabel(unlock.feature_type)}</div>
                        <div class="unlock-title">${this.getUnlockName(unlock)}</div>
                    </div>
                </div>
                <div class="unlock-description">${this.getDescription(unlock.id)}</div>
                <div class="unlock-requirement">${requirementDetails?.summary || this.formatRequirement(unlock.requirement_type)}</div>
                ${this.renderRequirementLines(requirementDetails)}
                <div class="unlock-progress">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progressBarWidth}"></div>
                    </div>
                    <span class="progress-text">${this.formatPercent(progress.percentage || 0, 0)}</span>
                </div>
                <div class="unlock-action">${actionMarkup}</div>
            `;
            unlockDiv.style.setProperty('--unlock-progress', progressBarWidth);
            this.containerElement.appendChild(unlockDiv);
        });
    }

    isManualUnlock(unlock) {
        return !!unlock && unlock.feature_type === 'stage';
    }

    renderUnlockAction(unlock, index, canUnlock, unlockText, unlockedText) {
        if (unlock.unlocked) {
            return `<span class="unlocked-badge">✓ ${unlockedText}</span>`;
        }

        if (this.isManualUnlock(unlock)) {
            return `
                <button type="button" id="unlock-button-${index}"
                        onclick="window.unlockManager.unlock('${unlock.id}')"
                        ${!canUnlock ? 'disabled class="disabled"' : ''}>
                    ${unlockText}
                </button>
            `;
        }

        return `<span class="unlock-hint">${this.t('unlockAutoRevealHint', '满足条件后自动揭示')}</span>`;
    }

    renderRequirementLines(requirementDetails) {
        if (!requirementDetails || !Array.isArray(requirementDetails.lines) || requirementDetails.lines.length === 0) {
            return '';
        }

        const lines = requirementDetails.lines
            .map((line) => {
                const current = Number(line.current || 0);
                const required = Number(line.required || 0);
                const ratio = required > 0 ? Math.max(0, Math.min(1, current / required)) : 0;
                return `
                    <div class="unlock-requirement-line">
                        <div class="unlock-requirement-line-header">
                            <span>${line.label}</span>
                            <strong>${this.formatRequirementValue(current)} / ${this.formatRequirementValue(required)}</strong>
                        </div>
                        <div class="unlock-requirement-line-bar">
                            <i style="width: ${(ratio * 100).toFixed(0)}%"></i>
                        </div>
                    </div>
                `;
            })
            .join('');

        return `<div class="unlock-requirement-lines">${lines}</div>`;
    }

    formatRequirementValue(value) {
        if (!Number.isFinite(value)) {
            return '0';
        }
        if (Math.abs(value - Math.round(value)) < 0.001) {
            return this.formatInteger(value);
        }
        return this.formatDecimal(value, 1);
    }

    getStageThemeClass(stageId) {
        const map = {
            stage_genesis: 'theme-genesis',
            stage_workers: 'theme-workers',
            stage_maggot: 'theme-maggot',
            stage_hybrid: 'theme-hybrid',
            stage_collective: 'theme-collective'
        };
        return map[stageId] || 'theme-genesis';
    }

    getStageSequenceLabel(stageId) {
        const map = {
            stage_genesis: 'PHASE 01',
            stage_workers: 'PHASE 02',
            stage_maggot: 'PHASE 03',
            stage_hybrid: 'PHASE 04',
            stage_collective: 'PHASE 05'
        };
        return map[stageId] || 'PHASE 01';
    }

    getStageNarrative(stageId) {
        const fallbackNarratives = {
            stage_genesis: '世界仍旧可被理解为资源与手工劳动的简单叠加，危险还隐藏在结构之后。',
            stage_workers: '聚落已经摆脱纯点击驱动，食物、住房和工人调度开始决定文明是否扩张。',
            stage_maggot: '死亡第一次形成可持续回报，生产不再只是建设，也开始吞食尸体与后果。',
            stage_hybrid: '秩序与腐化被迫共享同一套基础设施，任何失衡都会把社会推向崩塌。',
            stage_collective: '个体边界被持续稀释，意识、繁殖与远征开始围绕同一网络运转。'
        };
        return this.t(`stageNarrative_${stageId}`, fallbackNarratives[stageId] || fallbackNarratives.stage_genesis);
    }

    renderMetricCard(label, value, note) {
        return `
            <div class="progression-metric-card">
                <span class="metric-label">${label}</span>
                <strong>${this.formatDecimal(value, 1)}</strong>
                <small>${note}</small>
            </div>
        `;
    }

    formatInteger(value) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
            return window.NumberFormatter.formatInteger(value);
        }

        return Math.floor(Number(value) || 0).toLocaleString();
    }

    formatDecimal(value, fractionDigits = 1) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatDecimal === 'function') {
            return window.NumberFormatter.formatDecimal(value, { fractionDigits });
        }

        return Number(value || 0).toFixed(fractionDigits);
    }

    formatPercent(value, fractionDigits = 1) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatPercent === 'function') {
            return window.NumberFormatter.formatPercent(value, { fractionDigits });
        }

        return `${Number(value || 0).toFixed(fractionDigits)}%`;
    }

    getFeatureTypeLabel(featureType) {
        return this.t(`unlockFeatureType_${featureType}`, this.t('unlockFeatureType_default', '揭示项目'));
    }

    formatRequirement(type) {
        return this.t(`unlockRequirement_${type}`, this.t('unlockRequirement_default', '满足当前阶段条件'));
    }

    getDescription(featureId) {
        const fallbackDescriptions = {
            stage_workers: '基础采集已经无法满足扩张，新的劳动力系统即将开启。',
            stage_maggot: '你发现死亡并非终点，而是另一条生产链的入口。',
            stage_hybrid: '纯粹的人类秩序正在崩塌，共生将成为新的生产法则。',
            stage_collective: '当个体边界溶解，意识将直接驱动远征与扩张。',
            coexistence_balance: '把人类压力与蛆虫影响维持在可控平衡内。',
            workers_tab: '工人、住房、工作总览和生命周期系统已经稳定运转。',
            statistics_panel: '统计面板已成为稳定观测工具。',
            achievements_panel: '成就面板已被揭示，可查看里程碑进度。',
            dark_biology: '黑暗生物链已经形成，相关科技分支可被研究。'
        };

        if (window.i18n && typeof window.i18n.getUnlockDescription === 'function') {
            return window.i18n.getUnlockDescription(featureId, fallbackDescriptions[featureId] || this.t('unlockDescription_default', '新的阶段边界正在显现。'));
        }

        return fallbackDescriptions[featureId] || '新的阶段边界正在显现。';
    }
}

window.UnlockManager = UnlockManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('UnlockManager class loaded');
});
