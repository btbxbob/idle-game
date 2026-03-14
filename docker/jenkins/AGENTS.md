# docker/jenkins/ - Local Jenkins Stack

## OVERVIEW
Container images and bootstrap scripts for the local Jenkins controller, inbound build agent, and DinD runtime used by `idle-game-ci`.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change controller image/packages | `Dockerfile` | Preinstalls Node, Playwright Chromium, Docker CLI, Jenkins plugins |
| Change inbound agent image | `Dockerfile.agent` | Rust, wasm-pack, Node, and JNLP agent runtime live here |
| Change DinD image/runtime | `Dockerfile.dind` | Supports Playwright container execution inside Jenkins |
| Change local stack wiring | `docker-compose.yml` | Uses repo-root build context and binds the full checkout into containers |
| Change local env defaults | `.env.jenkins.example` | Template for local credentials and memory settings |
| Adjust auto-registration | `agent-entrypoint.sh` | Fetches crumb + JNLP secret, then launches the agent |
| Change Jenkins bootstrap config | `init.groovy.d/*.groovy` | Security setup and agent registration |
| Change plugin set | `plugins.txt` | Source of truth for controller plugins |

## CONVENTIONS
- Keep controller concerns in `Dockerfile`; build-tool installation for jobs belongs in `Dockerfile.agent` unless the controller truly needs it.
- Preserve the controller/agent/DinD split used by `docker-compose.yml`.
- Keep `docker-compose.yml` runnable from the repository root; its `../..` build contexts and bind mounts depend on that invocation path.
- Match defaults here with `docs/ci/jenkins-migration.md` and `docker-compose.yml` when changing ports, credentials, labels, or memory limits.
- Prefer fail-fast bootstrap behavior over silent retries without context.

## ANTI-PATTERNS
- Mixing controller initialization logic into the agent image or vice versa.
- Changing agent names/labels without updating `docker-compose.yml`, `Jenkinsfile`, and the Groovy/bootstrap path together.
- Treating these files like generic Docker examples; they are tailored to local Jenkins + Playwright DinD constraints.

## NOTES
- Default local URL is `http://localhost:8081`; the controller itself runs with `0` executors and the inbound agent does the work.
- Playwright browser images are expected to be available to DinD ahead of CI runs; Jenkins fails fast when they are missing.
