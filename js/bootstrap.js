// 异步加载WASM模块
async function initWasm() {
    try {
        // 动态导入生成的WASM绑定
        const init = await import('../pkg/idle_game.js');
        const wasm = await init.default();
        
        // 初始化游戏
        const game = init.init_game();
        
        // 尝试从 localStorage 加载存档
        let gameLoaded = false;
        let saveWasReset = false;
        try {
            const loaded = game.loadFromLocalStorage();
            if (loaded) {
                gameLoaded = true;
                console.log('✅ Game loaded from localStorage at', new Date().toLocaleString());
                console.log('   Coins:', game.get_coins());
                console.log('   Wood:', game.get_wood());
                console.log('   Stone:', game.get_stone());
                
                // Check if save was reset (all resources are 0 but there was a save)
                if (game.get_coins() === 0 && game.get_wood() === 0 && game.get_stone() === 0) {
                    saveWasReset = true;
                    console.warn('⚠️ Save game was reset due to version update (0.3.0)');
                }
            } else {
                console.log('ℹ️ No saved game found, starting new game');
            }
        } catch (loadError) {
            console.error('❌ Error loading saved game:', loadError);
        }
        
        // Show reset notification if save was reset
        if (saveWasReset) {
            const message = window.i18n && window.i18n.currentLang === 'zh-CN' 
                ? '游戏已更新至 v0.3.0，存档已重置。Worker系统已重新设计，请重新开始游戏。' 
                : 'Game updated to v0.3.0, save has been reset. Worker system has been redesigned, please start a new game.';
            console.warn(message);
            // Delay alert to not block initialization
            setTimeout(() => {
                alert(message);
            }, 500);
        }
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
        let gameLoaded = false;
        try {
            const loaded = game.loadFromLocalStorage();
            if (loaded) {
                gameLoaded = true;
                console.log('✅ Game loaded from localStorage at', new Date().toLocaleString());
                console.log('   Coins:', game.get_coins());
                console.log('   Wood:', game.get_wood());
                console.log('   Stone:', game.get_stone());
            } else {
                console.log('ℹ️ No saved game found, starting new game');
            }
        } catch (loadError) {
            console.error('❌ Error loading saved game:', loadError);
        }
        
        // 将游戏实例暴露到全局作用域供 UI 使用
        window.rustGame = game;
        window.gameInitialized = true;
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
        }
        
        if (window.WorkerManager) {
            window.workerManager = new window.WorkerManager(game);
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