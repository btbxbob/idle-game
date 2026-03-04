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
});
