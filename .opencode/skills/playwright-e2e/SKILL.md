---
name: playwright-e2e
description: Reusable Playwright + coverage E2E setup for vanilla-JS + WASM browser games — tests/functional vs tests/regression layout, coverage fixtures, merge/threshold scripts, browser matrix. Use when adding, running, or debugging E2E tests or E2E coverage in this project.
---

# Playwright E2E Testing Skill

Reusable Playwright + coverage testing setup for vanilla JS + WASM browser games.
Copy this entire `.opencode/skills/playwright-e2e/` directory to your new project.

## Quick Start

```bash
npm init -y
npm install @playwright/test monocart-coverage-reports
npx playwright install chromium
```

### Directory Structure

```
your-project/
├── tests/
│   ├── fixtures/
│   │   ├── coverage.js        # Chromium-only JS coverage fixture
│   │   └── stage-helpers.js   # Game-specific progression helpers (customize)
│   ├── functional/            # Routine feature tests
│   └── regression/            # Bug reproduction / fix-locking tests
├── scripts/
│   ├── lint-syntax.js         # Syntax check all JS files
│   ├── run-e2e-coverage.js    # Wrapper for coverage-enabled test run
│   └── merge-e2e-coverage.js  # Merge raw coverage data, enforce thresholds
├── playwright.config.js       # Browser matrix + webServer config
└── package.json
```

---

## 1. `package.json` Scripts

```json
{
  "scripts": {
    "lint": "node scripts/lint-syntax.js",
    "test": "npx playwright test --project=chromium",
    "test:e2e:coverage": "node scripts/run-e2e-coverage.js"
  }
}
```

---

## 2. `playwright.config.js`

```js
const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;
const runAllBrowsers = isCI || process.env.PW_ALL_BROWSERS === '1';
const testPort = Number(process.env.PW_TEST_PORT || '8080');
const testBaseUrl = `http://localhost:${testPort}`;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : 1,
  reporter: 'line',
  use: {
    baseURL: testBaseUrl,
    trace: process.env.PW_TRACE ? 'on-first-retry' : 'off',
  },
  projects: runAllBrowsers
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],
  webServer: {
    command: `python3 server.py --quiet --port ${testPort}`,
    url: testBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  grep: /^(?!.*Monkey).*$/i,  // Exclude slow tests by default
});
```

**Key points:**
- `webServer` auto-starts your dev server before tests
- `reuseExistingServer: !process.env.CI` — reuses running server locally
- `PW_ALL_BROWSERS=1` enables Firefox + WebKit in CI
- `PW_TEST_PORT` overrides default port 8080
- `grep` filter excludes slow "Monkey" tests from default runs

---

## 3. `tests/fixtures/coverage.js` — JS Coverage Fixture

```js
const fs = require('fs');
const path = require('path');
const base = require('@playwright/test');

const RAW_DIR = path.join(__dirname, '..', '..', 'coverage-report', 'raw');
const shouldCollectCoverage = process.env.RUN_COVERAGE === 'true';

const safeName = (value) => value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);

const shouldKeepCoverageEntry = (entry) => {
  const url = String(entry?.url || '').replace(/\\/g, '/');
  if (!url) return false;
  return url.includes('/js/');  // Only collect JS file coverage
};

const test = base.test.extend({
  page: async ({ page }, use, testInfo) => {
    if (testInfo.project.name !== 'chromium' || !shouldCollectCoverage) {
      await use(page);
      return;
    }
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    try {
      await use(page);
    } finally {
      let jsCoverage = [];
      try {
        jsCoverage = await page.coverage.stopJSCoverage();
      } catch (_err) { jsCoverage = []; }
      jsCoverage = Array.isArray(jsCoverage) ? jsCoverage.filter(shouldKeepCoverageEntry) : [];
      fs.mkdirSync(RAW_DIR, { recursive: true });
      const fileName = safeName(
        `${testInfo.project.name}-${testInfo.workerIndex}-${testInfo.titlePath.join('__')}.json`
      );
      fs.writeFileSync(path.join(RAW_DIR, fileName), JSON.stringify(jsCoverage));
    }
  }
});

module.exports = { test, expect: base.expect };
```

**Usage in tests:**
```js
const { test, expect } = require('../fixtures/coverage');
// Instead of: const { test, expect } = require('@playwright/test');
```

---

## 4. `scripts/run-e2e-coverage.js` — Coverage Test Runner

```js
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

try {
  execSync('npx playwright test --project=chromium', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, RUN_COVERAGE: 'true', NODE_NO_WARNINGS: '1' },
  });
} catch (error) {
  process.exit(error.status || 1);
}

