const { test, expect } = require('../fixtures/coverage');

test.describe('PopulationManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('sorting, filtering and rendering branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.PopulationManager) {
                return { ok: false, reason: 'missing class' };
            }

            const workers = [
                { id: 1, name: '工人A', gender: 'M', age: 20, level: 1, skill_level: 2, assigned_building: '矿场', efficiency: 1.2, mood: 80, health: 90, status: '工作中', is_hungry: false },
                { id: 2, name: '工人B', gender: 'F', age: 22, level: 2, skill_level: 3, assigned_building: '未分配', efficiency: 0.9, mood: 40, health: 50, status: '空闲', is_hungry: true }
            ];

            const manager = new window.PopulationManager({
                get_population_overview: () => workers
            });

            const table = document.createElement('table');
            table.id = 'population-table';
            const thead = document.createElement('thead');
            thead.innerHTML = '<tr><th data-sort="name">姓名</th><th data-sort="age">年龄</th></tr>';
            table.appendChild(thead);
            document.body.appendChild(table);

            const tbody = document.createElement('tbody');
            tbody.id = 'population-table-body';
            table.appendChild(tbody);

            const summary = document.createElement('div');
            summary.id = 'population-summary';
            document.body.appendChild(summary);

            const filter = document.createElement('select');
            filter.id = 'population-filter';
            document.body.appendChild(filter);

            manager.initialize();
            manager.setFilter('assigned');
            manager.setSortColumn('age');
            manager.setSortColumn('age');
            manager.setFilter('hungry');
            manager.renderPopulation();

            const rows = tbody.querySelectorAll('tr').length;
            const summaryText = summary.textContent || '';

            table.remove();
            summary.remove();
            filter.remove();

            return {
                ok: true,
                rows,
                summaryHasTotal: summaryText.includes('总人数'),
                effPositive: manager.formatEfficiency(1.1),
                effNegative: manager.formatEfficiency(0.9),
                hungryStatus: manager.formatStatus('空闲', true)
            };
        });

        expect(result.ok).toBe(true);
        expect(result.rows).toBeGreaterThanOrEqual(1);
        expect(result.summaryHasTotal).toBe(true);
        expect(result.effPositive).toContain('+');
        expect(result.effNegative).not.toContain('+');
        expect(result.hungryStatus).toContain('饥饿');
    });
});
