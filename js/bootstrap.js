// 异步加载WASM模块
async function initWasm() {
    try {
        // 动态导入生成的WASM绑定
        const init = await import('../pkg/idle_game.js');
        const wasm = await init.default();
        
        // 初始化游戏
        const game = init.init_game();
        
        // 将游戏实例暴露到全局作用域供UI使用
        window.rustGame = game;
        window.gameInitialized = true;
        
        if (game && typeof game.update_ui === 'function') {
            game.update_ui();
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
    }, 100); // 每100毫秒运行一次
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initWasm();
});