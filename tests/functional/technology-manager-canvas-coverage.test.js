/**
 * TechnologyManager Card UI Coverage Tests
 * Tests for the card-based technology interface
 */
const { test, expect } = require('../fixtures/coverage');

test.describe('TechnologyManager Card UI Coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
    });

    test('render creates tech-tools and tech-grid', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'tech1', name: 'Tech One', tier: 1, researched: false, costs: { Gold: 100 } }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            window.technologyManager.render();

            const hasTools = !!container.querySelector('.tech-tools');
            const hasGrid = !!container.querySelector('.tech-grid');
            const hasCards = !!container.querySelector('.tech-card');

            container.remove();

            return { ok: true, hasTools, hasGrid, hasCards };
        });

        expect(result.ok).toBe(true);
        expect(result.hasTools).toBe(true);
        expect(result.hasGrid).toBe(true);
        expect(result.hasCards).toBe(true);
    });

    test('render with empty technologies shows message', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [];
            window.technologyManager.i18n = { t: (key) => key };

            window.technologyManager.render();
            const html = container.innerHTML;

            container.remove();

            return {
                ok: true,
                hasEmptyMessage: html.includes('暂无科技') || html.includes('noTechnologies')
            };
        });

        expect(result.ok).toBe(true);
        expect(result.hasEmptyMessage).toBe(true);
    });

    test('filter hides researched technologies', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'tech1', name: 'Researched', tier: 1, researched: true, costs: {} },
                { id: 'tech2', name: 'Available', tier: 1, researched: false, costs: { Gold: 100 } }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            // Set filter to hide researched
            window.technologyManager.filterState.hideResearched = true;
            window.technologyManager.render();

            const cards = container.querySelectorAll('.tech-card');
            const cardNames = Array.from(cards).map(c => c.querySelector('.tech-name')?.textContent || '');

            container.remove();

            return { ok: true, cardCount: cards.length, cardNames };
        });

        expect(result.ok).toBe(true);
        expect(result.cardCount).toBe(1);
        expect(result.cardNames[0]).toContain('Available');
    });

    test('filter by available shows only researchable', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'tech1', name: 'Researched', tier: 1, researched: true, costs: {} },
                { id: 'tech2', name: 'Available', tier: 1, researched: false, costs: { Gold: 100 } },
                { id: 'tech3', name: 'Locked', tier: 2, researched: false, dependencies: ['tech_missing'], costs: {} }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            window.technologyManager.filterState.filterBy = 'available';
            window.technologyManager.render();

            const cards = container.querySelectorAll('.tech-card');
            const cardNames = Array.from(cards).map(c => c.querySelector('.tech-name')?.textContent || '');

            container.remove();

            return { ok: true, cardCount: cards.length, cardNames };
        });

        expect(result.ok).toBe(true);
        expect(result.cardCount).toBe(1);
        expect(result.cardNames[0]).toContain('Available');
    });

    test('search filters technologies', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'mining', name: 'Mining Tech', tier: 1, costs: {} },
                { id: 'farming', name: 'Farming Tech', tier: 1, costs: {} }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            window.technologyManager.filterState.query = 'Mining';
            window.technologyManager.render();

            const cards = container.querySelectorAll('.tech-card');

            container.remove();

            return { ok: true, cardCount: cards.length };
        });

        expect(result.ok).toBe(true);
        expect(result.cardCount).toBe(1);
    });

    test('card shows tier badge without extra status icon when not researched', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'tech1', name: 'Test Tech', tier: 2, researched: false, costs: { Gold: 100 } }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            // Mock resource check
            window.technologyManager.getResourceValue = () => 500;

            window.technologyManager.render();

            const card = container.querySelector('.tech-card');
            const tierBadge = card?.querySelector('.tech-badge')?.textContent;
            const hasStatus = !!card?.querySelector('.tech-status');

            container.remove();

            return { ok: true, tierBadge, hasStatus };
        });

        expect(result.ok).toBe(true);
        expect(result.tierBadge).toBe('T2');
        expect(result.hasStatus).toBe(false);
    });

    test('researched technology has correct styling', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'tech1', name: 'Done Tech', tier: 1, researched: true, costs: {} }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            window.technologyManager.render();

            const card = container.querySelector('.tech-card');
            const isResearchedClass = card?.classList.contains('researched');
            const hasStatus = !!card?.querySelector('.tech-status');

            container.remove();

            return { ok: true, isResearchedClass, hasStatus };
        });

        expect(result.ok).toBe(true);
        expect(result.isResearchedClass).toBe(true);
        expect(result.hasStatus).toBe(true);
    });

    test('locked technology has correct styling without status glyph', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            window.technologyManager.treeContainer = container;
            window.technologyManager.technologies = [
                { id: 'tech1', name: 'Locked Tech', tier: 2, researched: false, dependencies: ['missing'], costs: {} }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            window.technologyManager.render();

            const card = container.querySelector('.tech-card');
            const isLockedClass = card?.classList.contains('locked');
            const hasStatus = !!card?.querySelector('.tech-status');

            container.remove();

            return { ok: true, isLockedClass, hasStatus };
        });

        expect(result.ok).toBe(true);
        expect(result.isLockedClass).toBe(true);
        expect(result.hasStatus).toBe(false);
    });

    test('update preserves tech card DOM nodes when order is unchanged', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.TechnologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            const techStates = [
                [{ id: 'tech1', name: 'Stable Tech', tier: 1, researched: false, costs: { Gold: 10 } }],
                [{ id: 'tech1', name: 'Stable Tech', tier: 1, researched: false, costs: { Gold: 10 } }],
            ];
            let stateIndex = 0;

            const manager = new window.TechnologyManager({
                get_technologies: () => techStates[stateIndex],
                get_resources: () => ({ Gold: 100 }),
            }, window.i18n || null);

            manager.treeContainer = container;
            manager.initialize();

            const firstCard = container.querySelector('.tech-card');
            if (!firstCard) {
                container.remove();
                return { ok: false, reason: 'no card rendered' };
            }

            firstCard.dataset.probe = 'persist';
            stateIndex = 1;
            manager.update();

            const updatedCard = container.querySelector('.tech-card');
            const sameNode = updatedCard === firstCard;
            const probePreserved = updatedCard?.dataset.probe === 'persist';

            container.remove();

            return { ok: true, sameNode, probePreserved };
        });

        expect(result.ok).toBe(true);
        expect(result.sameNode).toBe(true);
        expect(result.probePreserved).toBe(true);
    });

    test('research button still works after incremental sync updates footer', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.TechnologyManager) return { ok: false, reason: 'missing manager' };

            const container = document.createElement('div');
            container.id = 'technology-tree-container';
            document.body.appendChild(container);

            const techStates = [
                [{ id: 'tech1', name: 'Clickable Tech', tier: 1, researched: false, costs: { Gold: 10 } }],
                [{ id: 'tech1', name: 'Clickable Tech', tier: 1, researched: false, costs: { Gold: 10 } }],
            ];
            let stateIndex = 0;
            let researchedId = null;

            const manager = new window.TechnologyManager({
                get_technologies: () => techStates[stateIndex],
                get_resources: () => ({ Gold: 100 }),
                research_technology: (techId) => {
                    researchedId = techId;
                    return true;
                },
            }, window.i18n || null);

            manager.treeContainer = container;
            manager.initialize();
            stateIndex = 1;
            manager.update();

            const button = container.querySelector('.tech-research-btn');
            if (!button) {
                container.remove();
                return { ok: false, reason: 'missing research button' };
            }

            button.click();

            container.remove();
            return { ok: true, researchedId };
        });

        expect(result.ok).toBe(true);
        expect(result.researchedId).toBe('tech1');
    });

    test('showTechDetail creates modal', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.technologyManager) return { ok: false, reason: 'missing manager' };

            window.technologyManager.technologies = [
                { id: 'tech1', name: 'Detail Tech', tier: 1, description: 'Test desc', costs: { Gold: 100 } }
            ];
            window.technologyManager.i18n = { t: (key) => key };

            window.technologyManager.showTechDetail('tech1');

            const modal = document.getElementById('tech-detail-modal');
            const hasModal = !!modal;
            const hasTitle = modal?.querySelector('h3')?.textContent?.includes('Detail Tech');

            modal?.remove();

            return { ok: true, hasModal, hasTitle };
        });

        expect(result.ok).toBe(true);
        expect(result.hasModal).toBe(true);
        expect(result.hasTitle).toBe(true);
    });

    test('backward-compatible methods exist', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.technologyManager;
            if (!mgr) return { ok: false };

            return {
                ok: true,
                hasRenderTree: typeof mgr.renderTree === 'function',
                hasRenderTextBasedTree: typeof mgr.renderTextBasedTree === 'function',
                hasSelectTechnology: typeof mgr.selectTechnology === 'function',
                hasRenderToPanel: typeof mgr.renderToPanel === 'function',
                hasRenderForceDirectedGraph: typeof mgr.renderForceDirectedGraph === 'function',
                hasStartForceSimulation: typeof mgr.startForceSimulation === 'function',
                hasStopForceSimulation: typeof mgr.stopForceSimulation === 'function',
                hasUpdatePhysics: typeof mgr.updatePhysics === 'function',
                hasSetupCanvasEvents: typeof mgr.setupCanvasEvents === 'function',
                hasSelectNode: typeof mgr.selectNode === 'function',
                hasUpdateDetailPanel: typeof mgr.updateDetailPanel === 'function'
            };
        });

        expect(result.ok).toBe(true);
        expect(result.hasRenderTree).toBe(true);
        expect(result.hasRenderTextBasedTree).toBe(true);
        expect(result.hasSelectTechnology).toBe(true);
        expect(result.hasRenderToPanel).toBe(true);
        expect(result.hasRenderForceDirectedGraph).toBe(true);
        expect(result.hasStartForceSimulation).toBe(true);
        expect(result.hasStopForceSimulation).toBe(true);
        expect(result.hasUpdatePhysics).toBe(true);
        expect(result.hasSetupCanvasEvents).toBe(true);
        expect(result.hasSelectNode).toBe(true);
        expect(result.hasUpdateDetailPanel).toBe(true);
    });
});
