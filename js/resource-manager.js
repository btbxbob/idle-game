class ResourceManager {
    constructor(rustGame, i18n) {
        this.rustGame = rustGame;
        this.i18n = i18n;
        this.currentCategory = 'primary';
        this.resourceKeys = this.getAllResourceKeys();
        this.bannerResourceKeys = [...this.resourceKeys, 'maggot', 'corpse'];
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

    getResourceIcon(resourceKey) {
        const iconMap = {
            coins: '🪙',
            wood: '🪵',
            stone: '🪨',
            ironOre: '⛏️',
            copperOre: '🔶',
            aluminumOre: '⚪',
            coal: '⚫',
            oil: '🛢️',
            crystal: '💎',
            food: '🍞',
            ironIngot: '🔩',
            copperIngot: '🔶',
            aluminumIngot: '⚪',
            steelPlate: '🪓',
            copperPlate: '🟧',
            aluminumPlate: '⬜',
            glass: '🪟',
            plastic: '🧪',
            chemicals: '⚗️',
            fuel: '⛽',
            paper: '📄',
            ink: '🖋️',
            cloth: '🧵',
            leather: '👜',
            ceramic: '🏺',
            cement: '🧱',
            brick: '🧱',
            rebar: '🔩',
            wire: '🔌',
            pipe: '🚿',
            valve: '⚙️',
            gear: '⚙️',
            bearing: '⚙️',
            spring: '🌀',
            screw: '🔩',
            nut: '🔩',
            washer: '🔩',
            pump: '💧',
            motor: '⚡',
            sensor: '📡',
            circuitBoard: '🔌',
            capacitor: '⚡',
            resistor: '⚡',
            diode: '⚡',
            transistor: '⚡',
            transformer: '⚡',
            generator: '⚡',
            compressor: '💨',
            battery: '🔋',
            microchip: '💾',
            engine: '🚀',
            robot: '🤖',
            satellite: '🛰️',
            spaceship: '🚀',
            quantumComputer: '💻',
            antimatter: '⚛️',
            darkMatter: '🌌',
            timeCrystal: '💎',
            nanobot: '🦠',
            maggot: '🪱',
            corpse: '🦴',
        };

        return iconMap[resourceKey] || '👜';
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

                const iconElement = element.querySelector('.resource-icon');
                const nameElement = element.querySelector('.resource-name');
                const amountElement = element.querySelector('.resource-amount');
                
                if (iconElement) iconElement.textContent = this.getResourceIcon(resourceKey);
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
                    amountElement.textContent = this.formatResourceAmount(this.getResourceAmount(resources, resourceKey));
                }
            });
        });

        this.updateHeaderDisplay(resources);
    }

    getCurrentStageId() {
        if (!this.rustGame || typeof this.rustGame.getProgressionStateJson !== 'function') {
            return 'stage_genesis';
        }
        try {
            const state = JSON.parse(this.rustGame.getProgressionStateJson());
            return state.current_stage_id || 'stage_genesis';
        } catch (error) {
            return 'stage_genesis';
        }
    }

    isResourceRevealed(resourceKey) {
        const resourceStages = {
            coins: 'stage_genesis', wood: 'stage_genesis', stone: 'stage_genesis',
            ironOre: 'stage_workers', copperOre: 'stage_workers', aluminumOre: 'stage_workers', coal: 'stage_workers', oil: 'stage_workers', crystal: 'stage_workers', food: 'stage_workers',
            maggot: 'stage_maggot', corpse: 'stage_maggot',
            darkMatter: 'stage_collective', spaceship: 'stage_collective'
        };
        const stageOrder = ['stage_genesis', 'stage_workers', 'stage_maggot', 'stage_hybrid', 'stage_collective'];
        const currentIndex = stageOrder.indexOf(this.getCurrentStageId());
        const requiredIndex = stageOrder.indexOf(resourceStages[resourceKey] || 'stage_workers');
        return requiredIndex <= currentIndex;
    }

    getResourceAmount(resources, key) {
        if (resources[key] !== undefined) return resources[key];

        const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1);
        if (resources[camelCaseKey] !== undefined) return resources[camelCaseKey];

        const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (resources[pascalCaseKey] !== undefined) return resources[pascalCaseKey];

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

        this.bannerResourceKeys.forEach((resourceKey) => {
            const amountElement = document.getElementById(`banner-${resourceKey}`);
            if (!amountElement) return;

            const amount = this.getResourceAmount(resources, resourceKey);
            const resourceName = this.i18n ? this.i18n.t(resourceKey) : resourceKey;
            amountElement.textContent = `${resourceName}: ${this.formatResourceAmount(amount)}`;

            const rateElement = document.getElementById(`banner-${resourceKey}-rate`);
            const cardElement = amountElement.closest('.header-resource-card');
            const rate = this.getResourceRate(resources, resourceKey);

            if (rateElement) {
                if (rate !== 0) {
                    rateElement.textContent = `${this.formatRate(rate)}/s`;
                    rateElement.style.display = 'block';
                } else {
                    rateElement.textContent = '';
                    rateElement.style.display = 'none';
                }
            }

            if (cardElement) {
                cardElement.style.display = amount !== 0 && this.isResourceRevealed(resourceKey) ? 'grid' : 'none';
            }
        });
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

    formatResourceAmount(amount) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatResource === 'function') {
            return window.NumberFormatter.formatResource(amount);
        }

        return Math.floor(Number(amount) || 0).toLocaleString();
    }

    formatRate(rate) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatRate === 'function') {
            return window.NumberFormatter.formatRate(rate, { includeSign: true, fractionDigits: 1 });
        }

        const numericRate = Number(rate) || 0;
        return `${numericRate >= 0 ? '+' : ''}${numericRate.toFixed(1)}`;
    }

    ensureHeaderCards() {
        const container = document.querySelector('#banner #resources');
        if (!container || container.children.length > 0) {
            return;
        }

        this.bannerResourceKeys.forEach((resourceKey) => {
            const card = document.createElement('div');
            card.className = 'resource-item header-resource-card';
            card.innerHTML = `
                <div class="header-resource-text">
                    <span id="banner-${resourceKey}" class="header-resource-amount">0</span>
                    <span id="banner-${resourceKey}-rate" class="header-resource-rate">+0.0/s</span>
                </div>
            `;

            container.appendChild(card);
        });
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
                amountElement.textContent = this.formatResourceAmount(this.getResourceAmount(resources, resourceKey));
            }
        });
    }
}

window.ResourceManager = ResourceManager;

window.updateResourcePanel = function() {
    if (window.resourceManager && typeof window.resourceManager.update === 'function') {
        window.resourceManager.update();
    }
};
