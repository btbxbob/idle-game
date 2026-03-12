const { test, expect } = require('../fixtures/coverage');

test.describe('StatisticsManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('update, formatTime, and render branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.StatisticsManager) {
                return { ok: false, reason: 'missing class' };
            }

            const originalWarn = console.warn;
            const warnings = [];
            console.warn = (...args) => warnings.push(args.map(String).join(' '));

            const noGameManager = new window.StatisticsManager(null);
            const noGame = noGameManager.update();

            const snakeStats = {
                total_clicks: 12,
                total_coins_earned: 3456,
                total_wood_earned: 78,
                total_stone_earned: 90,
                total_resources_crafted: 22,
                achievements_unlocked_count: 3,
                play_time_seconds: 3661,
                buildings_purchased: 6,
                upgrades_purchased: 2,
            };

            const camelStats = {
                total_clicks: 7,
                total_coins_earned: 890,
                total_wood_earned: 12,
                total_stone_earned: 34,
                total_resources_crafted: 5,
                achievements_unlocked_count: 1,
                play_time_seconds: 59,
                buildings_purchased: 4,
                upgrades_purchased: 1,
            };

            const snakeManager = new window.StatisticsManager({
                get_statistics: () => snakeStats,
            });
            const camelManager = new window.StatisticsManager({
                getStatistics: () => camelStats,
            });
            const unavailableManager = new window.StatisticsManager({});

            const missingPanelId = 'statistics-missing-panel';
            snakeManager.renderToPanel(missingPanelId);

            const tabPanel = document.getElementById('tab-statistics');
            const list = document.getElementById('statistics-list');
            const originalTabHtml = list ? list.innerHTML : '';
            if (!tabPanel || !list) {
                console.warn = originalWarn;
                return { ok: false, reason: 'missing statistics DOM' };
            }

            snakeManager.renderToPanel('tab-statistics');

            const customPanel = document.createElement('div');
            customPanel.id = 'custom-statistics-panel';
            document.body.appendChild(customPanel);
            camelManager.renderToPanel('custom-statistics-panel');

            const unavailablePanel = document.createElement('div');
            unavailablePanel.id = 'statistics-unavailable-panel';
            document.body.appendChild(unavailablePanel);
            unavailableManager.renderToPanel('statistics-unavailable-panel');

            const tabItems = list.querySelectorAll('.statistic-item').length;
            const customItems = customPanel.querySelectorAll('.statistic-item').length;
            const firstLabel = list.querySelector('.stat-label')?.textContent || '';
            const playTime = Array.from(list.querySelectorAll('.statistic-item')).map((item) => ({
                label: item.querySelector('.stat-label')?.textContent || '',
                value: item.querySelector('.stat-value')?.textContent || '',
            })).find((item) => item.label.includes('总点击次数') === false && item.value.includes(':'))?.value || '';

            const customText = customPanel.textContent || '';

            const formattedLong = snakeManager.formatTime(3661.9);
            const formattedShort = camelManager.formatTime(59);

            const snakeUpdateCoins = snakeManager.update()?.total_coins_earned || 0;
            const camelUpdateCoins = camelManager.update()?.total_coins_earned || 0;

            list.innerHTML = originalTabHtml;
            customPanel.remove();
            unavailablePanel.remove();
            console.warn = originalWarn;

            return {
                ok: true,
                noGame,
                snakeUpdateCoins,
                camelUpdateCoins,
                formattedLong,
                formattedShort,
                tabItems,
                customItems,
                firstLabel,
                playTime,
                customText,
                warnings,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.noGame).toBe(null);
        expect(result.snakeUpdateCoins).toBe(3456);
        expect(result.camelUpdateCoins).toBe(890);
        expect(result.formattedLong).toBe('01:01:01');
        expect(result.formattedShort).toBe('00:00:59');
        expect(result.tabItems).toBe(9);
        expect(result.customItems).toBe(9);
        expect(result.firstLabel).toContain('总点击次数');
        expect(result.playTime).toBe('01:01:01');
        expect(result.customText).toContain('890');
        expect(result.warnings.some((warning) => warning.includes('Statistics panel "statistics-missing-panel" not found'))).toBe(true);
        expect(result.warnings.some((warning) => warning.includes('Statistics not available'))).toBe(true);
    });
});
