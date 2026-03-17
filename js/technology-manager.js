/**
 * TechnologyManager - Card-based technology tree UI
 * Matches the visual style of worker cards for consistency
 */
class TechnologyManager {
    constructor(rustGame, i18n) {
        this.rustGame = rustGame;
        this.i18n = i18n;
        this.treeContainer = document.getElementById('technology-tree-container');
        this.technologies = [];
        
        // Filter/sort state
        this.filterState = {
            query: '',
            filterBy: 'all', // 'all', 'available', 'researched'
            hideResearched: false,
            sortBy: 'tier' // 'tier', 'name'
        };
        
        // Cache for preventing excessive re-renders
        this.lastTechStates = new Map();
        this.boundTechnologyTab = null;
    }

    initialize() {
        if (!this.rustGame || typeof this.rustGame.get_technologies !== 'function') {
            console.warn('TechnologyManager: rustGame or get_technologies not available');
            this.technologies = [];
            return;
        }

        try {
            const techData = this.rustGame.get_technologies();
            this.technologies = Array.isArray(techData) ? techData : [];
            this.cacheTechStates();
            this.renderTree();
            this.bindEvents();
        } catch (error) {
            console.error('TechnologyManager: Error loading technologies:', error);
            this.technologies = [];
        }
    }

    /**
     * Cache current technology states for change detection
     */
    cacheTechStates() {
        this.lastTechStates.clear();
        this.technologies.forEach(tech => {
            this.lastTechStates.set(tech.id, {
                researched: tech.researched || tech.purchased || false,
                canResearch: this.canResearch(tech),
                costs: JSON.stringify(tech.costs || {})
            });
        });
    }

    /**
     * Check if any technology state has changed
     */
    hasStateChanged() {
        if (this.lastTechStates.size !== this.technologies.length) return true;
        
        for (const tech of this.technologies) {
            const cached = this.lastTechStates.get(tech.id);
            if (!cached) return true;
            
            const currentState = {
                researched: tech.researched || tech.purchased || false,
                canResearch: this.canResearch(tech),
                costs: JSON.stringify(tech.costs || {})
            };
            
            if (JSON.stringify(cached) !== JSON.stringify(currentState)) {
                return true;
            }
        }
        return false;
    }

    update() {
        if (!this.rustGame || typeof this.rustGame.get_technologies !== 'function') {
            return;
        }

        try {
            const techData = this.rustGame.get_technologies();
            this.technologies = Array.isArray(techData) ? techData : [];
            
            const technologyTab = document.getElementById('tab-technology');
            if (technologyTab && technologyTab.classList.contains('active')) {
                // Only re-render if state actually changed
                if (this.hasStateChanged()) {
                    const filtered = this.getFilteredTechnologies();
                    if (this.needsFullCardRender(filtered)) {
                        this.renderTechCards(filtered);
                    } else {
                        this.syncRenderedCards(filtered);
                    }
                    this.syncToolsDisplay();
                    this.cacheTechStates();
                }
            }
        } catch (error) {
            console.error('TechnologyManager: Error updating technologies:', error);
        }
    }

    getCurrentObjectiveChain() {
        if (!this.rustGame || typeof this.rustGame.getCurrentObjectiveChainJson !== 'function') {
            return null;
        }

        try {
            return JSON.parse(this.rustGame.getCurrentObjectiveChainJson());
        } catch (error) {
            console.error('TechnologyManager: Failed to read objective chain:', error);
            return null;
        }
    }

