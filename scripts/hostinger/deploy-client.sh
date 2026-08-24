#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

package=""
expected_build=""
expected_sha256=""
expected_checksum=""
dry_run=false
smoke_test=true

while (($#)); do
  case "$1" in
    --package) package="${2:-}"; shift 2 ;;
    --expected-build) expected_build="${2:-}"; shift 2 ;;
    --expected-sha256) expected_sha256="${2:-}"; shift 2 ;;
    --expected-checksum) expected_checksum="${2:-}"; shift 2 ;;
    --dry-run) dry_run=true; shift ;;
    --no-smoke-test) smoke_test=false; shift ;;
    *) die "unknown-argument:$1" ;;
  esac
done

load_hostinger_environment
verify_args=(
  --package "$package"
  --expected-build "$expected_build"
  --expected-sha256 "$expected_sha256"
)
if [[ -n "$expected_checksum" ]]; then
  verify_args+=(--expected-checksum "$expected_checksum")
fi
verify_output="$("${SCRIPT_DIR}/verify-package.sh" "${verify_args[@]}")"
printf '%s\n' "$verify_output"

package_checksum="$(printf '%s\n' "$verify_output" | awk -F= '$1=="PACKAGE_CHECKSUM"{print $2}')"
package_files="$(printf '%s\n' "$verify_output" | awk -F= '$1=="PACKAGE_FILES"{print $2}')"
short_sha="$(printf '%s\n' "$verify_output" | awk -F= '$1=="PACKAGE_SHORT_SHA"{print $2}')"
timestamp="$(date -u +%Y%m%d-%H%M%S)"
remote_parent="$(dirname "$HOSTINGER_REMOTE_DIR")"
backup_path="${remote_parent}/charropro-backup-${timestamp}-pre-${short_sha}.zip"
remote_root="/home/${HOSTINGER_USER}/.charropro-deploy"
remote_package="${remote_root}/uploads/$(basename "$package")"
remote_release="${remote_root}/releases/${expected_build}-${short_sha}-${timestamp}"
base_url="${CHARROPRO_PUBLIC_BASE_URL:-https://orgullocharro.com/charropro}"

if [[ "$dry_run" == true ]]; then
  printf 'DRY_RUN=PASS\n'
  print_connection_summary
  printf 'PACKAGE=%s\nPACKAGE_SHA256=%s\nPACKAGE_BUILD=%s\n' "$package" "$expected_sha256" "$expected_build"
  printf 'BACKUP_PATH=%s\nREMOTE_TEMP_PATH=%s\nREMOTE_RELEASE_PATH=%s\n' "$backup_path" "$remote_package" "$remote_release"
  printf 'SMOKE_URLS=%s/index.html,%s/formato-federacion.html,%s/torneo-publico.html,%s/broadcast-studio.html,%s/cronometro.html\n' "$base_url" "$base_url" "$base_url" "$base_url" "$base_url"
  exit 0
fi

local_lock="/private/tmp/charropro-hostinger-deploy-${HOSTINGER_USER}-${HOSTINGER_HOST}.lock"
mkdir "$local_lock" 2>/dev/null || die "local-deploy-lock-active" 73
remote_lock_acquired=false
deployed=false

release_remote_lock() {
  if [[ "$remote_lock_acquired" == true ]]; then
    ssh "${HOSTINGER_SSH_ARGS[@]}" "$HOSTINGER_TARGET" 'rm -rf "$HOME/.charropro-deploy.lock"' >/dev/null 2>&1 || true
    remote_lock_acquired=false
  fi
}

on_exit() {
  local code=$?
  trap - EXIT ERR
  if ((code != 0)) && [[ "$deployed" == true && -n "$backup_path" ]]; then
    release_remote_lock
    "${SCRIPT_DIR}/rollback-client.sh" --backup "$backup_path" || true
  else
    release_remote_lock
  fi
  rmdir "$local_lock" 2>/dev/null || true
  exit "$code"
}
trap on_exit EXIT ERR

ssh "${HOSTINGER_SSH_ARGS[@]}" "$HOSTINGER_TARGET" bash -s <<'REMOTE'
set -euo pipefail
lock="$HOME/.charropro-deploy.lock"
if ! mkdir "$lock" 2>/dev/null; then
  now="$(date +%s)"
  modified="$(stat -c %Y "$lock" 2>/dev/null || echo "$now")"
  age=$((now - modified))
  if ((age < 14400)); then
    echo 'ERROR=remote-deploy-lock-active' >&2
    exit 73
  fi
  mv "$lock" "${lock}.stale-${now}"
  mkdir "$lock"
fi
printf '%s\n' "pid=$$" "createdAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$lock/metadata"
REMOTE
remote_lock_acquired=true

inventory_count="$(ssh "${HOSTINGER_SSH_ARGS[@]}" "$HOSTINGER_TARGET" "find '$HOSTINGER_REMOTE_DIR' -type f | wc -l")"
printf 'REMOTE_INVENTORY_FILES=%s\n' "$inventory_count"

backup_metadata="$(ssh "${HOSTINGER_SSH_ARGS[@]}" "$HOSTINGER_TARGET" bash -s -- "$HOSTINGER_REMOTE_DIR" "$backup_path" <<'REMOTE'
set -euo pipefail
remote_dir="$1"
backup="$2"
[[ -d "$remote_dir" ]] || { echo 'ERROR=remote-dir-missing' >&2; exit 1; }
[[ ! -e "$backup" ]] || { echo 'ERROR=backup-already-exists' >&2; exit 1; }
(cd "$(dirname "$remote_dir")" && zip -qr "$backup" "$(basename "$remote_dir")")
[[ -s "$backup" ]] || { echo 'ERROR=backup-empty' >&2; exit 1; }
printf 'BACKUP_PATH=%s\nBACKUP_SIZE=%s\nBACKUP_SHA256=%s\n' "$backup" "$(stat -c %s "$backup")" "$(sha256sum "$backup" | awk '{print $1}')"
REMOTE
)"
printf '%s\n' "$backup_metadata"

