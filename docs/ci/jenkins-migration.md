# Jenkins CI Migration (OpenCode -> Jenkins)

This project delegates build/test CI execution to Jenkins.

## 1) Start Jenkins (with MCP server plugin)

```bash
cp docker/jenkins/.env.jenkins.example docker/jenkins/.env.jenkins
docker compose --env-file docker/jenkins/.env.jenkins -f docker/jenkins/docker-compose.yml up -d --build
```

Jenkins UI: `http://localhost:8081`

Default local credentials (change in env):
- User: `admin`
- Password: `admin123`

You can override credentials before startup:

```bash
export JENKINS_ADMIN_ID="your-admin"
export JENKINS_ADMIN_PASSWORD="your-strong-password"
```

The local Compose profile now defaults to staying under `512MB` total memory for the Jenkins stack:

- `jenkins`: `416m` hard limit, `288m` reservation
- `dind`: `1536m` hard limit, `1024m` reservation
- Jenkins JVM: `-Xms128m -Xmx256m`

Use `docker/jenkins/.env.jenkins.example` as the tracked template and keep your actual local values in `docker/jenkins/.env.jenkins` (already gitignored). Run the compose command from the repository root with `--env-file docker/jenkins/.env.jenkins` so the memory limits and credentials are applied.

To keep the controller lightweight, Compose also starts a dedicated inbound build agent. The controller runs with `0` executors, while the `agent` service handles checkout, Rust, npm, and Jenkins pipeline shell steps. The Playwright browser container runs through `dind`, so `DIND_MEMORY_LIMIT` / `DIND_MEMORY_RESERVATION` need enough headroom for browser processes even though the controller itself stays under `512MB`.

## 2) Jenkins MCP endpoint

The official Jenkins MCP plugin is preinstalled in this image.

- Streamable HTTP: `http://localhost:8081/mcp-server/mcp`
- SSE: `http://localhost:8081/mcp-server/sse`
- Stateless: `http://localhost:8081/mcp-server/stateless`

Use Jenkins API token with Basic auth:

```bash
printf '%s' 'username:api-token' | base64
```

Example MCP client config snippet:

```json
{
  "mcpServers": {
    "jenkins": {
      "type": "streamableHttp",
      "url": "http://localhost:8081/mcp-server/mcp",
      "headers": {
        "Authorization": "Basic <base64(username:api-token)>"
      }
    }
  }
}
```

## 3) CI pipeline in Jenkins

This repository now includes `Jenkinsfile` with these CI stages:

1. `npm ci`
2. `npm run lint`
3. `cargo check`
4. `cargo test`
5. `wasm-pack build --target web --out-dir pkg --release --mode no-install`
6. optional Playwright stage (`RUN_PLAYWRIGHT=true` or `RUN_COVERAGE=true`)
Create a Jenkins Pipeline job pointing to this repository and script path `Jenkinsfile`.

### Pipeline source of truth

The local Jenkins controller now ships with `docker/jenkins/init.groovy.d/03-pipeline-job.groovy`, which synchronizes the `idle-game-ci` job definition from `/workspace/idle-game/Jenkinsfile` at startup.

This prevents the local controller from drifting onto a stale inline Pipeline Script stored in `/var/jenkins_home/jobs/idle-game-ci/config.xml`. If the checked-in `Jenkinsfile` changes, rebuild/restart the `jenkins` service so the controller reloads the updated job definition.

### Local sync model and common pitfall

There are two different source paths involved in local Jenkins runs, and they are easy to confuse:

- your normal development repository, which may also be pushed to remotes such as `origin` or `bx-server`
- the bind-mounted local path `../../` from `docker/jenkins/docker-compose.yml`, which appears inside the controller and agent containers as `/workspace/idle-game`

For the local Jenkins stack, `/workspace/idle-game` is the effective source of truth. Both the pipeline definition sync (`03-pipeline-job.groovy`) and the job `Checkout` stage read from that mounted path.

That means:

- pushing commits to `origin` does not update the local Jenkins job by itself
- pushing commits to the `bx-server` git remote does not update the local Jenkins job by itself
- changing `Jenkinsfile` in the repo requires a `jenkins` container restart before the job definition picks up the new script
- changing normal source files is enough on disk for the next local Jenkins run, because the containers read the mounted workspace directly

Useful checks when Jenkins seems to run stale code:

```bash
docker compose -f docker/jenkins/docker-compose.yml restart jenkins agent
docker compose -f docker/jenkins/docker-compose.yml logs --tail=50 jenkins
```

After restart, look for this controller log line:

```text
Synchronized pipeline job from /workspace/idle-game/Jenkinsfile
```

If that line does not appear, Jenkins is still running an older in-memory job definition.

### Checkout speed optimization

The Jenkins `Checkout` stage no longer copies the entire mounted repository with `cp -a`. It now prefers `rsync --delete --delete-excluded` and skips large generated directories such as `node_modules/`, `target/`, `pkg/`, `coverage-report/`, `playwright-report/`, and `test-results/`.

This keeps the agent workspace aligned with the mounted source while avoiding repeated copies of heavy local artifacts that do not belong in CI.

### Dependency cache optimization

The pipeline now also reuses persistent caches inside the Jenkins agent volume:

- npm cache: `/home/jenkins/agent/.cache/npm`
- Cargo target cache: `/home/jenkins/agent/.cache/cargo-target/idle-game`

The pipeline also reuses a local Node install under `/home/jenkins/.local/node`. It only re-downloads Node when the binary is missing or the configured `NODE_VERSION` no longer matches.