execSync('node scripts/merge-e2e-coverage.js', {
  cwd: root,
  stdio: 'inherit',
});
```

---

## 5. `scripts/merge-e2e-coverage.js` — Coverage Merge + Thresholds

```js
const fs = require('fs');
const path = require('path');
const MCR = require('monocart-coverage-reports');

const root = path.resolve(__dirname, '..');
const rawDir = path.join(root, 'coverage-report', 'raw');
const outDir = path.join(root, 'coverage-report', 'e2e-merged');
const summaryFile = path.join(outDir, 'coverage-summary.json');

// Filter entries: only JS files, exclude generated WASM bundles
const isGeneratedEntry = (entryPath) =>
  typeof entryPath === 'string' && /\/pkg\/.*\.js/i.test(entryPath);

const thresholds = {
  lines: Number(process.env.E2E_COVERAGE_MIN_LINES || 20),
  statements: Number(process.env.E2E_COVERAGE_MIN_STATEMENTS || 20),
  functions: Number(process.env.E2E_COVERAGE_MIN_FUNCTIONS || 15),
  branches: Number(process.env.E2E_COVERAGE_MIN_BRANCHES || 10),
};

const mcr = MCR({
  name: 'Playwright E2E Coverage (Merged)',
  outputDir: outDir,
  reports: ['json-summary', 'console-summary', 'lcovonly'],
  entryFilter: { '**/node_modules/**': false, '**/*': true },
  sourceFilter: { '**/node_modules/**': false, '**/js/**': true, '**/*': false },
});

(async () => {
  const files = fs.existsSync(rawDir) ? fs.readdirSync(rawDir).filter(f => f.endsWith('.json')) : [];
  if (!files.length) { console.error('No raw coverage files'); process.exit(1); }

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf8'));
    if (Array.isArray(data) && data.length > 0) await mcr.add(data);
  }

  await mcr.generate();
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  // Recompute totals excluding generated WASM entries
  // ... (see full file for details)
  const failures = [];
  for (const [metric, threshold] of Object.entries(thresholds)) {
    if ((summary.total[metric]?.pct || 0) < threshold) {
      failures.push(`${metric}: ${summary.total[metric].pct}% < ${threshold}%`);
    }
  }
  if (failures.length) {
    console.error('Coverage thresholds failed:', failures);
    process.exit(1);
  }
  console.log('Coverage thresholds passed:', thresholds);
})();
```

---

## 6. `scripts/lint-syntax.js` — JS Syntax Checker

```js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  jsDirs: ['js', 'tests', 'scripts'],
  extensions: ['.js'],
  ignorePatterns: [/node_modules/, /playwright-report/, /target/, /pkg/],
};

function collectFiles(dirs) {
  const files = [];
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return;
    const walk = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      entries.forEach(entry => {
        const fp = path.join(currentDir, entry.name);
        if (CONFIG.ignorePatterns.some(p => p.test(fp))) return;
        if (entry.isDirectory()) walk(fp);
        else if (CONFIG.extensions.includes(path.extname(entry.name))) files.push(fp);
      });
    };
    walk(fullPath);
  });
  return files;
}

const files = collectFiles(CONFIG.jsDirs);
let errors = 0;
files.forEach(fp => {
  const source = fs.readFileSync(fp, 'utf8');
  if (/^\s*(import|export)\s/m.test(source)) {
    console.log(`⚠️ ${path.relative(process.cwd(), fp)} (ESM skipped)`);
    return;
  }
  try {
    execSync(`node --check "${fp}"`, { stdio: 'pipe', timeout: 5000 });
    console.log(`✅ ${path.relative(process.cwd(), fp)}`);
  } catch (e) {
    console.error(`❌ ${path.relative(process.cwd(), fp)}`);
    errors++;
  }
});

if (errors > 0) {
  console.error(`\n❌ ${errors} file(s) have syntax errors`);
  process.exit(1);
}
console.log('\n✅ All files syntax OK!');
```

---

## 7. `tests/fixtures/stage-helpers.js` — Progression Helpers (Customize for Your Game)

For games with progressive stage unlocks, create helpers that:
1. Wait for `window.gameInitialized === true`
2. Use `page.evaluate()` to call WASM APIs
3. Seed resources, buy buildings, unlock features
4. Return structured results with `{ ok, reason }` for debugging

**Pattern:**
```js
async function unlockWorkersStage(page) {
  await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 30000 });
  const result = await page.evaluate(() => {
    // Click to earn resources
    for (let i = 0; i < 60; i++) window.rustGame.click_action();
    // Buy first building 3 times
    for (let i = 0; i < 3; i++) window.rustGame.buy_building(0);
    // Unlock the stage
    const unlocked = window.rustGame.unlock_feature('stage_workers');
    window.rustGame.update_ui();
    return { ok: unlocked };
  });
  if (!result.ok) throw new Error(`Failed to unlock: ${JSON.stringify(result)}`);
  return result;
}

