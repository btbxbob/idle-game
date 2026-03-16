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
            { button: document.querySelector('.category-tab-button[data-category="primary"]'), panel: document.getElementById('primary-resources') },
            { button: document.querySelector('.category-tab-button[data-category="secondary"]'), panel: document.getElementById('secondary-resources') },
            { button: document.querySelector('.category-tab-button[data-category="advanced"]'), panel: document.getElementById('advanced-resources') }
        ];

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

        const activeCategoryButton = document.querySelector('.category-tab-button.active');
        if (activeCategoryButton && activeCategoryButton.style.display === 'none') {
            const primaryButton = document.querySelector('.category-tab-button[data-category="primary"]');
            const primaryPanel = document.getElementById('primary-resources');
            document.querySelectorAll('.category-tab-button').forEach((button) => {
                button.classList.remove('active');
            });
            document.querySelectorAll('.resource-panel').forEach((panel) => {
                if (panel.id !== 'resources-panel') {
                    panel.style.display = 'none';
                }
            });
            if (primaryButton) {
                primaryButton.classList.add('active');
            }
            if (primaryPanel) {
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

    renderProgressionSummary() {
        if (!this.progressionState) {
            return '';
        }

        const stage = this.progressionState;
        const stageClass = this.getStageThemeClass(stage.current_stage_id);
        const showCoexistence = stage.current_stage_id === 'stage_hybrid' || stage.current_stage_id === 'stage_collective';
        const metricCards = [];

        if (showCoexistence) {
            metricCards.push(this.renderMetricCard('人类压力', stage.human_pressure, '人类秩序对异化的反制强度'));
            metricCards.push(this.renderMetricCard('蛆虫影响', stage.maggot_influence, '腐化生态正在渗透聚落的程度'));
            metricCards.push(this.renderMetricCard('共生稳定度', stage.symbiosis_stability, '决定混合社会是否还能保持运转'));
            metricCards.push(this.renderMetricCard('混合人口', stage.hybrid_population, '已经参与生产的蛆虫人规模'));
            if (stage.current_stage_id === 'stage_collective') {
                metricCards.push(this.renderMetricCard('集体意识', stage.collective_consciousness, '共享思维网络对终局产能的聚合程度'));
            }
        }

        return `
            <section class="progression-summary ${stageClass}">
                <div class="progression-summary-header">
                    <div>
                        <div class="progression-kicker">当前阶段 / ACTIVE DOSSIER</div>
                        <div class="unlock-title">${stage.current_stage_name}</div>
                    </div>
                    <div class="stage-chip">${this.getStageSequenceLabel(stage.current_stage_id)}</div>
                </div>
                <div class="unlock-description progression-lead">${stage.current_stage_description}</div>
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
        this.containerElement.innerHTML += '<div class="unlock-section-label">下一次揭示 / NEXT REVELATION</div>';

        if (this.unlocks.length === 0) {
            this.containerElement.innerHTML += '<p class="no-unlocks">目前没有新的可观测异常，边界暂时保持稳定。</p>';
            return;
        }

        const unlockText = window.i18n ? window.i18n.t('unlock') : 'Unlock';
        const unlockedText = window.i18n ? window.i18n.t('unlocked') : 'Unlocked';

        this.unlocks.forEach((unlock, index) => {
            const progress = this.checkProgress(unlock.id);
            const requirementDetails = this.getRequirementDetails(unlock.id);
            const progressBarWidth = `${Math.max(0, Math.min(100, progress.percentage || 0))}%`;
            const canUnlock = !unlock.unlocked && (progress.current || 0) >= (progress.required || 1);
            const unlockDiv = document.createElement('div');
            unlockDiv.className = `unlock-feature ${unlock.unlocked ? 'unlocked' : 'locked'} feature-${unlock.feature_type}`;
            unlockDiv.id = `unlock-feature-${index}`;
            unlockDiv.innerHTML = `
                <div class="unlock-card-header">
                    <div class="unlock-icon">${unlock.unlocked ? '✓' : '>'}</div>
                    <div>
                        <div class="unlock-type-label">${this.getFeatureTypeLabel(unlock.feature_type)}</div>
                        <div class="unlock-title">${unlock.name}</div>
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
                <div class="unlock-action">
                    ${!unlock.unlocked ? `
                        <button type="button" id="unlock-button-${index}"
                                onclick="window.unlockManager.unlock('${unlock.id}')"
                                ${!canUnlock ? 'disabled class="disabled"' : ''}>
                            ${unlockText}
                        </button>
                    ` : `<span class="unlocked-badge">✓ ${unlockedText}</span>`}
                </div>
            `;
            unlockDiv.style.setProperty('--unlock-progress', progressBarWidth);
            this.containerElement.appendChild(unlockDiv);
        });
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
        const narratives = {
            stage_genesis: '世界仍旧可被理解为资源与手工劳动的简单叠加，危险还隐藏在结构之后。',
            stage_workers: '聚落已经摆脱纯点击驱动，食物、住房和工人调度开始决定文明是否扩张。',
            stage_maggot: '死亡第一次形成可持续回报，生产不再只是建设，也开始吞食尸体与后果。',
            stage_hybrid: '秩序与腐化被迫共享同一套基础设施，任何失衡都会把社会推向崩塌。',
            stage_collective: '个体边界被持续稀释，意识、繁殖与远征开始围绕同一网络运转。'
        };
        return narratives[stageId] || narratives.stage_genesis;
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
        const labels = {
            stage: '阶段跃迁',
            system: '系统异常',
            area: '面板揭示'
        };
        return labels[featureType] || '揭示项目';
    }

    formatRequirement(type) {
        switch (type) {
            case 'workers_stage':
                return '累计购买 3 座建筑';
            case 'maggot_stage':
                return '揭示蛆虫阶段';
            case 'hybrid_stage':
                return '推进蛆虫人阶段';
            case 'collective_stage':
                return '推进集体意识阶段';
            case 'symbiosis_stability':
                return '维持共生平衡';
            case 'total_clicks':
                return '完成基础点击阈值';
            default:
                return '满足当前阶段条件';
        }
    }

    getDescription(featureId) {
        const descriptions = {
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
        return descriptions[featureId] || '新的阶段边界正在显现。';
    }
}

window.UnlockManager = UnlockManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('UnlockManager class loaded');
});
