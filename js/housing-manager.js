class HousingManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.occupancyRate = 100;
    }

    getHousingOverview() {
        const fallback = { totalCapacity: 0, occupied: 0, queue: 0 };
        if (!this.rustGame) return fallback;

        try {
            const totalCapacity = typeof this.rustGame.get_housing_capacity === 'function'
                ? Number(this.rustGame.get_housing_capacity() || 0)
                : 0;
            const occupied = typeof this.rustGame.get_housing_occupied === 'function'
                ? Number(this.rustGame.get_housing_occupied() || 0)
                : 0;
            let queue = 0;
            if (typeof this.rustGame.get_population_queue_json === 'function') {
                const queueObj = JSON.parse(this.rustGame.get_population_queue_json() || '{}');
                queue = Array.isArray(queueObj) ? queueObj.length : Number(queueObj.length || 0);
            }
            return { totalCapacity, occupied, queue };
        } catch (error) {
            console.error('Failed to get housing overview:', error);
            return fallback;
        }
    }

    getHousing() {
        if (this.rustGame && typeof this.rustGame.get_housing === 'function') {
            try {
                const housing = this.rustGame.get_housing();
                return housing || [];
            } catch (error) {
                console.error('Failed to get housing:', error);
                return [];
            }
        }
        return [];
    }

    upgradeHousing(index) {
        if (this.rustGame && typeof this.rustGame.upgrade_housing === 'function') {
            try {
                const success = this.rustGame.upgrade_housing(index);
                if (success) {
                    this.renderHousingList();
                    if (window.updateResourceDisplay) {
                        window.updateResourceDisplay();
                    }
                }
                return success;
            } catch (error) {
                console.error('Failed to upgrade housing:', error);
                return false;
            }
        }
        return false;
    }

    bulkUpgrade() {
        const housing = this.getHousing();
        let successCount = 0;
        let failures = 0;

        housing.forEach((_, index) => {
            if (this.upgradeHousing(index)) {
                successCount++;
            } else {
                failures++;
            }
        });

        return { successCount, failures, total: housing.length };
    }

    setOccupancyRate(rate) {
        this.occupancyRate = Math.max(0, Math.min(100, rate));
        this.renderHousingList();
    }

    calculateOccupants(capacity) {
        return Math.floor(capacity * (this.occupancyRate / 100));
    }

    formatUpgradeCost(cost) {
        if (!cost) return '';
        
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        const parts = [];
        
        for (const [resource, amount] of Object.entries(cost)) {
            const resourceName = t(resource.toLowerCase()) || resource;
            parts.push(`${Math.floor(amount)} ${resourceName}`);
        }
        
        return parts.join(', ');
    }

    renderHousingList() {
        const container = document.getElementById('housing-list');
        if (!container) {
            console.warn('Housing container "housing-list" not found');
            return;
        }

        const housing = this.getHousing();
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        if (housing.length === 0) {
            container.innerHTML = `<p id="housing-placeholder">${t('housingPlaceholder') || '住房系统将在未来版本中实现'}</p>`;
            return;
        }

        let html = '<div class="housing-list">';
        
        housing.forEach((house, index) => {
            const occupants = this.calculateOccupants(house.capacity);
            const upgradeCost = this.formatUpgradeCost(house.upgradeCost);
            const canAfford = this.canAffordUpgrade(house.upgradeCost);

            html += `
                <div class="housing-row" id="housing-row-${index}">
                    <div class="housing-info">
                        <span class="housing-name">${house.name}</span>
                        <span class="housing-level">${t('housingLevel') || '等级'}: ${house.level}</span>
                    </div>
                    <div class="housing-stats">
                        <span class="housing-stat">
                            <span class="stat-label">${t('capacity') || '容量'}:</span>
                            <span class="stat-value">${house.capacity}</span>
                        </span>
                        <span class="housing-stat">
                            <span class="stat-label">${t('occupants') || '入住人数'}:</span>
                            <span class="stat-value">${occupants}/${house.capacity}</span>
                        </span>
                    </div>
                    <div class="housing-upgrade">
                        <span class="upgrade-cost">${t('housingUpgradeCost') || '升级消耗'}: ${upgradeCost}</span>
                        <button 
                            class="housing-upgrade-btn ${canAfford ? '' : 'disabled'}"
                            onclick="window.housingManager.upgradeHousing(${index})"
                            ${!canAfford ? 'disabled' : ''}
                        >
                            ${t('upgradeHousing') || '升级'}
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    canAffordUpgrade(cost) {
        if (!this.rustGame || !cost) return false;

        try {
            const resources = this.rustGame.get_resources();
            for (const [resource, amount] of Object.entries(cost)) {
                const resourceKey = resource.charAt(0).toUpperCase() + resource.slice(1).toLowerCase();
                const current = resources[resourceKey] || 0;
                if (current < amount) {
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Failed to check upgrade affordability:', error);
            return false;
        }
    }

    renderToPanel(panelId = 'housing-panel') {
        const panel = document.getElementById(panelId);
        if (!panel) {
            console.warn(`Housing panel "${panelId}" not found`);
            return;
        }

        const housing = this.getHousing();
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        const overview = this.getHousingOverview();
        const totalCapacity = overview.totalCapacity || housing.reduce((sum, h) => sum + Number(h.capacity || 0), 0);
        const occupied = overview.occupied;
        const queueCount = overview.queue;
        const occupancyPercent = totalCapacity > 0 ? Math.min(100, Math.round((occupied / totalCapacity) * 100)) : 0;
        const isFull = totalCapacity > 0 && occupied >= totalCapacity;

        let html = `
            <div class="housing-panel">
                <div class="housing-header">
                    <h4>${t('housingManagement') || '住房管理'}</h4>
                    ${housing.length > 0 ? `
                        <div class="housing-summary">
                            <span class="summary-item">${t('housingList') || '住房数量'}: ${housing.length}</span>
                            <span class="summary-item">${t('totalCapacity') || '总容量'}: ${totalCapacity}</span>
                            <span class="summary-item ${isFull ? 'housing-full-text' : ''}">${t('currentOccupancy') || '当前入住'}: ${occupied}</span>
                            <span class="summary-item">${t('queueWorkers') || '等待队列'}: ${queueCount}</span>
                        </div>
                        <div class="housing-capacity-progress ${isFull ? 'full' : ''}">
                            <span>${t('occupancyRate') || '入住率'} ${occupancyPercent}%</span>
                            <div class="housing-capacity-bar"><i style="width:${occupancyPercent}%"></i></div>
                        </div>
                        ${isFull ? `<div class="housing-full-warning">${t('housingFullWarning') || '住房容量已满，新增人口将进入等待队列'}</div>` : ''}
                    ` : ''}
                </div>
                ${this.renderHousingToList()}
                ${housing.length > 0 ? `
                    <div class="housing-controls">
                        <div class="bulk-upgrade-section">
                            <button type="button" id="housing-bulk-upgrade" onclick="window.housingManager.handleBulkUpgrade()">
                                ${t('bulkUpgradeHousing') || '批量升级住房'}
                            </button>
                        </div>
                        <div class="occupancy-control">
                            <label for="occupancy-slider">${t('occupancyControl') || '入住控制'}:</label>
                            <input 
                                type="range" 
                                id="occupancy-slider" 
                                min="0" 
                                max="100" 
                                value="${this.occupancyRate}"
                                oninput="window.housingManager.handleOccupancyChange(this.value)"
                            >
                            <span id="occupancy-value">${this.occupancyRate}%</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        panel.innerHTML = html;
    }

    renderHousingToList() {
        const housing = this.getHousing();
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        if (housing.length === 0) {
            return `<p class="empty-list">${t('noHousing') || '暂无住房建筑'}</p>`;
        }

        let html = '<div class="housing-list-container">';
        
        housing.forEach((house, index) => {
            const occupants = this.calculateOccupants(house.capacity);
            const houseOccupancyPercent = house.capacity > 0 ? Math.round((occupants / house.capacity) * 100) : 0;
            const houseFull = occupants >= house.capacity;
            const upgradeCost = this.formatUpgradeCost(house.upgradeCost);
            const canAfford = this.canAffordUpgrade(house.upgradeCost);

            html += `
                <div class="housing-item ${houseFull ? 'housing-item-full' : ''}" id="housing-item-${index}">
                    <div class="housing-item-header">
                        <div class="housing-item-name">
                            <span class="housing-avatar">🏠</span>
                            <span class="housing-name-text">${house.name}</span>
                            <span class="housing-level-badge">${t('level') || '等级'} ${house.level}</span>
                        </div>
                    </div>
                    <div class="housing-item-body">
                        <div class="housing-detail-row">
                            <span class="detail-label">${t('capacity') || '容量'}:</span>
                            <span class="detail-value">${house.capacity}</span>
                        </div>
                        <div class="housing-detail-row">
                            <span class="detail-label">${t('occupants') || '入住人数'}:</span>
                            <span class="detail-value">${occupants}/${house.capacity}</span>
                            <div class="occupancy-progress-bar">
                                <div class="occupancy-progress-fill" style="width: ${houseOccupancyPercent}%"></div>
                            </div>
                        </div>
                        <div class="housing-detail-row">
                            <span class="detail-label">${t('housingUpgradeCost') || '升级消耗'}:</span>
                            <span class="detail-value upgrade-cost">${upgradeCost}</span>
                        </div>
                    </div>
                    <div class="housing-item-actions">
                        <button 
                            class="btn-upgrade ${canAfford ? '' : 'disabled'}"
                            onclick="window.housingManager.upgradeHousing(${index})"
                            ${!canAfford ? 'disabled' : ''}
                        >
                            ${t('upgradeHousing') || '升级'}
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    handleBulkUpgrade() {
        const result = this.bulkUpgrade();
        
        if (result.successCount > 0) {
            console.log(`Bulk upgrade: ${result.successCount}/${result.total} succeeded`);
        }
        
        if (result.failures > 0) {
            alert(`${result.failures} housing upgrades failed (insufficient resources)`);
        }
    }

    handleOccupancyChange(value) {
        this.setOccupancyRate(parseInt(value));
        document.getElementById('occupancy-value').textContent = `${value}%`;
    }
}

window.HousingManager = HousingManager;

window.updateHousingPanel = function() {
    if (window.housingManager && typeof window.housingManager.renderToPanel === 'function') {
        const buildingsTab = document.getElementById('tab-buildings');
        if (buildingsTab && buildingsTab.classList.contains('active')) {
            window.housingManager.renderToPanel('housing-panel');
        }
    }
};
