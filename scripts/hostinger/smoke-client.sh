#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

base_url="https://orgullocharro.com/charropro"
expected_build=""
expected_checksum=""

while (($#)); do
  case "$1" in
    --base-url) base_url="${2:-}"; shift 2 ;;
    --expected-build) expected_build="${2:-}"; shift 2 ;;
    --expected-checksum) expected_checksum="${2:-}"; shift 2 ;;
    *) die "unknown-argument:$1" ;;
  esac
done

[[ "$base_url" =~ ^https://[A-Za-z0-9.-]+/[A-Za-z0-9._/-]+$ ]] || die "smoke-base-url-invalid"
[[ -n "$expected_build" ]] || die "smoke-expected-build-required"
[[ "$expected_checksum" =~ ^[a-f0-9]{64}$ ]] || die "smoke-expected-checksum-invalid"
require_command curl
require_command node

base_url="${base_url%/}"
cache_key="hostinger-terminal-deploy-$(date -u +%Y%m%dT%H%M%SZ)"
configuration="$(curl -fsS -H 'Cache-Control: no-cache' "${base_url}/functions/configuration.defaults.json?deploy=${cache_key}")"
read -r http_build http_checksum < <(
  printf '%s' "$configuration" |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const c=JSON.parse(s);console.log(`${c?.values?.system?.appVersion||""} ${c?.checksum||""}`)})'
)
[[ "$http_build" == "$expected_build" ]] || die "smoke-http-build-mismatch"
[[ "$http_checksum" == "$expected_checksum" ]] || die "smoke-http-checksum-mismatch"

pages=(
  'index.html:INDEX_HTTP'
  'formato-federacion.html:FORMATO_FEDERACION_HTTP'
  'torneo-publico.html:PORTAL_HTTP'
  'broadcast-studio.html:BROADCAST_HTTP'
  'cronometro.html:CRONOMETRO_HTTP'
)

for item in "${pages[@]}"; do
  page="${item%%:*}"
  label="${item##*:}"
  body="$(curl -fsS -H 'Cache-Control: no-cache' "${base_url}/${page}?deploy=${cache_key}")"
  printf '%s' "$body" | grep -Fq 'src="./js/core/clientBootstrap.js"' || die "smoke-bootstrap-missing:${page}"
  if printf '%s' "$body" | grep -Fq '?v='; then die "smoke-historical-query-found:${page}"; fi
  printf '%s=PASS\n' "$label"
done

printf 'CONFIG_HTTP=PASS\n'
printf 'HTTP_BUILD=%s\n' "$http_build"
printf 'HTTP_CHECKSUM=%s\n' "$http_checksum"
printf 'HEADLESS_SMOKE=NOT_AVAILABLE\n'
printf 'SMOKE=PASS\n'
