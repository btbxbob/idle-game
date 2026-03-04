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

When `RUN_COVERAGE=true`, Jenkins executes Playwright on Chromium and then merges/checks E2E coverage:

- `npx playwright test --project=chromium --reporter=line,junit,html`
- `node scripts/merge-e2e-coverage.js`

Coverage threshold env vars (can be overridden in Jenkins job/pipeline env):

- `E2E_COVERAGE_MIN_LINES` (default `20`)
- `E2E_COVERAGE_MIN_STATEMENTS` (default `20`)
- `E2E_COVERAGE_MIN_FUNCTIONS` (default `15`)
- `E2E_COVERAGE_MIN_BRANCHES` (default `10`)

Playwright Chromium is preinstalled in the Jenkins image (`docker/jenkins/Dockerfile`) to avoid runtime browser download timeouts.

The pipeline exports:

- JUnit XML: `test-results/playwright-junit.xml` (for Jenkins Test Result trend)
- HTML report: `playwright-report/**` (archived artifacts)
- Additional test artifacts under `test-results/**` (archived artifacts)
- Coverage reports under `coverage-report/e2e-merged/**` (archived artifacts)

## 4) OpenCode policy

Compile/test CI runs should be triggered in Jenkins (UI, webhook, or MCP), not executed as OpenCode-hosted CI jobs.

Current OpenCode GitHub workflow can remain for AI orchestration, but build/test responsibility is Jenkins.

## 5) GitHub Pages deployment workflow

GitHub Pages release remains in `.github/workflows/deploy.yml`.

- Jenkins: build/test CI
- GitHub Actions deploy.yml: GitHub Pages release
