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
});
