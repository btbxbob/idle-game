const { test, expect } = require('../fixtures/coverage');

test.describe('bootstrap.js coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('canLoadVersionedBundle covers success and fallback branches', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const originalFetch = window.fetch;

            window.fetch = async (url) => {
                const value = String(url);
                if (value.includes('ok-js')) {
                    return {
                        ok: true,
                        headers: { get: () => 'application/javascript' },
                    };
                }
                if (value.includes('html-response')) {
                    return {
                        ok: true,
                        headers: { get: () => 'text/html; charset=utf-8' },
                    };
                }
                if (value.includes('bad-status')) {
                    return {
                        ok: false,
                        headers: { get: () => 'application/javascript' },
                    };
                }
                throw new Error('network-down');
            };

            const okJs = await window.canLoadVersionedBundle('http://example.test/ok-js');
            const htmlResponse = await window.canLoadVersionedBundle('http://example.test/html-response');
            const badStatus = await window.canLoadVersionedBundle('http://example.test/bad-status');
            const thrown = await window.canLoadVersionedBundle('http://example.test/throw');

            window.fetch = originalFetch;

            return { okJs, htmlResponse, badStatus, thrown };
        });

        expect(result.okJs).toBe(true);
        expect(result.htmlResponse).toBe(false);
        expect(result.badStatus).toBe(false);
        expect(result.thrown).toBe(false);
    });

    test('initWasm covers save reset alert and manager wiring branches', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const originals = {
                loadWasmBindings: window.loadWasmBindings,
                startGameLoop: window.startGameLoop,
                alert: window.alert,
                i18n: window.i18n,
                rustGame: window.rustGame,
                gameInitialized: window.gameInitialized,
                StatisticsManager: window.StatisticsManager,
                AchievementManager: window.AchievementManager,
                UnlockManager: window.UnlockManager,
                WorkerManager: window.WorkerManager,
                TechnologyManager: window.TechnologyManager,
                HousingManager: window.HousingManager,
                WorkOverviewManager: window.WorkOverviewManager,
                LifecycleManager: window.LifecycleManager,
                ResourceManager: window.ResourceManager,
                localStorageGetItem: Storage.prototype.getItem,
            };

            const alerts = [];
            let translationsUpdated = 0;
            let loopStarts = 0;
            let unlockUpdates = 0;
            let resourceInitializes = 0;
            let coinClicks = 0;

            const existingCoinButton = document.getElementById('coin-button');
            const createdCoinButton = !existingCoinButton;
            const coinButton = existingCoinButton || document.createElement('button');
            if (createdCoinButton) {
                coinButton.id = 'coin-button';
                document.body.appendChild(coinButton);
            }

            window.alert = (msg) => alerts.push(String(msg));
            window.i18n = {
                currentLanguage: 'zh-CN',
                t: (key) => ({ saveResetAlert: '存档已重置' }[key] || key),
                updateAllTranslations: () => { translationsUpdated += 1; },
            };

            Storage.prototype.getItem = function(key) {
                if (key === 'idle_game_save') {
                    return 'existing-save';
                }
                return originals.localStorageGetItem.call(this, key);
            };

            const game = {
                loadFromLocalStorage: () => true,
                get_coins: () => 0,
                get_wood: () => 0,
                get_stone: () => 0,
                get_total_clicks: () => 0,
                click_action: () => { coinClicks += 1; },
                update_ui: () => {},
            };

            window.loadWasmBindings = async () => ({
                default: async () => ({}),
                init_game: () => game,
            });
            window.startGameLoop = () => { loopStarts += 1; };

            window.StatisticsManager = function(g) { this.game = g; };
            window.AchievementManager = function(g) { this.game = g; };
            window.UnlockManager = function(g) {
                this.game = g;
                this.update = () => { unlockUpdates += 1; };
            };
            window.WorkerManager = function(g) { this.game = g; };
            window.TechnologyManager = function(g, i18n) { this.game = g; this.i18n = i18n; };
            window.HousingManager = function(g) { this.game = g; };
            window.WorkOverviewManager = function(g) { this.game = g; };
            window.LifecycleManager = function(g) { this.game = g; };
            window.ResourceManager = function(g, i18n) {
                this.game = g;
                this.i18n = i18n;
                this.initialize = () => { resourceInitializes += 1; };
            };

            const initResult = await window.initWasm();
            coinButton.click();

            const summary = {
                initReturnedGame: initResult === game,
                gameInitialized: window.gameInitialized === true,
                rustGameMatches: window.rustGame === game,
                alerts,
                translationsUpdated,
                loopStarts,
                unlockUpdates,
                resourceInitializes,
                coinClicks,
                hasStatisticsManager: !!window.statisticsManager,
                hasAchievementManager: !!window.achievementManager,
                hasUnlockManager: !!window.unlockManager,
                hasWorkerManager: !!window.workerManager,
                hasTechnologyManager: !!window.technologyManager,
                hasHousingManager: !!window.housingManager,
                hasWorkOverviewManager: !!window.workOverviewManager,
                hasLifecycleManager: !!window.lifecycleManager,
                hasResourceManager: !!window.resourceManager,
            };

            if (createdCoinButton) {
                coinButton.remove();
            }
            window.loadWasmBindings = originals.loadWasmBindings;
            window.startGameLoop = originals.startGameLoop;
            window.alert = originals.alert;
            window.i18n = originals.i18n;
            window.rustGame = originals.rustGame;
            window.gameInitialized = originals.gameInitialized;
            window.StatisticsManager = originals.StatisticsManager;
            window.AchievementManager = originals.AchievementManager;
            window.UnlockManager = originals.UnlockManager;
            window.WorkerManager = originals.WorkerManager;
            window.TechnologyManager = originals.TechnologyManager;
            window.HousingManager = originals.HousingManager;
            window.WorkOverviewManager = originals.WorkOverviewManager;
            window.LifecycleManager = originals.LifecycleManager;
            window.ResourceManager = originals.ResourceManager;
            Storage.prototype.getItem = originals.localStorageGetItem;

            return summary;
        });

        expect(result.initReturnedGame).toBe(true);
        expect(result.gameInitialized).toBe(true);
        expect(result.rustGameMatches).toBe(true);
        expect(result.alerts).toContain('存档已重置');
        expect(result.translationsUpdated).toBe(1);
        expect(result.loopStarts).toBe(1);
        expect(result.unlockUpdates).toBe(1);
        expect(result.resourceInitializes).toBe(1);
        expect(result.coinClicks).toBe(1);
        expect(result.hasStatisticsManager).toBe(true);
        expect(result.hasAchievementManager).toBe(true);
        expect(result.hasUnlockManager).toBe(true);
        expect(result.hasWorkerManager).toBe(true);
        expect(result.hasTechnologyManager).toBe(true);
        expect(result.hasHousingManager).toBe(true);
        expect(result.hasWorkOverviewManager).toBe(true);
        expect(result.hasLifecycleManager).toBe(true);
        expect(result.hasResourceManager).toBe(true);
    });

    test('startGameLoop covers update hooks and autosave failure branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalSetInterval = window.setInterval;
            const originalConsoleError = console.error;
            const scheduled = [];
            const errors = [];
            const counters = {
                gameLoop: 0,
                stats: 0,
                unlocks: 0,
                achievements: 0,
                coin: 0,
                resource: 0,
                tech: 0,
                lifecycle: 0,
            };

            window.setInterval = (fn, delay) => {
                scheduled.push({ fn, delay });
                return scheduled.length;
            };
            console.error = (...args) => errors.push(args.map(String).join(' '));

            window.updateStatisticsPanel = () => { counters.stats += 1; };
            window.updateUnlocksPanel = () => { counters.unlocks += 1; };
            window.updateAchievementsPanel = () => { counters.achievements += 1; };
            window.updateCoinButton = () => { counters.coin += 1; };
            window.updateResourcePanel = () => { counters.resource += 1; };
            window.updateTechnologyPanel = () => { counters.tech += 1; };
            window.updateLifecyclePanel = () => { counters.lifecycle += 1; };

            const game = {
                game_loop: () => { counters.gameLoop += 1; },
                saveToLocalStorage: () => { throw new Error('save-boom'); },
            };

            window.startGameLoop(game);
            scheduled[0].fn();
            scheduled[1].fn();

            window.setInterval = originalSetInterval;
            console.error = originalConsoleError;

            return {
                intervalCount: scheduled.length,
                delays: scheduled.map((item) => item.delay),
                counters,
                errors,
            };
        });

        expect(result.intervalCount).toBe(2);
        expect(result.delays).toEqual([1000, 15000]);
        expect(result.counters.gameLoop).toBe(1);
        expect(result.counters.stats).toBe(1);
        expect(result.counters.unlocks).toBe(1);
        expect(result.counters.achievements).toBe(1);
        expect(result.counters.coin).toBe(1);
        expect(result.counters.resource).toBe(1);
        expect(result.counters.tech).toBe(1);
        expect(result.counters.lifecycle).toBe(1);
        expect(result.errors.some((entry) => entry.includes('Auto-save failed:'))).toBe(true);
    });
});
