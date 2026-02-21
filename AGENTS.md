# Idle Game Project Knowledge Base

**Generated**: 2026-02-21
**Commit**: Modular Refactoring Complete
**Stack**: Rust + WebAssembly + JavaScript
**Architecture**: Core game logic in Rust (WASM), UI in vanilla JS

## Overview
Rust + WebAssembly idle game with JavaScript frontend. Core logic in Rust (modular), compiled to WASM, with JS/HTML/CSS frontend.

## Project Structure (UPDATED - Modular)
```
idle-game/
├── src/                      # Rust game logic (MODULAR)
│   ├── lib.rs               # Entry point (19 lines, exports only)
│   ├── core/                # Core game logic (~1200 lines)
│   │   ├── mod.rs
│   │   └── idle_game.rs     # IdleGame struct + operations
│   ├── state/               # Pure data structures
│   │   ├── game_state.rs    # GameState
│   │   └── statistics.rs    # Statistics (9 metrics)
│   ├── entities/            # Game entities (pure data)
│   │   ├── upgrade.rs       # Upgrade
│   │   ├── building.rs      # Building
│   │   └── worker.rs        # Worker (levels, XP)
│   ├── systems/             # Business logic systems
│   │   ├── achievement.rs   # 13 achievements
│   │   ├── crafting.rs      # 6 bidirectional recipes
│   │   ├── unlock.rs        # 5 progressive unlocks
│   │   └── production.rs    # Production calculation
│   ├── ui/                  # WASM-JS callbacks
│   │   └── callbacks.rs     # update_* functions
│   └── test_utils/          # Test utilities
│       └── test_game_state.rs  # TestGameState + 38 tests
├── js/                      # 8 JS modules (Manager pattern)
├── tests/                   # 34+ Playwright E2E tests
├── css/style.css            # Responsive styles
├── index.html               # 9 tabs
└── docs/                    # Design docs
```

## WHERE TO LOOK (UPDATED)
| Task | Location | Notes |
|------|----------|-------|
| Add game mechanic | `src/core/idle_game.rs` | Core Rust logic |
| Add state field | `src/state/game_state.rs` | Pure data |
| Add entity | `src/entities/` | Building/Upgrade/Worker |
| Add system logic | `src/systems/` | Achievement/Crafting/etc |
| Add UI panel | `js/*.js` + `index.html` | Manager + tab |
| Add test (Rust) | `src/test_utils/test_game_state.rs` | `#[cfg(test)]` |
| Add test (E2E) | `tests/*.test.js` | Playwright, `*.test.js` suffix |
| Add translation | `js/i18n.js` | zh-CN + en pairs |
| Fix borrow error | `src/core/idle_game.rs` | Check `RefCell` scopes |
| Add CSS style | `css/style.css` | Mobile-first, 4 breakpoints |

## Core Systems (5)
1. **Statistics** - 9 metrics (clicks, resources, time, etc.)
2. **Achievements** - 13 achievements, 5 categories, toast notifications
3. **Crafting** - 6 bidirectional recipes (100:10:1 ratio)
4. **Unlocks** - 5 progressive features with threshold checks
5. **Workers** - 5 types, assignment, levels, XP, efficiency bonuses

## Build Commands
```bash
# Development
wasm-pack build --target web --out-dir pkg --dev
python server.py  # http://localhost:8080

# Production
wasm-pack build --target web --out-dir pkg --release

# Tests
cargo test        # Rust (38 tests)
npm run test      # Playwright (34 tests)
```

## ANTI-PATTERNS (CRITICAL)
### Rust Borrowing
- ❌ Never hold `RefCell` borrows across function calls
- ❌ Never borrow `state` and `statistics` simultaneously
- ✅ ALWAYS use scope blocks to release borrows before calling methods

```rust
// ❌ WRONG - borrow conflict
let state = self.state.borrow();
let stats = self.statistics.borrow();
self.check_achievement(); // PANIC: state still borrowed!

// ✅ CORRECT - release borrows first
{
    let state = self.state.borrow();
    let value = state.coins;
} // released
self.check_achievement(); // OK
```

### WASM Exports
- ❌ Don't expose `Vec<T>` directly (use `#[wasm_bindgen(skip)]`)
- ❌ Don't call JS from Rust without `Result` handling
- ✅ Use `Rc<RefCell<T>>` for shared mutable state

### JavaScript
- ❌ Don't modify game state directly (call Rust via `window.rustGame`)
- ❌ Don't assume WASM ready (check `window.gameInitialized`)
- ✅ Use manager pattern: `window.statisticsManager.update()`

