class ResourceManager {
    constructor(rustGame, i18n) {
        this.rustGame = rustGame;
        this.i18n = i18n;
        this.currentCategory = 'primary';
        this.resourceKeys = this.getAllResourceKeys();
        this.headerResourceConfigs = [
            { key: 'coins', icon: '🪙', amountId: 'coins', rateId: 'cps' },
            { key: 'wood', icon: '🪵', amountId: 'wood', rateId: 'wps' },
            { key: 'stone', icon: '🪨', amountId: 'stone', rateId: 'sps' },
            { key: 'ironOre', icon: '⛏️', amountId: 'iron-ore' },
            { key: 'copperOre', icon: '🔶', amountId: 'copper-ore' },
            { key: 'aluminumOre', icon: '⚪', amountId: 'aluminum-ore' },
            { key: 'coal', icon: '⚫', amountId: 'coal' },
            { key: 'oil', icon: '🛢️', amountId: 'oil' },
            { key: 'crystal', icon: '💎', amountId: 'crystal' },
            { key: 'food', icon: '🍞', amountId: 'food' },
            { key: 'maggot', icon: '🪱', amountId: 'maggot' },
            { key: 'corpse', icon: '🦴', amountId: 'corpse' }
        ];
    }

    getAllResourceKeys() {
        return [
            'coins', 'wood', 'stone', 'ironOre', 'copperOre', 'aluminumOre', 'coal', 'oil', 'crystal', 'food',
            'ironIngot', 'copperIngot', 'aluminumIngot', 'steelPlate', 'copperPlate', 'aluminumPlate',
            'glass', 'plastic', 'chemicals', 'fuel', 'paper', 'ink', 'cloth', 'leather', 'ceramic', 'cement',
            'brick', 'rebar', 'wire', 'pipe', 'valve', 'gear', 'bearing', 'spring', 'screw', 'nut', 'washer',
            'pump', 'motor', 'sensor', 'circuitBoard', 'capacitor', 'resistor', 'diode', 'transistor',
            'transformer', 'generator', 'compressor', 'battery',
            'microchip', 'engine', 'robot', 'satellite', 'spaceship', 'quantumComputer', 'antimatter',
            'darkMatter', 'timeCrystal', 'nanobot'
        ];
    }

    getResourceKeysByCategory(category) {
        const ranges = {
            'primary': { start: 0, end: 10 },
            'secondary': { start: 10, end: 50 },
            'advanced': { start: 50, end: 60 }
        };
        const range = ranges[category];
        return range ? this.resourceKeys.slice(range.start, range.end) : [];
    }

    initialize() {
        if (!this.i18n) return;

        this.ensureHeaderCards();

        ['primary', 'secondary', 'advanced'].forEach(category => {
            const panel = document.getElementById(`${category}-resources`);
            if (!panel) return;

            const resourceKeys = this.getResourceKeysByCategory(category);
            const resourceElements = panel.querySelectorAll('.resource-item');

            resourceElements.forEach((element, index) => {
                const resourceKey = resourceKeys[index];
                if (!resourceKey) return;

                const nameElement = element.querySelector('.resource-name');
                const amountElement = element.querySelector('.resource-amount');
                
                if (nameElement) nameElement.textContent = this.i18n.t(resourceKey);
                if (amountElement) amountElement.textContent = '0';
                element.setAttribute('data-resource', resourceKey);
            });
        });

        this.setupCategoryTabs();
        this.switchCategory('primary');
    }

