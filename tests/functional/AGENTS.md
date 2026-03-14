# tests/functional/ - Feature Validation

## OVERVIEW
Routine user-flow and system-behavior coverage for the current game, not historical bug lock-ins.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add coverage for a UI manager | `*-coverage.test.js` | Mirrors manager/module names used in `js/` |
| Validate a gameplay flow | `*flow.test.js`, `workers.test.js`, `unlocks.test.js` | Prefer user-visible behavior plus targeted WASM checks |
| Check layout or responsiveness | `responsive.test.js`, `visual-style.test.js` | Use explicit viewport sizes |
| Add stage-gated setup | `../fixtures/stage-helpers.js` | Reuse helpers before writing new unlock setup |

## CONVENTIONS
- Start from `../fixtures/coverage` and wait for `window.gameInitialized === true` in `beforeEach` or the test body.
- Prefer visible runtime contracts first, then direct `window.rustGame.*` checks when the UI alone is too indirect.
- Keep filenames flat and descriptive: `<feature>.test.js`, `*-coverage.test.js`, `*-flow.test.js`.
- Use screenshot evidence sparingly and keep paths under `.sisyphus/evidence/` when you need visual proof.

## ANTI-PATTERNS
- Moving ordinary feature assertions into `tests/regression/`.
- Duplicating progression unlock code instead of reusing or extending fixture helpers.
- Locking tests to transient DOM structure when a stable tab/id/runtime API contract already exists.

## NOTES
- `workers.test.js`, `technology-tree-flow.test.js`, and `responsive.test.js` are good pattern references for dense feature flows.
- `playwright.config.js` filters Monkey tests out of default runs; functional coverage should stay fast enough for routine Jenkins execution.