    getRecommendedTechnologyId() {
        const objectiveChain = this.getCurrentObjectiveChain();
        const currentObjectiveId = objectiveChain && objectiveChain.current_objective_id
            ? objectiveChain.current_objective_id
            : null;
        const stageId = objectiveChain && objectiveChain.stage_id ? objectiveChain.stage_id : null;

        if (currentObjectiveId === 'research_first_tech') {
            if (this.technologies.some((tech) => tech.id === 'BasicAgriculture')) {
                return 'BasicAgriculture';
            }
        }

        if (currentObjectiveId === 'research_maggot_tech') {
            if (this.technologies.some((tech) => tech.id === 'MaggotBreeding')) {
                return 'MaggotBreeding';
            }
            if (this.technologies.some((tech) => tech.id === 'NecroticRecycling')) {
                return 'NecroticRecycling';
            }
        }

        if (currentObjectiveId === 'research_hive_mind') {
            if (this.technologies.some((tech) => tech.id === 'HiveMindProtocol')) {
                return 'HiveMindProtocol';
            }
        }

        if (currentObjectiveId === 'upload_consciousness') {
            if (this.technologies.some((tech) => tech.id === 'ConsciousnessUpload')) {
                return 'ConsciousnessUpload';
            }
        }

        const priority = stageId === 'stage_collective'
            ? ['CollectiveAwakening', 'ConsciousnessUpload', 'SpaceExploration', 'QuantumComputing']
            : stageId === 'stage_hybrid'
                ? ['SymbioticHosts', 'HiveMindProtocol']
                : stageId === 'stage_maggot'
                    ? ['MaggotBreeding', 'NecroticRecycling', 'SymbioticHosts']
                    : ['BasicAgriculture', 'BasicSmelting', 'BasicEngineering', 'BasicChemistry', 'Electronics'];

        const available = this.technologies.filter((tech) => this.canResearch(tech) && !(tech.researched || tech.purchased));
        for (const techId of priority) {
            if (available.some((tech) => tech.id === techId)) {
                return techId;
            }
        }

        return null;
    }

    /**
     * Main render method - builds tools + card grid
     */
    render() {
        if (!this.treeContainer) return;
        
        this.renderTools();
        this.renderTechCards();
    }

    /**
     * Render filter/sort tools bar
     */
    renderTools() {
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        const researchedCount = this.technologies.filter(t => t.researched || t.purchased).length;
        const availableCount = this.technologies.filter(t => this.canResearch(t) && !(t.researched || t.purchased)).length;
        
        // Find or create tools container
        let toolsEl = this.treeContainer.querySelector('.tech-tools');
        if (!toolsEl) {
            toolsEl = document.createElement('div');
            toolsEl.className = 'tech-tools';
            this.treeContainer.appendChild(toolsEl);
            toolsEl.innerHTML = `
                <input type="text" class="tech-search">
                <select class="tech-filter"></select>
                <label class="tech-hide-researched">
                    <input type="checkbox">
                    <span class="tech-hide-label"></span>
                </label>
                <span class="tech-count"></span>
            `;
            this.bindToolEvents(toolsEl);
        }

        const searchEl = toolsEl.querySelector('.tech-search');
        const filterEl = toolsEl.querySelector('.tech-filter');
        const hideCheckbox = toolsEl.querySelector('.tech-hide-researched input');
        const hideLabel = toolsEl.querySelector('.tech-hide-label');
        const countEl = toolsEl.querySelector('.tech-count');

        if (searchEl) {
            searchEl.placeholder = t('search') || '搜索科技';
            if (searchEl.value !== this.filterState.query) {
                searchEl.value = this.filterState.query;
            }
        }

        if (filterEl) {
            filterEl.innerHTML = `
                <option value="all">${t('all') || '全部'} (${this.technologies.length})</option>
                <option value="available">${t('available') || '可研究'} (${availableCount})</option>
                <option value="researched">${t('researched') || '已研究'} (${researchedCount})</option>
            `;
            filterEl.value = this.filterState.filterBy;
        }

        if (hideCheckbox) {
            hideCheckbox.checked = this.filterState.hideResearched;
        }

        if (hideLabel) {
            hideLabel.textContent = t('hideResearched') || '隐藏已研究';
        }

        if (countEl) {
            countEl.textContent = `${researchedCount}/${this.technologies.length}`;
        }
    }

    syncToolsDisplay() {
        if (!this.treeContainer || !this.treeContainer.querySelector('.tech-tools')) {
            return;
        }

        this.renderTools();
    }

