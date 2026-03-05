pipeline {
  agent any

  options {
    timeout(time: 120, unit: 'MINUTES')
  }

  parameters {
    booleanParam(name: 'RUN_PLAYWRIGHT', defaultValue: false, description: 'Run Playwright e2e suite in Jenkins')
    booleanParam(name: 'RUN_COVERAGE', defaultValue: false, description: 'Run Playwright e2e coverage check in Jenkins')
  }

  environment {
    CI = 'true'
    PATH = "/var/jenkins_home/.cargo/bin:${env.PATH}"
    PLAYWRIGHT_IMAGE_PRIMARY = 'mcr.microsoft.com/playwright:v1.58.2-jammy'
    PLAYWRIGHT_IMAGE_MIRROR = 'mcr.azure.cn/playwright:v1.58.2-jammy'
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

    stage('Install JS Dependencies') {
      steps {
        sh '''
          if ! command -v node >/dev/null 2>&1; then
            mkdir -p "$HOME/.local"
            curl -fsSL https://nodejs.org/dist/v20.19.5/node-v20.19.5-linux-x64.tar.gz -o /tmp/node.tar.gz
            tar -xzf /tmp/node.tar.gz -C "$HOME/.local"
            mv "$HOME/.local/node-v20.19.5-linux-x64" "$HOME/.local/node"
          fi
          export PATH="$HOME/.local/node/bin:$PATH"
          node --version
          npm --version
          npm ci
        '''
      }
    }

    stage('Lint') {
      steps {
        sh '''
          export PATH="$HOME/.local/node/bin:$PATH"
          npm run lint
        '''
      }
    }

    stage('Setup Rust Toolchain') {
      steps {
        sh '''
          if ! command -v cargo >/dev/null 2>&1; then
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
          fi
          export PATH="$HOME/.cargo/bin:$PATH"
          cargo --version
          if ! command -v wasm-pack >/dev/null 2>&1; then
            curl -sSf https://rustwasm.github.io/wasm-pack/installer/init.sh | sh
          fi
          wasm-pack --version
        '''
      }
    }

    stage('Rust Check') {
      steps {
        sh '''
          export PATH="$HOME/.cargo/bin:$PATH"
          cargo check
        '''
      }
    }

    stage('Rust Tests') {
      steps {
        sh '''
          export PATH="$HOME/.cargo/bin:$PATH"
          cargo test
        '''
      }
    }

    stage('Build WASM') {
      steps {
        sh '''
          export PATH="$HOME/.cargo/bin:$PATH"
          wasm-pack build --target web --out-dir pkg --release
        '''
      }
    }

    stage('Prewarm Playwright Image') {
      when {
        expression { return params.RUN_PLAYWRIGHT || params.RUN_COVERAGE }
      }
      options {
        timeout(time: 15, unit: 'MINUTES')
      }
      steps {
        sh '''
          PLAYWRIGHT_IMAGE="$PLAYWRIGHT_IMAGE_PRIMARY"
          MIRROR_IMAGE="$PLAYWRIGHT_IMAGE_MIRROR"

          if docker image inspect "$PLAYWRIGHT_IMAGE" >/dev/null 2>&1; then
            echo "Playwright image already present: $PLAYWRIGHT_IMAGE"
          else
            pulled=0
            if [ -n "$MIRROR_IMAGE" ]; then
              echo "Trying mirror first: $MIRROR_IMAGE"
              if timeout 300 docker pull "$MIRROR_IMAGE"; then
                docker tag "$MIRROR_IMAGE" "$PLAYWRIGHT_IMAGE"
                pulled=1
                echo "Mirror pull succeeded and tagged as: $PLAYWRIGHT_IMAGE"
              else
                echo "Mirror pull failed or timed out, falling back to primary registry"
              fi
            fi

            if [ "$pulled" -ne 1 ]; then
              echo "Pulling primary image with timeout: $PLAYWRIGHT_IMAGE"
              timeout 900 docker pull "$PLAYWRIGHT_IMAGE"
            fi
          fi
        '''
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
            --pull=never \
            -e CI=true \
            -e RUN_COVERAGE=${RUN_COVERAGE} \
            -e PW_TEST_PORT=8080 \
            -e E2E_COVERAGE_MIN_LINES=${E2E_COVERAGE_MIN_LINES} \
            -e E2E_COVERAGE_MIN_STATEMENTS=${E2E_COVERAGE_MIN_STATEMENTS} \
            -e E2E_COVERAGE_MIN_FUNCTIONS=${E2E_COVERAGE_MIN_FUNCTIONS} \
            -e E2E_COVERAGE_MIN_BRANCHES=${E2E_COVERAGE_MIN_BRANCHES} \
            -v "$PWD:/work" \
            -w /work \
            "$PLAYWRIGHT_IMAGE_PRIMARY" \
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
      archiveArtifacts artifacts: 'pkg/**', allowEmptyArchive: true
      archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true
      archiveArtifacts artifacts: 'coverage-report/e2e-merged/**', allowEmptyArchive: true
      junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
      cleanWs()
    }
  }
}
