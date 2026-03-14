# tests/fixtures/ - Shared Playwright Helpers

## OVERVIEW
Shared test infrastructure for Chromium coverage collection and stage-unlock helpers.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change Playwright base fixture | `coverage.js` | Re-export `test`/`expect`; Chromium-only coverage wiring lives here |
| Add progression helper | `stage-helpers.js` | Use for stage-gated tabs before UI assertions |
| Debug raw coverage output | `coverage.js` | Writes JSON into `coverage-report/raw/` |

## CONVENTIONS
- Keep fixture exports compatible with `const { test, expect } = require('../fixtures/coverage');`.
- `coverage.js` must stay safe for non-Chromium projects; bail out without coverage collection there.
- Helper functions should return actionable failure context, not silent booleans.
- Stage helpers may call WASM APIs directly, but only after the caller has waited for `window.gameInitialized === true`.

## ANTI-PATTERNS
- Importing `@playwright/test` directly in normal E2E files when the coverage fixture already wraps it.
- Hiding unlock/setup failures inside helpers; throw with enough state to debug.
- Adding app-specific assertions here; keep these files reusable across many tests.

## NOTES
- `unlockWorkersStage(page)` is the current shared progression helper; extend here before duplicating unlock logic across tests.
- Raw coverage filenames include project, worker, retry, and title path, so helper changes can affect merged artifact volume.