    /**
     * Bind events for filter/sort tools
     */
    bindToolEvents(toolsEl) {
        const search = toolsEl.querySelector('.tech-search');
        const filter = toolsEl.querySelector('.tech-filter');
        const hideCheckbox = toolsEl.querySelector('.tech-hide-researched input');
        
        if (search) {
            search.addEventListener('input', (e) => {
                this.filterState.query = e.target.value || '';
                this.renderTechCards();
            });
        }
        
        if (filter) {
            filter.addEventListener('change', (e) => {
                this.filterState.filterBy = e.target.value || 'all';
                this.renderTechCards();
            });
        }
        
        if (hideCheckbox) {
            hideCheckbox.addEventListener('change', (e) => {
                this.filterState.hideResearched = e.target.checked;
                this.renderTechCards();
            });
        }
    }

    /**
     * Render technology cards in a grid
     */
    renderTechCards(filteredTechnologies = null) {
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        
        // Find or create grid container
        let gridEl = this.treeContainer.querySelector('.tech-grid');
        if (!gridEl) {
            gridEl = document.createElement('div');
            gridEl.className = 'tech-grid';
            this.treeContainer.appendChild(gridEl);
        }
        
        // Filter technologies
        const filtered = filteredTechnologies || this.getFilteredTechnologies();
        
        if (filtered.length === 0) {
            gridEl.innerHTML = `<p class="no-technologies" style="padding:20px;text-align:center;opacity:0.7;">${t('noTechnologies') || '暂无科技可研究'}</p>`;
            return;
        }
        
        // Render cards
        let html = '';
        for (const tech of filtered) {
            html += this.renderTechCard(tech, t);
        }
        gridEl.innerHTML = html;
        
        // Bind card events
        this.bindCardEvents(gridEl);
    }

    needsFullCardRender(filtered) {
        if (!this.treeContainer) return true;

        const gridEl = this.treeContainer.querySelector('.tech-grid');
        if (!gridEl) return true;

        const renderedCards = Array.from(gridEl.querySelectorAll('.tech-card'));
        if (renderedCards.length !== filtered.length) return true;

        const renderedIds = renderedCards.map((card) => card.getAttribute('data-tech-id'));
        const filteredIds = filtered.map((tech) => tech.id);
        return renderedIds.some((id, index) => id !== filteredIds[index]);
    }

    syncRenderedCards(filtered) {
        if (!this.treeContainer) return;

        const gridEl = this.treeContainer.querySelector('.tech-grid');
        if (!gridEl) return;

        filtered.forEach((tech) => {
            const card = gridEl.querySelector(`.tech-card[data-tech-id="${CSS.escape(String(tech.id))}"]`);
            if (card) {
                this.updateTechCardElement(card, tech);
            }
        });
    }

    updateTechCardElement(card, tech) {
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        const isResearched = tech.researched || tech.purchased || false;
        const canResearch = this.canResearch(tech);
        const hasResources = this.hasResources(tech.costs);
        const statusClass = isResearched ? 'researched' : (canResearch ? '' : 'locked');
        const statusIcon = isResearched ? '✓' : '';

        card.className = `tech-card ${statusClass}`.trim();

        const statusEl = card.querySelector('.tech-status');
        if (statusEl) {
            statusEl.textContent = statusIcon;
            statusEl.style.display = statusIcon ? '' : 'none';
        }

        const effectEl = card.querySelector('.tech-effect');
        if (effectEl) {
            effectEl.textContent = this.getEffectDescription(tech);
        }

        const bodyEl = card.querySelector('.tech-body');
        if (bodyEl) {
            const existingCosts = bodyEl.querySelector('.tech-costs');
            const costsMarkup = this.renderTechCostsHtml(tech.costs);
            if (costsMarkup) {
                if (existingCosts) {
                    existingCosts.outerHTML = costsMarkup;
                } else {
                    bodyEl.insertAdjacentHTML('beforeend', costsMarkup);
                }
            } else if (existingCosts) {
                existingCosts.remove();
            }
        }

        const footerEl = card.querySelector('.tech-footer');
        if (footerEl) {
            footerEl.innerHTML = this.renderTechFooterHtml(tech, t, canResearch, hasResources, isResearched);
        }

        card.classList.toggle('recommended', this.getRecommendedTechnologyId() === tech.id && !isResearched);
    }

