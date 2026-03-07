// 异步加载WASM模块
async function canLoadVersionedBundle(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            cache: 'no-store'
        });
        if (!response.ok) {
            return false;
        }
        const contentType = response.headers.get('content-type') || '';
        return !contentType.includes('text/html');
    } catch (error) {
        return false;
    }
}

async function loadWasmBindings() {
    const appVersion = document.querySelector('meta[name="app-version"]')?.content;
    const baseUrl = document.baseURI || window.location.href;

    if (appVersion) {
        const versionedUrl = new URL(`pkg/idle_game.v${appVersion}.js`, baseUrl);
        if (await canLoadVersionedBundle(versionedUrl.href)) {
            return await import(versionedUrl.href);
        }
        console.info(`Versioned WASM bundle not available for v${appVersion}, using unversioned bundle.`);
    }

    const fallbackUrl = new URL('pkg/idle_game.js', baseUrl);
    return await import(fallbackUrl.href);
}

async function initWasm() {
    try {
        // 动态导入生成的WASM绑定
        const init = await loadWasmBindings();
        const wasm = await init.default();
        
        // 初始化游戏
        const game = init.init_game();
        
        // 尝试从 localStorage 加载存档
        let gameLoaded = false;
        let hadExistingSave = false;
        try {
            // Check if we have an existing save
            const existingSave = localStorage.getItem('idle_game_save');
            hadExistingSave = !!existingSave;
            
            const loaded = game.loadFromLocalStorage();
            if (loaded) {
                gameLoaded = true;
                
                // Check if save was reset due to version mismatch
                const coins = game.get_coins();
                const wood = game.get_wood();
                const stone = game.get_stone();
                const totalClicks = game.get_total_clicks ? game.get_total_clicks() : 0;
                
                if (hadExistingSave && coins === 0 && wood === 0 && stone === 0 && totalClicks === 0) {
                    // Likely a version reset
                    console.warn('⚠️ Game save was reset due to version update (0.3.0)');
                    if (window.i18n) {
                        const t = window.i18n.t.bind(window.i18n);
                        alert(t('saveResetAlert') || '游戏已更新至 v0.3.0，由于结构性变更，存档已重置。请开始新的游戏旅程！');
                    } else {
                        alert('游戏已更新至 v0.3.0，由于结构性变更，存档已重置。请开始新的游戏旅程！');
                    }
                } else {
                    console.log('✅ Game loaded from localStorage at', new Date().toLocaleString());
                    console.log('   Coins:', coins);
                    console.log('   Wood:', wood);
                    console.log('   Stone:', stone);
                }
            } else {
                console.log('ℹ️ No saved game found, starting new game');
            }
        } catch (loadError) {
            console.error('❌ Error loading saved game:', loadError);
        }
        
        // 将游戏实例暴露到全局作用域供 UI 使用
        window.rustGame = game;
        window.gameInitialized = true;
        
        // Add click handler for coin-button
        const coinButton = document.getElementById('coin-button');
        if (coinButton) {
            coinButton.addEventListener('click', () => {
                if (game && typeof game.click_action === 'function') {
                    game.click_action();
                }
            });
        }
        
        if (window.StatisticsManager) {
            window.statisticsManager = new window.StatisticsManager(game);
        }
        
        if (window.CraftingManager) {
            window.craftingManager = new window.CraftingManager(game);
        }
        
        if (window.AchievementManager) {
            window.achievementManager = new window.AchievementManager(game);
        }
        
        if (window.UnlockManager) {
            window.unlockManager = new window.UnlockManager(game);
            window.unlockManager.update();
        }
        
        if (window.WorkerManager) {
            window.workerManager = new window.WorkerManager(game);
        }

        if (window.TechnologyManager) {
            window.technologyManager = new window.TechnologyManager(game, window.i18n || null);
        }

        if (window.HousingManager) {
            window.housingManager = new window.HousingManager(game);
        }

        if (window.WorkOverviewManager) {
            window.workOverviewManager = new window.WorkOverviewManager(game);
        }

        if (window.LifecycleManager) {
            window.lifecycleManager = new window.LifecycleManager(game);
        }
        
        if (window.ResourceManager && window.i18n) {
            window.resourceManager = new window.ResourceManager(game, window.i18n);
            window.resourceManager.initialize();
        }
        
        if (game && typeof game.update_ui === 'function') {
            game.update_ui();
        }
        
        // 更新 i18n 翻译（如果存在）
        if (window.i18n) {
            window.i18n.updateAllTranslations();
        }
        
        console.log('Idle game initialized successfully!');
        
        // 启动游戏主循环
        startGameLoop(game);
        
        return game;
    } catch (error) {
        console.error('Failed to initialize WASM:', error);
        alert('Failed to load game. Please check the console for details.');
    }
}

// 启动游戏主循环
function startGameLoop(game) {
    // 主游戏循环 - 每秒更新资源和成就
    setInterval(() => {
        if (game && typeof game.game_loop === 'function') {
            game.game_loop();
        }
        if (window.updateStatisticsPanel) {
            window.updateStatisticsPanel();
        }
        if (window.updateUnlocksPanel) {
            window.updateUnlocksPanel();
        }
        if (window.updateCraftingPanel) {
            window.updateCraftingPanel();
        }
        if (window.updateAchievementsPanel) {
            window.updateAchievementsPanel();
        }
        if (window.updateCoinButton) {
            window.updateCoinButton();
        }
        if (window.updateResourcePanel) {
            window.updateResourcePanel();
        }
        if (window.updateTechnologyPanel) {
            window.updateTechnologyPanel();
        }
        if (window.updateLifecyclePanel) {
            window.updateLifecyclePanel();
        }
    }, 1000);
    
    // 自动保存 - 每 15 秒保存一次
    setInterval(() => {
        if (game && typeof game.saveToLocalStorage === 'function') {
            try {
                game.saveToLocalStorage();
                console.log('Game auto-saved at', new Date().toLocaleTimeString());
            } catch (saveError) {
                console.error('Auto-save failed:', saveError);
            }
        }
    }, 15000); // 15 seconds
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initWasm();
});
