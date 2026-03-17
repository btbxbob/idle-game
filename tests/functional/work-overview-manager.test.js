const { test, expect } = require('../fixtures/coverage');

test.describe('WorkOverviewManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('render fallback and missing panel paths execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.workOverviewManager) {
                return { ok: false, reason: 'missing manager' };
            }

            const originalPanel = document.getElementById('work-overview-panel');
            const originalHtml = originalPanel ? originalPanel.innerHTML : null;
            if (originalPanel) {
                originalPanel.remove();
            }

            window.workOverviewManager.renderToPanel('work-overview-panel');

            const tempPanel = document.createElement('div');
            tempPanel.id = 'work-overview-panel';
            document.body.appendChild(tempPanel);

            const originalUpdate = window.workOverviewManager.update;
            window.workOverviewManager.update = () => null;
            window.workOverviewManager.renderToPanel('work-overview-panel');
            const fallbackHtml = tempPanel.innerHTML;

            window.workOverviewManager.update = originalUpdate;
            tempPanel.remove();

            if (originalPanel) {
                const restored = document.createElement('div');
                restored.id = 'work-overview-panel';
                restored.innerHTML = originalHtml || '';
                document.body.appendChild(restored);
            }

            return {
                ok: true,
                fallbackContainsUnavailable: fallbackHtml.includes('工作总览数据不可用')
            };
        });

        expect(result.ok).toBe(true);
        expect(result.fallbackContainsUnavailable).toBe(true);
    });

    test('render table and escape paths execute', async ({ page }) => {
        const rendered = await page.evaluate(() => {
            if (!window.workOverviewManager) {
                return { ok: false, reason: 'missing manager' };
            }

            let panel = document.getElementById('work-overview-panel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'work-overview-panel';
                document.body.appendChild(panel);
            }

            const originalUpdate = window.workOverviewManager.update;
            window.workOverviewManager.update = () => ({
                total_workers: 3,
                unassigned_workers: 1,
                total_efficiency: 3.2,
                jobs: [
                    { job_type: '矿工', worker_count: 2, avg_efficiency: 1.3, total_output: 8 },
                    { job_type: '<script>alert(1)</script>', worker_count: 1, avg_efficiency: 0.6, total_output: 2 }
                ]
            });

            window.workOverviewManager.renderToPanel('work-overview-panel');
            const html = panel.innerHTML;
            const rows = panel.querySelectorAll('tbody tr').length;
            const hasPie = !!panel.querySelector('.workforce-pie');

            window.workOverviewManager.update = originalUpdate;

            return {
                ok: true,
                rows,
                hasPie,
                escapedScript: html.includes('&lt;script&gt;alert(1)&lt;/script&gt;')
            };
        });

        expect(rendered.ok).toBe(true);
        expect(rendered.rows).toBeGreaterThanOrEqual(2);
        expect(rendered.hasPie).toBe(true);
        expect(rendered.escapedScript).toBe(true);
    });

    test('update, pie, palette and formatter fallback branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.WorkOverviewManager(null);

            const nullUpdate = manager.update();

            manager.rustGame = {
                get_work_overview_json: () => '{bad-json',
            };
            const invalidUpdate = manager.update();

            manager.rustGame = {
                get_work_overview_json: () => JSON.stringify({ total_workers: 2, unassigned_workers: 1, total_efficiency: 2, jobs: [] }),
            };
            const validUpdate = manager.update();

            const emptyPie = manager.buildPieGradient([], 0);
            const partialPie = manager.buildPieGradient([{ worker_count: 1 }, { worker_count: 1 }], 3);
            const paletteWrapped = manager.getPaletteColor(9);

            const originalFormatter = window.NumberFormatter;
            delete window.NumberFormatter;
            const decimalFallback = manager.formatDecimal(12.345, 2);
            const integerFallback = manager.formatInteger(42.9);
            const percentFallback = manager.formatPercent(12.345, 0);
            window.NumberFormatter = originalFormatter;

            let panel = document.getElementById('work-overview-panel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'work-overview-panel';
                document.body.appendChild(panel);
            }

            manager.renderToPanel('work-overview-panel');
            const panelHtml = panel.innerHTML;

            return {
                nullUpdate,
                invalidUpdate,
                validTotalWorkers: validUpdate.total_workers,
                emptyPie,
                partialPie,
                paletteWrapped,
                decimalFallback,
                integerFallback,
                percentFallback,
                panelHtml,
            };
        });

        expect(result.nullUpdate).toBeNull();
        expect(result.invalidUpdate).toBeNull();
        expect(result.validTotalWorkers).toBe(2);
        expect(result.emptyPie).toContain('conic-gradient');
        expect(result.partialPie).toContain('#777');
        expect(result.paletteWrapped).toBe('#f5b041');
        expect(result.decimalFallback).toBe('12.35');
        expect(result.integerFallback).toBe('42');
        expect(result.percentFallback).toBe('12%');
        expect(result.panelHtml).toContain('暂无分配数据');
        expect(result.panelHtml).toContain('暂无工种分布数据');
    });

    test('formatter integration and full pie branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = new window.WorkOverviewManager({
                get_work_overview_json: () => JSON.stringify({
                    total_workers: 4,
                    unassigned_workers: 0,
                    total_efficiency: 5,
                    jobs: [
                        { job_type: '农夫', worker_count: 2, avg_efficiency: 1.25, total_output: 4.2 },
                        { job_type: '矿工', worker_count: 2, avg_efficiency: 1.0, total_output: 3.1 }
                    ]
                })
            });

            const originalFormatter = window.NumberFormatter;
            window.NumberFormatter = {
                formatDecimal: (value, { fractionDigits }) => `DEC:${Number(value).toFixed(fractionDigits)}`,
                formatInteger: (value) => `INT:${Math.floor(Number(value) || 0)}`,
                formatPercent: (value, { fractionDigits }) => `PCT:${Number(value).toFixed(fractionDigits)}`,
            };

            const panel = document.createElement('div');
            panel.id = 'work-overview-panel-formatter';
            document.body.appendChild(panel);

            manager.renderToPanel('work-overview-panel-formatter');
            const html = panel.innerHTML;
            const fullPie = manager.buildPieGradient([
                { worker_count: 2 },
                { worker_count: 2 }
            ], 4);

            panel.remove();
            window.NumberFormatter = originalFormatter;

            return {
                html,
                fullPie,
            };
        });

        expect(result.html).toContain('INT:4');
        expect(result.html).toContain('PCT:125.0');
        expect(result.html).toContain('DEC:4.20');
        expect(result.fullPie).toContain('conic-gradient');
        expect(result.fullPie).not.toContain('#777');
    });
});