module.exports = { unlockWorkersStage };
```

---

## 8. Writing E2E Tests — Conventions

```js
const { test, expect } = require('../fixtures/coverage');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
  });

  test('API exists and returns structured data', async ({ page }) => {
    const result = await page.evaluate(() => {
      if (!window.rustGame || typeof window.rustGame.my_api !== 'function') return null;
      return window.rustGame.my_api();
    });
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');
  });

  test('edge case: invalid input returns false', async ({ page }) => {
    const result = await page.evaluate(() => window.rustGame.do_prestige(-1));
    expect(result).toBe(false);
  });

  test('state mutation is correct', async ({ page }) => {
    const before = await page.evaluate(() => window.rustGame.get_coins());
    await page.evaluate(() => { for (let i = 0; i < 100; i++) window.rustGame.click_action(); });
    const after = await page.evaluate(() => window.rustGame.get_coins());
    expect(after).toBe(before + 100);
  });
});
```

### Conventions:
- Wait for `window.gameInitialized === true` before any assertions
- Prefer `page.evaluate()` over Playwright locators for WASM games
- Test API existence first, then behavior, then edge cases
- Use `#id` or `[data-attribute]` selectors for DOM checks
- Keep test files flat: `<feature>.test.js`, `*-coverage.test.js`, `*-flow.test.js`
- Filter slow tests with `test.describe.configure({ timeout: 60000 })`

---

## 9. Commands

```bash
# All tests (Chromium only)
npm test
npx playwright test --project=chromium

# Single test file
npx playwright test tests/functional/workers.test.js

# Single test by name pattern
npx playwright test -g "prestige preserves PP"

# All browsers
PW_ALL_BROWSERS=1 npm test

# With JS coverage
npm run test:e2e:coverage

# Custom port
PW_TEST_PORT=3000 npm test

# Syntax check only
npm run lint

# Skip slow Monkey tests
npx playwright test --grep-invert Monkey
```

---

## 10. `.gitignore`

```
coverage-report/
playwright-report/
test-results/
node_modules/
```

---

## Customizing for Your Project

1. **Server command**: Update `webServer.command` in `playwright.config.js` (e.g. `npm run dev` instead of `python3 server.py`)
2. **Port**: Change `PW_TEST_PORT` default
3. **Coverage filter**: Update `shouldKeepCoverageEntry` in `coverage.js` to match your JS directory
4. **Source filter**: Update `sourceFilter` in `merge-e2e-coverage.js` to your JS path
5. **Stage helpers**: Rewrite `stage-helpers.js` for your game's progression mechanics
6. **Thresholds**: Adjust `E2E_COVERAGE_MIN_*` env vars for your coverage goals
7. **Game init**: Change `window.gameInitialized` to your own ready-signal variable
8. **WASM API**: Change `window.rustGame.*` to your game's WASM export name

---

## Pitfalls

- **`waitForFunction` timeout silently ignored**: `page.waitForFunction(fn, { timeout: 60000 })` passes the options object in the `arg` position, so the timeout never applies (falls back to the 30s default). Must be `page.waitForFunction(fn, null, { timeout: 60000 })`. Symptom is intermittent long waits / false passes — it does **not** error. (Found in 15 places in this repo.)
- **Detached WASM method call crashes**: `const fn = window.rustGame.game_loop; fn()` loses `this` and throws `TypeError: Cannot read properties of undefined (reading '__wbg_ptr')`. Always call through the receiver: `const game = window.rustGame; game.game_loop()`.
- **Stage-gated tabs**: only ~5 tab buttons are visible at a fresh start. To assert on all panels, first `await unlockAdvancedIndustry(page)` (from `tests/fixtures/stage-helpers.js`), then call `window.rustGame.update_ui()` / `window.updateUnlocksPanel()`, and wait for `.tab-button` count to grow (12 in this repo).
- **Local Jenkins may be down** (`localhost:8081`): formal E2E runs go through Jenkins per repo policy; for a local smoke test start `python server.py --quiet --port 8080` first, then `npx playwright test <file> --project=chromium` (the config's `reuseExistingServer` reuses it). `python3` may be a Windows Store stub — prefer `python`.
- **Performance budgets/measurement** live in a separate skill: `game-perf-measurement`.
