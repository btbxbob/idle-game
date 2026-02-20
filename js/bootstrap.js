// 异步加载WASM模块
async function initWasm() {
    try {
        // 动态导入生成的WASM绑定
        const init = await import('../pkg/idle_game.js');
        const wasm = await init.default();
        
        // 初始化游戏
        const game = init.init_game();
        
        // 尝试从 localStorage 加载存档
        try {
            const loaded = game.load_from_local_storage();
            if (loaded) {
                console.log('Game loaded from localStorage');
            } else {
                console.log('No saved game found, starting new game');
            }
        } catch (loadError) {
            console.error('Error loading saved game:', loadError);
        }
        
        // 将游戏实例暴露到全局作用域供 UI 使用
        window.rustGame = game;
        window.gameInitialized = true;
        
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
    }, 1000);
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initWasm();
});