    renderTechCostsHtml(costs) {
        if (!costs || Object.keys(costs).length === 0) {
            return '';
        }

        const costItems = this.sortCosts(costs).map(([resource, amount]) => {
            const hasEnough = this.getResourceValue(resource) >= amount;
            const insufficientClass = !hasEnough ? 'insufficient' : '';
            return `<span class="tech-cost-item ${insufficientClass}">${this.getResourceName(resource)}: ${this.formatInteger(amount)}</span>`;
        });

        return `<div class="tech-costs">${costItems.join('')}</div>`;
    }

    renderTechFooterHtml(tech, t, canResearch, hasResources, isResearched) {
        if (!isResearched) {
            const btnClass = canResearch && hasResources ? 'can-research' : (canResearch ? 'cannot-afford' : '');
            const btnDisabled = !canResearch || !hasResources ? 'disabled' : '';
            const btnText = canResearch ? (hasResources ? (t('research') || '研究') : (t('insufficientResources') || '资源不足')) : (t('locked') || '未解锁');
            return `<button class="tech-research-btn ${btnClass}" ${btnDisabled} data-tech-id="${tech.id}">${btnText}</button>`;
        }

        return `<span style="color:#27ae60;font-size:11px;">✓ ${t('researched') || '已研究'}</span>`;
    }

    /**
     * Get filtered and sorted technologies
     */
    getFilteredTechnologies() {
        const query = this.filterState.query.trim().toLowerCase();
        const filterBy = this.filterState.filterBy;
        const hideResearched = this.filterState.hideResearched;
        
        let filtered = this.technologies.filter(tech => {
            // Filter by status
            const isResearched = tech.researched || tech.purchased || false;
            const isAvailable = this.canResearch(tech);
            
            if (filterBy === 'available' && (isResearched || !isAvailable)) return false;
            if (filterBy === 'researched' && !isResearched) return false;
            if (hideResearched && isResearched) return false;
            
            // Filter by search query
            if (query) {
                const searchStr = `${tech.name || ''} ${tech.description || ''} ${this.getEffectDescription(tech)}`.toLowerCase();
                if (!searchStr.includes(query)) return false;
            }
            
            return true;
        });
        
        // Sort by tier then name
        const recommendedId = this.getRecommendedTechnologyId();

        filtered.sort((a, b) => {
            const recommendedA = a.id === recommendedId ? 1 : 0;
            const recommendedB = b.id === recommendedId ? 1 : 0;
            if (recommendedA !== recommendedB) return recommendedB - recommendedA;

            const tierA = a.tier || 1;
            const tierB = b.tier || 1;
            if (tierA !== tierB) return tierA - tierB;
            return String(a.name || '').localeCompare(String(b.name || ''));
        });
        
        return filtered;
    }

    /**
     * Render a single technology card
     */
    renderTechCard(tech, t) {
        const isResearched = tech.researched || tech.purchased || false;
        const canResearch = this.canResearch(tech);
        const hasResources = this.hasResources(tech.costs);
        const statusClass = isResearched ? 'researched' : (canResearch ? '' : 'locked');
        const effectDesc = this.getEffectDescription(tech);
        const isRecommended = this.getRecommendedTechnologyId() === tech.id && !isResearched;
        
        // Status icon and text
        const statusIcon = isResearched ? '✓' : '';
        
        const costsHtml = this.renderTechCostsHtml(tech.costs);
        const buttonHtml = this.renderTechFooterHtml(tech, t, canResearch, hasResources, isResearched);
        
        return `
            <div class="tech-card ${statusClass} ${isRecommended ? 'recommended' : ''}" data-tech-id="${tech.id}">
                <div class="tech-header">
                    <span class="tech-name">
                        <span class="tech-badge">T${tech.tier || 1}</span>
                        ${this.escapeHtml(tech.name || tech.id)}
                    </span>
                    ${statusIcon ? `<span class="tech-status">${statusIcon}</span>` : ''}
                </div>
                <div class="tech-body">
                    ${isRecommended ? '<div class="tech-recommendation">推荐路线</div>' : ''}
                    <div class="tech-effect">${this.escapeHtml(effectDesc)}</div>
                    ${costsHtml}
                </div>
                <div class="tech-footer">
                    ${buttonHtml}
                </div>
            </div>
        `;
    }

