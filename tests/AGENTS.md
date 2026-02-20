# tests/ - Playwright E2E Tests

**Location**: `tests/` directory (34 test files)

## Overview
Playwright end-to-end tests. Tests game functionality across Chromium, Firefox, Webkit.

## Test Structure
```
tests/
├── *.test.js            # Must use .test.js suffix
├── statistics.test.js   # Statistics system tests
├── achievements.test.js # Achievement system tests
├── crafting.test.js     # Crafting system tests
├── unlocks.test.js      # Unlock system tests
├── workers.test.js      # Worker system tests
├── responsive.test.js   # Responsive design tests
└── ...                  # 34 total test files
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add test | New `*.test.js` file | Suffix REQUIRED |
| Fix test | Existing test file | Wait for `gameInitialized` |
| Run tests | `npm run test` | Auto-starts server |

## Test Pattern (MANDATORY)
```javascript
const { test, expect } = require('@playwright/test');

test('test description', async ({ page }) => {
  // 1. Navigate to game
  await page.goto('http://localhost:8080');
  
  // 2. CRITICAL: Wait for WASM initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // 3. Test assertions
  const coinValue = await page.textContent('#coin-value');
  expect(parseFloat(coinValue)).toBeGreaterThan(0);
});
```

## ANTI-PATTERNS (CRITICAL)
### Playwright Tests - MUST FOLLOW
```javascript
// ❌ FORBIDDEN - skip gameInitialized wait
await page.goto('http://localhost:8080');
const coins = await page.textContent('#coin-value');

// ✅ REQUIRED - always wait first
await page.goto('http://localhost:8080');
await page.waitForFunction(() => window.gameInitialized === true);
const coins = await page.textContent('#coin-value');
```

```javascript
// ❌ FORBIDDEN - English text matching (game is in Chinese)
await expect(page.locator('text=Coins')).toBeVisible();

// ✅ REQUIRED - exact Chinese strings
await expect(page.locator('text=金币')).toBeVisible();
```

```javascript
// ❌ FORBIDDEN - unstable selectors
await page.click('.upgrade-button');

// ✅ REQUIRED - use stable IDs
await page.click('#upgrade-button-0');
```

## Test Categories

### 1. Function Tests
Test game mechanics work correctly:
```javascript
test('click earns coins', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  const initialCoins = await page.textContent('#coin-value');
  await page.click('#click-area');
  await page.waitForTimeout(100);
  
  const newCoins = await page.textContent('#coin-value');
  expect(parseFloat(newCoins)).toBeGreaterThan(parseFloat(initialCoins));
});
```

### 2. Visual Tests
Test colors, layout, styles:
```javascript
test('resource display has gold color', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  const element = page.locator('#resource-display');
  const color = await element.evaluate(el => getComputedStyle(el).color);
  expect(color).toBe('rgb(241, 196, 15)'); // Gold
});
```

### 3. Interaction Tests
Test tab switching, button clicks:
```javascript
test('tab switching works', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  await page.click('[data-tab="achievements"]');
  await expect(page.locator('#tab-achievements')).toHaveClass(/active/);
});
```

### 4. Responsive Tests
Test mobile layouts:
```javascript
test('mobile layout works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Check horizontal scroll
  const resources = page.locator('#resources');
  await expect(resources).toHaveCSS('overflow-x', 'auto');
});
```

## Commands
```bash
# Run all tests
npm run test

# Single test file
npx playwright test tests/statistics.test.js

# With UI for debugging
npm run test:ui

# Generate HTML report
npx playwright test --reporter=html

# Run specific browser
npx playwright test --project=chromium
```

## Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: 'tests/',
  testMatch: '*.test.js',  // Suffix REQUIRED
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browser: 'chromium' } },
    { name: 'firefox', use: { browser: 'firefox' } },
    { name: 'webkit', use: { browser: 'webkit' } },
  ],
  webServer: {
    command: 'python server.py',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
};
```

## Common Assertions
```javascript
// Text content
const text = await page.textContent('#element-id');
expect(parseFloat(text)).toBeGreaterThan(0);

// Visibility
await expect(page.locator('#element')).toBeVisible();

// CSS classes
await expect(page.locator('#tab')).toHaveClass(/active/);

// CSS properties
const color = await element.evaluate(el => getComputedStyle(el).color);
expect(color).toBe('rgb(241, 196, 15)');

// Element count
const items = await page.locator('.achievement-item').count();
expect(items).toBeGreaterThanOrEqual(13);
```

## Debugging
```javascript
// Pause test for inspection
await page.pause();

// Take screenshot
await page.screenshot({ path: 'debug.png' });

// Console logs
page.on('console', msg => console.log(msg.text()));

// Slow down for visual debugging
test.slow();
```
