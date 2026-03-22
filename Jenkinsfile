pipeline {
  agent { label 'idle-game-build-agent' }

  options {
    timeout(time: 120, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '3'))
  }

  parameters {
    booleanParam(name: 'RUN_PLAYWRIGHT', defaultValue: false, description: 'Run Playwright e2e suite in Jenkins')
    booleanParam(name: 'RUN_COVERAGE', defaultValue: false, description: 'Run Playwright e2e coverage check in Jenkins')
    booleanParam(name: 'PW_PARALLEL_CONTAINERS', defaultValue: false, description: 'Run functional tests in 2 parallel containers')
    booleanParam(name: 'RUN_REGRESSION_TESTS', defaultValue: false, description: 'Include regression tests (only when not using parallel containers)')
    string(name: 'PW_TEST_WORKERS', defaultValue: '4', description: 'Playwright worker count for single-container runs (positive integer)')
  }

  environment {
    CI = 'true'
    PATH = "/home/jenkins/agent/.cargo/bin:${env.PATH}"
    NPM_CONFIG_CACHE = '/home/jenkins/agent/.cache/npm'
    CARGO_HOME = '/home/jenkins/agent/.cargo'
    RUSTUP_HOME = '/home/jenkins/agent/.rustup'
    CARGO_TARGET_DIR = '/home/jenkins/agent/.cache/cargo-target/idle-game'
    PLAYWRIGHT_IMAGE_PRIMARY = 'mcr.microsoft.com/playwright:v1.58.2-jammy'
    PLAYWRIGHT_IMAGE_MIRROR = 'mcr.azure.cn/playwright:v1.58.2-jammy'
    PLAYWRIGHT_PULL_TIMEOUT_SECONDS = '30'
    PW_TEST_WORKERS = '4'
    PW_TEST_RETRIES = '1'
    E2E_COVERAGE_MIN_LINES = '20'
    E2E_COVERAGE_MIN_STATEMENTS = '20'
    E2E_COVERAGE_MIN_FUNCTIONS = '15'
    E2E_COVERAGE_MIN_BRANCHES = '10'
  }

  stages {
    stage('Checkout') {
      steps {
        sh '''
          cat > .jenkins-sync-excludes <<'EOF'
.git/
node_modules/
target/
pkg/
playwright-report/
test-results/
coverage-report/
.sisyphus/
__pycache__/
*.log
EOF

          if command -v rsync >/dev/null 2>&1; then
            rsync -a --delete --delete-excluded --exclude-from=.jenkins-sync-excludes /workspace/idle-game/ ./
          else
            find . -mindepth 1 -maxdepth 1 ! -name '.jenkins-sync-excludes' -exec rm -rf {} +
            tar -C /workspace/idle-game --exclude-from=.jenkins-sync-excludes -cf - . | tar -xf -
          fi

          rm -f .jenkins-sync-excludes
        '''
      }
    }

    stage('Install JS Dependencies') {
      steps {
        sh '''
          mkdir -p "$NPM_CONFIG_CACHE" "$CARGO_HOME" "$RUSTUP_HOME" "$CARGO_TARGET_DIR"
          NODE_VERSION='v20.19.5'
          NODE_DIR="$HOME/.local/node"
          NODE_BIN="$NODE_DIR/bin/node"
          mkdir -p "$HOME/.local"
          if [ ! -x "$NODE_BIN" ] || [ "$("$NODE_BIN" --version 2>/dev/null || true)" != "$NODE_VERSION" ]; then
            rm -rf "$NODE_DIR" "$HOME/.local/node-${NODE_VERSION}-linux-x64"
            curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz" -o /tmp/node.tar.gz
            tar -xzf /tmp/node.tar.gz -C "$HOME/.local"
            mv "$HOME/.local/node-${NODE_VERSION}-linux-x64" "$NODE_DIR"
          fi
          export PATH="$NODE_DIR/bin:$PATH"
          node --version
          npm --version
          npm ci --cache "$NPM_CONFIG_CACHE" --prefer-offline
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
          export PATH="$CARGO_HOME/bin:$HOME/.cargo/bin:$PATH"
          mkdir -p "$CARGO_TARGET_DIR"
          if ! command -v rustup >/dev/null 2>&1; then
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
          fi
          rustup default stable
          cargo --version
          if ! command -v wasm-pack >/dev/null 2>&1; then
            curl -sSf https://rustwasm.github.io/wasm-pack/installer/init.sh | sh
          fi
          WASM_BINDGEN_VERSION=$(grep -A 1 '^name = "wasm-bindgen"$' Cargo.lock | grep '^version = ' | head -n 1 | cut -d'"' -f2)
          if [ -z "$WASM_BINDGEN_VERSION" ]; then
            echo "Could not determine wasm-bindgen version from Cargo.lock"
            exit 1
          fi
          INSTALLED_WASM_BINDGEN_VERSION=""
          if command -v wasm-bindgen >/dev/null 2>&1; then
            INSTALLED_WASM_BINDGEN_VERSION=$(wasm-bindgen --version | awk '{print $2}')
          fi
          if [ "$INSTALLED_WASM_BINDGEN_VERSION" != "$WASM_BINDGEN_VERSION" ]; then
            cargo install wasm-bindgen-cli --version "$WASM_BINDGEN_VERSION" --locked
          fi
          wasm-pack --version
          wasm-bindgen --version
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
          wasm-pack build --target web --out-dir pkg --release --mode no-install
          python3 scripts/version-wasm-assets.py
        '''
      }
    }

    stage('Verify Playwright Image') {
      when {
        expression { return params.RUN_PLAYWRIGHT || params.RUN_COVERAGE }
      }
      options {
        timeout(time: 2, unit: 'MINUTES')
      }
      steps {
        sh '''
          PLAYWRIGHT_IMAGE="$PLAYWRIGHT_IMAGE_PRIMARY"
          MIRROR_IMAGE="$PLAYWRIGHT_IMAGE_MIRROR"

          if timeout "$PLAYWRIGHT_PULL_TIMEOUT_SECONDS" docker image inspect "$PLAYWRIGHT_IMAGE" >/dev/null 2>&1; then
            echo "Playwright image already present: $PLAYWRIGHT_IMAGE"
          elif [ -n "$MIRROR_IMAGE" ] && timeout "$PLAYWRIGHT_PULL_TIMEOUT_SECONDS" docker image inspect "$MIRROR_IMAGE" >/dev/null 2>&1; then
            echo "Using locally cached mirror image: $MIRROR_IMAGE"
            docker tag "$MIRROR_IMAGE" "$PLAYWRIGHT_IMAGE"
          else
            echo "Playwright image is not available in the Jenkins DinD cache."
            echo "Expected one of: $PLAYWRIGHT_IMAGE or $PLAYWRIGHT_IMAGE_MIRROR"
            echo "Preload the image into the DinD daemon before running Jenkins Playwright stages."
            exit 1
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
        script {
          def singleContainerWorkers = params.PW_TEST_WORKERS?.trim() ?: '2'
          if (!(singleContainerWorkers ==~ /[1-9]\d*/)) {
            error("PW_TEST_WORKERS must be a positive integer, got: ${params.PW_TEST_WORKERS}")
          }

          if (params.PW_PARALLEL_CONTAINERS) {
            // Multi-container parallel mode: split functional tests into 2 containers (alphabetically)
            // Regression tests run separately if requested
            def testSuites = [
              [name: 'functional-1', testDir: 'tests/functional', grep: '^[a-l]', workers: 2],
              [name: 'functional-2', testDir: 'tests/functional', grep: '^[m-z]', workers: 2]
            ]
            def runRegression = params.RUN_REGRESSION_TESTS != null ? params.RUN_REGRESSION_TESTS : false

            def parallelStages = [:]
            for (suite in testSuites) {
              def s = suite
              parallelStages[s.name] = {
                stage("Playwright ${s.name}") {
                  sh """
                    mkdir -p test-results
                    docker run --rm \
                      --pull=never \
                      --ipc=host \
                      --shm-size=1g \
                      -e CI=true \
                      -e RUN_COVERAGE=${RUN_COVERAGE} \
                      -e PW_TEST_PORT=8080 \
                      -e PW_TEST_WORKERS=${s.workers} \
                      -e PW_TEST_RETRIES=${PW_TEST_RETRIES} \
                      -e E2E_COVERAGE_MIN_LINES=${E2E_COVERAGE_MIN_LINES} \
                      -e E2E_COVERAGE_MIN_STATEMENTS=${E2E_COVERAGE_MIN_STATEMENTS} \
                      -e E2E_COVERAGE_MIN_FUNCTIONS=${E2E_COVERAGE_MIN_FUNCTIONS} \
                      -e E2E_COVERAGE_MIN_BRANCHES=${E2E_COVERAGE_MIN_BRANCHES} \
                      -v "${env.WORKSPACE}:/work" \
                      -w /work \
                      "$PLAYWRIGHT_IMAGE_PRIMARY" \
                      bash -lc '
                        set -e

                        # Start webServer in background (container-internal)
                        python3 server.py --quiet --port 8080 &
                        WEBSERVER_PID=\$!
                        sleep 3

                        set +e
                        if [ "${RUN_COVERAGE}" = "true" ]; then
                          PLAYWRIGHT_JUNIT_OUTPUT_NAME=test-results/playwright-junit-${s.name}.xml \
                          ./node_modules/.bin/playwright test ${s.testDir} --project=chromium --grep "${s.grep}" --reporter=line,junit
                          PW_EXIT=\$?
                        else
                          PLAYWRIGHT_JUNIT_OUTPUT_NAME=test-results/playwright-junit-${s.name}.xml \
                          ./node_modules/.bin/playwright test ${s.testDir} --project=chromium --grep "${s.grep}" --reporter=line,junit
                          PW_EXIT=\$?
                        fi
                        set -e

                        # Rename coverage files to avoid collision
                        if [ -d coverage-report/raw ]; then
                          for f in coverage-report/raw/*.json; do
                            [ -f "\$f" ] && mv "\$f" "\${f%.json}-${s.name}.json"
                          done
                        fi

                        # Cleanup
                        kill \$WEBSERVER_PID 2>/dev/null || true

                        exit \$PW_EXIT
                      '
                  """
                }
              }
            }
            parallel parallelStages

            // Merge coverage from all containers
            if (params.RUN_COVERAGE) {
              sh '''
                # Collect all coverage files into raw directory
                mkdir -p coverage-report/raw
                cp coverage-report/raw/*-functional.json coverage-report/raw/ 2>/dev/null || true
                cp coverage-report/raw/*-regression.json coverage-report/raw/ 2>/dev/null || true

                # Merge and check coverage
                node scripts/merge-e2e-coverage.js
              '''
            }

            // Ensure JUnit files exist for Jenkins
            sh '''
              ls -la test-results/playwright-junit-*.xml || true
            '''
          } else {
            // Original single-container mode: functional tests + optional regression
            def testDirs = params.RUN_REGRESSION_TESTS ? "tests/functional tests/regression" : "tests/functional"

            sh """
              mkdir -p test-results
              docker run --rm \
                --pull=never \
                --ipc=host \
                --shm-size=1g \
                -e CI=true \
                -e RUN_COVERAGE=${RUN_COVERAGE} \
                -e PW_TEST_PORT=8080 \
                -e PW_TEST_WORKERS=${singleContainerWorkers} \
                -e PW_TEST_RETRIES=${PW_TEST_RETRIES} \
                -e E2E_COVERAGE_MIN_LINES=${E2E_COVERAGE_MIN_LINES} \
                -e E2E_COVERAGE_MIN_STATEMENTS=${E2E_COVERAGE_MIN_STATEMENTS} \
                -e E2E_COVERAGE_MIN_FUNCTIONS=${E2E_COVERAGE_MIN_FUNCTIONS} \
                -e E2E_COVERAGE_MIN_BRANCHES=${E2E_COVERAGE_MIN_BRANCHES} \
                -v "${env.WORKSPACE}:/work" \
                -w /work \
                "$PLAYWRIGHT_IMAGE_PRIMARY" \
                bash -lc '
                  set -e
                  if [ "${RUN_COVERAGE}" = "true" ]; then
                    rm -rf coverage-report/raw coverage-report/e2e-merged
                    set +e
                    PLAYWRIGHT_JUNIT_OUTPUT_NAME=test-results/playwright-junit.xml \
                    ./node_modules/.bin/playwright test ${testDirs} --project=chromium --reporter=line,junit
                    PW_EXIT=\$?
                    set -e
                    node scripts/merge-e2e-coverage.js
                    exit \$PW_EXIT
                  else
                    PLAYWRIGHT_JUNIT_OUTPUT_NAME=test-results/playwright-junit.xml \
                    ./node_modules/.bin/playwright test ${testDirs} --project=chromium --reporter=line,junit
                  fi
                '
            """
          }
        }
      }
    }

  }

  post {
    always {
      archiveArtifacts artifacts: 'pkg/**', allowEmptyArchive: true
      script {
        if (fileExists('playwright-report') || fileExists('test-results')) {
          archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true
        }

        if (fileExists('coverage-report/e2e-merged')) {
          archiveArtifacts artifacts: 'coverage-report/e2e-merged/**', allowEmptyArchive: true
        }

        if (fileExists('test-results')) {
          junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
        }
      }
      cleanWs()
    }
  }
}
