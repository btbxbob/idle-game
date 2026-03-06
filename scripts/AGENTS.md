# scripts/ - Repo Utility Scripts

**Location**: `scripts/` directory
**Role**: Small operational helpers for CI reruns, coverage merging, syntax linting, and DOM debugging.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Re-run Jenkins locally | `jenkins-debug-rerun.sh` | Triggers `idle-game-ci`, waits, prints failures and coverage |
| Merge E2E coverage | `merge-e2e-coverage.js` | Consumes `coverage-report/raw/*.json` and enforces thresholds |
| Syntax-check JS files | `lint-syntax.js` | Repo-specific lint entry behind `npm run lint` |
| Inspect upgrade DOM manually | `debug-upgrade-dom.js` | Console-paste debug aid, not part of CI |

## CONVENTIONS
- `jenkins-debug-rerun.sh` assumes local Jenkins defaults (`http://localhost:8081`, `admin/admin123`) unless env overrides are supplied.
- Coverage thresholds come from environment variables and default to the same values documented in Jenkins.
- `lint-syntax.js` intentionally scans `js`, `tests`, and `scripts`; keep new JS utility code inside those paths if you want lint coverage.

## ANTI-PATTERNS
- Treating debug helpers like `debug-upgrade-dom.js` as production runtime code.
- Reading Jenkins logs aggressively while builds are still running; use metadata polling first.
- Writing new one-off scripts without documenting their entrypoint/expected environment here.

## NOTES
- `merge-e2e-coverage.js` is the source of truth for merged E2E coverage thresholds and artifact shape.
- `jenkins-debug-rerun.sh` is the fastest way to reproduce the Jenkins E2E + coverage path outside the UI.
