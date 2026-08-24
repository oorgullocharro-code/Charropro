#!/usr/bin/env bash

set -euo pipefail

HOSTINGER_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOSTINGER_REPO_ROOT="$(cd "${HOSTINGER_SCRIPT_DIR}/../.." && pwd)"

die() {
  printf 'ERROR=%s\n' "$1" >&2
  exit "${2:-1}"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required-command-missing:$1"
}

sha256_file() {
  shasum -a 256 "$1" | awk '{print $1}'
}

mask_value() {
  local value="$1"
  if ((${#value} <= 4)); then
    printf '****'
  else
    printf '%s***%s' "${value:0:2}" "${value: -2}"
  fi
}

load_hostinger_environment() {
  local env_file="${HOSTINGER_ENV_FILE:-${HOSTINGER_SCRIPT_DIR}/hostinger-deploy.env}"
  if [[ -f "$env_file" && ( -z "${HOSTINGER_HOST:-}" || -z "${HOSTINGER_PORT:-}" || -z "${HOSTINGER_USER:-}" || -z "${HOSTINGER_REMOTE_DIR:-}" || -z "${HOSTINGER_KEY:-}" ) ]]; then
    # shellcheck disable=SC1090
    source "$env_file"
  fi

  : "${HOSTINGER_HOST:?HOSTINGER_HOST is required}"
  : "${HOSTINGER_PORT:?HOSTINGER_PORT is required}"
  : "${HOSTINGER_USER:?HOSTINGER_USER is required}"
  : "${HOSTINGER_REMOTE_DIR:?HOSTINGER_REMOTE_DIR is required}"
  : "${HOSTINGER_KEY:?HOSTINGER_KEY is required}"

  [[ "$HOSTINGER_HOST" =~ ^[A-Za-z0-9.-]+$ ]] || die "hostinger-host-invalid"
  [[ "$HOSTINGER_PORT" =~ ^[0-9]{1,5}$ ]] || die "hostinger-port-invalid"
  ((HOSTINGER_PORT >= 1 && HOSTINGER_PORT <= 65535)) || die "hostinger-port-invalid"
  [[ "$HOSTINGER_USER" =~ ^[A-Za-z0-9._-]+$ ]] || die "hostinger-user-invalid"
  [[ "$HOSTINGER_REMOTE_DIR" == /*/public_html/charropro ]] || die "hostinger-remote-dir-invalid"
  [[ -f "$HOSTINGER_KEY" ]] || die "hostinger-key-not-found"

  HOSTINGER_TARGET="${HOSTINGER_USER}@${HOSTINGER_HOST}"
  HOSTINGER_KNOWN_HOSTS="${HOSTINGER_KNOWN_HOSTS:-${HOME}/.ssh/known_hosts}"
  HOSTINGER_SSH_ARGS=(
    -i "$HOSTINGER_KEY"
    -o IdentitiesOnly=yes
    -o BatchMode=yes
    -o ConnectTimeout=15
    -o StrictHostKeyChecking=yes
    -o UserKnownHostsFile="$HOSTINGER_KNOWN_HOSTS"
    -p "$HOSTINGER_PORT"
  )
  HOSTINGER_SCP_ARGS=(
    -i "$HOSTINGER_KEY"
    -o IdentitiesOnly=yes
    -o BatchMode=yes
    -o ConnectTimeout=15
    -o StrictHostKeyChecking=yes
    -o UserKnownHostsFile="$HOSTINGER_KNOWN_HOSTS"
    -P "$HOSTINGER_PORT"
  )
}

package_short_sha() {
  local name
  name="$(basename "$1")"
  [[ "$name" =~ -([0-9a-f]{7,40})\.zip$ ]] || die "package-commit-sha-missing"
  printf '%s' "${BASH_REMATCH[1]}"
}

assert_safe_backup_path() {
  local backup="$1"
  local expected_parent
  expected_parent="$(dirname "$HOSTINGER_REMOTE_DIR")"
  case "$backup" in
    "${expected_parent}"/charropro-backup-*.zip) ;;
    *) die "remote-backup-path-invalid" ;;
  esac
}

print_connection_summary() {
  printf 'REMOTE_HOST=%s\n' "$(mask_value "$HOSTINGER_HOST")"
  printf 'REMOTE_PORT=%s\n' "$HOSTINGER_PORT"
  printf 'REMOTE_USER=%s\n' "$(mask_value "$HOSTINGER_USER")"
  printf 'REMOTE_DIR=%s\n' "$HOSTINGER_REMOTE_DIR"
}