    /**
     * Bind click events for technology cards
     */
    bindCardEvents(gridEl) {
        if (!gridEl || gridEl.dataset.techEventsBound === 'true') {
            return;
        }

        gridEl.addEventListener('click', (e) => {
            const researchButton = e.target.closest('.tech-research-btn');
            if (researchButton && gridEl.contains(researchButton)) {
                e.stopPropagation();
                if (researchButton.disabled) {
                    return;
                }

                const techId = researchButton.getAttribute('data-tech-id');
                if (techId) {
                    this.researchTechnology(techId);
                }
                return;
            }

            const card = e.target.closest('.tech-card');
            if (card && gridEl.contains(card)) {
                const techId = card.getAttribute('data-tech-id');
                if (techId) {
                    this.showTechDetail(techId);
                }
            }
        });

        gridEl.dataset.techEventsBound = 'true';
    }

    /**
     * Show technology detail modal
     */
    showTechDetail(techId) {
        const tech = this.technologies.find(t => t.id === techId);
        if (!tech) return;
        
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        const isResearched = tech.researched || tech.purchased || false;
        const canResearch = this.canResearch(tech);
        const hasResources = this.hasResources(tech.costs);
        const effectDesc = this.getEffectDescription(tech);
        
        // Build costs HTML
        let costsHtml = '';
        if (tech.costs && Object.keys(tech.costs).length > 0) {
            costsHtml = '<div class="tech-detail-row"><strong>' + (t('costs') || '花费') + ':</strong><br>';
            for (const [resource, amount] of this.sortCosts(tech.costs)) {
                const hasEnough = this.getResourceValue(resource) >= amount;
                const color = hasEnough ? '#27ae60' : '#e74c3c';
                costsHtml += `<span style="color:${color}">${this.getResourceName(resource)}: ${this.formatInteger(amount)}</span> `;
            }
            costsHtml += '</div>';
        }
        
        // Build dependencies HTML
        let depsHtml = '';
        if (tech.dependencies && tech.dependencies.length > 0) {
            depsHtml = '<div class="tech-detail-row"><strong>' + (t('dependencies') || '前置科技') + ':</strong><br>';
            tech.dependencies.forEach(depId => {
                const depTech = this.technologies.find(t => t.id === depId);
                const depName = depTech ? depTech.name : depId;
                const depResearched = depTech && (depTech.researched || depTech.purchased);
                const color = depResearched ? '#27ae60' : '#e74c3c';
                depsHtml += `<span style="color:${color}">${depResearched ? '✓' : '○'} ${this.escapeHtml(depName)}</span> `;
            });
            depsHtml += '</div>';
        }
        
        // Build button HTML
        let buttonHtml = '';
        if (!isResearched) {
            const btnDisabled = !canResearch || !hasResources ? 'disabled' : '';
            const btnText = canResearch ? (hasResources ? (t('research') || '研究') : (t('insufficientResources') || '资源不足')) : (t('locked') || '未解锁');
            buttonHtml = `<button class="tech-research-btn" style="width:100%;margin-top:10px;" ${btnDisabled} id="modal-research-btn">${btnText}</button>`;
        }
        
        // Create modal
        const existingModal = document.getElementById('tech-detail-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'tech-detail-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:400px;">
                <div class="modal-header">
                    <h3>${this.escapeHtml(tech.name || tech.id)}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="padding:15px;">
                    <div class="tech-detail-row">
                        <span class="tech-badge" style="background:#333;color:#fff;">T${tech.tier || 1}</span>
                        <span style="margin-left:8px;font-weight:bold;color:${isResearched ? '#27ae60' : (canResearch ? '#e67e22' : '#e74c3c')}">
                            ${isResearched ? (t('researched') || '已研究') : (canResearch ? (t('available') || '可研究') : (t('locked') || '未解锁'))}
                        </span>
                    </div>
                    <p style="margin:10px 0;color:#666;font-size:12px;">${this.escapeHtml(tech.description || '')}</p>
                    <div class="tech-detail-row" style="color:#3498db;"><strong>${t('effect') || '效果'}:</strong> ${this.escapeHtml(effectDesc)}</div>
                    ${costsHtml}
                    ${depsHtml}
                    ${buttonHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind modal events
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        const researchBtn = modal.querySelector('#modal-research-btn');
        if (researchBtn && !researchBtn.disabled) {
            researchBtn.addEventListener('click', () => {
                this.researchTechnology(techId);
                modal.remove();
            });
        }
    }

    // =====================
    // Core logic methods
    // =====================

    canResearch(tech) {
        if (!tech) return false;
        if (typeof tech.can_research === 'boolean') return tech.can_research;
        if (typeof tech.canResearch === 'boolean') return tech.canResearch;
        if (tech.researched || tech.purchased) return false;
        if (tech.dependencies && tech.dependencies.length > 0) {
            for (const depId of tech.dependencies) {
                const depTech = this.technologies.find(t => t.id === depId);
                if (!depTech || !(depTech.researched || depTech.purchased)) {
                    return false;
                }
            }
        }
        return true;
    }

    hasResources(costs) {
        if (!costs || Object.keys(costs).length === 0) return true;
        for (const [resource, amount] of Object.entries(costs)) {
            if (this.getResourceValue(resource) < amount) return false;
        }
        return true;
    }

    getResourceValue(resourceType) {
        if (!this.rustGame) return 0;
        
        if (typeof this.rustGame.get_resources === 'function') {
            try {
                const resources = this.rustGame.get_resources();
                if (resources && typeof resources === 'object') {
                    const direct = resources[resourceType];
                    if (typeof direct === 'number') return direct;
                    
                    const camelMap = {
                        Gold: 'coins', Wood: 'wood', Stone: 'stone', IronOre: 'ironOre',
                        CopperOre: 'copperOre', AluminumOre: 'aluminumOre',
                        Coal: 'coal', Oil: 'oil', Crystal: 'crystal', Food: 'food'
                    };
                    const camelKey = camelMap[resourceType];
                    if (camelKey && typeof resources[camelKey] === 'number') {
                        return resources[camelKey];
                    }
                }
            } catch (error) {
                // Fall through to individual getters
            }
        }
        
        const resourceMap = {
            'Gold': 'get_coins', 'Wood': 'get_wood', 'Stone': 'get_stone',
            'IronOre': 'get_iron_ore', 'CopperOre': 'get_copper_ore',
            'AluminumOre': 'get_aluminum_ore', 'Coal': 'get_coal',
            'Oil': 'get_oil', 'Crystal': 'get_crystal', 'Food': 'get_food'
        };
        const getter = resourceMap[resourceType];
        if (getter && typeof this.rustGame[getter] === 'function') {
            return this.rustGame[getter]();
        }
        return 0;
    }

    getResourceName(resourceType) {
        const resourceKeyMap = {
            Gold: 'coins',
            Wood: 'wood',
            Stone: 'stone',
            IronOre: 'ironOre',
            CopperOre: 'copperOre',
            AluminumOre: 'aluminumOre',
            Coal: 'coal',
            Oil: 'oil',
            Crystal: 'crystal',
            Food: 'food',
            IronIngot: 'ironIngot',
            CopperIngot: 'copperIngot',
            AluminumIngot: 'aluminumIngot',
            SteelPlate: 'steelPlate',
            CopperPlate: 'copperPlate',
            AluminumPlate: 'aluminumPlate',
            Glass: 'glass',
            Plastic: 'plastic',
            Chemicals: 'chemicals',
            Fuel: 'fuel',
            Paper: 'paper',
            Ink: 'ink',
            Cloth: 'cloth',
            Leather: 'leather',
            Ceramic: 'ceramic',
            Cement: 'cement',
            Brick: 'brick',
            Rebar: 'rebar',
            Wire: 'wire',
            Pipe: 'pipe',
            Valve: 'valve',
            Gear: 'gear',
            Bearing: 'bearing',
            Spring: 'spring',
            Screw: 'screw',
            Nut: 'nut',
            Washer: 'washer',
            Pump: 'pump',
            Motor: 'motor',
            Sensor: 'sensor',
            CircuitBoard: 'circuitBoard',
            Capacitor: 'capacitor',
            Resistor: 'resistor',
            Diode: 'diode',
            Transistor: 'transistor',
            Transformer: 'transformer',
            Generator: 'generator',
            Compressor: 'compressor',
            Battery: 'battery',
            Microchip: 'microchip',
            Engine: 'engine',
            Robot: 'robot',
            Satellite: 'satellite',
            Spaceship: 'spaceship',
            QuantumComputer: 'quantumComputer',
            Antimatter: 'antimatter',
            DarkMatter: 'darkMatter',
            TimeCrystal: 'timeCrystal',
            Nanobot: 'nanobot',
            Maggot: 'maggot',
            Corpse: 'corpse'
        };

        if (this.i18n) {
            const mappedKey = resourceKeyMap[resourceType] || resourceType;
            const translated = this.i18n.t(mappedKey);
            if (translated && translated !== mappedKey) {
                return translated;
            }
        }

        return resourceType;
    }

    getResourceShortName(resourceType) {
        const shortNames = {
            'Gold': '金', 'Wood': '木', 'Stone': '石',
            'IronOre': '铁', 'CopperOre': '铜', 'AluminumOre': '铝',
            'Coal': '煤', 'Oil': '油', 'Crystal': '晶', 'Food': '食'
        };
        return shortNames[resourceType] || resourceType.substring(0, 2);
    }

    sortCosts(costs) {
        if (!costs || typeof costs !== 'object') return [];
        
        const resourcePriority = [
            'Gold', 'Wood', 'Stone', 'IronOre', 'CopperOre', 'AluminumOre',
            'Coal', 'Oil', 'Crystal', 'Food'
        ];
        
        const entries = Object.entries(costs);
        entries.sort((a, b) => {
            const indexA = resourcePriority.indexOf(a[0]);
            const indexB = resourcePriority.indexOf(b[0]);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a[0].localeCompare(b[0]);
        });
        
        return entries;
    }

    getEffectDescription(tech) {
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        
        if (!tech.effect) return tech.description || (t('unknownEffect') || '未知效果');
        
        const effectKeys = Object.keys(tech.effect);
        if (effectKeys.length === 0) return tech.description || (t('unknownEffect') || '未知效果');
        
        const effectType = effectKeys[0];
        const effectData = tech.effect[effectType];
        
        switch (effectType) {
            case 'ProductionBonus':
                if (Array.isArray(effectData) && effectData.length >= 2) {
                    const resource = effectData[0];
                    const value = effectData[1];
                    return `+${this.formatInteger(value * 100)}% ${this.getResourceName(resource)} 产量`;
                }
                return `+${this.formatInteger(tech.effect_value * 100)}% 产量`;
            
            case 'UnlockBuilding':
                return `🏗️ 解锁: ${effectData || '未知建筑'}`;
            
            case 'UnlockUI':
                return '🔓 解锁新功能';
            
            case 'MechanicChange':
                if (typeof effectData === 'string') {
                    return this.getMechanicDescription(effectData);
                }
                return tech.description || '游戏机制改变';
            
            default:
                return tech.description || (t('unknownEffect') || '未知效果');
        }
    }

    formatInteger(value) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
            return window.NumberFormatter.formatInteger(value);
        }

        return Math.floor(Number(value) || 0).toLocaleString();
    }

