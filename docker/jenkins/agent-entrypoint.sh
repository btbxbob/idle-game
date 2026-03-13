#!/usr/bin/env bash
set -euo pipefail

JENKINS_URL="${JENKINS_URL:-http://jenkins:8081}"
JENKINS_ADMIN_ID="${JENKINS_ADMIN_ID:-admin}"
JENKINS_ADMIN_PASSWORD="${JENKINS_ADMIN_PASSWORD:-admin123}"
JENKINS_AGENT_NAME="${JENKINS_AGENT_NAME:-idle-game-build-agent}"
JENKINS_AGENT_WORKDIR="${JENKINS_AGENT_WORKDIR:-/home/jenkins/agent}"
COOKIE_JAR="$(mktemp)"

cleanup() {
  rm -f "${COOKIE_JAR}"
}

trap cleanup EXIT

mkdir -p "${JENKINS_AGENT_WORKDIR}"

get_crumb() {
  curl -fsS --user "${JENKINS_ADMIN_ID}:${JENKINS_ADMIN_PASSWORD}" \
    -b "${COOKIE_JAR}" \
    -c "${COOKIE_JAR}" \
    "${JENKINS_URL}/crumbIssuer/api/json"
}

get_secret() {
  local crumb_json crumb_field crumb_value script secret
  crumb_json="$(get_crumb)"
  crumb_field="$(python3 -c 'import json,sys; data=json.load(sys.stdin); print(data["crumbRequestField"])' <<<"${crumb_json}")"
  crumb_value="$(python3 -c 'import json,sys; data=json.load(sys.stdin); print(data["crumb"])' <<<"${crumb_json}")"
  script="def computer = jenkins.model.Jenkins.instance.getComputer('${JENKINS_AGENT_NAME}'); if (computer == null) { print(''); } else { print(computer.getJnlpMac()); }"
  secret="$(curl -fsS --user "${JENKINS_ADMIN_ID}:${JENKINS_ADMIN_PASSWORD}" \
    -b "${COOKIE_JAR}" \
    -c "${COOKIE_JAR}" \
    -H "${crumb_field}: ${crumb_value}" \
    --data-urlencode "script=${script}" \
    "${JENKINS_URL}/scriptText")"
  printf '%s' "${secret}"
}

for _ in $(seq 1 120); do
  if curl -fsS "${JENKINS_URL}/login" >/dev/null 2>&1; then
    secret="$(get_secret || true)"
    if [[ -n "${secret}" ]]; then
      export JENKINS_SECRET="${secret}"
      export JENKINS_WEB_SOCKET=true
      exec /usr/local/bin/jenkins-agent
    fi
  fi
  sleep 5
done

echo "Failed to obtain Jenkins agent secret for ${JENKINS_AGENT_NAME}" >&2
exit 1
