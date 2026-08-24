#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

backup=""
dry_run=false

while (($#)); do
  case "$1" in
    --backup) backup="${2:-}"; shift 2 ;;
    --dry-run) dry_run=true; shift ;;
    *) die "unknown-argument:$1" ;;
  esac
done

load_hostinger_environment
assert_safe_backup_path "$backup"

if [[ "$dry_run" == true ]]; then
  printf 'ROLLBACK_DRY_RUN=PASS\n'
  print_connection_summary
  printf 'BACKUP_PATH=%s\n' "$backup"
  printf 'ROLLBACK_TARGET=%s\n' "$HOSTINGER_REMOTE_DIR"
  exit 0
fi

ssh "${HOSTINGER_SSH_ARGS[@]}" "$HOSTINGER_TARGET" bash -s -- "$backup" "$HOSTINGER_REMOTE_DIR" <<'REMOTE'
set -euo pipefail
backup="$1"
remote_dir="$2"
lock="$HOME/.charropro-deploy.lock"
mkdir "$lock" 2>/dev/null || { echo 'ERROR=remote-deploy-lock-active' >&2; exit 73; }
stage="$(mktemp -d "$HOME/.charropro-rollback.XXXXXX")"
failed_backup="$(dirname "$remote_dir")/charropro-failed-$(date -u +%Y%m%d-%H%M%S).zip"
cleanup() { rm -rf "$stage"; rm -rf "$lock"; }
trap cleanup EXIT
[[ -f "$backup" && -s "$backup" ]] || { echo 'ERROR=rollback-backup-missing' >&2; exit 1; }
unzip -t "$backup" >/dev/null
(cd "$(dirname "$remote_dir")" && zip -qr "$failed_backup" "$(basename "$remote_dir")")
unzip -q "$backup" -d "$stage"
restored="$stage/$(basename "$remote_dir")"
[[ -f "$restored/index.html" && -f "$restored/functions/configuration.defaults.json" ]] || { echo 'ERROR=rollback-content-invalid' >&2; exit 1; }
rsync -a --delete "$restored/" "$remote_dir/"
printf 'ROLLBACK=PASS\nFAILED_RELEASE_BACKUP=%s\n' "$failed_backup"
REMOTE
