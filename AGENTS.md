# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-12
**Commit:** c7dc464
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
- Rust LSP symbols may be unavailable; use file-level map above plus scoped guides.

## COMMANDS

### Build WASM
```bash
# Development build
wasm-pack build --target web --out-dir pkg --dev

# Release build (production)
wasm-pack build --target web --out-dir pkg --release

# Using build script
./build.sh          # Linux/macOS
.\build.bat         # Windows
```

### Run Tests
```bash
# Rust tests
cargo test

# Playwright tests (Chromium only by default)
npm run test
# or
npx playwright test

# Single test file
npx playwright test tests/functional/workers.test.js

# Single test by pattern
npx playwright test -g "test-name-pattern"

# All browsers (Chromium, Firefox, Webkit)
PW_ALL_BROWSERS=1 npm run test

# With coverage
npm run test:e2e:coverage

# Regression tests (bugfix validation only)
npx playwright test tests/regression/<bug-case>.test.js
```

⚠️ **IMPORTANT: Commit Before Testing**

Always commit your code changes BEFORE running tests. This ensures:
1. Tests run against the committed version
2. No uncommitted changes interfere with test results
3. Git history accurately reflects what was tested

```bash
# Workflow:
1. Make changes
2. git add <files> && git commit -m "message"
3. npm run test  # Test the committed version
```

### Lint
```bash
# Rust (strict mode - warnings as errors)
cargo clippy --all-targets --all-features -- -D warnings

# JavaScript syntax check
npm run lint
# or
node scripts/lint-syntax.js
```

### Development Workflow
```bash
# 1. Build WASM
wasm-pack build --target web --out-dir pkg --dev

# 2. Start server
python3 server.py

# 3. Run tests in another terminal
npm run test

# 4. Lint before committing
npm run lint && cargo clippy --all-targets --all-features -- -D warnings
```

## CODE STYLE

### Rust Conventions
- **Imports**: std → external crates → local modules (alphabetical within groups)
- **Naming**: `PascalCase` for types/enums, `snake_case` for functions/variables
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Error Handling**: Return `Result<T, String>` for fallible operations; avoid `unwrap()` in production WASM paths
- **Serde**: All persisted structs use `Serialize` + `Deserialize`; new fields MUST have `#[serde(default)]`
- **Borrow Scopes**: Never hold `RefCell` borrows across method calls - use explicit scope blocks

```rust
// CORRECT - borrow released before method call
{
    let mut state = self.state.borrow_mut();
    state.spend_coins(cost);
} // borrow released
self.check_achievement("purchase"); // OK

// FORBIDDEN - holds borrow across method call
let state = self.state.borrow();
if state.coins >= cost {
    self.check_achievement(); // PANIC!
}
```

### JavaScript Conventions
- **Classes**: `PascalCase` (e.g., `WorkerManager`, `ResourceManager`)
- **Functions**: `camelCase` (e.g., `updateResourceDisplay`)
- **Documentation**: JSDoc for all public methods
- **WASM Access**: Always use `window.rustGame.*` - never mutate Rust state directly
- **Guard Checks**: Verify element existence before DOM manipulation

```javascript
// CORRECT - guard check before DOM access
const coinsElement = document.getElementById('coins');
if (coinsElement) {
    coinsElement.textContent = `金币：${Math.floor(safeCoins)}`;
}

// CORRECT - try-catch around WASM calls
assignWorker(workerIndex, buildingId) {
    try {
        return this.rustGame.assign_worker(workerIndex, buildingId);
    } catch (error) {
        console.error('Failed to assign worker:', error);
        return false;
    }
}
```

## ANTI-PATTERNS
- ❌ Holding `RefCell` borrows across method calls in Rust
- ❌ Using `unwrap()`/`expect()` in production-facing WASM paths
- ❌ Skipping `window.gameInitialized === true` wait in Playwright tests
- ❌ Adding Playwright tests without `*.test.js` suffix
- ❌ Backup files (e.g., `lib.rs.backup2`) in `src/` directory
- ❌ Build artifacts (e.g., `.pdb` files) in `src/utils/` — belongs in `target/`
- ❌ `building.rs` at `src/` root — should be in `src/entities/`
- ❌ JS mutating Rust state directly instead of using `window.rustGame.*`
- ❌ Embedding gameplay formulas in JS managers when Rust systems own them

