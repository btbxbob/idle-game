class UnlockManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.unlocks = [];
        this.containerElement = null;
    }

    update() {
        if (!this.rustGame || typeof this.rustGame.get_unlocks !== 'function') {
            console.warn('UnlockManager: rustGame or get_unlocks not available');
            this.unlocks = [];
            return;
        }

        try {
            const unlocksData = this.rustGame.get_unlocks();
            if (unlocksData && unlocksData !== null) {
                this.unlocks = Array.isArray(unlocksData) ? unlocksData : [];
            } else {
                this.unlocks = [];
            }
        } catch (error) {
            console.error('UnlockManager: Error fetching unlocks:', error);
            this.unlocks = [];
        }
    }

    unlock(featureId) {
        if (!this.rustGame || typeof this.rustGame.unlock_feature !== 'function') {
            console.warn('UnlockManager: rustGame or unlock_feature not available');
            return false;
        }

        try {
            const success = this.rustGame.unlock_feature(featureId);
            if (success) {
                this.update();
            }
            return success;
        } catch (error) {
            console.error('UnlockManager: Error unlocking feature:', error);
            return false;
        }
    }

    checkProgress(featureId) {
        const feature = this.unlocks.find(u => u.id === featureId);
        
        if (!feature) {
            return {
                current: 0,
                required: 0,
                percentage: 0,
                unlocked: false,
                name: featureId,
                requirementType: 'unknown'
            };
        }

        let currentValue = 0;
        if (this.rustGame) {
            switch (feature.requirement_type) {
                case 'total_clicks':
                    currentValue = this.rustGame.get_total_clicks ? this.rustGame.get_total_clicks() : 0;
                    break;
                case 'total_coins':
                    currentValue = this.rustGame.get_coins ? this.rustGame.get_coins() : 0;
                    break;
                case 'buildings_owned':
                    if (this.rustGame.get_statistics) {
                        const stats = this.rustGame.get_statistics();
                        currentValue = stats.buildings_purchased || 0;
                    }
                    break;
                default:
                    currentValue = 0;
            }
        }

        const required = feature.requirement_value || 0;
        const percentage = required > 0 ? Math.min(100, (currentValue / required) * 100) : 0;

        return {
            current: currentValue,
            required: required,
            percentage: percentage,
            unlocked: feature.unlocked || false,
            name: feature.name || featureId,
            requirementType: feature.requirement_type || 'unknown'
        };
    }

    renderUnlocks() {
        if (!this.containerElement) {
            this.containerElement = document.getElementById('unlock-list');
            if (!this.containerElement) {
                console.warn('UnlockManager: #unlock-list element not found');
                return;
            }
        }

        if (!this.containerElement) {
            return;
        }

        this.containerElement.innerHTML = '';

        if (this.unlocks.length === 0) {
            this.containerElement.innerHTML = '<p class="no-unlocks">暂无解锁内容</p>';
            return;
        }

        const unlockText = window.i18n ? window.i18n.t('unlock') : 'Unlock';
        const unlockedText = window.i18n ? window.i18n.t('unlocked') : 'Unlocked';

        this.unlocks.forEach((unlock, index) => {
            const unlockDiv = document.createElement('div');
            unlockDiv.className = `unlock-feature ${unlock.unlocked ? 'unlocked' : 'locked'}`;
            unlockDiv.id = `unlock-feature-${index}`;

            const progress = this.checkProgress(unlock.id);
            const progressBarWidth = `${progress.percentage}%`;
            
            const canUnlock = !progress.unlocked && progress.current >= progress.required;

            unlockDiv.innerHTML = `
                <div class="unlock-icon">${progress.unlocked ? '🔓' : '🔒'}</div>
                <div class="unlock-title">${unlock.name}</div>
                <div class="unlock-description">${this.getDescription(unlock.id)}</div>
                <div class="unlock-requirement">
                    需求：${this.formatRequirement(unlock.requirement_type, unlock.requirement_value)}
                </div>
                <div class="unlock-progress">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progressBarWidth}"></div>
                    </div>
                    <span class="progress-text">${progress.current.toFixed(0)} / ${progress.required.toFixed(0)}</span>
                </div>
                <div class="unlock-action" style="margin-top: 10px;">
                    ${!progress.unlocked ? 
                        `<button type="button" id="unlock-button-${index}" 
                                onclick="window.unlockManager.unlock('${unlock.id}')"
                                ${!canUnlock ? 'disabled class="disabled"' : ''}>
                            ${unlockText}
                        </button>` : 
                        `<span class="unlocked-badge" style="color: #FFD700; font-weight: bold;">✓ ${unlockedText}</span>`
                    }
                </div>
            `;

            this.containerElement.appendChild(unlockDiv);
        });
    }

    formatRequirement(type, value) {
        const clickText = window.i18n ? window.i18n.t('clicks') : 'clicks';
        const coinsText = window.i18n ? window.i18n.t('coins') : 'coins';
        const buildingsText = window.i18n ? window.i18n.t('buildings') : 'buildings';

        switch (type) {
            case 'total_clicks':
                return `${value} ${clickText}`;
            case 'total_coins':
                return `${value.toFixed(0)} ${coinsText}`;
            case 'buildings_owned':
                return `${value} ${buildingsText}`;
            default:
                return `${value}`;
        }
    }

    getDescription(featureId) {
        const descriptions = {
            'statistics_panel': '解锁统计数据面板，查看您的游戏统计信息',
            'achievements_panel': '解锁成就面板，追踪您的游戏成就',
            'crafting_panel': '解锁资源合成系统，转换不同资源',
            'workers_tab': '解锁工人标签页，管理工人分配',
            'advanced_buildings': '解锁高级建筑，提升生产效率'
        };
        return descriptions[featureId] || '解锁新的游戏功能';
    }

    updateButtonStates() {
        this.unlocks.forEach((unlock, index) => {
            const button = document.getElementById(`unlock-button-${index}`);
            if (!button) return;

            const progress = this.checkProgress(unlock.id);
            const canUnlock = !progress.unlocked && progress.current >= progress.required;
            
            button.disabled = !canUnlock;
            if (canUnlock) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        });
    }

    getContainerElement() {
        return this.containerElement;
    }
}

window.UnlockManager = UnlockManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('UnlockManager class loaded');
});
