# tests/ - Playwright E2E Suite

**Location**: `tests/` directory
**Framework**: Playwright with a Chromium-only coverage fixture by default.

## STRUCTURE
```text
tests/
├── fixtures/        # Shared Playwright extensions (`coverage.js`)
├── functional/      # Normal feature validation scope
└── regression/      # Bug reproduction / fix-locking tests only
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add shared test behavior | `fixtures/coverage.js` | Imported by almost every E2E file |
| Add routine feature coverage | `functional/` | Preferred day-to-day scope |
| Lock a bugfix | `regression/` | Keep assertions narrow and symptom-focused |
| Viewport/layout validation | `functional/responsive*.test.js`, `regression/banner-tab-overlap.test.js` | Use explicit viewport sizes |

## CONVENTIONS
- Import from `../fixtures/coverage` instead of `@playwright/test` directly.
- Wait for `window.gameInitialized === true` before any UI assertions or `page.evaluate()` calls.
- Prefer `#id` selectors, then stable data attributes like `button[data-tab="workers"]`.
- Use exact Chinese text when matching UI labels; zh-CN is the primary surface.
- Coverage collection only records Chromium pages; multi-browser runs are opt-in via config/env.

## ANTI-PATTERNS
- Skipping the WASM init wait, especially in smoke or syntax-only tests.
- Writing regression tests that assert broad UI snapshots instead of the specific broken contract.
- Adding normal feature assertions under `tests/regression/` instead of `tests/functional/`.
- Using raw `.class` selectors when an ID or tab data attribute already exists.
- Checking in `test.only()`; CI forbids it.

## NOTES
- `playwright.config.js` defaults to Chromium locally and expands to all browsers in CI or `PW_ALL_BROWSERS=1`.
- The web server command is `python3 server.py --quiet --port ${PW_TEST_PORT}`; keep tests compatible with that server contract.
- Formal repository test execution still belongs to Jenkins even though local Playwright structure lives here.
