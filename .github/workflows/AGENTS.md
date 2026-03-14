# .github/workflows/ - GitHub Automation

## OVERVIEW
GitHub Actions only handles Pages deployment and opencode orchestration; build/test CI ownership stays in Jenkins.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change GitHub Pages release flow | `deploy.yml` | Builds WASM release and publishes Pages artifact |
| Change comment-triggered opencode behavior | `opencode.yml` | Orchestration-only workflow; prints CI ownership notice |
| Cross-check CI ownership | `Jenkinsfile`, `docs/ci/jenkins-migration.md` | Jenkins remains source of truth for build/test stages |

## CONVENTIONS
- Keep `deploy.yml` focused on static-site release steps; do not reintroduce repo test stages here.
- Keep `opencode.yml` read-only/orchestration oriented unless CI ownership changes repo-wide.
- When workflow behavior changes, make the same ownership story consistent across root docs and Jenkins docs.

## ANTI-PATTERNS
- Duplicating Jenkins build/test logic in GitHub Actions.
- Adding workflow assumptions that conflict with local Jenkins defaults or documented CI ownership.
- Hiding deployment/build responsibilities across multiple workflow files without updating the docs.

## NOTES
- `deploy.yml` triggers on `master` pushes and `workflow_dispatch`.
- `opencode.yml` responds only to `/oc` or `/opencode` comment triggers.
