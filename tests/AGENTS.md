# tests/ - Playwright E2E Tests

**Location**: `tests/` directory (50 test files)
**Framework**: Playwright (Chromium, Firefox, Webkit)

## Test Categories (50 files)

### Core Mechanics
- `statistics.test.js`, `achievements.test.js`, `crafting.test.js`
- `unlocks.test.js`, `workers.test.js`, `workers-panel.test.js`

### Resources (Phase 2)
- `primary-resources.test.js`, `secondary-resources.test.js`, `advanced-resources.test.js`
- `resource-production-complete.test.js`, `resource-crafting-complete.test.js`
- `resource-update.test.js`

### System Flows (Phase 2)
- `technology-tree-flow.test.js`, `housing-system-flow.test.js`
- `worker-simulation-flow.test.js`, `life-death-cycle.test.js`

### UI & Visual
- `responsive.test.js`, `responsive-iphone-15-pro.test.js`, `responsive-layout.test.js`
- `visual-style.test.js`, `particle-effect.test.js`
- `tab-structure.test.js`, `tab-evidence.test.js`, `comprehensive-tab.test.js`

### Performance
- `performance-benchmark.test.js`, `performance-stress-test.test.js`, `performance-quick-test.test.js`

### QA & Regression
- `monkey-test.test.js`, `manual-qa.test.js`, `autoclicker-removed.test.js`
- `core-issues-fixed.test.js`, `fix-all-issues.test.js`, `no-undefined-display.test.js`

## Test Pattern (MANDATORY)
```javascript
const { test, expect } = require('@playwright/test');

test('description', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);  // CRITICAL
  // Use exact Chinese strings for text matching
});
```

## ANTI-PATTERNS
- ❌ Skip `gameInitialized` wait → flaky tests
- ❌ English text matching → game is zh-CN primary
- ❌ Unstable selectors (`.class`) → use `#id` selectors
- ❌ Missing `*.test.js` suffix → Playwright won't find it

## Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: 'tests/',
  testMatch: '*.test.js',
  webServer: {
    command: 'python3 server.py',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
};
```

## Commands
```bash
npm run test                                    # All tests
npx playwright test tests/specific.test.js      # Single file
npm run test:ui                                 # With UI debugger
npx playwright test --project=chromium          # Single browser
```
