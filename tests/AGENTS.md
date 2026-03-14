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

Scoped guides:
- `tests/fixtures/AGENTS.md`
- `tests/functional/AGENTS.md`
- `tests/regression/AGENTS.md`

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
- Prefer selectors and visibility checks that match the current runtime DOM contract: `#coin-count` and banner resource cards for coin display, visible tab buttons for stage-gated navigation, and absence checks for removed tabs like `crafting` when the runtime no longer renders them.
- When a gameplay surface moves from one UI entry point to another (for example crafting -> factory-based progression), migrate tests to the new user-visible contract or WASM API instead of forcing the old tab/DOM path to remain in assertions.

## ANTI-PATTERNS
- Skipping the WASM init wait, especially in smoke or syntax-only tests.
- Writing regression tests that assert broad UI snapshots instead of the specific broken contract.
- Adding normal feature assertions under `tests/regression/` instead of `tests/functional/`.
- Using raw `.class` selectors when an ID or tab data attribute already exists.
- Checking in `test.only()`; CI forbids it.
- Assuming all tabs are visible at startup; stage-gated tabs may exist in DOM but be hidden until progression unlocks them.
- Hardcoding legacy selectors or removed surfaces (for example `#coins` or `button[data-tab="crafting"]`) after the runtime UI has moved on.

## NOTES
- `playwright.config.js` defaults to Chromium locally and expands to all browsers in CI or `PW_ALL_BROWSERS=1`.
- The web server command is `python3 server.py --quiet --port ${PW_TEST_PORT}`; keep tests compatible with that server contract.
- `playwright.config.js` excludes Monkey tests with `grep: /^(?!.*Monkey).*$/i`; opt in explicitly when working on that suite.
- Formal repository test execution still belongs to Jenkins even though local Playwright structure lives here.