### General
- ❌ Don't mix business logic between Rust and JS
- ❌ Don't hardcode i18n strings (use `js/i18n.js`)
- ❌ Don't bypass 1000ms game loop (performance)

## Key Patterns
### WASM Integration
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
```

### Test Pattern (Playwright)
```javascript
test('description', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  // Test assertions
});
```

## Testing
- **Rust**: `#[cfg(test)]` in `src/lib.rs` (38 tests)
- **Playwright**: `tests/*.test.js` (34 tests, `*.test.js` suffix required)
- **Wait for**: `window.gameInitialized === true`
- **i18n**: Exact Chinese strings for matching

## Sub-AGENTS
- [`src/AGENTS.md`](src/AGENTS.md) - Rust logic, borrowing, WASM exports
- [`js/AGENTS.md`](js/AGENTS.md) - Manager pattern, WASM integration
- [`tests/AGENTS.md`](tests/AGENTS.md) - Playwright patterns
- [`docs/AGENTS.md`](docs/AGENTS.md) - Documentation structure

## Build Commands

### Development Build
```bash
# Windows
.\build.bat

# Linux/macOS  
./build.sh

# Direct wasm-pack command
wasm-pack build --target web --out-dir pkg --dev
```

### Production Build
```bash
wasm-pack build --target web --out-dir pkg --release
```

### Run Development Server
```bash
python server.py  # Serves on http://localhost:8080
# Or use Python's built-in server
python -m http.server 8080
```

## Test Commands

### Run Rust Tests
```bash
cargo test
```

Note: Tests are located in `src/lib.rs` under `#[cfg(test)]` modules. There are currently 5 test functions covering:
- Initial state validation
- Click action functionality  
- Upgrade purchase logic
- Building purchase logic
- Production calculation

### Run Playwright E2E Tests
```bash
# Run all tests
npm run test
# or
npx playwright test

# Run single test file
npx playwright test tests/example.test.js

# Run with UI
npm run test:ui

# Generate HTML report
npx playwright test --reporter=html
```

**Playwright Test Configuration:**
- **Test directory**: `tests/`
- **File naming**: Must use `*.test.js` suffix to be recognized by Playwright
- **Framework**: Playwright
- **Auto server**: Configured to automatically start `python server.py` on http://localhost:8080
- **Browser support**: Chromium, Firefox, Webkit
- **CI mode**: Uses `reuseExistingServer: !process.env.CI`

**Current Test Files:**
- `resource-colors.test.js` - Resource color validation
- `comprehensive-tab.test.js` - Comprehensive tab functionality
- `debug-tab.test.js` - Debug tab features
- `multi-tab.test.js` - Multi-tab switching
- `visual-style.test.js` - Visual style checks
- `core-issues-fixed.test.js` - Core issues verification
- `fix-all-issues.test.js` - All issues fix validation
- `no-undefined-display.test.js` - Undefined display prevention
- `click-after-failure.test.js` - Click behavior after failure
- `resource-update.test.js` - Resource update testing
- `buy-button.test.js` - Buy button functionality

### Test Writing Guidelines

**Basic Structure:**
```javascript
const { test, expect } = require('@playwright/test');

test('test description', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Test assertions
  const element = page.locator('#some-element');
  await expect(element).toBeVisible();
});
```

**Important Notes:**
1. **File naming**: Must use `*.test.js` suffix
2. **Async waiting**: Game initialization must wait for `window.gameInitialized === true`
3. **URL**: Use relative paths based on configured baseURL
4. **Element selectors**: Use stable IDs or data attributes
5. **Chinese text**: Use exact Chinese strings for text matching

**Test Types:**
- **Function tests**: Verify click, buy features work correctly
- **Visual tests**: Verify colors, layout, styles
- **Interaction tests**: Verify tab switching, button interactions
- **Real-time update tests**: Verify resource number updates in real-time

### Manual Testing
Since this is a browser-based game, manual testing involves:
1. Build the project
2. Start the development server
3. Open http://localhost:8080 in browser
4. Test click functionality and purchase mechanics

## Code Style Guidelines

### Rust Code Style
- **Formatting**: Use standard Rust formatting (`rustfmt`)
- **Naming**: 
  - Variables/functions: `snake_case`
  - Types/structs: `PascalCase`
  - Constants: `SCREAMING_SNAKE_CASE`
- **Error Handling**: Use proper Result types where applicable
- **Memory Management**: Leverage Rust's ownership system; avoid unnecessary clones
- **WASM Specifics**: 
  - Use `wasm-bindgen` for JS interop
  - Use `RefCell`/`Rc` for shared mutable state (as seen in current code)
  - Handle JS exceptions properly with `Result` types

