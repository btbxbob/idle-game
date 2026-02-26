# Idle Game Project Knowledge Base

**Generated**: 2026-02-26
**Commit**: 3859faf (Phase 2 Complete)
**Stack**: Rust + WebAssembly + JavaScript (vanilla)
**Architecture**: Game logic in Rust → WASM, UI in vanilla JS, Manager pattern

## Overview
Idle game with 60+ resources, technology tree, worker simulation, housing, decay, and prestige systems. Rust core compiled to WASM via wasm-bindgen. JS frontend uses Manager pattern for WASM integration. i18n: zh-CN primary, en secondary.

## Structure
```
idle-game/
├── src/                      # Rust game logic (33 files, ~7000 lines)
│   ├── lib.rs               # Entry point (21 lines, re-exports + init_game)
│   ├── core/idle_game.rs    # IdleGame struct (~1700 lines, ALL game operations)
│   ├── state/               # GameState, Statistics, Resources (60+ types), JobStats
│   ├── entities/            # Building, Housing, Upgrade, Worker (traits/gender/hobbies), Technology
│   ├── systems/             # achievement, crafting, production, unlock, decay, technology, prestige, population
│   ├── utils/               # NameGenerator, WorkerGenerator (rand 0.10 API)
│   ├── ui/callbacks.rs      # WASM→JS callback bridge (update_* functions)
│   └── test_utils/          # TestGameState (109 Rust tests, no WASM deps)
├── js/                       # 15 JS modules (Manager pattern)
│   ├── bootstrap.js         # WASM init, game loop (1000ms), manager setup
│   ├── game.js              # UI update functions, event handlers
│   ├── i18n.js              # Translations (zh-CN + en)
│   ├── resource-*.js        # Resource panel, classification
│   ├── technology-manager.js # Technology tree UI (784 lines)
│   └── {stats,achievements,crafting,unlocks,workers,housing,population,prestige}-*.js
├── tests/                    # 50 Playwright E2E tests (*.test.js suffix REQUIRED)
├── css/style.css            # Responsive styles, mobile-first, 4 breakpoints
├── index.html               # 9+ tabs
└── docs/                    # Design docs, guidelines
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add game mechanic | `src/core/idle_game.rs` | Core Rust logic, watch borrow scopes |
| Add resource type | `src/state/resource.rs` | ResourceType enum (60+ variants) |
| Add state field | `src/state/game_state.rs` | Pure data, add `#[serde(default)]` |
| Add entity | `src/entities/` | Building/Worker/Technology |
| Add system logic | `src/systems/` | achievement/crafting/production/decay/technology/prestige |
| Add UI panel | `js/*.js` + `index.html` | Follow Manager pattern |
| Add test (Rust) | `src/test_utils/test_game_state.rs` | `#[cfg(test)]`, TestGameState |
| Add test (E2E) | `tests/*.test.js` | Playwright, `*.test.js` suffix |
| Add translation | `js/i18n.js` | zh-CN + en pairs |
| Fix borrow error | `src/core/idle_game.rs` | Check `RefCell` scopes |
| Add CSS style | `css/style.css` | Mobile-first, 4 breakpoints |

## Core Systems (10)
1. **Resources** — 60+ types across 3 tiers (primary/secondary/advanced), 5 categories
2. **Production** — Per-resource building production with worker bonuses
3. **Workers** — 5 types, gender/hobbies/traits, levels, XP, efficiency, happiness, hunger
4. **Achievements** — 13 achievements, 5 categories, toast notifications
5. **Crafting** — 6+ bidirectional recipes (100:10:1 ratio)
6. **Unlocks** — 5 progressive features with threshold checks
7. **Technology** — Technology tree with 50 planned techs, tier-based, dependency chains
8. **Housing** — Housing buildings, population capacity
9. **Decay** — Corpse decay system (20 maggots/corpse, configurable timer)
10. **Prestige** — Reset-for-bonus system (in progress)

## ANTI-PATTERNS (CRITICAL)

### Rust Borrowing — MUST FOLLOW
```rust
// ❌ PANIC — borrow held across method call
let state = self.state.borrow();
self.check_achievement(); // state still borrowed!

// ✅ CORRECT — scope block releases borrow
{
    let state = self.state.borrow();
    let value = state.coins;
} // released
self.check_achievement(); // OK
```
- Never hold `RefCell` borrows across `self.method()` calls
- Never borrow `state` and `statistics` simultaneously
- Borrow order: statistics → state (never reverse)
- Drop borrows before `update_*` callback calls

### WASM Exports
- ❌ Never expose `Vec<T>` directly (use `#[wasm_bindgen(skip)]`)
- ❌ Never call JS from Rust without `Result` handling
- ✅ Use `Rc<RefCell<T>>` for shared mutable state

### JavaScript
- ❌ Never modify game state directly (call Rust via `window.rustGame`)
- ❌ Never assume WASM ready (check `window.gameInitialized`)
- ❌ Never hardcode i18n strings (use `js/i18n.js`)
- ✅ Use Manager pattern: `window.statisticsManager.update()`
- ✅ 1000ms game loop — DO NOT change interval

### Serialization
- All new `GameState` fields MUST have `#[serde(default)]` for save compatibility
- Version check in `game_state.rs` — old saves reset on version mismatch

### rand 0.10 API (UPDATED)
- `gen_range()` → `random_range()` (requires `use rand::RngExt;`)
- `choose_multiple()` → `sample()` (from `rand::seq::IndexedRandom`)
- Thread RNG: `use rand::rng; let mut rng = rng();`

## Key Patterns

### WASM Integration Flow
```
User click → JS handler → Rust function → State update → JS callback → DOM update
```

### Manager Pattern (JS)
```javascript
class StatisticsManager {
  constructor(rustGame) { this.rustGame = rustGame; }
  update() { return this.rustGame.get_statistics(); }
  renderToPanel(id) { /* DOM updates */ }
}
window.statisticsManager = new StatisticsManager(game);
```

### Playwright Test Pattern
```javascript
test('description', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  // Use exact Chinese strings for text matching
});
```

## Build Commands
```bash
# Development
wasm-pack build --target web --out-dir pkg --dev
python server.py  # http://localhost:8080

# Production
wasm-pack build --target web --out-dir pkg --release

# Windows/Linux shortcuts
.\build.bat  # or ./build.sh

# Tests
cargo test        # Rust (109 tests)
npm run test      # Playwright (50 test files)
npx playwright test tests/specific.test.js  # Single file
```

## Dependencies
- **Rust**: wasm-bindgen, web-sys, js-sys, serde, serde_json, serde-wasm-bindgen, base64, rand 0.10
- **System**: Rust stable, wasm-pack, Python 3, Node.js + npm
- **Test**: Playwright (auto-starts `python server.py`)

## Sub-AGENTS
- [`src/AGENTS.md`](src/AGENTS.md) — Rust module hierarchy, borrow rules
- [`src/core/AGENTS.md`](src/core/AGENTS.md) — IdleGame core logic, method sequences
- [`src/entities/AGENTS.md`](src/entities/AGENTS.md) — Entity definitions (Building, Worker, Technology)
- [`src/state/AGENTS.md`](src/state/AGENTS.md) — GameState, Resources, Statistics
- [`src/systems/AGENTS.md`](src/systems/AGENTS.md) — All game systems (10 modules)
- [`js/AGENTS.md`](js/AGENTS.md) — Manager pattern, WASM integration, i18n
- [`tests/AGENTS.md`](tests/AGENTS.md) — Playwright patterns, 50 test files
- [`docs/AGENTS.md`](docs/AGENTS.md) — Documentation structure
