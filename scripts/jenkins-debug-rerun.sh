#!/usr/bin/env bash
set -euo pipefail

JENKINS_URL="${JENKINS_URL:-http://localhost:8081}"
JENKINS_USER="${JENKINS_USER:-admin}"
JENKINS_TOKEN="${JENKINS_TOKEN:-admin123}"
JOB_NAME="${JOB_NAME:-idle-game-ci}"
RUN_PLAYWRIGHT="${RUN_PLAYWRIGHT:-true}"
RUN_COVERAGE="${RUN_COVERAGE:-true}"
POLL_SECONDS="${POLL_SECONDS:-20}"
QUEUE_WAIT_MAX="${QUEUE_WAIT_MAX:-120}"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: scripts/jenkins-debug-rerun.sh

Environment overrides:
  JENKINS_URL       Jenkins base URL (default: http://localhost:8081)
  JENKINS_USER      Jenkins username (default: admin)
  JENKINS_TOKEN     Jenkins password/token (default: admin123)
  JOB_NAME          Jenkins job full name (default: idle-game-ci)
  RUN_PLAYWRIGHT    true/false (default: true)
  RUN_COVERAGE      true/false (default: true)
  POLL_SECONDS      Build polling interval in seconds (default: 20)
  QUEUE_WAIT_MAX    Queue executable wait attempts (default: 120)
EOF
  exit 0
fi

COOKIE_JAR="$(mktemp)"
cleanup() {
  rm -f "${COOKIE_JAR}"
}
trap cleanup EXIT

auth_curl() {
  curl -g -sS -u "${JENKINS_USER}:${JENKINS_TOKEN}" -b "${COOKIE_JAR}" -c "${COOKIE_JAR}" "$@"
}

echo "[1/5] Getting Jenkins crumb"
CRUMB_JSON="$(auth_curl "${JENKINS_URL}/crumbIssuer/api/json")"
CRUMB_FIELD="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["crumbRequestField"])' <<<"${CRUMB_JSON}")"
CRUMB_VALUE="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["crumb"])' <<<"${CRUMB_JSON}")"

echo "[2/5] Triggering ${JOB_NAME} with RUN_PLAYWRIGHT=${RUN_PLAYWRIGHT}, RUN_COVERAGE=${RUN_COVERAGE}"
RESP_HEADERS="$(auth_curl -D - -o /dev/null -H "${CRUMB_FIELD}: ${CRUMB_VALUE}" -X POST "${JENKINS_URL}/job/${JOB_NAME}/buildWithParameters?RUN_PLAYWRIGHT=${RUN_PLAYWRIGHT}&RUN_COVERAGE=${RUN_COVERAGE}")"
QUEUE_URL="$(python3 -c 'import sys; lines=sys.stdin.read().splitlines(); m=[l for l in lines if l.lower().startswith("location:")]; print(m[0].split(":",1)[1].strip() if m else "")' <<<"${RESP_HEADERS}")"
if [[ -z "${QUEUE_URL}" ]]; then
  echo "ERROR: Failed to get queue URL from Jenkins response"
  exit 1
fi
QUEUE_ID="${QUEUE_URL%/}"
QUEUE_ID="${QUEUE_ID##*/}"
echo "Queue item: ${QUEUE_ID}"

echo "[3/5] Waiting for build number"
BUILD_NUMBER=""
for ((i=1; i<=QUEUE_WAIT_MAX; i++)); do
  QUEUE_JSON="$(auth_curl "${JENKINS_URL}/queue/item/${QUEUE_ID}/api/json")"
  BUILD_NUMBER="$(python3 -c 'import json,sys; d=json.load(sys.stdin); e=d.get("executable") or {}; print(e.get("number") or "")' <<<"${QUEUE_JSON}")"
  if [[ -n "${BUILD_NUMBER}" ]]; then
    break
  fi
  CANCELLED="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(str(bool(d.get("cancelled"))).lower())' <<<"${QUEUE_JSON}")"
  if [[ "${CANCELLED}" == "true" ]]; then
    echo "ERROR: Queue item was cancelled"
    exit 1
  fi
  sleep 2
done

if [[ -z "${BUILD_NUMBER}" ]]; then
  echo "ERROR: Build number was not assigned in time"
  exit 1
fi
echo "Build number: ${BUILD_NUMBER}"

echo "[4/5] Polling build status"
while true; do
  BUILD_JSON="$(auth_curl "${JENKINS_URL}/job/${JOB_NAME}/${BUILD_NUMBER}/api/json?tree=number,building,result,duration")"
  BUILDING="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(str(bool(d.get("building"))).lower())' <<<"${BUILD_JSON}")"
  if [[ "${BUILDING}" == "false" ]]; then
    RESULT="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("result") or "UNKNOWN")' <<<"${BUILD_JSON}")"
    DURATION_MS="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(int(d.get("duration") or 0))' <<<"${BUILD_JSON}")"
    echo "Build finished: result=${RESULT}, duration_ms=${DURATION_MS}"
    break
  fi
  sleep "${POLL_SECONDS}"
done

echo "[5/5] Collecting test and coverage summary"
TEST_JSON="$(auth_curl "${JENKINS_URL}/job/${JOB_NAME}/${BUILD_NUMBER}/testReport/api/json?tree=failCount,skipCount,totalCount")"
echo "Tests: $(python3 -c 'import json,sys; d=json.load(sys.stdin); print(f"total={d.get("totalCount")}, fail={d.get("failCount")}, skip={d.get("skipCount")}")' <<<"${TEST_JSON}")"

FAIL_CASES_JSON="$(auth_curl "${JENKINS_URL}/job/${JOB_NAME}/${BUILD_NUMBER}/testReport/api/json?tree=suites[cases[className,name,status,errorDetails]]")"
FAIL_CASES_JSON_PAYLOAD="${FAIL_CASES_JSON}" python3 - <<'PY'
import json
import os

d = json.loads(os.environ["FAIL_CASES_JSON_PAYLOAD"])
failed = []
for s in d.get("suites", []):
    for c in s.get("cases", []):
        if c.get("status") == "FAILED":
            failed.append(c)
if not failed:
    print("Failed cases: none")
else:
    print("Failed cases:")
    for c in failed:
        detail = (c.get("errorDetails") or "").splitlines()[0]
        print(f"- {c.get('className')} :: {c.get('name')} :: {detail}")
PY

COVERAGE_JSON="$(auth_curl "${JENKINS_URL}/job/${JOB_NAME}/${BUILD_NUMBER}/artifact/coverage-report/e2e-merged/coverage-summary.json" || true)"
if [[ -n "${COVERAGE_JSON}" ]]; then
  COVERAGE_JSON_PAYLOAD="${COVERAGE_JSON}" python3 - <<'PY'
import json
import os

d = json.loads(os.environ["COVERAGE_JSON_PAYLOAD"])
t = d["total"]
print("Coverage:")
print(f"- lines: {t['lines']['pct']}%")
print(f"- statements: {t['statements']['pct']}%")
print(f"- functions: {t['functions']['pct']}%")
print(f"- branches: {t['branches']['pct']}%")
PY
else
  echo "Coverage: unavailable (coverage-summary.json not found)"
fi

if [[ "${RESULT}" != "SUCCESS" ]]; then
  exit 2
fi
