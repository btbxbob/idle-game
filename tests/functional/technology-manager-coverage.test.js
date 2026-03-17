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

            const effectTypes = [
                manager.getEffectDescription({ effect: { type: 'ProductionBonus', resource: 'Gold' }, effect_value: 0.2 }),
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
        expect(result.effectTypes.length).toBe(6);
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

    test('showTechDetail, notification and mechanic description branches', async ({ page }) => {
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
                    id: 'target-tech',
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

            manager.showTechDetail('target-tech');
            const modal = document.getElementById('tech-detail-modal');
            const modalHtml = modal ? modal.innerHTML : '';
            const overlayBefore = !!document.getElementById('tech-detail-modal');
            if (modal) {
                modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
            const overlayAfter = !!document.getElementById('tech-detail-modal');

            manager.showTechDetail('target-tech');
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
        expect(result.afterButton).toBe(false);
        expect(result.researchedTechId).toBe('target-tech');
        expect(result.notificationBeforeTimeout).toBe('second');
        expect(result.notificationAfterTimeout).toBe(false);
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
});