    getMechanicDescription(mechanic) {
        const descriptions = {
            'auto_production': '🤖 自动化生产',
            'full_automation': '⚙️ 全自动化',
            'ai_assistance': '🤖 AI助手',
            'ai_optimization': '🧠 AI优化',
            'molecular_assembly': '🔬 分子组装',
            'genetic_optimization': '🧬 基因优化',
            'nuclear_power': '⚡ 核能',
            'fusion_power': '☀️ 聚变能源',
            'terraforming': '🌍 行星改造',
            'time_manipulation': '⏰ 时间操控',
            'dimensional_travel': '🌌 维度旅行',
            'consciousness_upload': '🧠 意识上传',
            'immortality': '✨ 永生',
            'godhood': '🌟 神级能力',
            'click_efficiency': '👆 点击效率',
            'resource_boost': '💎 资源增益',
            'production_multiplier': '📈 生产倍增',
            'cost_reduction': '💰 成本降低',
            'critical_click': '💥 暴击点击',
            'auto_assignment': '👥 自动分配',
            'legacy_bonus': '👑 遗产加成',
            'ascension': '🚀 飞升',
            'omniscience': '👁️ 全知全能'
        };
        return descriptions[mechanic] || `⚙️ ${mechanic}`;
    }

    researchTechnology(techId) {
        if (!this.rustGame || typeof this.rustGame.research_technology !== 'function') {
            console.warn('TechnologyManager: research_technology not available');
            return false;
        }

        try {
            const success = this.rustGame.research_technology(techId);
            if (success) {
                this.cacheTechStates();
                this.renderTree();
                this.selectTechnology(techId);
                console.log('Technology researched:', techId);
            } else {
                const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
                this.showNotification(t('researchFailed') || '研究失败');
            }
            return success;
        } catch (error) {
            const message = String(error?.message || error);
            const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
            
            if (message.toLowerCase().includes('cannot afford') || message.toLowerCase().includes('insufficient')) {
                this.showNotification(t('insufficientResources') || '资源不足');
            } else {
                console.error('TechnologyManager: Error researching:', error);
            }
            return false;
        }
    }

