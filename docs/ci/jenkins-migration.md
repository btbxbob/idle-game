# Jenkins CI Migration (OpenCode -> Jenkins)

This project delegates build/test CI execution to Jenkins.

## 1) Start Jenkins (with MCP server plugin)

```bash
docker compose -f docker-compose.jenkins.yml up -d --build
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
5. `wasm-pack build --target web --out-dir pkg --release`
6. optional Playwright stage (`RUN_PLAYWRIGHT=true` or `RUN_COVERAGE=true`)
Create a Jenkins Pipeline job pointing to this repository and script path `Jenkinsfile`.

### Playwright in Jenkins

When `RUN_PLAYWRIGHT=true`, Jenkins executes:

- `npx playwright test --project=chromium --reporter=line,junit,html`

The Jenkins pipeline now passes `PW_TEST_WORKERS=2` into the Playwright container by default, so Chromium E2E runs can use two workers unless the pipeline environment overrides that value.

When `RUN_COVERAGE=true`, Jenkins executes Playwright on Chromium and then merges/checks E2E coverage:

- `npx playwright test --project=chromium --reporter=line,junit,html`
- `node scripts/merge-e2e-coverage.js`

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
scripts/jenkins-debug-rerun.sh
```

## 5) GitHub Pages deployment workflow

GitHub Pages release remains in `.github/workflows/deploy.yml`.

- Jenkins: build/test CI
- GitHub Actions deploy.yml: GitHub Pages release