ssh "${HOSTINGER_SSH_ARGS[@]}" "$HOSTINGER_TARGET" "mkdir -p '${remote_root}/uploads' '${remote_root}/releases'"
scp "${HOSTINGER_SCP_ARGS[@]}" "$package" "${HOSTINGER_TARGET}:${remote_package}"

remote_metadata="$(ssh "${HOSTINGER_SSH_ARGS[@]}" "$HOSTINGER_TARGET" bash -s -- \
  "$remote_package" "$remote_release" "$HOSTINGER_REMOTE_DIR" "$expected_sha256" "$expected_build" "$package_checksum" "$package_files" <<'REMOTE'
set -euo pipefail
remote_package="$1"
release="$2"
remote_dir="$3"
expected_sha="$4"
expected_build="$5"
expected_checksum="$6"
expected_files="$7"
actual_sha="$(sha256sum "$remote_package" | awk '{print $1}')"
[[ "$actual_sha" == "$expected_sha" ]] || { echo 'ERROR=remote-package-sha-mismatch' >&2; exit 1; }
[[ ! -e "$release" ]] || { echo 'ERROR=remote-release-already-exists' >&2; exit 1; }
mkdir -p "$release"
unzip -q "$remote_package" -d "$release"
[[ -f "$release/index.html" && -f "$release/functions/configuration.defaults.json" && -d "$release/assets" && -d "$release/js" ]] || { echo 'ERROR=remote-release-invalid' >&2; exit 1; }
actual_files="$(find "$release" -type f | wc -l)"
[[ "$actual_files" == "$expected_files" ]] || { echo 'ERROR=remote-release-file-count-mismatch' >&2; exit 1; }
config_values="$(python3 - "$release/functions/configuration.defaults.json" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as handle:
    config = json.load(handle)
print(config["values"]["system"]["appVersion"], config["checksum"])
PY
)"
build="${config_values%% *}"
checksum="${config_values##* }"
[[ "$build" == "$expected_build" && "$checksum" == "$expected_checksum" ]] || { echo 'ERROR=remote-release-config-mismatch' >&2; exit 1; }
rsync -a "$release/" "$remote_dir/"
deployed_values="$(python3 - "$remote_dir/functions/configuration.defaults.json" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as handle:
    config = json.load(handle)
print(config["values"]["system"]["appVersion"], config["checksum"])
PY
)"
deployed_build="${deployed_values%% *}"
deployed_checksum="${deployed_values##* }"
[[ "$deployed_build" == "$expected_build" && "$deployed_checksum" == "$expected_checksum" ]] || { echo 'ERROR=remote-deployed-config-mismatch' >&2; exit 1; }
printf 'REMOTE_PACKAGE_SHA=%s\nREMOTE_TEMP_PATH=%s\nREMOTE_RELEASE_PATH=%s\nREMOTE_BUILD=%s\nREMOTE_CHECKSUM=%s\n' "$actual_sha" "$remote_package" "$release" "$deployed_build" "$deployed_checksum"
REMOTE
)"
deployed=true
printf '%s\n' "$remote_metadata"

if [[ "$smoke_test" == true ]]; then
  "${SCRIPT_DIR}/smoke-client.sh" --base-url "$base_url" --expected-build "$expected_build" --expected-checksum "$package_checksum"
else
  printf 'SMOKE=SKIPPED\n'
fi

log_dir="${CHARROPRO_DEPLOY_LOG_DIR:-${HOSTINGER_REPO_ROOT}/deploy-logs}"
mkdir -p "$log_dir"
log_file="${log_dir}/${timestamp}-${expected_build}.log"
manifest_file="${log_dir}/${timestamp}-${expected_build}-deploy-manifest.json"
{
  printf 'timestamp=%s\npackage=%s\nsha256=%s\nbuild=%s\nchecksum=%s\nbackup=%s\nremoteDir=%s\nresult=PASS\n' \
    "$timestamp" "$package" "$expected_sha256" "$expected_build" "$package_checksum" "$backup_path" "$HOSTINGER_REMOTE_DIR"
} > "$log_file"
BUILD="$expected_build" COMMIT="$(git -C "$HOSTINGER_REPO_ROOT" rev-parse HEAD)" PACKAGE="$package" SHA256="$expected_sha256" CHECKSUM="$package_checksum" TIMESTAMP="$timestamp" REMOTE_DIR="$HOSTINGER_REMOTE_DIR" BACKUP="$backup_path" \
  node -e 'const fs=require("fs"); const value={build:process.env.BUILD,commit:process.env.COMMIT,package:process.env.PACKAGE,sha256:process.env.SHA256,checksum:process.env.CHECKSUM,timestamp:process.env.TIMESTAMP,remoteDir:process.env.REMOTE_DIR,backupPath:process.env.BACKUP}; fs.writeFileSync(process.argv[1],JSON.stringify(value,null,2)+"\n")' "$manifest_file"

printf 'DEPLOY=PASS\nDEPLOY_LOCK=PASS\nDEPLOY_LOG=%s\nDEPLOY_MANIFEST=%s\n' "$log_file" "$manifest_file"
