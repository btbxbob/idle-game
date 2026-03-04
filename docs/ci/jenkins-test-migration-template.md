# Jenkins Test Migration Template (Reusable)

This template helps migrate test execution from local/agent runs to Jenkins-only CI with Docker isolation.

## 1. Migration Goal

- Test execution must happen in Jenkins, not on developer machines or AI agents.
- E2E tests run in an isolated container (`docker run`) to avoid host port conflicts.
- Coverage reports are always generated when coverage mode is enabled, even if tests fail.

## 2. Minimum Architecture

- Jenkins controller/agent service
- Docker daemon reachable by Jenkins (`DOCKER_HOST` to DinD or remote daemon)
- Jenkins pipeline with parameters:
  - `RUN_PLAYWRIGHT` (or `RUN_E2E`)
  - `RUN_COVERAGE`

Recommended for local self-hosted setup:
- `jenkins` + `dind` in `docker-compose`
- `jenkins` uses `DOCKER_HOST=tcp://dind:2375`

## 3. Jenkinsfile Template

```groovy
pipeline {
  agent any

  options {
    timeout(time: 120, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  parameters {
    booleanParam(name: 'RUN_PLAYWRIGHT', defaultValue: false, description: 'Run Playwright e2e suite')
    booleanParam(name: 'RUN_COVERAGE', defaultValue: false, description: 'Run e2e coverage merge/check')
  }

  environment {
    CI = 'true'
    E2E_COVERAGE_MIN_LINES = '20'
    E2E_COVERAGE_MIN_STATEMENTS = '20'
    E2E_COVERAGE_MIN_FUNCTIONS = '15'
    E2E_COVERAGE_MIN_BRANCHES = '10'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build and Unit Tests') {
      steps {
        sh '''
          npm ci
          npm run lint
          cargo check
          cargo test
        '''
      }
    }

    stage('Prewarm Playwright Image') {
      when {
        expression { return params.RUN_PLAYWRIGHT || params.RUN_COVERAGE }
      }
      steps {
        sh 'docker pull mcr.microsoft.com/playwright:v1.58.2-jammy'
      }
    }

    stage('Playwright E2E') {
      when {
        expression { return params.RUN_PLAYWRIGHT || params.RUN_COVERAGE }
      }
      options {
        timeout(time: 60, unit: 'MINUTES')
      }
      steps {
        sh '''
          mkdir -p test-results
          docker run --rm \
            -e CI=true \
            -e RUN_COVERAGE=${RUN_COVERAGE} \
            -e E2E_COVERAGE_MIN_LINES=${E2E_COVERAGE_MIN_LINES} \
            -e E2E_COVERAGE_MIN_STATEMENTS=${E2E_COVERAGE_MIN_STATEMENTS} \
            -e E2E_COVERAGE_MIN_FUNCTIONS=${E2E_COVERAGE_MIN_FUNCTIONS} \
            -e E2E_COVERAGE_MIN_BRANCHES=${E2E_COVERAGE_MIN_BRANCHES} \
            -v "$PWD:/work" \
            -w /work \
            mcr.microsoft.com/playwright:v1.58.2-jammy \
            bash -lc '
              set -e
              if [ "${RUN_COVERAGE}" = "true" ]; then
                set +e
                PLAYWRIGHT_JUNIT_OUTPUT_NAME=test-results/playwright-junit.xml \
                npx playwright test --project=chromium --reporter=line,junit,html
                PW_EXIT=$?
                set -e
                node scripts/merge-e2e-coverage.js
                exit $PW_EXIT
              else
                PLAYWRIGHT_JUNIT_OUTPUT_NAME=test-results/playwright-junit.xml \
                npx playwright test --project=chromium --reporter=line,junit,html
              fi
            '
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true
      archiveArtifacts artifacts: 'coverage-report/e2e-merged/**', allowEmptyArchive: true
      junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
    }
  }
}
```

## 4. docker-compose (Jenkins + DinD) Template

```yaml
services:
  dind:
    image: docker:29.0-dind
    container_name: project-dind
    privileged: true
    environment:
      DOCKER_TLS_CERTDIR: ""
    command: ["--host=tcp://0.0.0.0:2375"]
    volumes:
      - dind_data:/var/lib/docker

  jenkins:
    image: jenkins/jenkins:lts-jdk17
    container_name: project-jenkins
    ports:
      - "8081:8081"
      - "50000:50000"
    environment:
      JENKINS_OPTS: "--httpPort=8081"
      DOCKER_HOST: tcp://dind:2375
    depends_on:
      - dind
    volumes:
      - jenkins_home:/var/jenkins_home

volumes:
  jenkins_home:
  dind_data:
```

## 5. Migration Checklist

- [ ] Add policy doc: tests must run through Jenkins.
- [ ] Add pipeline parameters (`RUN_PLAYWRIGHT`, `RUN_COVERAGE`).
- [ ] Add `disableConcurrentBuilds()`.
- [ ] Move E2E execution to `docker run` stage.
- [ ] Add image prewarm (`docker pull`).
- [ ] Ensure coverage merge/check runs in `RUN_COVERAGE=true` mode.
- [ ] Archive JUnit, HTML report, and coverage artifacts.
- [ ] Verify Jenkins has Docker CLI and reachable daemon.

## 6. Common Pitfalls and Fixes

- Port conflict (`localhost:8080 already used`)
  - Cause: host/shared process model.
  - Fix: run E2E fully inside container and disable concurrent builds.

- `docker: command not found` in Jenkins
  - Cause: Jenkins image missing Docker CLI.
  - Fix: install `docker-cli` in Jenkins image/container.

- Coverage not produced when tests fail
  - Cause: script exits before merge step.
  - Fix: capture test exit code, run merge, then exit with original code.

- First run very slow
  - Cause: large Playwright image pull.
  - Fix: prewarm stage and keep DinD image cache volume.

## 7. Verification Commands (Jenkins API)

- Trigger build with E2E:
  - `buildWithParameters?RUN_PLAYWRIGHT=true&RUN_COVERAGE=false`
- Trigger build with coverage:
  - `buildWithParameters?RUN_PLAYWRIGHT=true&RUN_COVERAGE=true`
- Confirm log markers:
  - `docker run --rm`
  - `mcr.microsoft.com/playwright:v1.58.2-jammy`
  - no `http://localhost:8080 is already used`

## 8. Rollout Recommendation

- Phase 1: Keep old and new path, run new path in parallel for 2-3 builds.
- Phase 2: Make Jenkins path mandatory in docs and reviews.
- Phase 3: Remove old local CI shortcuts that bypass Jenkins.
