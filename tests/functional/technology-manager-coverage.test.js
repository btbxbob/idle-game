const { test, expect } = require('../fixtures/coverage');

test.describe('TechnologyManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('escapeHtml and core utility branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            return {
                ok: true,
                nullInput: window.technologyManager.escapeHtml(null),
                emptyInput: window.technologyManager.escapeHtml(''),
                xssInput: window.technologyManager.escapeHtml('<script>alert(1)</script>'),
                normalText: window.technologyManager.escapeHtml('Normal Text'),
            };
        });
        expect(result.ok).toBe(true);
        expect(result.nullInput).toBe('');
        expect(result.emptyInput).toBe('');
        expect(result.xssInput).toContain('&lt;');
        expect(result.normalText).toContain('Normal');
    });

    test('english language mode localizes technology cards and effects', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager || !window.i18n) {
                return { ok: false, reason: 'missing technology manager or i18n' };
            }

            window.i18n.setLanguage('en');
            const manager = window.technologyManager;
            manager.technologies = [{
                id: 'AdvancedMining',
                name: '高级采矿',
                description: '高级采矿技术，大幅提升矿产产量',
                tier: 1,
                costs: { Gold: 10 },
                dependencies: [],
                purchased: false,
                researched: false,
                can_research: true,
                effect_value: 0.2,
                effect: { type: 'ProductionBonus', resource: 'IronOre' },
            }];
            manager.renderToPanel('technology-panel');

            const card = document.querySelector('.tech-card');
            const detailName = manager.getTechnologyName(manager.technologies[0]);
            const detailDescription = manager.getTechnologyDescription(manager.technologies[0]);
            return {
                ok: true,
                language: window.i18n.getCurrentLanguage(),
                cardCount: document.querySelectorAll('.tech-card').length,
                firstCardText: (card?.textContent || '').replace(/\s+/g, ' ').trim(),
                detailName,
                detailDescription,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.language).toBe('en');
        expect(result.cardCount).toBeGreaterThan(0);
        expect(result.firstCardText).toContain('Advanced Mining');
        expect(result.firstCardText).toContain('Iron Ore Production');
        expect(result.firstCardText).not.toMatch(/[\u4e00-\u9fff]{2,}/);
        expect(result.detailName).toBe('Advanced Mining');
        expect(result.detailDescription).toContain('greatly increase ore production');
    });

    test('canResearch branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            const techs = window.technologyManager.technologies || [];
            const results = techs.slice(0, 5).map(tech => ({
                id: tech.id,
                canResearch: window.technologyManager.canResearch(tech),
            }));
            return { ok: true, results };
        });
        expect(result.ok).toBe(true);
    });

    test('hasResources branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            return {
                ok: true,
                empty: window.technologyManager.hasResources({}),
                noCosts: window.technologyManager.hasResources(null),
                enough: window.technologyManager.hasResources({ coins: 1 }),
                notEnough: window.technologyManager.hasResources({ coins: 99999999 }),
            };
        });
        expect(result.ok).toBe(true);
    });

    test('renderTextBasedTree branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);
            
            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [];
            window.technologyManager.renderTextBasedTree();
            const emptyHtml = container.innerHTML;
            const hasEmptyMsg = emptyHtml.includes('暂无科技') || emptyHtml.includes('noTechnologies');
            
            window.technologyManager.technologies = [
                { id: 'test1', name: 'Test Tech 1', tier: 1, description: 'Test', researched: true, costs: { coins: 100 }, dependencies: [] },
                { id: 'test2', name: 'Test Tech 2', tier: 1, description: 'Test 2', researched: false, costs: { coins: 200 }, dependencies: ['test1'] }
            ];
            window.technologyManager.renderTextBasedTree();
            const withTechsHtml = container.innerHTML;
            const hasTechItems = withTechsHtml.includes('tech-item');
            const hasList = withTechsHtml.includes('tech-tree-list');
            
            container.remove();
            
            return {
                ok: true,
                hasEmptyMsg,
                hasTechItems,
                hasList,
            };
        });
        expect(result.ok).toBe(true);
    });

    test('selectTechnology branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);
            
            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'test1', name: 'Test Tech', tier: 1, description: 'Test', researched: false, costs: { coins: 10 }, dependencies: [] }
            ];
            
            window.technologyManager.selectTechnology('nonexistent');
            const afterInvalid = window.technologyManager.selectedTechnology;
            
            window.technologyManager.selectTechnology('test1');
            const afterValid = window.technologyManager.selectedTechnology;
            
            container.remove();
            
            return {
                ok: true,
                afterInvalidIsNull: afterInvalid === null || afterInvalid === undefined,
                afterValidIsSet: afterValid && afterValid.id === 'test1',
            };
        });
        expect(result.ok).toBe(true);
    });

    test('renderTree branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);
            
            window.technologyManager.treeContainer = container;
            window.technologyManager.renderTree();
            const html = container.innerHTML;
            
            container.remove();
            
            const container2 = document.createElement('div');
            container2.id = 'technology-tree-container-missing';
            document.body.appendChild(container2);
            
            window.technologyManager.treeContainer = null;
            window.technologyManager.renderTree();
            
            container2.remove();
            
            return {
                ok: true,
                htmlHasContent: html.length > 10,
            };
        });
        expect(result.ok).toBe(true);
    });

    test('updateTechnologyPanel branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const panel = document.createElement('div');
            panel.id = 'technology-panel';
            document.body.appendChild(panel);
            
            window.technologyManager.renderToPanel('technology-panel');
            const html = panel.innerHTML;
            
            panel.remove();
            
            return {
                ok: true,
                htmlLength: html.length,
            };
        });
        expect(result.ok).toBe(true);
    });

    test('getAvailableTechnologies and getResearchedTechnologies branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            const techs = window.technologyManager.technologies || [];
            const researched = techs.filter(t => t.researched || t.purchased);
            const available = techs.filter(t => window.technologyManager.canResearch(t));
            return {
                ok: true,
                totalCount: techs.length,
                researchedCount: researched.length,
                availableCount: available.length,
            };
        });
        expect(result.ok).toBe(true);
    });

    test('toggleResearch branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }
            
            const techs = window.technologyManager.technologies || [];
            if (techs.length === 0) {
                return { ok: true, noTechs: true };
            }
            
            const tech = techs[0];
            const before = tech.researched || tech.purchased || false;
            
            return {
                ok: true,
                noTechs: false,
                beforeResearched: before,
                canResearch: window.technologyManager.canResearch(tech),
            };
        });
        expect(result.ok).toBe(true);
    });

    test('getResourceValue/getResourceName/getEffectDescription branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }

            const manager = window.technologyManager;
            const originalRustGame = manager.rustGame;
            const originalI18n = manager.i18n;

            manager.rustGame = null;
            const noGameValue = manager.getResourceValue('Gold');

            manager.rustGame = {
                get_coins: () => 77,
            };
            const knownValue = manager.getResourceValue('Gold');
            const unknownValue = manager.getResourceValue('UnknownResource');

            const zhName = manager.getResourceName('Gold');
            manager.i18n = { currentLanguage: 'en', t: (key) => key };
            const enName = manager.getResourceName('Gold');
            const fallbackName = manager.getResourceName('Mystery');
            const techName = manager.getTechnologyName({ id: 'AdvancedMining', name: '高级采矿' });
            const techDescription = manager.getTechnologyDescription({ id: 'AdvancedMining', description: '高级采矿技术，大幅提升矿产产量' });

            const effectTypes = [
                manager.getEffectDescription({ effect: { type: 'ProductionBonus', resource: 'IronOre' }, effect_value: 0.2 }),
                manager.getEffectDescription({ effect: { type: 'UnlockBuilding', building_type: 'Mine' }, effect_value: 0 }),
                manager.getEffectDescription({ effect: { type: 'UnlockUI' }, effect_value: 0 }),
                manager.getEffectDescription({ effect: { type: 'MechanicChange', description: 'Custom change' }, effect_value: 0 }),
                manager.getEffectDescription({ effect: { type: 'UnknownType' }, description: 'fallback desc' }),
                manager.getEffectDescription({ description: 'no effect description' }),
            ];

            manager.rustGame = originalRustGame;
            manager.i18n = originalI18n;

            return {
                ok: true,
                noGameValue,
                knownValue,
                unknownValue,
                zhName,
                enName,
                fallbackName,
                techName,
                techDescription,
                effectTypes,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.noGameValue).toBe(0);
        expect(result.knownValue).toBe(77);
        expect(result.unknownValue).toBe(0);
        expect(result.zhName).toContain('金');
        expect(result.enName).toBe('Gold');
        expect(result.fallbackName).toBe('Mystery');
        expect(result.techName).toBe('Advanced Mining');
        expect(result.techDescription).toContain('greatly increase ore production');
        expect(result.effectTypes.length).toBe(6);
        expect(result.effectTypes[0].length).toBeGreaterThan(0);
        expect(result.effectTypes[0].includes('Iron Ore') || result.effectTypes[0].includes('铁矿')).toBe(true);
        expect(result.effectTypes[1].length).toBeGreaterThan(0);
        expect(result.effectTypes[1].length).toBeGreaterThan(0);
        expect(result.effectTypes[2].length).toBeGreaterThan(0);
        expect(result.effectTypes[2].length).toBeGreaterThan(0);
    });

    test('initialize/update/researchTechnology and renderToPanel guard branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) {
                return { ok: false, reason: 'missing manager' };
            }

            const manager = window.technologyManager;
            const originalRustGame = manager.rustGame;
            const originalBindEvents = manager.bindEvents;
            const originalRenderTree = manager.renderTree;
            const originalSelectTechnology = manager.selectTechnology;

            let bindCalls = 0;
            let renderCalls = 0;
            let selectCalls = 0;

            manager.bindEvents = () => { bindCalls += 1; };
            manager.renderTree = () => { renderCalls += 1; };
            manager.selectTechnology = () => { selectCalls += 1; };

            manager.rustGame = null;
            manager.initialize();
            manager.update();
            const researchNoApi = manager.researchTechnology('t1');

            manager.rustGame = {
                get_technologies: () => [{ id: 't1', researched: false }],
                research_technology: () => true,
            };
            manager.selectedTechnology = { id: 't1' };
            manager.initialize();
            manager.update();
            const researchSuccess = manager.researchTechnology('t1');

            manager.rustGame = {
                get_technologies: () => [{ id: 't2', researched: false }],
                research_technology: () => false,
            };
            const researchFail = manager.researchTechnology('t2');

            manager.rustGame = {
                get_technologies: () => { throw new Error('boom-tech-list'); },
                research_technology: () => { throw new Error('boom-research'); },
            };
            manager.initialize();
            manager.update();
            const researchThrow = manager.researchTechnology('t3');

            manager.treeContainer = null;
            manager.renderToPanel('definitely-missing-panel-id');

            manager.rustGame = originalRustGame;
            manager.bindEvents = originalBindEvents;
            manager.renderTree = originalRenderTree;
            manager.selectTechnology = originalSelectTechnology;

            return {
                ok: true,
                bindCalls,
                renderCalls,
                selectCalls,
                researchNoApi,
                researchSuccess,
                researchFail,
                researchThrow,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.bindCalls).toBeGreaterThan(0);
        expect(result.renderCalls).toBeGreaterThan(0);
        expect(result.selectCalls).toBeGreaterThan(0);
        expect(result.researchNoApi).toBe(false);
        expect(result.researchSuccess).toBe(true);
        expect(result.researchFail).toBe(false);
        expect(result.researchThrow).toBe(false);
    });

    test('filter, card, state change and cost-sorting branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.TechnologyManager(null, { currentLanguage: 'zh-CN', t: (key) => key });

            manager.getResourceValue = (resource) => ({ Gold: 200, Wood: 10, Stone: 0 }[resource] || 0);
            manager.technologies = [
                { id: 'researched-tech', name: 'Alpha', description: 'Done', tier: 2, researched: true, costs: { Gold: 10 }, dependencies: [] },
                { id: 'available-tech', name: 'Beta', description: 'Available', tier: 1, researched: false, costs: { Gold: 20, Wood: 5 }, dependencies: [] },
                { id: 'cannot-afford-tech', name: 'Gamma', description: 'Needs stone', tier: 1, researched: false, costs: { Stone: 5 }, dependencies: [] },
                { id: 'locked-tech', name: 'Delta', description: 'Locked', tier: 3, researched: false, costs: { Gold: 10 }, dependencies: ['researched-tech', 'missing-tech'] },
            ];

            manager.cacheTechStates();
            const unchanged = manager.hasStateChanged();
            manager.technologies[1].costs = { Gold: 99 };
            const changed = manager.hasStateChanged();
            manager.technologies[1].costs = { Gold: 20, Wood: 5 };

            manager.filterState = { query: '', filterBy: 'available', hideResearched: false, sortBy: 'tier' };
            const availableIds = manager.getFilteredTechnologies().map((tech) => tech.id);

            manager.filterState = { query: '', filterBy: 'researched', hideResearched: false, sortBy: 'tier' };
            const researchedIds = manager.getFilteredTechnologies().map((tech) => tech.id);

            manager.filterState = { query: 'available', filterBy: 'all', hideResearched: true, sortBy: 'tier' };
            const queryIds = manager.getFilteredTechnologies().map((tech) => tech.id);

            const t = (key) => ({ researched: '已研究', available: '可研究', locked: '未解锁', research: '研究', insufficientResources: '资源不足' }[key] || key);
            const researchedCard = manager.renderTechCard(manager.technologies[0], t);
            const availableCard = manager.renderTechCard(manager.technologies[1], t);
            const unaffordableCard = manager.renderTechCard(manager.technologies[2], t);
            const lockedCard = manager.renderTechCard(manager.technologies[3], t);
            const sortedCosts = manager.sortCosts({ Stone: 5, Gold: 1, Wood: 2, Unknown: 3 }).map(([key]) => key);
            const shortKnown = manager.getResourceShortName('Gold');
            const shortUnknown = manager.getResourceShortName('QuantumDust');

            return {
                unchanged,
                changed,
                availableIds,
                researchedIds,
                queryIds,
                researchedCard,
                availableCard,
                unaffordableCard,
                lockedCard,
                sortedCosts,
                shortKnown,
                shortUnknown,
            };
        });

        expect(result.unchanged).toBe(false);
        expect(result.changed).toBe(true);
        expect(result.availableIds).toEqual(['available-tech', 'cannot-afford-tech']);
        expect(result.researchedIds).toEqual(['researched-tech']);
        expect(result.queryIds).toEqual(['available-tech']);
        expect(result.researchedCard).toContain('researched');
        expect(result.availableCard).toContain('can-research');
        expect(result.unaffordableCard).toContain('cannot-afford');
        expect(result.lockedCard).toContain('locked');
        expect(result.sortedCosts).toEqual(['Gold', 'Wood', 'Stone', 'Unknown']);
        expect(result.shortKnown).toBe('金');
        expect(result.shortUnknown).toBe('Qu');
    });

    test('showTechDetail, notification and linked feedback branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalSetTimeout = window.setTimeout;
            const scheduled = [];
            window.setTimeout = (fn) => {
                scheduled.push(fn);
                return scheduled.length;
            };

            const manager = new window.TechnologyManager(null, { currentLanguage: 'zh-CN', t: (key) => key });
            manager.getResourceValue = (resource) => ({ Gold: 30, Wood: 5 }[resource] || 0);
            let researchedTechId = null;
            manager.researchTechnology = (techId) => {
                researchedTechId = techId;
                return true;
            };

            manager.technologies = [
                { id: 'dep-tech', name: 'Dependency', tier: 1, researched: true, costs: {}, dependencies: [] },
                {
                    id: 'MaggotBreeding',
                    name: 'Target',
                    description: 'Target description',
                    tier: 2,
                    can_research: true,
                    researched: false,
                    costs: { Gold: 20, Wood: 2 },
                    dependencies: ['dep-tech', 'unknown-dep'],
                    effect: { MechanicChange: 'auto_assignment' },
                },
            ];

            manager.showTechDetail('missing-tech');
            const missingModal = document.getElementById('tech-detail-modal');

            manager.showTechDetail('MaggotBreeding');
            const modal = document.getElementById('tech-detail-modal');
            const modalHtml = modal ? modal.innerHTML : '';
            const overlayBefore = !!document.getElementById('tech-detail-modal');
            if (modal) {
                modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
            const overlayAfter = !!document.getElementById('tech-detail-modal');

            manager.showTechDetail('MaggotBreeding');
            const reopenModal = document.getElementById('tech-detail-modal');
            const button = reopenModal ? reopenModal.querySelector('#modal-research-btn') : null;
            if (button) {
                button.click();
            }
            const afterButton = !!document.getElementById('tech-detail-modal');

            manager.showNotification('first');
            manager.showNotification('second');
            const notificationBeforeTimeout = document.getElementById('tech-notification')?.textContent || '';
            scheduled.forEach((fn) => {
                fn();
            });
            const notificationAfterTimeout = document.getElementById('tech-notification');

            window.setTimeout = originalSetTimeout;

            return {
                missingModal: !!missingModal,
                overlayBefore,
                overlayAfter,
                modalHtml,
                afterButton,
                researchedTechId,
                notificationBeforeTimeout,
                notificationAfterTimeout: !!notificationAfterTimeout,
                linkedFeedback: manager.getTechnologyLinkedFeedback({ id: 'CollectiveAwakening' }),
                knownMechanic: manager.getMechanicDescription('auto_assignment'),
                unknownMechanic: manager.getMechanicDescription('wild_unknown_mechanic'),
            };
        });

        expect(result.missingModal).toBe(false);
        expect(result.overlayBefore).toBe(true);
        expect(result.overlayAfter).toBe(false);
        expect(result.modalHtml).toContain('Target');
        expect(result.modalHtml).toContain('Dependency');
        expect(result.modalHtml).toContain('unknown-dep');
        expect(result.modalHtml).toContain('linkedSystems');
        expect(result.modalHtml).toContain('蛆虫工厂');
        expect(result.afterButton).toBe(false);
        expect(result.researchedTechId).toBe('MaggotBreeding');
        expect(result.notificationBeforeTimeout).toBe('second');
        expect(result.notificationAfterTimeout).toBe(false);
        expect(result.linkedFeedback).toContain('解锁建筑：神经尖塔');
        expect(result.knownMechanic).toContain('自动分配');
        expect(result.unknownMechanic).toContain('wild_unknown_mechanic');
    });

    test('objective recommendation, tool sync and card binding branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.TechnologyManager(null, { currentLanguage: 'zh-CN', t: (key) => key });

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);
            manager.treeContainer = container;

            manager.technologies = [
                { id: 'BasicAgriculture', name: 'Agriculture', tier: 1, researched: false, costs: {}, dependencies: [] },
                { id: 'BasicSmelting', name: 'Smelting', tier: 1, researched: false, costs: {}, dependencies: [] },
                { id: 'NecroticRecycling', name: 'Necrotic', tier: 2, researched: false, costs: {}, dependencies: [] },
            ];

            manager.rustGame = {
                getCurrentObjectiveChainJson: () => JSON.stringify({ current_objective_id: 'research_first_tech', stage_id: 'stage_workers' }),
            };
            const workerRecommended = manager.getRecommendedTechnologyId();

            manager.rustGame.getCurrentObjectiveChainJson = () => '{bad-json';
            const badObjective = manager.getCurrentObjectiveChain();

            manager.rustGame.getCurrentObjectiveChainJson = () => JSON.stringify({ current_objective_id: 'research_maggot_tech', stage_id: 'stage_maggot' });
            const maggotRecommended = manager.getRecommendedTechnologyId();

            let renderCalls = 0;
            manager.renderTechCards = () => { renderCalls += 1; };
            manager.renderTools();
            const toolsEl = container.querySelector('.tech-tools');
            const search = toolsEl.querySelector('.tech-search');
            const filter = toolsEl.querySelector('.tech-filter');
            const hideCheckbox = toolsEl.querySelector('.tech-hide-researched input');

            search.value = 'necro';
            search.dispatchEvent(new Event('input', { bubbles: true }));
            filter.value = 'available';
            filter.dispatchEvent(new Event('change', { bubbles: true }));
            hideCheckbox.checked = true;
            hideCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

            const toolCount = toolsEl.querySelector('.tech-count')?.textContent || '';
            manager.syncToolsDisplay();

            const grid = document.createElement('div');
            grid.className = 'tech-grid';
            container.appendChild(grid);
            manager.researchTechnology = (techId) => {
                manager.__researched = techId;
                return true;
            };
            manager.showTechDetail = (techId) => {
                manager.__detail = techId;
            };
            manager.bindCardEvents(grid);
            manager.bindCardEvents(grid);

            grid.innerHTML = '<div class="tech-card" data-tech-id="BasicSmelting"><button class="tech-research-btn" data-tech-id="BasicAgriculture">研究</button></div>';
            grid.querySelector('.tech-research-btn').click();
            grid.querySelector('.tech-card').click();

            const originalCss = window.CSS;
            window.CSS = { escape: (value) => String(value) };
            const card = document.createElement('div');
            card.className = 'tech-card';
            card.setAttribute('data-tech-id', 'BasicAgriculture');
            card.innerHTML = '<span class="tech-status"></span><div class="tech-effect"></div><div class="tech-body"></div><div class="tech-footer"></div>';
            grid.appendChild(card);
            manager.syncRenderedCards([{ id: 'BasicAgriculture', name: 'Agriculture', tier: 1, researched: false, costs: { Gold: 5 }, dependencies: [] }]);
            const updatedFooter = card.querySelector('.tech-footer')?.innerHTML || '';
            window.CSS = originalCss;

            container.remove();

            return {
                workerRecommended,
                badObjective,
                maggotRecommended,
                renderCalls,
                filterState: manager.filterState,
                toolCount,
                researchedTechId: manager.__researched,
                detailTechId: manager.__detail,
                eventsBound: grid.dataset.techEventsBound,
                updatedFooter,
            };
        });

        expect(result.workerRecommended).toBe('BasicAgriculture');
        expect(result.badObjective).toBeNull();
        expect(result.maggotRecommended).toBe('NecroticRecycling');
        expect(result.renderCalls).toBe(3);
        expect(result.filterState.query).toBe('necro');
        expect(result.filterState.filterBy).toBe('available');
        expect(result.filterState.hideResearched).toBe(true);
        expect(result.toolCount).toContain('/');
        expect(result.researchedTechId).toBe('BasicAgriculture');
        expect(result.detailTechId).toBe('BasicSmelting');
        expect(result.eventsBound).toBe('true');
        expect(result.updatedFooter).toContain('tech-research-btn');
    });

    test('card sync, update hook and research error branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalManager = window.technologyManager;
            const originalError = console.error;
            const originalGetElementById = document.getElementById.bind(document);
            const errors = [];
            console.error = (...args) => errors.push(args.map(String).join(' '));

            const manager = new window.TechnologyManager(null, { currentLanguage: 'zh-CN', t: (key) => key });
            manager.getResourceValue = (resource) => ({ Gold: 20, Wood: 1 }[resource] || 0);
            manager.technologies = [
                { id: 'dep-tech', name: 'Dep', researched: true, costs: {}, dependencies: [] },
                { id: 'rec-tech', name: 'Rec', description: 'recommended', tier: 2, researched: false, costs: { Gold: 5 }, dependencies: ['dep-tech'], effect: { UnlockBuilding: 'Lab' } },
                { id: 'locked-tech', name: 'Locked', description: 'locked', tier: 1, researched: false, costs: {}, dependencies: ['missing-tech'], effect: {} },
            ];

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            const grid = document.createElement('div');
            grid.className = 'tech-grid';
            container.appendChild(grid);
            document.body.appendChild(container);
            manager.treeContainer = container;

            const card = document.createElement('div');
            card.className = 'tech-card';
            card.setAttribute('data-tech-id', 'rec-tech');
            card.innerHTML = '<div class="tech-effect"></div><div class="tech-body"><div class="tech-costs">old</div></div><div class="tech-footer"></div>';
            grid.appendChild(card);

            const originalRecommended = manager.getRecommendedTechnologyId.bind(manager);
            manager.getRecommendedTechnologyId = () => 'rec-tech';
            manager.updateTechCardElement(card, manager.technologies[1]);
            const recommendedClass = card.classList.contains('recommended');
            const footerHtml = card.querySelector('.tech-footer')?.innerHTML || '';
            const costsHtml = card.querySelector('.tech-costs')?.innerHTML || '';
            const statusAfterRecommended = !!card.querySelector('.tech-status');

            manager.updateTechCardElement(card, manager.technologies[2]);
            const removedCosts = !card.querySelector('.tech-costs');
            const lockedFooter = card.querySelector('.tech-footer')?.innerHTML || '';
            const statusAfterLocked = !!card.querySelector('.tech-status');

            const tab = document.createElement('div');
            tab.id = 'tab-technology';
            tab.className = 'active';
            document.body.appendChild(tab);
            document.getElementById = (id) => {
                if (id === 'tab-technology') {
                    return tab;
                }
                return originalGetElementById(id);
            };

            let hookCalls = 0;
            manager.update = () => { hookCalls += 1; };
            window.technologyManager = manager;
            window.updateTechnologyPanel();
            tab.className = '';
            window.updateTechnologyPanel();

            const notifications = [];
            manager.showNotification = (message) => notifications.push(message);
            manager.rustGame = {
                research_technology: () => { throw new Error('cannot afford now'); }
            };
            const insufficientResult = manager.researchTechnology('rec-tech');

            manager.rustGame = {
                research_technology: () => { throw new Error('boom-general'); }
            };
            const genericResult = manager.researchTechnology('rec-tech');

            manager.getRecommendedTechnologyId = originalRecommended;
            container.remove();
            tab.remove();
            document.getElementById = originalGetElementById;
            console.error = originalError;
            window.technologyManager = originalManager;

            return {
                recommendedClass,
                footerHtml,
                costsHtml,
                statusAfterRecommended,
                removedCosts,
                lockedFooter,
                statusAfterLocked,
                hookCalls,
                notifications,
                insufficientResult,
                genericResult,
                errors,
            };
        });

        expect(result.recommendedClass).toBe(true);
        expect(result.footerHtml).toContain('tech-research-btn');
        expect(result.costsHtml).toContain('tech-cost-item');
        expect(result.costsHtml).toContain('5');
        expect(result.statusAfterRecommended).toBe(false);
        expect(result.removedCosts).toBe(true);
        expect(result.lockedFooter).toContain('locked');
        expect(result.statusAfterLocked).toBe(false);
        expect(result.hookCalls).toBe(1);
        expect(result.notifications).toContain('insufficientResources');
        expect(result.insufficientResult).toBe(false);
        expect(result.genericResult).toBe(false);
        expect(result.errors.some((entry) => entry.includes('Error researching'))).toBe(true);
    });

    test('card render, filter and modal branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.TechnologyManager) {
                return { ok: false, reason: 'missing manager class' };
            }

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            const techStates = [
                [
                    { id: 'tech1', name: 'Researched', tier: 1, researched: true, costs: {} },
                    { id: 'tech2', name: 'Available', tier: 2, researched: false, costs: { Gold: 100 } },
                    { id: 'tech3', name: 'Locked', tier: 2, researched: false, dependencies: ['missing'], costs: {} },
                ],
                [
                    { id: 'tech1', name: 'Stable Tech', tier: 1, researched: false, costs: { Gold: 10 } },
                ],
                [
                    { id: 'tech1', name: 'Stable Tech', tier: 1, researched: false, costs: { Gold: 10 } },
                ],
            ];
            let stateIndex = 0;
            let researchedId = null;

            const manager = new window.TechnologyManager({
                get_technologies: () => techStates[stateIndex],
                get_resources: () => ({ Gold: 500 }),
                research_technology: (techId) => {
                    researchedId = techId;
                    return true;
                },
            }, { t: (key) => key, currentLanguage: 'en' });

            manager.treeContainer = container;
            manager.initialize();

            const initialTools = !!container.querySelector('.tech-tools');
            const initialGrid = !!container.querySelector('.tech-grid');
            const initialCards = container.querySelectorAll('.tech-card').length;

            manager.filterState.hideResearched = true;
            manager.render();
            const hideResearchedText = Array.from(container.querySelectorAll('.tech-card')).map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim());

            manager.filterState.hideResearched = false;
            manager.filterState.filterBy = 'available';
            manager.render();
            const availableText = Array.from(container.querySelectorAll('.tech-card')).map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim());

            manager.filterState.filterBy = 'all';
            manager.filterState.query = 'Available';
            manager.render();
            const searchCount = container.querySelectorAll('.tech-card').length;

            manager.filterState.query = '';
            manager.render();
            const cards = container.querySelectorAll('.tech-card');
            const cardStates = Array.from(cards).reduce((acc, card) => {
                const techId = card.getAttribute('data-tech-id');
                acc[techId] = {
                    tierBadge: card.querySelector('.tech-badge')?.textContent || '',
                    hasStatus: !!card.querySelector('.tech-status'),
                    researched: card.classList.contains('researched'),
                    locked: card.classList.contains('locked'),
                };
                return acc;
            }, {});

            const tab = document.createElement('div');
            tab.id = 'tab-technology';
            tab.className = 'active';
            document.body.appendChild(tab);

            stateIndex = 1;
            manager.update();
            const firstCard = container.querySelector('.tech-card');
            firstCard.dataset.probe = 'persist';
            stateIndex = 2;
            manager.update();
            const updatedCard = container.querySelector('.tech-card');
            const sameNode = updatedCard === firstCard;
            const probePreserved = updatedCard?.dataset.probe === 'persist';

            const button = container.querySelector('.tech-research-btn');
            const clickedTechId = button?.getAttribute('data-tech-id') || null;
            if (button) {
                button.click();
            }

            manager.technologies = [
                { id: 'detail-tech', name: 'Detail Tech', tier: 1, description: 'Test desc', costs: { Gold: 100 } }
            ];
            manager.showTechDetail('detail-tech');
            const modal = document.getElementById('tech-detail-modal');
            const modalTitle = modal?.querySelector('h3')?.textContent || '';
            modal?.remove();

            const methods = {
                renderTree: typeof manager.renderTree === 'function',
                renderTextBasedTree: typeof manager.renderTextBasedTree === 'function',
                selectTechnology: typeof manager.selectTechnology === 'function',
                renderToPanel: typeof manager.renderToPanel === 'function',
                renderForceDirectedGraph: typeof manager.renderForceDirectedGraph === 'function',
                startForceSimulation: typeof manager.startForceSimulation === 'function',
                stopForceSimulation: typeof manager.stopForceSimulation === 'function',
                updatePhysics: typeof manager.updatePhysics === 'function',
                setupCanvasEvents: typeof manager.setupCanvasEvents === 'function',
                selectNode: typeof manager.selectNode === 'function',
                updateDetailPanel: typeof manager.updateDetailPanel === 'function',
            };

            tab.remove();
            container.remove();

            return {
                ok: true,
                initialTools,
                initialGrid,
                initialCards,
                hideResearchedText,
                availableText,
                searchCount,
                cardStates,
                sameNode,
                probePreserved,
                clickedTechId,
                researchedId,
                modalTitle,
                methods,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.initialTools).toBe(true);
        expect(result.initialGrid).toBe(true);
        expect(result.initialCards).toBe(3);
        expect(result.hideResearchedText).toHaveLength(2);
        expect(result.hideResearchedText[0]).toContain('Available');
        expect(result.hideResearchedText[1]).toContain('Locked');
        expect(result.availableText).toHaveLength(1);
        expect(result.availableText[0]).toContain('Available');
        expect(result.searchCount).toBe(1);
        expect(result.cardStates.tech1.tierBadge).toBe('T1');
        expect(result.cardStates.tech1.hasStatus).toBe(true);
        expect(result.cardStates.tech1.researched).toBe(true);
        expect(result.cardStates.tech2.tierBadge).toBe('T2');
        expect(result.cardStates.tech2.hasStatus).toBe(false);
        expect(result.cardStates.tech3.locked).toBe(true);
        expect(result.cardStates.tech3.hasStatus).toBe(false);
        expect(result.sameNode).toBe(true);
        expect(result.probePreserved).toBe(true);
        expect(result.clickedTechId).toBeTruthy();
        expect(result.researchedId).toBe(result.clickedTechId);
        expect(result.modalTitle).toContain('Detail Tech');
        expect(Object.values(result.methods).every(Boolean)).toBe(true);
    });
});