    showNotification(message) {
        const existing = document.getElementById('tech-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.id = 'tech-notification';
        notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#333;color:#fff;padding:10px 20px;border-radius:4px;z-index:10000;font-size:13px;';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    // =====================
    // Backward-compatible stubs for old tests
    // =====================

    /** @deprecated Use render() instead */
    renderTree() {
        this.render();
    }

    /** @deprecated Use render() instead */
    renderTextBasedTree() {
        this.render();
    }

    /** @deprecated Use showTechDetail() instead */
    selectTechnology(techId) {
        const tech = this.technologies.find(t => t.id === techId);
        if (tech) {
            this.showTechDetail(techId);
        }
    }

    /** @deprecated Use render() instead */
    renderToPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('TechnologyManager: Container not found:', containerId);
            return;
        }
        if (!this.treeContainer || this.treeContainer.parentNode !== container) {
            container.innerHTML = '<div id="technology-tree-container"></div>';
            this.treeContainer = document.getElementById('technology-tree-container');
        }
        this.render();
    }



    // =====================
    // Removed force-directed graph methods (stubs for backward compatibility)
    // =====================

    /** @deprecated Force-directed graph removed - no-op */
    renderForceDirectedGraph() { this.render(); }

    /** @deprecated Force-directed graph removed - no-op */
    startForceSimulation() {}

    /** @deprecated Force-directed graph removed - no-op */
    stopForceSimulation() {}

    /** @deprecated Force-directed graph removed - no-op */
    updatePhysics() {}

    /** @deprecated Force-directed graph removed - no-op */
    setupCanvasEvents() {}

    /** @deprecated Force-directed graph removed - no-op */
    selectNode() {}

    /** @deprecated Use showTechDetail() instead */
    updateDetailPanel() {}


    bindEvents() {
        // Tab activation check
        const technologyTab = document.getElementById('tab-technology');
        if (technologyTab && technologyTab !== this.boundTechnologyTab) {
            this.boundTechnologyTab = technologyTab;
            const observer = new MutationObserver(() => {
                if (technologyTab.classList.contains('active')) {
                    this.update();
                }
            });
            observer.observe(technologyTab, { attributes: true, attributeFilter: ['class'] });
        }
    }
}

// Export
window.TechnologyManager = TechnologyManager;

window.updateTechnologyPanel = function() {
    if (window.technologyManager && typeof window.technologyManager.update === 'function') {
        const technologyTab = document.getElementById('tab-technology');
        if (technologyTab && technologyTab.classList.contains('active')) {
            window.technologyManager.update();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('TechnologyManager class loaded (card-based UI)');
});