### JavaScript Code Style
- **Formatting**: Standard JavaScript formatting (no specific linter configured)
- **Naming**: 
  - Variables/functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE` or `camelCase`
- **Global State**: Minimize global variables; current code uses `window` object for WASM integration
- **Event Handling**: Use modern event listeners rather than inline handlers when possible
- **Error Handling**: Check for existence of WASM functions before calling them
- **Internationalization**: Use the `i18n.js` system for all translatable text

### HTML/CSS Style
- **HTML**: Semantic structure, proper accessibility attributes
- **CSS**: 
  - Mobile-first responsive design
  - Consistent color palette using CSS variables would be beneficial
  - Current styling uses direct color values (#2c3e50, #f1c40f, etc.)

## Project Structure
```
idle-game/
├── docs/                 # Project documentation
│   ├── DESIGN.md         # Detailed design documentation
│   ├── DEVELOPMENT_GUIDELINES.md  # Development guidelines
│   └── unit_tests.md     # Unit test documentation
├── src/                  # Rust source code
│   └── lib.rs            # Main game logic with WASM bindings
├── js/                   # JavaScript frontend
│   ├── i18n.js           # Internationalization system (zh-CN, en)
│   ├── game.js           # UI update functions and event handlers
│   └── bootstrap.js      # WASM module loading and initialization
├── css/                  # Stylesheets
│   └── style.css         # Main stylesheet
├── tests/                # Playwright end-to-end tests
├── assets/               # Game assets (images, sounds, etc.)
├── pkg/                  # Generated WASM output (git ignored)
├── target/               # Rust build artifacts (git ignored)
├── build.bat             # Windows build script
├── build.sh              # Unix build script
├── server.py             # Development HTTP server
├── index.html            # Main HTML entry point
└── docs/TEST_CASES.md    # Test cases documentation
```

## Testing Guidelines

### Playwright Test Framework
The project uses Playwright for end-to-end testing. All test files are located in the `tests/` directory and must follow the `*.test.js` naming convention.

### Unit Tests
Unit tests are located in `src/lib.rs` starting from line 400, using the `#[cfg(test)] mod tests` module. These tests use a `TestGameState` structure that provides game state functionality without WASM dependencies, allowing testing in standard Rust environments.

For more details about unit tests, see `docs/unit_tests.md`.

### Test File Structure
Each test file should:
1. Import Playwright test utilities: `const { test, expect } = require('@playwright/test');`
2. Use `test()` blocks for individual test cases
3. Wait for game initialization: `await page.waitForFunction(() => window.gameInitialized === true);`
4. Use stable element selectors (IDs or data attributes preferred)
5. Handle Chinese text with exact string matching

### Running Tests
```bash
# All tests
npm run test

# Single test file
npx playwright test tests/resource-colors.test.js

# With UI for debugging
npm run test:ui

# Generate HTML report
npx playwright test --reporter=html
```

### Common Test Patterns

**Resource Validation:**
```javascript
const coinValue = await page.textContent('#coin-value');
expect(parseFloat(coinValue)).toBeGreaterThan(0);
```

**Button Click & State Change:**
```javascript
await page.click('#upgrade-button-0');
await page.waitForFunction(() => window.rustGame.getCoins() >= 0);
```

**Visual Style Checks:**
```javascript
const element = page.locator('#resource-display');
const color = await element.evaluate(el => getComputedStyle(el).color);
expect(color).toBe('rgb(241, 196, 15)'); // Gold color
```

### Test Coverage
Current test files cover:
- Resource color validation
- Tab switching functionality
- Visual style consistency
- Core issue fixes
- Undefined display prevention
- Click behavior after failures
- Real-time resource updates
- Buy button functionality

### Best Practices
- Write independent tests (no shared state)
- Use descriptive test names
- Test one thing per test case
- Verify both success and failure cases
- Include assertions for visual feedback
- Test across multiple browsers (Chromium, Firefox, Webkit)

### Common Pitfalls
- **Element not found**: Ensure waiting for game initialization with `page.waitForFunction(() => window.gameInitialized === true)`
- **Chinese text matching**: Use exact Chinese strings
- **Style tests**: Use `getComputedStyle` to check rendered colors
- **Layout tests**: Use `boundingBox` to verify element positions

## Development Tips

### Debugging WASM
- Use `console.log` in Rust via `web_sys::console::log_1`
- Enable debug builds with `--dev` flag for better error messages
- Use browser developer tools to inspect WASM module loading