    setupCategoryTabs() {
        document.querySelectorAll('.category-tab-button').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                if (category) this.switchCategory(category);
            });
        });
    }

    switchCategory(category) {
        document.querySelectorAll('.category-tab-button').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-category') === category);
        });

        ['primary', 'secondary', 'advanced'].forEach(cat => {
            const panel = document.getElementById(`${cat}-resources`);
            if (panel) panel.style.display = cat === category ? 'block' : 'none';
        });

        this.currentCategory = category;
        this.update();
    }

    update() {
        if (!this.rustGame || typeof this.rustGame.get_resources !== 'function') {
            return null;
        }

        try {
            const resources = this.rustGame.get_resources();
            if (resources) this.updateResourceDisplays(resources);
            return resources;
        } catch (error) {
            console.error('ResourceManager: Failed to fetch resources:', error);
            return null;
        }
    }

    updateResourceDisplays(resources) {
        if (!resources) return;

        ['primary', 'secondary', 'advanced'].forEach(category => {
            const panel = document.getElementById(`${category}-resources`);
            if (!panel) return;

            panel.querySelectorAll('.resource-item').forEach(element => {
                const resourceKey = element.getAttribute('data-resource');
                if (!resourceKey) return;

                const amountElement = element.querySelector('.resource-amount');
                if (amountElement) {
                    amountElement.textContent = Math.floor(this.getResourceAmount(resources, resourceKey)).toLocaleString();
                }
            });
        });

        this.updateHeaderDisplay(resources);
    }

    getResourceAmount(resources, key) {
        if (resources[key] !== undefined) return resources[key];

        const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1);
        if (resources[camelCaseKey] !== undefined) return resources[camelCaseKey];

        const rustMap = {
            'coins': 'Gold', 'wood': 'Wood', 'stone': 'Stone',
            'ironOre': 'IronOre', 'copperOre': 'CopperOre', 'aluminumOre': 'AluminumOre',
            'coal': 'Coal', 'oil': 'Oil', 'crystal': 'Crystal', 'food': 'Food'
        };

        const rustKey = rustMap[key];
        return (rustKey && resources[rustKey]) || 0;
    }

    updateHeaderDisplay(resources) {
        this.ensureHeaderCards();

        this.headerResourceConfigs.forEach((config) => {
            const amountElement = document.getElementById(config.amountId);
            if (!amountElement) return;

            const amount = this.getResourceAmount(resources, config.key);
            const resourceName = this.i18n ? this.i18n.t(config.key) : config.key;
            amountElement.textContent = `${resourceName}: ${Math.floor(amount).toLocaleString()}`;

            const rateElementId = config.rateId || `${config.amountId}-rate`;
            const rateElement = document.getElementById(rateElementId);
            const cardElement = amountElement.closest('.header-resource-card');
            const rate = this.getResourceRate(resources, config.key);

            if (rateElement) {
                rateElement.textContent = `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}/s`;
            }

            if (cardElement) {
                cardElement.style.display = rate > 0 ? 'grid' : 'none';
            }
        });

        const cpcElement = document.getElementById('cpc');
        if (cpcElement) {
            const coinsPerClick = resources.coinsPerClick || resources.CoinsPerClick || 0;
            cpcElement.textContent = `+${coinsPerClick.toFixed(1)}/click`;
        }
    }

    getResourceRate(resources, key) {
        const explicitRateMap = {
            coins: ['coinsPerSecond', 'CoinsPerSecond', 'goldPerSecond', 'GoldPerSecond'],
            wood: ['woodPerSecond', 'WoodPerSecond'],
            stone: ['stonePerSecond', 'StonePerSecond']
        };

        const candidates = explicitRateMap[key] || [
            `${key}PerSecond`,
            `${key.charAt(0).toUpperCase() + key.slice(1)}PerSecond`
        ];

        for (const candidate of candidates) {
            if (resources[candidate] !== undefined) {
                return Number(resources[candidate]) || 0;
            }
        }

        return 0;
    }

    ensureHeaderCards() {
        const container = document.querySelector('#banner #resources');
        if (!container || container.children.length > 0) {
            return;
        }

        this.headerResourceConfigs.forEach((config) => {
            const card = document.createElement('div');
            card.className = 'resource-item header-resource-card';
            card.innerHTML = `
                <div class="header-resource-text">
                    <span id="${config.amountId}" class="header-resource-amount">0</span>
                    <span id="${config.rateId || `${config.amountId}-rate`}" class="header-resource-rate">+0.0/s</span>
                </div>
            `;

            container.appendChild(card);
        });

        const clickCard = document.createElement('div');
        clickCard.className = 'resource-item header-resource-card header-click-card';
        clickCard.innerHTML = `
            <div class="header-resource-text">
                <span class="header-resource-amount">点击收益</span>
                <span id="cpc" class="header-resource-rate">+1.0/click</span>
            </div>
        `;
        container.appendChild(clickCard);
    }

    renderToPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const resources = this.update();
        if (!resources) return;

        const resourceKeys = this.getResourceKeysByCategory(this.currentCategory);
        panel.querySelectorAll('.resource-item').forEach((element, index) => {
            const resourceKey = resourceKeys[index];
            if (!resourceKey) return;

            const amountElement = element.querySelector('.resource-amount');
            if (amountElement) {
                amountElement.textContent = Math.floor(this.getResourceAmount(resources, resourceKey)).toLocaleString();
            }
        });
    }
}

window.ResourceManager = ResourceManager;

window.updateResourcePanel = function() {
    if (window.resourceManager && typeof window.resourceManager.update === 'function') {
        const resourcesTab = document.getElementById('tab-resources');
        if (resourcesTab && resourcesTab.classList.contains('active')) {
            window.resourceManager.update();
        }
    }
};
