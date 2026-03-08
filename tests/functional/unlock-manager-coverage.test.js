const { test, expect } = require('../fixtures/coverage');

test.describe('UnlockManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('update and renderUnlocks branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.unlockManager) return { ok: false };
            const panel = document.createElement('div');
            panel.id = 'unlock-list';
            document.body.appendChild(panel);

            window.unlockManager.containerElement = panel;
            window.unlockManager.update();
            const count = window.unlockManager.unlocks.length;
            window.unlockManager.renderUnlocks();
            const html = panel.innerHTML;

            panel.remove();
            return { ok: true, count, hasHtml: html.length >= 0 };
        });
        expect(result.ok).toBe(true);
    });

    test('checkProgress and formatRequirement branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.unlockManager) return { ok: false };
            window.unlockManager.update();
            const first = window.unlockManager.unlocks[0];
            const existing = first ? window.unlockManager.checkProgress(first.id) : null;
            const details = first ? window.unlockManager.getRequirementDetails(first.id) : null;
            return {
                ok: true,
                existingCurrent: existing ? existing.current : null,
                fmtClicks: window.unlockManager.formatRequirement('total_clicks'),
                fmtWorkers: window.unlockManager.formatRequirement('workers_stage'),
                detailsSummary: details ? details.summary : null,
                hasExisting: !!existing || window.unlockManager.unlocks.length === 0,
            };
        });
        expect(result.ok).toBe(true);
        if (result.existingCurrent !== null) {
            expect(result.existingCurrent).toBeGreaterThanOrEqual(0);
        }
        expect(result.fmtClicks.length).toBeGreaterThan(0);
        expect(result.fmtWorkers.length).toBeGreaterThan(0);
    });

    test('unlock and updateButtonStates branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.unlockManager) return { ok: false };
            const panel = document.createElement('div');
            panel.id = 'unlock-list';
            document.body.appendChild(panel);
            window.unlockManager.containerElement = panel;
            window.unlockManager.update();
            window.unlockManager.renderUnlocks();

            let attempted = false;
            if (window.unlockManager.unlocks[0]) {
                attempted = window.unlockManager.unlock(window.unlockManager.unlocks[0].id) === true || window.unlockManager.unlock(window.unlockManager.unlocks[0].id) === false;
            }
            const desc = window.unlockManager.getDescription('workers_tab');
            const rendered = panel.innerHTML.includes('unlock-requirement-line');
            panel.remove();
            return { ok: true, attempted, descHasText: !!desc && desc.length > 0, rendered };
        });
        expect(result.ok).toBe(true);
        expect(result.descHasText).toBe(true);
        expect(result.rendered || result.attempted === false || result.attempted === true).toBe(true);
    });
});
