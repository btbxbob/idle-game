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
                    this.renderToPanel('housing-panel');
                    if (window.updateResourceDisplay) {
                        window.updateResourceDisplay();
                    }
                }
                return success;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error || '');
                if (message.includes('Insufficient')) {
                    console.info('Skipped housing upgrade:', message);
                } else {
                    console.error('Failed to upgrade housing:', error);
                }
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
        this.renderToPanel('housing-panel');
    }

    calculateOccupants(capacity) {
        return Math.floor(capacity * (this.occupancyRate / 100));
    }

    formatInteger(value) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
            return window.NumberFormatter.formatInteger(value);
        }

        return Math.floor(Number(value) || 0).toLocaleString();
    }

    normalizeResourceKey(resource) {
        const normalized = String(resource || '').trim();
        if (!normalized) return '';

        const aliases = {
            gold: 'coins',
            coin: 'coins',
            coins: 'coins',
            Gold: 'coins',
            Coin: 'coins',
            Coins: 'coins',
            Wood: 'wood',
            wood: 'wood',
            Stone: 'stone',
            stone: 'stone',
            IronOre: 'ironOre',
            ironore: 'ironOre',
            ironOre: 'ironOre',
            CopperOre: 'copperOre',
            copperore: 'copperOre',
            copperOre: 'copperOre',
            AluminumOre: 'aluminumOre',
            aluminumore: 'aluminumOre',
            aluminumOre: 'aluminumOre',
            IronIngot: 'ironIngot',
            ironingot: 'ironIngot',
            ironIngot: 'ironIngot',
            SteelPlate: 'steelPlate',
            steelplate: 'steelPlate',
            steelPlate: 'steelPlate',
            Glass: 'glass',
            glass: 'glass',
            Plastic: 'plastic',
            plastic: 'plastic',
            Chemicals: 'chemicals',
            chemicals: 'chemicals',
            Gear: 'gear',
            gear: 'gear',
            Motor: 'motor',
            motor: 'motor',
            Battery: 'battery',
            battery: 'battery',
            CircuitBoard: 'circuitBoard',
            circuitboard: 'circuitBoard',
            circuitBoard: 'circuitBoard',
            Sensor: 'sensor',
            sensor: 'sensor',
            Microchip: 'microchip',
            microchip: 'microchip',
            QuantumComputer: 'quantumComputer',
            quantumcomputer: 'quantumComputer',
            quantumComputer: 'quantumComputer',
            Robot: 'robot',
            robot: 'robot',
            Nanobot: 'nanobot',
            nanobot: 'nanobot',
            Antimatter: 'antimatter',
            antimatter: 'antimatter',
            TimeCrystal: 'timeCrystal',
            timecrystal: 'timeCrystal',
            timeCrystal: 'timeCrystal',
        };

        if (aliases[normalized]) {
            return aliases[normalized];
        }

        const lower = normalized.toLowerCase();
        if (aliases[lower]) {
            return aliases[lower];
        }

        return normalized.charAt(0).toLowerCase() + normalized.slice(1);
    }

    getResourceAmount(resources, resource) {
        const normalizedKey = this.normalizeResourceKey(resource);
        if (!normalizedKey || !resources || typeof resources !== 'object') {
            return 0;
        }

        const candidates = [
            normalizedKey,
            normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1),
        ];

        const rustMap = {
            coins: 'Gold',
            wood: 'Wood',
            stone: 'Stone',
            ironOre: 'IronOre',
            copperOre: 'CopperOre',
            aluminumOre: 'AluminumOre',
            coal: 'Coal',
            oil: 'Oil',
            crystal: 'Crystal',
            food: 'Food',
        };

        if (rustMap[normalizedKey]) {
            candidates.push(rustMap[normalizedKey]);
        }

        for (const candidate of candidates) {
            if (resources[candidate] !== undefined) {
                return Number(resources[candidate]) || 0;
            }
        }

        return 0;
    }

    getResourceLabel(resource) {
        const normalizedKey = this.normalizeResourceKey(resource);
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        return t(normalizedKey) || normalizedKey || String(resource || '');
    }

    getTechnologyLabel(technologyId) {
        if (!technologyId) {
            return '';
        }

        const language = window.i18n && window.i18n.currentLanguage === 'en' ? 'en' : 'zh-CN';
        const labels = {
            BasicLogging: { 'zh-CN': '基础伐木', en: 'Basic Logging' },
            BasicQuarrying: { 'zh-CN': '基础采石', en: 'Basic Quarrying' },
            BasicSmelting: { 'zh-CN': '基础冶炼', en: 'Basic Smelting' },
            BasicEngineering: { 'zh-CN': '基础工程', en: 'Basic Engineering' },
            AdvancedChemistry: { 'zh-CN': '高级化学', en: 'Advanced Chemistry' },
            Automation: { 'zh-CN': '自动化', en: 'Automation' },
            Biotechnology: { 'zh-CN': '生物科技', en: 'Biotechnology' },
            QuantumComputing: { 'zh-CN': '量子计算', en: 'Quantum Computing' },
            SpaceExploration: { 'zh-CN': '太空探索', en: 'Space Exploration' },
        };

        if (labels[technologyId]) {
            return labels[technologyId][language] || labels[technologyId]['zh-CN'];
        }

        return String(technologyId).replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    getHousingName(housing) {
        const fallback = housing?.name || '';
        if (window.i18n && typeof window.i18n.getHousingName === 'function') {
            const translated = window.i18n.getHousingName(housing?.name, fallback);
            return translated || fallback;
        }
        return fallback;
    }

    getHousingDescription(housing) {
        const fallback = housing?.description || '';
        if (window.i18n && typeof window.i18n.getHousingDescription === 'function') {
            const translated = window.i18n.getHousingDescription(housing?.name, fallback);
            return translated || fallback;
        }
        return fallback;
    }

    getCostEntries(cost) {
        if (!cost) return [];
        if (cost instanceof Map) {
            return Array.from(cost.entries());
        }
        if (Array.isArray(cost)) {
            return cost;
        }
        if (typeof cost === 'object') {
            return Object.entries(cost);
        }
        return [];
    }

    formatUpgradeCost(cost) {
        if (!cost) return '';
        const parts = [];

        for (const [resource, amount] of this.getCostEntries(cost)) {
            const resourceName = this.getResourceLabel(resource);
            parts.push(`${this.formatInteger(amount)} ${resourceName}`);
        }
        
        return parts.join(', ');
    }

    renderCostChips(cost) {
        const entries = this.getCostEntries(cost);
        if (entries.length === 0) {
            return '';
        }

        return `<div class="housing-cost-chips">${entries.map(([resource, amount]) => {
            const affordable = this.canAffordUpgrade([[resource, amount]]);
            return `
                <span class="housing-cost-chip ${affordable ? '' : 'insufficient'}">
                    ${this.formatInteger(amount)} ${this.getResourceLabel(resource)}
                </span>
            `;
        }).join('')}</div>`;
    }

    renderHousingList() {
        const container = document.getElementById('housing-list');
        if (!container) {
            this.renderToPanel('housing-panel');
            return;
        }

        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        if (!this.rustGame || typeof this.rustGame.get_housing !== 'function') {
            container.innerHTML = `<p id="housing-placeholder">${t('housingLoadingPlaceholder') || '正在加载住房面板...'}</p>`;
            return;
        }

        const housing = this.getHousing();

        if (housing.length === 0) {
            container.innerHTML = `<p id="housing-placeholder">${t('noHousing') || '暂无住房建筑'}</p>`;
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
                            <span class="stat-value">${this.formatInteger(house.capacity)}</span>
                        </span>
                        <span class="housing-stat">
                            <span class="stat-label">${t('occupants') || '入住人数'}:</span>
                            <span class="stat-value">${this.formatInteger(occupants)}/${this.formatInteger(house.capacity)}</span>
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
            for (const [resource, amount] of this.getCostEntries(cost)) {
                const current = this.getResourceAmount(resources, resource);
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
                    <div class="housing-toolbar">
                        <div>
                            <h4>${t('housingManagement') || '住房管理'}</h4>
                            <div class="housing-toolbar-subtitle">${t('housingCatalogSubtitle') || '住房会沿着科技与工业资源链持续升级。'}</div>
                        </div>
                        <button type="button" id="housing-auto-purchase" class="housing-auto-purchase-btn" onclick="window.housingManager.handleAutoPurchase()">
                            ${t('housingAutoPurchase') || '自动购买'}
                        </button>
                    </div>
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
                        <div class="occupancy-control housing-occupancy-top">
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
                    ` : ''}
                </div>
                ${this.renderHousingToList()}
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
            const technologyLabel = this.getTechnologyLabel(house.requiredTechnology);
            const icon = house.icon || '🏠';
            const housingName = this.getHousingName(house);
            const housingDescription = this.getHousingDescription(house);

            html += `
                <div class="housing-item ${houseFull ? 'housing-item-full' : ''}" id="housing-item-${index}">
                    <div class="housing-item-header">
                        <div class="housing-item-name">
                            <span class="housing-avatar">${icon}</span>
                            <div class="housing-title-block">
                                <span class="housing-name-text">${housingName}</span>
                                <span class="housing-level-badge">${t('level') || '等级'} ${house.level}</span>
                            </div>
                        </div>
                        ${technologyLabel ? `<span class="housing-tech-badge">${technologyLabel}</span>` : ''}
                    </div>
                    <div class="housing-item-body">
                        ${housingDescription ? `<div class="housing-description">${housingDescription}</div>` : ''}
                        <div class="housing-detail-row housing-detail-row-stacked">
                            <span class="detail-label">${t('housingCapacityPerLevel') || '单级容量'}:</span>
                            <span class="detail-value">${this.formatInteger(house.baseCapacity || house.capacity)}</span>
                        </div>
                        <div class="housing-detail-row">
                            <span class="detail-label">${t('capacity') || '容量'}:</span>
                            <span class="detail-value">${this.formatInteger(house.capacity)}</span>
                        </div>
                        <div class="housing-detail-row">
                            <span class="detail-label">${t('occupants') || '入住人数'}:</span>
                            <span class="detail-value">${this.formatInteger(occupants)}/${this.formatInteger(house.capacity)}</span>
                            <div class="occupancy-progress-bar">
                                <div class="occupancy-progress-fill" style="width: ${houseOccupancyPercent}%"></div>
                            </div>
                        </div>
                        <div class="housing-detail-row housing-detail-row-stacked">
                            <span class="detail-label">${t('housingUpgradeCost') || '升级消耗'}:</span>
                            <span class="detail-value upgrade-cost">${upgradeCost}</span>
                        </div>
                        ${this.renderCostChips(house.upgradeCost)}
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

    handleAutoPurchase() {
        if (!this.rustGame || typeof this.rustGame.upgrade_housing !== 'function') {
            return;
        }

        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        const housing = this.getHousing();
        let purchased = 0;
        let progressed = true;
        let safetyCounter = 0;
        const maxAttempts = Math.max(25, housing.length * 25);

        while (progressed && safetyCounter < maxAttempts) {
            progressed = false;

            for (let index = 0; index < housing.length; index += 1) {
                try {
                    const success = this.rustGame.upgrade_housing(index);
                    if (success) {
                        purchased += 1;
                        progressed = true;
                        safetyCounter += 1;
                        if (safetyCounter >= maxAttempts) {
                            break;
                        }
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error || '');
                    if (!message.includes('Insufficient')) {
                        console.error('Failed to auto purchase housing:', error);
                    }
                }
            }
        }

        this.renderToPanel('housing-panel');
        if (window.updateResourceDisplay) {
            window.updateResourceDisplay();
        }

        if (purchased === 0) {
            alert(t('housingNoAutoPurchase') || '当前资源不足，无法自动购买住房');
            return;
        }

        alert((t('housingAutoPurchaseSummary') || '自动购买完成，共升级 {count} 次住房').replace('{count}', String(purchased)));
    }

    handleBulkUpgrade() {
        this.handleAutoPurchase();
    }

    handleOccupancyChange(value) {
        this.setOccupancyRate(parseInt(value));
        document.getElementById('occupancy-value').textContent = `${value}%`;
    }
}

window.HousingManager = HousingManager;

window.updateHousingPanel = function() {
    if (window.housingManager && typeof window.housingManager.renderToPanel === 'function') {
        const housingTab = document.getElementById('tab-housing');
        if (housingTab && housingTab.classList.contains('active')) {
            window.housingManager.renderToPanel('housing-panel');
        }
    }
};
