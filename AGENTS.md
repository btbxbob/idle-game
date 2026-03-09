# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-06
**Commit:** 2bab852
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
├── scripts/             # Jenkins rerun, coverage merge, debug helpers
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
| CI/debug helper scripts | `scripts/` | Jenkins rerun and coverage utilities |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `initWasm` | JS function | `js/bootstrap.js` | Initializes WASM, restores save, wires managers |
| `startGameLoop` | JS function | `js/bootstrap.js` | Drives 1000ms update/save loop |
| `IdleGame` | Rust struct | `src/core/idle_game.rs` | Core orchestrator for systems and wasm exports |
| `window.rustGame.*` | API boundary | `src/lib.rs` + `js/*.js` | JS->Rust interaction contract |

Notes:
- Rust LSP symbols are currently unavailable in this environment; use file-level map above plus scoped guides.

## CONVENTIONS
- Use `python3` (not `python`) for local server and Playwright `webServer.command`.
- Keep game loop cadence at 1000ms; timing changes affect balance and tests.
- JS must call exported WASM methods (`window.rustGame.*`) instead of mutating Rust state directly.
- New persisted Rust fields require `#[serde(default)]` for backward-compatible save loading.
- Keep `zh-CN` and `en` translations aligned when adding UI text.
- Normalized day-to-day test scope is functional tests only (`tests/functional/`); use `tests/regression/` only for bug reproduction/fix validation.
- Treat current runtime UI as the source of truth for E2E expectations; when product UI contracts change (for example tab removal, staged tab visibility, or selector changes like `#coin-count` replacing `#coins`), migrate tests to the new contract instead of preserving legacy UI assumptions.
- Before changing or adding E2E assertions, check the live HTML/JS contract (`index.html`, `js/bootstrap.js`, `js/unlocks.js`, `js/resource-manager.js`) and align tests to the currently rendered DOM rather than historical screenshots or old failures.

## ANTI-PATTERNS (THIS PROJECT)
- Holding `RefCell` borrows across method calls in `IdleGame` (can panic at runtime).
- Using `unwrap()`/`expect()` in production-facing WASM paths.
- Skipping `window.gameInitialized === true` wait in Playwright tests.
- Adding Playwright tests without `*.test.js` suffix.
- Backup files (e.g., `lib.rs.backup2`) in `src/` directory.
- Build artifacts (e.g., `.pdb` files) in `src/utils/` — belongs in `target/`.
- `building.rs` at `src/` root — should be in `src/entities/`.

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
npx playwright test tests/functional
npx playwright test tests/functional/workers.test.js

# Regression (bugfix validation only)
npx playwright test tests/regression/<bug-case>.test.js
```

## CI OWNERSHIP
- CI build/test execution is centralized in Jenkins pipeline (`Jenkinsfile`).
- GitHub Pages deployment remains in GitHub Actions workflow (`.github/workflows/deploy.yml`).
- Do not treat OpenCode automation as CI executor for build/test/deploy stages.
- Agent rule: do not run test commands directly in local sessions; trigger Jenkins jobs for all test execution and report the Jenkins build number/results.

### Jenkins Test Flow
- Jenkins job: `idle-game-ci`.
- Stage order: `Checkout` -> `Install JS Dependencies` -> `Lint` -> `Setup Rust Toolchain` -> `Rust Check` -> `Rust Tests` -> `Build WASM` -> optional `Playwright E2E` (`RUN_PLAYWRIGHT=true` or `RUN_COVERAGE=true`).
- Trigger Playwright E2E with `RUN_PLAYWRIGHT=true`; trigger coverage gate with `RUN_COVERAGE=true`.
- Coverage thresholds in Jenkins env: `E2E_COVERAGE_MIN_LINES=20`, `E2E_COVERAGE_MIN_STATEMENTS=20`, `E2E_COVERAGE_MIN_FUNCTIONS=15`, `E2E_COVERAGE_MIN_BRANCHES=10`.
- Playwright in CI uses `python3 server.py --quiet` from `playwright.config.js`.
- CI artifacts: `pkg/**`, `playwright-report/**`, `test-results/**`, `coverage-report/e2e-merged/**`; JUnit source: `test-results/**/*.xml`.
- Timeout policy: pipeline `120 minutes`, Playwright stage `60 minutes`.

### Jenkins Background Monitoring Policy
- Default mode: never block OpenCode foreground while waiting for Jenkins completion; always monitor in background.
- Trigger builds (including coverage) first, then start a background `task(...)` to poll Jenkins build status/logs until `building=false`.
- Required parameter combo for full E2E + coverage: `RUN_PLAYWRIGHT=true` and `RUN_COVERAGE=true`.
- Use `background_output(task_id="...")` to fetch progress/results on demand; summarize build number, final status, test result, and coverage percentages.
- Coverage data source priority: `coverage-report/e2e-merged/coverage-summary.json` artifact first, fallback to build log extraction only after bounded attempts.
- Keep the foreground free for other requests while background monitoring runs; do not idle-wait with long blocking sleeps.
- If multiple people are using Jenkins, only diagnose and repair builds you personally triggered in this session; do not treat teammates' queued or running builds as your repair target.
- Do root-cause analysis from existing build metadata/logs first, then trigger a new Jenkins run only after you have a concrete hypothesis worth validating; avoid speculative reruns that consume shared queue capacity.

### Jenkins MCP Timeout Mitigation
- Known issue: `jenkins_getBuildLog` and `jenkins_searchBuildLog` may timeout (`MCP error -32001`) on active builds.
- Mandatory sequence: call `jenkins_getBuild` first; if `building=true`, do not use log APIs for status polling.
- Running build polling should use metadata APIs only: `jenkins_getBuild`, `jenkins_getQueueItem`, and `jenkins_getTestResults`.
- Only call log APIs after `building=false`; use bounded windows (`limit<=200`, prefer `skip=-200` for recent lines) instead of full log scans.
- For `jenkins_searchBuildLog`, use narrow patterns and bounded matches (`maxMatches<=20`); avoid broad regex during long logs.
- Retry policy for log APIs: max 3 attempts with backoff (2s, 5s, 10s), then fall back to artifacts/test APIs and report partial diagnostics.
- Preferred result sources to avoid log timeouts: build result from `jenkins_getBuild`, tests from `jenkins_getTestResults`, coverage from archived `coverage-summary.json`.
- Local Jenkins may use a workspace-source copy instead of Git checkout; verify the job config before assuming remote-only SCM state.


## SCOPED GUIDES
- `src/AGENTS.md`
- `src/core/AGENTS.md`
- `src/entities/AGENTS.md`
- `src/state/AGENTS.md`
- `src/systems/AGENTS.md`
- `src/test_utils/AGENTS.md`
- `src/ui/AGENTS.md`
- `src/utils/AGENTS.md`
- `css/AGENTS.md`
- `js/AGENTS.md`
- `tests/AGENTS.md`
- `docs/AGENTS.md`
- `scripts/AGENTS.md`

## NOTES
- LSP Rust analysis may be unavailable if `rust-analyzer` is not installed in environment.
- `wasm-pack` release profile has `wasm-opt = false` in `Cargo.toml` (WASM not optimized in release builds).
