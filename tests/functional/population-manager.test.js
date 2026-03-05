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

    test('update/fallback/filter/status/color/sort-indicator branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.PopulationManager) {
                return { ok: false, reason: 'missing class' };
            }

            const managerNoApi = new window.PopulationManager(null);
            const noApi = managerNoApi.update();

            const managerThrow = new window.PopulationManager({
                get_population_overview: () => {
                    throw new Error('boom-pop');
                },
            });
            const throwData = managerThrow.update();

            const workers = [
                { id: 1, name: '工人A', assigned_building: '矿场', is_hungry: false, status: '工作中', mood: 80, health: 85, efficiency: 1.2 },
                { id: 2, name: '工人B', assigned_building: '未分配', is_hungry: false, status: '空闲', mood: 50, health: 45, efficiency: 1.0 },
                { id: 3, name: '工人C', assigned_building: '农场', is_hungry: true, status: '空闲', mood: 20, health: 25, efficiency: 0.8 },
            ];

            const manager = new window.PopulationManager({
                get_population_overview: () => workers,
            });

            const assigned = manager.filterByStatus(workers, 'assigned').length;
            const unassigned = manager.filterByStatus(workers, 'unassigned').length;
            const hungry = manager.filterByStatus(workers, 'hungry').length;
            const all = manager.filterByStatus(workers, 'all').length;
            const unknown = manager.filterByStatus(workers, 'unknown').length;

            const statusHungry = manager.formatStatus('空闲', true);
            const statusWorking = manager.formatStatus('工作中', false);
            const statusIdle = manager.formatStatus('空闲', false);
            const statusOther = manager.formatStatus('测试状态', false);

            const low = manager.formatColoredValue(20, 30, 70);
            const normal = manager.formatColoredValue(50, 30, 70);
            const high = manager.formatColoredValue(80, 30, 70);

            const table = document.createElement('table');
            table.id = 'population-table';
            table.innerHTML = '<thead><tr><th data-sort="name">姓名</th><th data-sort="age">年龄</th></tr></thead>';
            document.body.appendChild(table);

            manager.sortColumn = 'age';
            manager.sortDirection = 'desc';
            manager.updateSortIndicators();
            const ageTh = table.querySelector('th[data-sort="age"]');
            const nameTh = table.querySelector('th[data-sort="name"]');
            const sortedAge = ageTh && ageTh.classList.contains('sorted');
            const unsortedName = nameTh && !nameTh.classList.contains('sorted');
            const ageText = ageTh ? ageTh.textContent : '';

            table.remove();

            return {
                ok: true,
                noApiLength: noApi.length,
                throwLength: throwData.length,
                assigned,
                unassigned,
                hungry,
                all,
                unknown,
                statusHungry,
                statusWorking,
                statusIdle,
                statusOther,
                low,
                normal,
                high,
                sortedAge,
                unsortedName,
                ageText,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.noApiLength).toBe(0);
        expect(result.throwLength).toBe(0);
        expect(result.assigned).toBe(2);
        expect(result.unassigned).toBe(1);
        expect(result.hungry).toBe(1);
        expect(result.all).toBe(3);
        expect(result.unknown).toBe(3);
        expect(result.statusHungry).toContain('饥饿');
        expect(result.statusWorking).toContain('工作中');
        expect(result.statusIdle).toContain('空闲');
        expect(result.statusOther).toBe('测试状态');
        expect(result.low).toContain('value-low');
        expect(result.normal).toContain('value-normal');
        expect(result.high).toContain('value-high');
        expect(result.sortedAge).toBe(true);
        expect(result.unsortedName).toBe(true);
        expect(result.ageText).toContain('▼');
    });

    test('renderPopulation empty state branch', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.PopulationManager) {
                return { ok: false, reason: 'missing class' };
            }

            const manager = new window.PopulationManager({
                get_population_overview: () => [],
            });

            const table = document.createElement('table');
            table.id = 'population-table';
            document.body.appendChild(table);

            const tbody = document.createElement('tbody');
            tbody.id = 'population-table-body';
            table.appendChild(tbody);

            const summary = document.createElement('div');
            summary.id = 'population-summary';
            document.body.appendChild(summary);

            manager.renderPopulation();

            const html = tbody.innerHTML;
            const summaryText = summary.textContent || '';

            table.remove();
            summary.remove();

            return {
                ok: true,
                hasEmptyMessage: html.includes('暂无人口数据'),
                summaryHasZero: summaryText.includes('总人数：0'),
            };
        });

        expect(result.ok).toBe(true);
        expect(result.hasEmptyMessage).toBe(true);
        expect(result.summaryHasZero).toBe(true);
    });
});
