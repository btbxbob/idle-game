---
name: game-perf-measurement
description: Measure and budget-test this idle game's runtime performance — startup load, per-tick cost, WASM query cost, panel re-render, tab switching, idle FPS/long tasks/heap — producing an HTML report plus SVG/speedscope flamegraph. Use when asked about 性能/卡顿/启动慢/火焰图/flamegraph/perf budget, or when adding performance regression tests. Not for isolated Rust algorithm micro-benchmarks (use criterion) or E2E feature coverage (see playwright-e2e).
---

# Game Performance Measurement Skill

Instrument and regression-test the game's runtime performance on the real browser
(not just native Rust). Everything is self-contained in two files; no extra deps.

## When to Use

- User says 性能 / 卡顿 / 启动慢 / 首屏慢 / 切 tab 卡 / 火焰图 / flamegraph / perf budget / profiling.
- Adding or changing performance regression tests.
- Not for: pure Rust algorithm micro-benchmarks (use `criterion`), or ordinary E2E feature coverage (see `playwright-e2e`).

## Environment

- Windows, PowerShell 7; run from repo root.
- `node` + `@playwright/test` (devDependency), Chromium.
- Dev server is `python server.py` (on this machine `python3` also works, Python 3.13). The scripts start/stop it themselves.
- No extra dependencies; the report and flamegraph are generated in-process.
- Key globals: `window.gameLoadMetrics`, `window.rustGame`, `window.update*Panel` (all UI hooks may be undefined — guard).

## Procedure

1. Generate the report:
   ```bash
   npm run measure:game-perf          # = node scripts/measure-game-perf.js
   ```
   Emits `perf-report/` (gitignored):

   | file | purpose |
   |------|---------|
   | `game-perf.html` | metric cards + hot-path bars + multi-run startup table + tab-switch chart + inline flamegraph |
   | `game-perf-flamegraph.svg` | static flamegraph (icicle layout, self-time width) |
   | `game-perf.speedscope.json` | interactive flamegraph at speedscope.app |
   | `game-perf.cpuprofile` | load in Chrome DevTools → Performance |
   | `game-perf.json` | raw data: `startup`, `startupRuns`, `hotPaths`, `idle`, `cpuProfile`, `tabSwitches`, `tabsUnlocked` |

2. Run the budget tests:
   ```bash
   npm run test:perf                  # = playwright test tests/functional/performance-budget.test.js
   ```
   4 cases: hot-path p95, idle FPS/long-tasks/heap, startup p95, tab-switch p95.
   Env-overridable budgets (defaults are CI-safe):
   `PERF_BUDGET_TICK_MS=8`, `PERF_BUDGET_RENDER_MS=30`, `PERF_BUDGET_MIN_FPS=30`,
   `PERF_BUDGET_MAX_LONG_TASKS=5`, `PERF_BUDGET_MAX_HEAP_GROWTH_MB=25`,
   `PERF_BUDGET_STARTUP_MS=8000`, `PERF_BUDGET_TAB_MS=200`,
   `PERF_STARTUP_RUNS=3`, `PERF_TAB_ITERATIONS=3`, `PERF_UNLOCK_ALL_TABS=0` (skip unlock, measure only visible tabs).

3. Measurement conventions:
   - **Startup**: read `window.gameLoadMetrics.totalVisibleLoadDuration`; multi-run = `about:blank` → clear storage → `goto` → wait init.
   - **Hot paths**: time each call with `performance.now()` inside `page.evaluate`. Call WASM methods with the receiver (`game.game_loop()`), never as a detached function.
   - **Tab switching**: `btn.click()` then wait two `requestAnimationFrame`s before stopping the timer. `ui-controller` early-returns when the clicked tab is already active, so click a different tab first and iterate the tab list to guarantee real switches.
   - **Flamegraph**: CDP `Profiler.enable` → `Profiler.setSamplingInterval {interval:250}` → `Profiler.start` → run a stress loop → `Profiler.stop`; build speedscope from `profile.samples` + `profile.timeDeltas`, and lay out the SVG from self-times.
   - **Heap**: sample CDP `Runtime.getHeapUsage` on an interval; report start/end/growth.

4. Optional release-vs-dev comparison:
   `wasm-pack build --target web --out-dir pkg --release`, re-run the script, then `wasm-pack build --target web --out-dir pkg --dev` to restore.

## Pitfalls

- **First load is dominated by WASM compilation**: dev build first navigation ≈ 1.8–2.2 s, subsequent navigations ≈ 0.4 s (code cache hit). With 3 runs the p95 is the slowest one, so don't treat it as a steady value — startup budget was widened to 8000 ms after a flake under load.
- **`get_workers()` is O(worker count)**: ~26 `Reflect::set` per worker (heavy JS object allocation), measured ≈ 0.14 ms/worker → ~125 ms/call at 1000 workers (called every 4th tick).
- **`updateResourcePanel()` runs every tick**: measured 2.6–6.8 ms/call × 4/s, with ~60 `getElementById` calls per invocation.
- **Detached WASM call crashes**: `const fn = window.rustGame.game_loop; fn()` throws `TypeError: Cannot read properties of undefined (reading '__wbg_ptr')`. Always `const game = window.rustGame; game.game_loop()`.
- **Only 5 tabs visible at fresh start** (stage-gated). The script/test call `unlockAdvancedIndustry(page)` from `tests/fixtures/stage-helpers.js` to reach 12 tabs; disable with `PERF_UNLOCK_ALL_TABS=0`.
- **Port collision**: the script and Playwright `webServer` both use 8080 — never run them concurrently. `server.py` binds `127.0.0.1` by default.
- **Dev numbers are not production numbers**: dev wasm ≈ 4.42 MB vs release ≈ 1.11 MB (−74.8%); release tick p95 ≈ 0.02 ms vs dev ≈ 0.66 ms.

## Verification

- `node scripts/measure-game-perf.js` exits 0 and `perf-report/` contains all five artifacts; `game-perf-flamegraph.svg` contains at least one `<rect>` (non-empty flamegraph).
- `npm run test:perf` → 4 passed, and the console prints the measured tick/render/startup/tab p95 values.
- Never conclude from logs alone — cite the measured numbers from the report.