## UNIQUE STYLES
- UI is manager-driven vanilla JS (no framework), one module per system surface
- Tech tree has text/ASCII-oriented rendering in JS manager layer
- Rust crates expose minimal JS-friendly WASM API boundary; complex internals remain skipped
- Manager pattern: each UI surface has its own class (`WorkerManager`, `TechnologyManager`, etc.)

## VERSION BUMP CHECKLIST
When updating version (e.g., 0.6.6 → 0.6.7):

### 1. Update Version Sources
| File | Location | What to Update |
|------|----------|---------------|
| `Cargo.toml` | Line 3 | `version = "0.6.7"` — **WASM embeds this at compile time** |
| `package.json` | Line 3 | `"version": "0.6.7"` — npm package version |
| `README.md` | Version badge | `当前版本：**v0.6.7**` |
| `index.html` | Line 7 | `<meta name="app-version" content="0.6.7">` |
| `index.html` | Lines 10-11 | CSS `?v=0.6.7` cache-busting |
| `index.html` | Lines 285-297 | All JS `?v=0.6.7` cache-busting |
| `index.html` | Line 251 | Footer `游戏版本：v0.6.7` |

### 2. Rebuild WASM (CRITICAL)
```bash
rm -f pkg/idle_game.v0.6.*.js pkg/idle_game_bg.v0.6.*.wasm
wasm-pack build --target web --out-dir pkg --dev
strings pkg/idle_game_bg.wasm | grep "0\.6\."  # Should output: 0.6.7
```

### 3. Verify & Commit
```bash
python3 server.py
# Hard-refresh browser: Ctrl+Shift+R
git add Cargo.toml package.json README.md index.html
git commit -m "chore: bump runtime version to v0.6.7"
# Note: pkg/ is gitignored; do NOT commit WASM artifacts
```

## CI OWNERSHIP
- CI build/test execution is centralized in Jenkins pipeline (`Jenkinsfile`)
- GitHub Pages deployment remains in GitHub Actions workflow
- Agent rule: do not run test commands locally; trigger Jenkins jobs for all test execution

### Jenkins Test Flow
- Job: `idle-game-ci`
- Local Jenkins URL: `http://localhost:8081`
- Local Jenkins credentials: `admin` / `admin123`
- Stages: Checkout → Install JS → Lint → Rust Check → Rust Tests → Build WASM → Playwright E2E
- Trigger E2E: `RUN_PLAYWRIGHT=true`
- Trigger coverage: `RUN_COVERAGE=true`
- Coverage thresholds: `E2E_COVERAGE_MIN_LINES=20`, `E2E_COVERAGE_MIN_STATEMENTS=20`

### Jenkins Background Monitoring
- Trigger builds first, then start background `task(...)` to poll status
- Use `background_output(task_id="...")` to fetch results on demand
- Coverage priority: `coverage-report/e2e-merged/coverage-summary.json` artifact first
- Only diagnose builds you personally triggered in this session
- Do root-cause analysis from metadata/logs before triggering new runs

### Jenkins MCP Timeout Mitigation
- Known issue: `jenkins_getBuildLog` may timeout on active builds
- Sequence: call `jenkins_getBuild` first; if `building=true`, do NOT use log APIs
- Use metadata APIs only for running builds: `jenkins_getBuild`, `jenkins_getQueueItem`, `jenkins_getTestResults`
- Call log APIs only after `building=false`; use bounded windows (`limit<=200`, `skip=-200`)
- Retry policy: max 3 attempts with backoff (2s, 5s, 10s)

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
- LSP Rust analysis may be unavailable if `rust-analyzer` is not installed
- `wasm-pack` release profile has `wasm-opt = false` (WASM not optimized in release builds)
- No Cursor/Copilot rules configured; this file is the primary agentic coding guide
