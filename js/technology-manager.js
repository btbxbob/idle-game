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

    isEnglish() {
        return this.i18n && this.i18n.currentLanguage === 'en';
    }

    getTechnologyName(tech) {
        const techId = tech && tech.id ? String(tech.id) : '';
        if (!this.isEnglish()) {
            return tech && tech.name ? tech.name : techId;
        }

        const names = {
            BasicMining: 'Basic Mining',
            AdvancedMining: 'Advanced Mining',
            BasicLogging: 'Basic Logging',
            AdvancedLogging: 'Advanced Logging',
            BasicQuarrying: 'Basic Quarrying',
            AdvancedQuarrying: 'Advanced Quarrying',
            BasicSmelting: 'Basic Smelting',
            AdvancedSmelting: 'Advanced Smelting',
            BasicAgriculture: 'Basic Agriculture',
            AdvancedAgriculture: 'Advanced Agriculture',
            BasicRefining: 'Basic Refining',
            AdvancedRefining: 'Advanced Refining',
            BasicChemistry: 'Basic Chemistry',
            AdvancedChemistry: 'Advanced Chemistry',
            BasicEngineering: 'Basic Engineering',
            MassProduction: 'Mass Production',
            Automation: 'Automation',
            Robotics: 'Robotics',
            AdvancedRobotics: 'Advanced Robotics',
            Electronics: 'Electronics',
            AdvancedElectronics: 'Advanced Electronics',
            ComputerTechnology: 'Computer Technology',
            AITechnology: 'AI Technology',
            AdvancedAI: 'Advanced AI',
            Nanotechnology: 'Nanotechnology',
            AdvancedNanotech: 'Advanced Nanotechnology',
            Biotechnology: 'Biotechnology',
            GeneticEngineering: 'Genetic Engineering',
            MaggotBreeding: 'Maggot Breeding',
            NecroticRecycling: 'Necrotic Recycling',
            SymbioticHosts: 'Symbiotic Hosts',
            HiveMindProtocol: 'Hive Mind Protocol',
            CollectiveAwakening: 'Collective Awakening',
            RenewableEnergy: 'Renewable Energy',
            NuclearEnergy: 'Nuclear Energy',
            QuantumComputing: 'Quantum Computing',
            FusionEnergy: 'Fusion Energy',
            AntimatterEnergy: 'Antimatter Energy',
            SpaceExploration: 'Space Exploration',
            Terraforming: 'Terraforming',
            TimeManipulation: 'Time Manipulation',
            DimensionalTravel: 'Dimensional Travel',
            ConsciousnessUpload: 'Consciousness Upload',
            Immortality: 'Immortality',
            Godhood: 'Godhood',
            ClickEfficiency: 'Click Efficiency',
            ResourceBoost: 'Resource Boost',
            ProductionMultiplier: 'Production Multiplier',
            CostReduction: 'Cost Reduction',
            CriticalClick: 'Critical Click',
            AutoAssignment: 'Auto Assignment',
            Prestige: 'Prestige',
            Legacy: 'Legacy',
            Ascension: 'Ascension',
            Omniscience: 'Omniscience',
        };

        return names[techId] || (tech && tech.name) || techId || '';
    }

    humanizeIdentifier(value) {
        const text = value == null ? '' : String(value);
        if (!text || text.includes(' ')) {
            return text;
        }
        return text.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    getTechnologyDescription(tech) {
        const techId = tech && tech.id ? String(tech.id) : '';
        if (!this.isEnglish()) {
            return tech && tech.description ? tech.description : '';
        }

        const descriptions = {
            BasicMining: 'Unlocks basic mining methods and improves ore gathering efficiency.',
            AdvancedMining: 'Advanced mining methods that greatly increase ore production.',
            BasicLogging: 'Unlocks basic logging techniques and improves wood gathering efficiency.',
            AdvancedLogging: 'Advanced logging methods that greatly increase wood production.',
            BasicQuarrying: 'Unlocks basic quarrying and improves stone gathering efficiency.',
            AdvancedQuarrying: 'Advanced quarrying methods that greatly increase stone production.',
            BasicSmelting: 'Unlocks basic smelting and improves metal output.',
            AdvancedSmelting: 'Advanced smelting methods that greatly increase metal output.',
            BasicAgriculture: 'Unlocks basic agriculture and improves food production.',
            AdvancedAgriculture: 'Advanced agriculture that greatly increases food output.',
            BasicRefining: 'Unlocks basic refining and improves refining efficiency.',
            AdvancedRefining: 'Advanced refining methods that greatly improve refining efficiency.',
            BasicChemistry: 'Unlocks basic chemistry and improves chemical output.',
            AdvancedChemistry: 'Advanced chemistry that greatly increases chemical output.',
            BasicEngineering: 'Unlocks basic engineering and improves component output.',
            MassProduction: 'Industrial-scale production methods that improve all output.',
            Automation: 'Automated workflows that reduce manual labor requirements.',
            Robotics: 'Industrial robotics that deepen automation.',
            AdvancedRobotics: 'Advanced robotics that push production toward full automation.',
            Electronics: 'Electronics research that opens electronic component production.',
            AdvancedElectronics: 'Advanced electronics that unlock higher-end circuit work.',
            ComputerTechnology: 'Computer systems research that unlocks computing infrastructure.',
            AITechnology: 'Artificial intelligence research that unlocks AI systems.',
            AdvancedAI: 'Advanced AI research that unlocks stronger AI capabilities.',
            Nanotechnology: 'Nanotechnology research that unlocks nanoscale manufacturing.',
            AdvancedNanotech: 'Advanced nanotechnology that unlocks molecular assembly.',
            Biotechnology: 'Biotechnology research that unlocks bioengineering.',
            GeneticEngineering: 'Genetic engineering that unlocks gene editing.',
            MaggotBreeding: 'Establishes a dark breeding line around corpses and maggots.',
            NecroticRecycling: 'Recycles necrotic tissue back into food and chemical loops.',
            SymbioticHosts: 'Builds a controllable symbiosis between human hosts and maggot ecology.',
            HiveMindProtocol: 'Links hybrid individuals into a shared thought network.',
            CollectiveAwakening: 'Pushes the symbiotic whole into unified consciousness and expansion.',
            RenewableEnergy: 'Renewable energy research that unlocks cleaner power.',
            NuclearEnergy: 'Nuclear energy research that unlocks reactor technology.',
            QuantumComputing: 'Quantum computing research that unlocks quantum systems.',
            FusionEnergy: 'Fusion energy research that unlocks near-limitless power.',
            AntimatterEnergy: 'Antimatter energy research that unlocks extreme power density.',
            SpaceExploration: 'Space exploration research that unlocks interstellar expansion.',
            Terraforming: 'Terraforming research that unlocks planetary reshaping.',
            TimeManipulation: 'Time manipulation research that unlocks temporal acceleration.',
            DimensionalTravel: 'Dimensional travel research that unlocks parallel-realm access.',
            ConsciousnessUpload: 'Consciousness upload research that unlocks digital immortality.',
            Immortality: 'Immortality research that unlocks bodily eternal life.',
            Godhood: 'God-tier research that unlocks near-divine abilities.',
            ClickEfficiency: 'Improves the reward from every click.',
            ResourceBoost: 'Temporarily boosts all resource production.',
            ProductionMultiplier: 'Permanently increases total production multipliers.',
            CostReduction: 'Reduces the cost of purchases across the board.',
            CriticalClick: 'Unlocks critical clicks.',
            AutoAssignment: 'Unlocks automatic worker assignment.',
            Prestige: 'Unlocks the prestige system.',
            Legacy: 'Unlocks the legacy bonus system.',
            Ascension: 'Unlocks the ascension system.',
            Omniscience: 'Unlocks the omniscience system.',
        };

        return descriptions[techId] || tech.description || '';
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

        const nameEl = card.querySelector('.tech-name');
        if (nameEl) {
            nameEl.innerHTML = `<span class="tech-badge">T${tech.tier || 1}</span>${this.escapeHtml(this.getTechnologyName(tech))}`;
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

        const recommendationEl = card.querySelector('.tech-recommendation');
        if (recommendationEl) {
            recommendationEl.textContent = this.isEnglish() ? 'Recommended Route' : '推荐路线';
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
            const searchStr = `${this.getTechnologyName(tech)} ${this.getTechnologyDescription(tech)} ${this.getEffectDescription(tech)}`.toLowerCase();
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
            return this.getTechnologyName(a).localeCompare(this.getTechnologyName(b));
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
                        ${this.escapeHtml(this.getTechnologyName(tech))}
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
        const linkedFeedback = this.getTechnologyLinkedFeedback(tech);
        
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
                const depName = depTech ? this.getTechnologyName(depTech) : depId;
                const depResearched = depTech && (depTech.researched || depTech.purchased);
                const color = depResearched ? '#27ae60' : '#e74c3c';
                depsHtml += `<span style="color:${color}">${depResearched ? '✓' : '○'} ${this.escapeHtml(depName)}</span> `;
            });
            depsHtml += '</div>';
        }

        let linkedHtml = '';
        if (linkedFeedback.length > 0) {
            linkedHtml = '<div class="tech-detail-row"><strong>' + (t('linkedSystems') || '联动反馈') + ':</strong><br>';
            linkedHtml += linkedFeedback.map((item) => `<span class="tech-linked-item">${this.escapeHtml(item)}</span>`).join('');
            linkedHtml += '</div>';
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
                    <h3>${this.escapeHtml(this.getTechnologyName(tech))}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="padding:15px;">
                    <div class="tech-detail-row">
                        <span class="tech-badge" style="background:#333;color:#fff;">T${tech.tier || 1}</span>
                        <span style="margin-left:8px;font-weight:bold;color:${isResearched ? '#27ae60' : (canResearch ? '#e67e22' : '#e74c3c')}">
                            ${isResearched ? (t('researched') || '已研究') : (canResearch ? (t('available') || '可研究') : (t('locked') || '未解锁'))}
                        </span>
                    </div>
                    <p style="margin:10px 0;color:#666;font-size:12px;">${this.escapeHtml(this.getTechnologyDescription(tech))}</p>
                    <div class="tech-detail-row" style="color:#3498db;"><strong>${t('effect') || '效果'}:</strong> ${this.escapeHtml(effectDesc)}</div>
                    ${costsHtml}
                    ${depsHtml}
                    ${linkedHtml}
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

        return this.isEnglish() ? this.humanizeIdentifier(resourceType) : resourceType;
    }

    getResourceShortName(resourceType) {
        const shortNames = {
            'Gold': '金', 'Wood': '木', 'Stone': '石',
            'IronOre': '铁', 'CopperOre': '铜', 'AluminumOre': '铝',
            'Coal': '煤', 'Oil': '油', 'Crystal': '晶', 'Food': '食'
        };
        return shortNames[resourceType] || resourceType.substring(0, 2);
    }

    getBuildingTypeLabel(buildingType) {
        const labels = this.isEnglish() ? {
            Mine: 'Mine',
            LumberMill: 'Lumber Mill',
            Quarry: 'Quarry',
            OilRig: 'Oil Rig',
            Farm: 'Farm',
            Smelter: 'Smelting Line',
            Refinery: 'Refining Line',
            Factory: 'Industrial Assembly Line',
            ChemicalPlant: 'Chemical Plant',
            PowerPlant: 'Power Facility',
            ChipFab: 'Chip Fabrication Line',
            ResearchLab: 'Research Lab',
            SpacePort: 'Spaceport',
            QuantumLab: 'Quantum Computing Center',
            NaniteFactory: 'Nanite Factory',
        } : {
            Mine: '矿井',
            LumberMill: '锯木厂',
            Quarry: '采石场',
            OilRig: '石油钻井',
            Farm: '农场',
            Smelter: '冶炼产线',
            Refinery: '精炼产线',
            Factory: '工业装配产线',
            ChemicalPlant: '化学品厂',
            PowerPlant: '发电设施',
            ChipFab: '芯片制造产线',
            ResearchLab: '研究实验室',
            SpacePort: '太空港',
            QuantumLab: '量子计算中心',
            NaniteFactory: '纳米工厂',
        };

        return labels[buildingType] || buildingType || '未知建筑';
    }

    getUnlockBuildingText(techId, buildingType) {
        const buildingLabel = this.getBuildingTypeLabel(buildingType);
        const unlockCopy = this.isEnglish() ? {
            BasicAgriculture: 'Stabilizes the farm line and improves food supply.',
            BasicSmelting: 'Unlocks iron and copper smelting lines.',
            BasicRefining: 'Unlocks refining lines.',
            BasicChemistry: 'Unlocks the chemical plant.',
            BasicEngineering: 'Unlocks baseline industrial assembly lines.',
            Electronics: 'Unlocks circuit board and chip fabrication lines.',
            ComputerTechnology: 'Unlocks the research lab.',
            RenewableEnergy: 'Unlocks power generation facilities.',
            QuantumComputing: 'Unlocks the quantum computing center.',
            SpaceExploration: 'Unlocks space expedition infrastructure.',
        } : {
            BasicAgriculture: '稳定农场产线并强化食物供给',
            BasicSmelting: '开放铁锭冶炼厂与铜锭冶炼厂',
            BasicRefining: '开放精炼相关产线',
            BasicChemistry: '开放化学品厂',
            BasicEngineering: '开放基础工业装配产线',
            Electronics: '开放电路板与芯片制造产线',
            ComputerTechnology: '开放研究实验室',
            RenewableEnergy: '开放发电设施',
            QuantumComputing: '开放量子计算中心',
            SpaceExploration: '开放太空远征设施',
        };

        return unlockCopy[techId] || (this.isEnglish() ? `Unlocks: ${buildingLabel}` : `研究后开放：${buildingLabel}`);
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
        const productionLabel = t('techEffectProductionLabel') || (this.isEnglish() ? 'Production' : '产量');
        const unlocksLabel = t('techEffectUnlocksLabel') || (this.isEnglish() ? 'Unlocks' : '解锁');
        const newFeatureLabel = t('techEffectNewFeature') || (this.isEnglish() ? 'Unlocks a new feature' : '解锁新功能');
        
        if (!tech.effect) return this.getTechnologyDescription(tech) || (t('unknownEffect') || '未知效果');
        
        const effectKeys = Object.keys(tech.effect);
        if (effectKeys.length === 0) return this.getTechnologyDescription(tech) || (t('unknownEffect') || '未知效果');
        
        const effectType = effectKeys[0];
        const effectData = tech.effect[effectType];

        if (tech.effect.type) {
            switch (tech.effect.type) {
                case 'ProductionBonus':
                    return `+${this.formatInteger((tech.effect_value || 0) * 100)}% ${this.getResourceName(tech.effect.resource)} ${productionLabel}`;
                case 'UnlockBuilding':
                    return `🏗️ ${unlocksLabel}: ${this.getBuildingTypeLabel(tech.effect.building_type)}`;
                case 'UnlockUI':
                    return `🔓 ${newFeatureLabel}`;
                case 'MechanicChange':
                    return this.getTechnologyDescription({ ...tech, description: tech.effect.description || tech.description || '' })
                        || (this.isEnglish() ? 'Gameplay mechanics updated' : '游戏机制改变');
                default:
                    return this.getTechnologyDescription(tech) || (t('unknownEffect') || '未知效果');
            }
        }

        switch (effectType) {
            case 'ProductionBonus':
                if (Array.isArray(effectData) && effectData.length >= 2) {
                    const resource = effectData[0];
                    const value = effectData[1];
                    return `+${this.formatInteger(value * 100)}% ${this.getResourceName(resource)} ${productionLabel}`;
                }
                return `+${this.formatInteger(tech.effect_value * 100)}% ${productionLabel}`;
            
            case 'UnlockBuilding':
                return `🏗️ ${this.getUnlockBuildingText(tech.id, effectData)}`;
            
            case 'UnlockUI':
                return `🔓 ${newFeatureLabel}`;
            
            case 'MechanicChange':
                if (typeof effectData === 'string') {
                    return this.getMechanicDescription(effectData);
                }
                return this.getTechnologyDescription(tech) || (this.isEnglish() ? 'Gameplay mechanics updated' : '游戏机制改变');
            
            default:
                return this.getTechnologyDescription(tech) || (t('unknownEffect') || '未知效果');
        }
    }

    getTechnologyLinkedFeedback(tech) {
        const feedbackMap = this.isEnglish() ? {
            BasicSmelting: [
                'Linked buildings: Iron Ingot Smelter, Copper Ingot Smelter',
                'Connects ore gathering to the metal smelting chain.',
            ],
            BasicChemistry: [
                'Linked building: Chemical Plant',
                'Pushes oil and coal into chemical processing.',
            ],
            BasicEngineering: [
                'Linked buildings: Steel Works, Glassworks, Plastic Plant, Gear Works',
                'Moves the economy from raw materials into industrial components.',
            ],
            Electronics: [
                'Linked buildings: Circuit Board Plant, Chip Fabrication Plant',
                'Pushes the industrial chain into electronics manufacturing.',
            ],
            MaggotBreeding: [
                'Unlocks: Maggot Factory',
                'Turns corpse decay into a controllable maggot processing chain.',
            ],
            NecroticRecycling: [
                'Unlocks: Necrotic Brood Pool',
                'Pushes maggots further into food and chemical conversion.',
            ],
            SymbioticHosts: [
                'Unlocks: Symbiotic Growth Chamber',
                'Begins raising hybrid population and symbiosis stability.',
            ],
            HiveMindProtocol: [
                'Links hybrid bodies into a shared thought network.',
                'Prepares the endgame mind web and resource lattice.',
            ],
            CollectiveAwakening: [
                'Unlocks: Neural Spire',
                'Starts the endgame dark matter chain.',
            ],
            RenewableEnergy: [
                'Linked building: Generator Plant',
                'Lets the energy chain break away from handcraft pacing.',
            ],
            QuantumComputing: [
                'Linked building: Quantum Computing Center',
                'Feeds advanced computation into the endgame research chain.',
            ],
            ConsciousnessUpload: [
                'Unlocks: Deep Space Hatchery',
                'Lets unified consciousness begin producing starships.',
            ],
            SpaceExploration: [
                'Unlocks: Spaceport',
                'Brings dark matter and ships into the expedition chain.',
            ],
        } : {
            BasicSmelting: [
                '关联建筑：铁锭冶炼厂、铜锭冶炼厂',
                '把矿石采集正式接入金属冶炼链',
            ],
            BasicChemistry: [
                '关联建筑：化学品厂',
                '让石油与煤炭进入化工加工流程',
            ],
            BasicEngineering: [
                '关联建筑：钢铁厂、玻璃厂、塑料厂、齿轮厂',
                '让工业装配从原料阶段过渡到部件阶段',
            ],
            Electronics: [
                '关联建筑：电路板厂、芯片制造厂',
                '把工业链推进到电子制造阶段',
            ],
            MaggotBreeding: [
                '解锁建筑：蛆虫工厂',
                '把尸体腐化转成可控的蛆虫加工链',
            ],
            NecroticRecycling: [
                '解锁建筑：腐肉育池',
                '让蛆虫进一步转化为食物与化学品',
            ],
            SymbioticHosts: [
                '解锁建筑：共生培育舱',
                '开始提升混合人口与共生稳定度',
            ],
            HiveMindProtocol: [
                '把混合个体接入共享思维网络',
                '为集体觉醒与终局资源网络做准备',
            ],
            CollectiveAwakening: [
                '解锁建筑：神经尖塔',
                '让终局链条开始产出暗物质',
            ],
            RenewableEnergy: [
                '关联建筑：发电机厂',
                '让能源链条正式脱离基础手工业节奏',
            ],
            QuantumComputing: [
                '关联建筑：量子计算中心',
                '让高阶计算资源进入终局研究链',
            ],
            ConsciousnessUpload: [
                '解锁建筑：深空孵化港',
                '让统一意识开始生成太空船',
            ],
            SpaceExploration: [
                '解锁建筑：太空港',
                '把暗物质与太空船并入远征扩张链',
            ],
        };

        return feedbackMap[tech?.id] || [];
    }

    formatInteger(value) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
            return window.NumberFormatter.formatInteger(value);
        }

        return Math.floor(Number(value) || 0).toLocaleString();
    }

    getMechanicDescription(mechanic) {
        const descriptions = this.isEnglish() ? {
            'auto_production': '🤖 Automated Production',
            'full_automation': '⚙️ Full Automation',
            'ai_assistance': '🤖 AI Assistance',
            'ai_optimization': '🧠 AI Optimization',
            'molecular_assembly': '🔬 Molecular Assembly',
            'genetic_optimization': '🧬 Genetic Optimization',
            'nuclear_power': '⚡ Nuclear Power',
            'fusion_power': '☀️ Fusion Energy',
            'terraforming': '🌍 Terraforming',
            'time_manipulation': '⏰ Time Manipulation',
            'dimensional_travel': '🌌 Dimensional Travel',
            'consciousness_upload': '🧠 Consciousness Upload',
            'immortality': '✨ Immortality',
            'godhood': '🌟 Godhood',
            'click_efficiency': '👆 Click Efficiency',
            'resource_boost': '💎 Resource Boost',
            'production_multiplier': '📈 Production Multiplier',
            'cost_reduction': '💰 Cost Reduction',
            'critical_click': '💥 Critical Click',
            'auto_assignment': '👥 Auto Assignment',
            'legacy_bonus': '👑 Legacy Bonus',
            'ascension': '🚀 Ascension',
            'omniscience': '👁️ Omniscience'
        } : {
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
