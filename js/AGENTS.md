# js/ - JavaScript Frontend Managers

**Location**: `js/` directory
**Role**: Browser-side orchestration, DOM rendering, and WASM boundary glue.

## STRUCTURE
```
js/
├── bootstrap.js              # Primary WASM init + game loop
├── game.js                   # Window-scoped update hooks and coin particle effects
├── i18n.js                   # Localization (1260 lines, largest JS file)
├── number-formatter.js       # Number formatting
├── statistics.js             # Statistics display
├── achievements.js           # Achievements UI
├── unlocks.js                # Unlocks UI
├── workers.js                # Worker cards/assignment (1053 lines)
├── resource-manager.js       # Header resource cards
├── technology-manager.js     # Tech tree UI (1285 lines)
├── housing-manager.js        # Housing system UI
├── population-manager.js     # Population UI
├── work-overview-manager.js  # Work overview UI
├── lifecycle-manager.js      # Lifecycle management
├── event-manager.js          # Event system UI
├── prestige-manager.js       # Prestige UI
└── objective-manager.js      # Objective tracking UI
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| WASM init / save restore | `bootstrap.js` | `initWasm()` and `startGameLoop()` own startup order |
| Shared click/UI updates | `game.js` | Window-scoped update hooks used by the main loop |
| Header/resources tab UI | `resource-manager.js` | Header cards and categorized resource panel |
| Worker cards / assignment UX | `workers.js` | Dense card grid and modal assignment flow |
| Technology tree UI | `technology-manager.js` | Largest JS module; canvas/text hybrid rendering |
| Localization | `i18n.js` | zh-CN primary; keep en in sync |

## CONVENTIONS
- JS stays manager-driven: fetch state through `window.rustGame.*`, then render DOM.
- `bootstrap.js` owns manager construction order; do not instantiate managers ad hoc elsewhere.
- Keep the bootstrap construction order stable: statistics -> achievements -> unlocks -> workers -> technology -> housing -> work overview -> lifecycle -> resources.
- Guard all WASM access with `window.gameInitialized` / `window.rustGame` checks.
- Keep the 250ms game loop cadence in `bootstrap.js`; balance and tests assume it.
- Use `window.i18n.t(...)` for labels instead of hardcoded UI text.
- Coin button click logic lives solely in `bootstrap.js` — no duplicate handlers.

## ANTI-PATTERNS
- Mutating imagined JS copies of Rust state instead of calling exported methods.
- Embedding gameplay formulas in JS managers when the Rust systems already own them.
- Touching DOM before `initWasm()` finishes wiring managers and restoring saves.
- Splitting the same UI surface across multiple managers without a clear owner.
- Adding duplicate event handlers — coin button click handler belongs only in `bootstrap.js`.

## HOT FILES
- `bootstrap.js` — startup contract, save reset alert path, loop wiring, coin click handler.
- `workers.js` — large UI surface with filtering, sorting, assignment modal, XP display.
- `technology-manager.js` — highest JS complexity; check here before changing tree behavior.
- `resource-manager.js` — header resource cards and categorized resource panel synchronization.

## NOTES
- `window.update*` hooks in `game.js` are part of the main-loop contract; preserve their names when refactoring.
- `bootstrap.js` prefers versioned `pkg/idle_game.v{appVersion}.js` bundles and falls back to plain `pkg/idle_game.js` for local/dev runs.
- Coin particle effects (`window.createCoinParticles`) are defined in `game.js` and called from `bootstrap.js`.
- Local browser checks are fine here, but repository-wide test execution policy still routes formal test runs through Jenkins.