`npm ci` now runs with `--cache ... --prefer-offline`, and Rust stages reuse a persistent `CARGO_TARGET_DIR` outside the cleaned workspace. This reduces repeat install/compile time while keeping the checked-out workspace disposable.

### WASM build optimization

The Jenkins agent image now preinstalls a matching `wasm-bindgen-cli` version, and the pipeline runs `wasm-pack build` with `--mode no-install`.

This avoids the per-build `Installing wasm-bindgen...` step inside the WASM stage and makes repeat `Build WASM` runs more predictable.

### Measured speedup

After re-syncing `idle-game-ci` to the repository `Jenkinsfile`, repeat local builds dropped sharply:

- build `#11`: `275871ms` (`cp -a`, no cache-backed pipeline sync)
- build `#13`: `310041ms` (still running stale inline Pipeline Script)
- build `#17`: `64325ms` (synced job, `rsync`, cache reuse, `--mode no-install`)

The biggest change was the WASM stage:

- build `#13`: Rust release compile `27.66s`, `wasm-pack` total `52.09s`
- build `#17`: Rust release compile `0.04s`, `wasm-pack` total `0.23s`

At this point the main remaining cost is Jenkins pipeline overhead plus checkout/lint/npm work, not Rust/WASM compilation.

### Playwright in Jenkins

When `RUN_PLAYWRIGHT=true`, Jenkins executes:

- `npx playwright test --project=chromium --reporter=line,junit,html`

The Jenkins pipeline passes `PW_TEST_WORKERS=2` into the Playwright container by default, matching the CI fallback in `playwright.config.js` and reducing browser memory pressure in a single container.

The pipeline also enables `buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '3'))` so the Jenkins controller keeps only the latest 10 build records and the latest 3 sets of archived artifacts, reducing local disk growth.

- `npx playwright test tests/functional --project=chromium --reporter=line,junit,html`
- `node scripts/merge-e2e-coverage.js`

By default, only functional tests are run. To include regression tests, set `RUN_REGRESSION_TESTS=true`.

Before a coverage run starts, the pipeline removes `coverage-report/raw` and `coverage-report/e2e-merged` so the merged report only reflects the current Jenkins execution.

Coverage threshold env vars (can be overridden in Jenkins job/pipeline env):

- `E2E_COVERAGE_MIN_LINES` (default `20`)
- `E2E_COVERAGE_MIN_STATEMENTS` (default `20`)
- `E2E_COVERAGE_MIN_FUNCTIONS` (default `15`)
- `E2E_COVERAGE_MIN_BRANCHES` (default `10`)

Playwright Chromium is preinstalled in the Jenkins image (`docker/jenkins/Dockerfile`) to avoid runtime browser download timeouts.

The Jenkins pipeline does not pull the Playwright runtime image during CI anymore. It only verifies that the DinD daemon already has either `mcr.microsoft.com/playwright:v1.58.2-jammy` or the configured mirror tag cached locally, then runs `docker run --pull=never ...`. If the image is missing, the pipeline fails fast with a preload hint instead of hanging in a long registry pull.

The pipeline exports:

- JUnit XML: `test-results/playwright-junit.xml` (for Jenkins Test Result trend)
- HTML report: `playwright-report/**` (archived artifacts)
- Additional test artifacts under `test-results/**` (archived artifacts)
- Coverage reports under `coverage-report/e2e-merged/**` (archived artifacts)

## 4) OpenCode policy

Compile/test CI runs should be triggered in Jenkins (UI, webhook, or MCP), not executed as OpenCode-hosted CI jobs.

Current OpenCode GitHub workflow can remain for AI orchestration, but build/test responsibility is Jenkins.

### MCP log timeout handling (`-32001`)

When monitoring Jenkins from MCP, use this sequence to avoid log-read timeouts:

1. Poll build state with `jenkins_getBuild` first.
2. While `building=true`, avoid `jenkins_getBuildLog` and `jenkins_searchBuildLog`.
3. For running builds, use `jenkins_getQueueItem`/`jenkins_getTestResults` for progress signals.
4. After `building=false`, read logs with bounded windows (example: `limit<=200`, `skip=-200`).
5. Use bounded log search only (`maxMatches<=20`, narrow pattern) and avoid broad regex across full logs.
6. Retry log APIs at most 3 times with backoff (2s, 5s, 10s), then fall back to artifacts and test APIs.

Coverage retrieval priority:
- First: archived `coverage-report/e2e-merged/coverage-summary.json`
- Fallback: bounded log extraction only when artifact retrieval is unavailable

### Reusable debug/rerun script

Use `scripts/jenkins-debug-rerun.sh` to run a full Jenkins rerun + poll + summary flow in one command.

Important: Jenkins reruns only reflect committed repository state. If you change Playwright tests or runtime code and want Jenkins to execute the updated sources, commit those changes before triggering the rerun.

```bash
chmod +x scripts/jenkins-debug-rerun.sh
scripts/jenkins-debug-rerun.sh
```

Optional environment overrides:

```bash
JENKINS_URL=http://localhost:8081 \
JENKINS_USER=admin \
JENKINS_TOKEN=admin123 \
JOB_NAME=idle-game-ci \
RUN_PLAYWRIGHT=true \
RUN_COVERAGE=true \
RUN_REGRESSION_TESTS=true \
scripts/jenkins-debug-rerun.sh
```

## 5) GitHub Pages deployment workflow

GitHub Pages release remains in `.github/workflows/deploy.yml`.

- Jenkins: build/test CI
- GitHub Actions deploy.yml: GitHub Pages release
