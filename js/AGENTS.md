# js/ - JavaScript Frontend Managers

**Location**: `js/` directory
**Role**: Browser-side orchestration, DOM rendering, and WASM boundary glue.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| WASM init / save restore | `bootstrap.js` | `initWasm()` and `startGameLoop()` own startup order |
| Shared click/UI updates | `game.js` | Window-scoped update hooks used by the main loop |
| Header/resources tab UI | `resource-manager.js`, `resource-panel.js` | Header cards vs categorized panel are separate layers |
| Worker cards / assignment UX | `workers.js` | Dense card grid and modal assignment flow |
| Technology tree UI | `technology-manager.js` | Largest JS module; canvas/text hybrid rendering |
| Localization | `i18n.js` | zh-CN primary; keep en in sync |

## CONVENTIONS
- JS stays manager-driven: fetch state through `window.rustGame.*`, then render DOM.
- `bootstrap.js` owns manager construction order; do not instantiate managers ad hoc elsewhere.
- Keep the bootstrap construction order stable: statistics -> achievements -> unlocks -> workers -> technology -> housing -> work overview -> lifecycle -> resources.
- Guard all WASM access with `window.gameInitialized` / `window.rustGame` checks.
- Keep the 1000ms game loop cadence in `bootstrap.js`; balance and tests assume it.
- Use `window.i18n.t(...)` for labels instead of hardcoded UI text.

## ANTI-PATTERNS
- Mutating imagined JS copies of Rust state instead of calling exported methods.
- Embedding gameplay formulas in JS managers when the Rust systems already own them.
- Touching DOM before `initWasm()` finishes wiring managers and restoring saves.
- Splitting the same UI surface across multiple managers without a clear owner.

## HOT FILES
- `bootstrap.js` — startup contract, save reset alert path, loop wiring.
- `workers.js` — large UI surface with filtering, sorting, assignment modal, XP display.
- `technology-manager.js` — highest JS complexity; check here before changing tree behavior.
- `resource-manager.js` — header resource cards and categorized resource-panel synchronization.

## NOTES
- `window.update*` hooks in `game.js` are part of the main-loop contract; preserve their names when refactoring.
- `bootstrap.js` prefers versioned `pkg/idle_game.v{appVersion}.js` bundles and falls back to plain `pkg/idle_game.js` for local/dev runs.
- Local browser checks are fine here, but repository-wide test execution policy still routes formal test runs through Jenkins.