### Performance Considerations
- Minimize frequency of UI updates from Rust
- Batch DOM updates when possible
- Consider debouncing rapid click events
- Optimize game loop interval (currently 100ms)

### Testing Best Practices
- **Single Responsibility**: Each test should focus on one specific feature
- **Independence**: Tests should not depend on other tests' state
- **Stability**: Avoid using unstable element selectors
- **Clear Descriptions**: Test names should clearly describe what's being tested

### Extending the Game
- Add new game mechanics in Rust `lib.rs`
- Update UI templates in JavaScript functions
- Add new styles to `style.css`
- Update build scripts if new dependencies are added
- Add new translations to `i18n.js` for any new text
- Add new tests to `tests/*.test.js` for any new functionality
- Update `TEST_CASES.md` with test coverage information

## Key Conventions

### WASM Integration
- Rust functions exposed via `#[wasm_bindgen]`
- JavaScript calls Rust functions through `window.rustGame` object
- UI updates from Rust call back to JavaScript via `window.updateResourceDisplay`, `window.updateUpgradeButtons`, etc.
- Game state managed in Rust, UI state synchronized via callbacks

### Internationalization (i18n)
- **Primary language**: Simplified Chinese (zh-CN)
- **Secondary language**: English (en)
- **Translation keys**: Use descriptive keys like 'gameTitle', 'clickToEarn', 'coins', etc.
- **Dynamic text**: All user-facing text should use the i18n system
- **Language selector**: Available in the header for user switching
- **Adding new languages**: Add new translation objects to `i18n.js`
- Single source of truth in Rust `GameState`
- JavaScript maintains minimal state (mainly DOM references)
- All game logic happens in Rust, JavaScript handles presentation only

### Event Flow
1. User clicks UI element
2. JavaScript handler calls appropriate Rust function
3. Rust processes logic and updates internal state
4. Rust calls JavaScript UI update functions
5. JavaScript updates DOM to reflect new state

## Anti-Patterns to Avoid

### Rust
- Don't use `unwrap()` or `expect()` in production code
- Avoid excessive `RefCell` borrowing that could panic
- Don't expose internal state directly to JavaScript
- Avoid blocking operations in WASM (keep game loop lightweight)

### JavaScript  
- Don't modify game state directly in JavaScript
- Avoid inline event handlers (use event delegation instead)
- Don't assume WASM module is always available (check `window.rustGame`)
- Avoid global variables beyond the necessary integration points

### General
- Don't mix business logic between Rust and JavaScript
- Avoid hardcoding values that should be configurable
- Don't duplicate game state between Rust and JavaScript

## Development Tips

### Debugging WASM
- Use `console.log` in Rust via `web_sys::console::log_1`
- Enable debug builds with `--dev` flag for better error messages
- Use browser developer tools to inspect WASM module loading

### Performance Considerations
- Minimize frequency of UI updates from Rust
- Batch DOM updates when possible
- Consider debouncing rapid click events
- Optimize game loop interval (currently 100ms)

### Extending the Game
- Add new game mechanics in Rust `lib.rs`
- Update UI templates in JavaScript functions
- Add new styles to `style.css`
- Update build scripts if new dependencies are added
- Add new translations to `i18n.js` for any new text
- Add new tests to `tests/*.test.js` for any new functionality
- Update `TEST_CASES.md` with test coverage information

## Testing Best Practices

- **Single Responsibility**: Each test should focus on one specific feature
- **Independence**: Tests should not depend on other tests' state
- **Stability**: Avoid using unstable element selectors
- **Clear Descriptions**: Test names should clearly describe what's being tested

### Common Pitfalls
- **Element not found**: Ensure waiting for game initialization with `page.waitForFunction(() => window.gameInitialized === true)`
- **Chinese text matching**: Use exact Chinese strings
- **Style tests**: Use `getComputedStyle` to check rendered colors
- **Layout tests**: Use `boundingBox` to verify element positions

## Key Conventions

### Rust Dependencies
- `wasm-bindgen`: WASM-JS interop
- `web-sys`: Web API bindings
- `js-sys`: JavaScript standard library bindings  
- `serde`: Serialization/deserialization
- `serde-wasm-bindgen`: Serde integration with WASM

### System Dependencies
- Rust toolchain (stable)
- `wasm-pack` (installed automatically by build scripts)
- Python 3 (for development server)

### Testing Dependencies
- **Playwright**: End-to-end testing framework
- **Node.js & npm**: Required for running Playwright tests