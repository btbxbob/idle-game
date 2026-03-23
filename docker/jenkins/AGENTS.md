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

## Remote SSH Agent (`bx-server`)
- Remote node name is `bx-server-docker-agent` with labels `idle-game-build-agent linux docker`.
- Jenkins connects to host `115.190.167.210:22` as user `bx` via `SSHLauncher`; it does not SSH directly into the container.
- Jenkins node `remoteFS` is `/home/bx/jenkins-agent-home`, and the configured Java path is `/home/bx/bin/jenkins-java`.
- `/home/bx/bin/jenkins-java` is a host-side wrapper that converts Jenkins' Java launch into `docker exec ... bx-jenkins-ssh-agent /opt/java/openjdk/bin/java ...`; avoid reintroducing `prefixStartSlaveCmd`/`suffixStartSlaveCmd` docker wrapping because `SSHLauncher` can concatenate it incorrectly.
- Keep the remote agent container name as `bx-jenkins-ssh-agent` unless you update the wrapper script and Jenkins node configuration together.
- The remote agent container should mount:
- `/home/bx/jenkins-agent-home:/home/jenkins/agent`
- `/home/bx/jenkins-agent-home:/home/bx/jenkins-agent-home`
- `/home/bx/jenkins-agent-home/source/idle-game:/workspace/idle-game`
- `/var/run/docker.sock:/var/run/docker.sock`
- The container also needs the host docker socket group added (`--group-add 988` on the current host) so the in-container `jenkins` user can run Docker.
- Source sync for this remote path is not Git checkout; `Jenkinsfile` rsyncs from `/workspace/idle-game` into the Jenkins workspace.
- Do not `rm -rf /home/bx/jenkins-agent-home/source/idle-game` while the container is running; deleting and recreating the bind-mount root can leave `/workspace/idle-game` stale or empty inside the live container. Refresh files in place instead, or recreate the container after replacing the mount root.
- `idle-game-ci` currently uses an inline Jenkins pipeline definition on the controller, so repository `Jenkinsfile` edits do not take effect until the controller-side job definition is refreshed.
- The pipeline now self-heals tool bootstrap for this remote agent: Node install clears stale `$HOME/.local/node` directories first, and Rust setup installs the `wasm-bindgen-cli` version that matches `Cargo.lock`.
