# js/ - JavaScript Frontend

**Location**: `js/` directory (8 modules)

## Overview
Vanilla JavaScript frontend. Manager pattern for WASM integration. UI updates only - NO game logic.

## Module Structure
```
js/
├── bootstrap.js         # WASM loading, game initialization (1000ms loop)
├── game.js              # UI update functions, event handlers
├── i18n.js              # i18n system (zh-CN + en)
├── statistics.js        # StatisticsManager (9 metrics)
├── achievements.js      # AchievementManager + toast notifications
├── crafting.js          # CraftingManager (6 recipes)
├── unlocks.js           # UnlockManager (5 features)
└── workers.js           # WorkerManager (5 types, levels, XP)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add UI panel | New manager + `index.html` tab | Follow manager pattern |
| Add translation | `i18n.js` | zh-CN + en pairs |
| Fix WASM call | `bootstrap.js` + manager files | Check `window.rustGame` |
| Add event handler | `game.js` | Use event delegation |

## Manager Pattern (MANDATORY)
```javascript
class StatisticsManager {
  constructor(rustGame) {
    this.rustGame = rustGame;  // Store WASM reference
  }
  
  update() {
    // Call Rust via WASM
    return this.rustGame.get_statistics();
  }
  
  renderToPanel(panelId) {
    // DOM updates only
    const stats = this.update();
    const panel = document.getElementById(panelId);
    panel.innerHTML = `...`;
  }
}

// Initialize in bootstrap.js
window.statisticsManager = new StatisticsManager(game);
```

## ANTI-PATTERNS (CRITICAL)
### JavaScript - MUST FOLLOW
```javascript
// ❌ FORBIDDEN - modify game state directly
window.rustGame.state.coins = 1000;

// ✅ REQUIRED - call Rust functions only
window.rustGame.click_action();
```

```javascript
// ❌ FORBIDDEN - assume WASM ready
const coins = window.rustGame.get_coins();

// ✅ REQUIRED - check initialization
if (window.gameInitialized && window.rustGame) {
    const coins = window.rustGame.get_coins();
}
```

```javascript
// ❌ FORBIDDEN - hardcode i18n strings
element.textContent = "金币";

// ✅ REQUIRED - use i18n system
const t = window.i18n.t.bind(window.i18n);
element.textContent = t('coins');
```

## WASM Integration
```javascript
// bootstrap.js pattern
async function initWasm() {
    const init = await import('../pkg/idle_game.js');
    const wasm = await init.default();
    
    const game = init.init_game();
    
    // Try load saved game
    const loaded = game.loadFromLocalStorage();
    
    // Expose globally
    window.rustGame = game;
    window.gameInitialized = true;
    
    // Initialize managers
    window.statisticsManager = new StatisticsManager(game);
    // ... other managers
}
```

## Game Loop (1000ms)
```javascript
// bootstrap.js - line ~70
setInterval(() => {
    if (window.rustGame) {
        window.rustGame.game_loop();
        
        // Update all managers
        if (window.statisticsManager) window.statisticsManager.update();
        if (window.achievementsManager) window.achievementsManager.update();
        // ... other managers
    }
}, 1000);  // 1 second - DO NOT change
```

## Event Handler Pattern
```javascript
// game.js - use event delegation
document.getElementById('click-area').addEventListener('click', () => {
    if (!window.gameInitialized) return;
    window.rustGame.click_action();
});

// Upgrade button
document.getElementById('upgrade-button-0').addEventListener('click', () => {
    if (!window.gameInitialized) return;
    const success = window.rustGame.buy_upgrade(0);
    if (success) {
        window.rustGame.update_upgrades_only();
    }
});
```

## i18n System
```javascript
// i18n.js
window.i18n = {
    currentLang: 'zh-CN',
    translations: {
        'zh-CN': { gameTitle: 'Rust WASM 闲置游戏', ... },
        'en': { gameTitle: 'Rust WASM Idle Game', ... }
    },
    t(key) {
        return this.translations[this.currentLang][key] || key;
    }
};

// Usage in managers
const t = window.i18n.t.bind(window.i18n);
element.textContent = t('totalClicks');
```

## Commands
```bash
# Run Playwright tests
npm run test

# Run with UI
npm run test:ui

# Single test file
npx playwright test tests/statistics.test.js
```

## Dependencies
- WASM module (`pkg/idle_game.js`, `pkg/idle_game_bg.wasm`)
- i18n system (built-in)
- No external JS frameworks (vanilla JS only)
