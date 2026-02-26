# js/ - JavaScript Frontend

**Location**: `js/` directory (15 modules)
**Pattern**: Manager classes wrapping WASM calls. NO game logic in JS.

## Module Structure
```
js/
├── bootstrap.js              # WASM init, game loop (1000ms), manager setup
├── game.js (475 lines)       # UI update functions, event handlers
├── i18n.js (498 lines)       # Translations (zh-CN primary, en secondary)
├── statistics.js             # StatisticsManager (9 metrics)
├── achievements.js           # AchievementManager + toast notifications
├── crafting.js               # CraftingManager (6+ recipes)
├── unlocks.js                # UnlockManager (5 features)
├── workers.js (396 lines)    # WorkerManager (traits, gender, hobbies)
├── resource-manager.js       # Resource state management
├── resource-panel.js         # Resource display panel
├── resource-classification.js (356 lines) # Resource categorization (60+ types)
├── technology-manager.js (784 lines)      # Technology tree UI
├── housing-manager.js        # Housing/population capacity UI
├── population-manager.js     # Population growth/death UI
└── prestige-manager.js       # Prestige reset UI
```

## Manager Pattern (MANDATORY)
```javascript
class TechnologyManager {
  constructor(rustGame) { this.rustGame = rustGame; }
  update() { return this.rustGame.get_technology_tree(); }
  renderToPanel(id) { /* DOM updates only */ }
}
window.technologyManager = new TechnologyManager(game);
```

## ANTI-PATTERNS (CRITICAL)
```javascript
// ❌ FORBIDDEN — modify game state directly
window.rustGame.state.coins = 1000;
// ✅ REQUIRED — call Rust functions only
window.rustGame.click_action();

// ❌ FORBIDDEN — assume WASM ready
const coins = window.rustGame.get_coins();
// ✅ REQUIRED — check initialization
if (window.gameInitialized && window.rustGame) { ... }

// ❌ FORBIDDEN — hardcode i18n strings
element.textContent = "金币";
// ✅ REQUIRED — use i18n system
const t = window.i18n.t.bind(window.i18n);
element.textContent = t('coins');
```

## Game Loop (1000ms — DO NOT CHANGE)
```javascript
setInterval(() => {
    if (window.rustGame) {
        window.rustGame.game_loop();
        // All managers update here
    }
}, 1000);
```

## window.* Globals
- `window.rustGame` — WASM game instance
- `window.gameInitialized` — boolean, true when WASM ready
- `window.i18n` — Translation system
- `window.{name}Manager` — All manager instances

## Commands
```bash
npm run test          # Playwright E2E tests
npx playwright test tests/specific.test.js
```
