# tests/regression/ - Bug Lock-In Tests

## OVERVIEW
Narrow regression coverage for previously broken behavior; each file should preserve the symptom, root cause context, and expected post-fix contract.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new bug lock-in | `*.test.js` in this folder | Keep one defect family per file when possible |
| Follow regression file format | `README.md` | `Bug`, optional `Root Cause`, and `Expected` header pattern |
| Reuse stage setup | `../fixtures/stage-helpers.js` | Needed for worker/resource regressions behind progression gates |

## CONVENTIONS
- Assert the specific broken contract, not a broad page snapshot.
- Keep setup minimal; reproduce just enough state to prove the regression stays fixed.
- Preserve the historical context comment block at the top of each file.
- Reuse the same runtime waits and selector discipline as `tests/AGENTS.md`.

## ANTI-PATTERNS
- Turning regression files into general feature suites.
- Writing assertions so broad that unrelated UI restyling breaks them.
- Omitting the bug description/context that explains why the test belongs here.

## NOTES
- `banner-tab-overlap.test.js` and `resource-workers-density-layout-regression.test.js` are good references for layout-focused regressions.
- If a regression grows into a normal product expectation with no historical nuance left, move the lasting coverage to `tests/functional/`.
