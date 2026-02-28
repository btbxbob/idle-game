class ResourceManager {
    constructor(rustGame, i18n) {
        this.rustGame = rustGame;
        this.i18n = i18n;
        this.currentCategory = 'primary';
        this.resourceKeys = this.getAllResourceKeys();
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
        const headerResources = [
            { key: 'coins', elementId: 'coins' },
            { key: 'wood', elementId: 'wood' },
            { key: 'stone', elementId: 'stone' }
        ];

        headerResources.forEach(({ key, elementId }) => {
            const element = document.getElementById(elementId);
            if (!element) return;

            const amount = this.getResourceAmount(resources, key);
            const resourceName = this.i18n ? this.i18n.t(key) : key;
            
            element.textContent = this.i18n
                ? this.i18n.t('resourceFormat', { resource: resourceName, amount: Math.floor(amount) })
                : `${resourceName}: ${Math.floor(amount)}`;
        });

        const productionRates = [
            { key: 'coins', rateKey: 'coinsPerSecond', elementId: 'cps' },
            { key: 'wood', rateKey: 'woodPerSecond', elementId: 'wps' },
            { key: 'stone', rateKey: 'stonePerSecond', elementId: 'sps' }
        ];

        productionRates.forEach(({ key, rateKey, elementId }) => {
            const element = document.getElementById(elementId);
            if (!element) return;

            const amount = this.getResourceAmount(resources, rateKey) || 0;
            const resourceName = this.i18n ? this.i18n.t(key) : key;
            
            element.textContent = this.i18n
                ? this.i18n.t('productionFormat', { resource: resourceName, amount: amount.toFixed(1) })
                : `${resourceName}/sec: ${amount.toFixed(1)}`;
        });

        const cpcElement = document.getElementById('cpc');
        if (cpcElement && this.i18n) {
            const coinsPerClick = resources.coinsPerClick || resources.CoinsPerClick || 0;
            cpcElement.textContent = this.i18n.t('clickFormat', {
                resource: this.i18n.t('coins'),
                amount: coinsPerClick.toFixed(1)
            });
        }
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
