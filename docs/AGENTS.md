# docs/ - Design and Process Docs

**Location**: `docs/` directory

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Update gameplay/design intent | `DESIGN.md`, `phase-2-systems.md` | Mechanics, progression, UI goals |
| Update CI / Jenkins process | `ci/jenkins-migration.md` | Current source of truth for local Jenkins setup |
| Cross-check implemented vs planned behavior | `DESIGN.md` + matching code/test area | Docs can drift from shipped mechanics |
| Review testing guidance | `TEST_CASES.md`, `unit_tests.md` | Functional/E2E vs Rust-unit coverage |

## CONVENTIONS
- Treat `docs/ci/jenkins-migration.md` as the detailed CI operations guide; root `AGENTS.md` only carries the concise policy.
- Keep design docs aligned with the implemented Rust/JS behavior, especially for technology, workers, and resource flows.
- Prefer adding new operational notes under an existing focused doc before creating more top-level markdown files.

## ANTI-PATTERNS
- Leaving docs frozen on old feature phases after the code has moved on.
- Duplicating CI ownership details across multiple docs when `docs/ci/jenkins-migration.md` already owns them.
- Recording generic language/tool advice here instead of repo-specific decisions.

## NOTES
- Current docs mix long-form planning (`phase-2-systems.md`) with operational docs (`ci/jenkins-migration.md`); preserve that split.
- `docs/AGENTS.md` should stay index-like and point to higher-signal documents, not mirror their full contents.
