# scripts/ - Repo Utility Scripts

**Location**: `scripts/` directory
**Role**: Small operational helpers for CI reruns, coverage merging, syntax linting, and DOM debugging.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Re-run Jenkins locally | `jenkins-debug-rerun.sh` | Triggers `idle-game-ci`, waits, prints failures and coverage |
| Merge E2E coverage | `merge-e2e-coverage.js` | Consumes `coverage-report/raw/*.json` and enforces thresholds |
| Measure startup load time | `measure-load-time.js` | Runs repeated Playwright startup samples, prints JSON summary |
| Syntax-check JS files | `lint-syntax.js` | Repo-specific lint entry behind `npm run lint` |
| Version WASM assets | `version-wasm-assets.py` | Creates versioned `pkg` wrapper/wasm files so deploys bypass stale browser caches |
| Inspect upgrade DOM manually | `debug-upgrade-dom.js` | Console-paste debug aid, not part of CI |
| Patch Rust tech files ad hoc | `add_derive.py`, `add_tech.py`, `fix_tech.py` | One-off source patch helpers; review before rerunning |
| Patch production test fixtures | `fix_buildings.js` | Rewrites `src/systems/production.rs` test helper block |

## CONVENTIONS
- `jenkins-debug-rerun.sh` assumes local Jenkins defaults (`http://localhost:8081`, `admin/admin123`) unless env overrides are supplied.
- Coverage thresholds come from environment variables and default to the same values documented in Jenkins.
- `lint-syntax.js` intentionally scans `js`, `tests`, and `scripts`; keep new JS utility code inside those paths if you want lint coverage.
- `version-wasm-assets.py` should run immediately after `wasm-pack build`; `bootstrap.js` prefers the versioned bundle and falls back to the plain `pkg` entry for local/dev runs.
- One-off patch helpers in this directory assume repo-root execution; their file paths are relative to `/home/bx/src/idle-game`, not `scripts/`.

## ANTI-PATTERNS
- Treating debug helpers like `debug-upgrade-dom.js` as production runtime code.
- Running patch helpers from inside `scripts/` and accidentally targeting the wrong relative paths.
- Reading Jenkins logs aggressively while builds are still running; use metadata polling first.
- Writing new one-off scripts without documenting their entrypoint/expected environment here.

## NOTES
- `merge-e2e-coverage.js` is the source of truth for merged E2E coverage thresholds and artifact shape.
- `jenkins-debug-rerun.sh` is the fastest way to reproduce the Jenkins E2E + coverage path outside the UI.
