# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-01
**Commit:** 746d29f
**Branch:** master

## OVERVIEW
Rust + WASM idle game with vanilla JS UI managers and Playwright E2E tests.
Core logic is Rust (`src/`), browser orchestration is JS (`js/`), served by `python3 server.py`.

## STRUCTURE
```text
idle-game/
├── src/                 # Rust game state, entities, systems, wasm exports
├── js/                  # UI managers + bootstrap lifecycle
├── tests/               # Playwright functional/regression tests
├── docs/                # Design and development docs
├── index.html           # Main UI shell + script loading order
├── Cargo.toml           # Rust + wasm-pack config
├── package.json         # npm scripts + Playwright dependency
└── playwright.config.js # Browser matrix + webServer settings
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change game mechanics | `src/core/idle_game.rs` | Central orchestration and wasm API |
| Add/alter entities | `src/entities/` | Worker/building/technology definitions |
| Add state fields | `src/state/` | Persisted state; use serde defaults |
| Adjust systems | `src/systems/` | Crafting, production, unlock, tech, prestige |
| UI rendering/events | `js/` | Manager pattern; avoid direct state mutation |
| E2E behavior validation | `tests/functional/` | Feature flows and multi-browser checks |
| Bug regression coverage | `tests/regression/` | Past issue repro + fixed assertions |

## CONVENTIONS
- Use `python3` (not `python`) for local server and Playwright `webServer.command`.
- Keep game loop cadence at 1000ms; timing changes affect balance and tests.
- JS must call exported WASM methods (`window.rustGame.*`) instead of mutating Rust state directly.
- New persisted Rust fields require `#[serde(default)]` for backward-compatible save loading.
- Keep `zh-CN` and `en` translations aligned when adding UI text.

## ANTI-PATTERNS (THIS PROJECT)
- Holding `RefCell` borrows across method calls in `IdleGame` (can panic at runtime).
- Using `unwrap()`/`expect()` in production-facing WASM paths.
- Skipping `window.gameInitialized === true` wait in Playwright tests.
- Adding Playwright tests without `*.test.js` suffix.

## UNIQUE STYLES
- UI is manager-driven vanilla JS (no framework), one module per system surface.
- Tech tree currently has text/ASCII-oriented rendering in JS manager layer.
- Rust crates expose minimal JS-friendly WASM API boundary; complex internals remain skipped.

## COMMANDS
```bash
# Build and run
wasm-pack build --target web --out-dir pkg --dev
python3 server.py

# Checks
cargo check
cargo clippy --all-targets --all-features -- -D warnings
npm run lint

# Tests
cargo test
npx playwright test
npx playwright test tests/functional/workers.test.js
```

## SCOPED GUIDES
- `src/AGENTS.md`
- `src/core/AGENTS.md`
- `src/entities/AGENTS.md`
- `src/state/AGENTS.md`
- `src/systems/AGENTS.md`
- `src/test_utils/AGENTS.md`
- `js/AGENTS.md`
- `tests/AGENTS.md`
- `docs/AGENTS.md`

## NOTES
- LSP Rust analysis may be unavailable if `rust-analyzer` is not installed in environment.
- `wasm-pack` release profile currently has `wasm-opt = false` in `Cargo.toml`.
