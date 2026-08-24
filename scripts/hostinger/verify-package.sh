#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

package=""
expected_build=""
expected_sha256=""
expected_checksum=""

while (($#)); do
  case "$1" in
    --package) package="${2:-}"; shift 2 ;;
    --expected-build) expected_build="${2:-}"; shift 2 ;;
    --expected-sha256) expected_sha256="${2:-}"; shift 2 ;;
    --expected-checksum) expected_checksum="${2:-}"; shift 2 ;;
    *) die "unknown-argument:$1" ;;
  esac
done

[[ -f "$package" ]] || die "package-not-found"
[[ "$expected_build" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$ ]] || die "expected-build-invalid"
[[ "$expected_sha256" =~ ^[a-f0-9]{64}$ ]] || die "expected-sha256-invalid"
if [[ -n "$expected_checksum" ]]; then
  [[ "$expected_checksum" =~ ^[a-f0-9]{64}$ ]] || die "expected-checksum-invalid"
fi

for command in unzip shasum node awk grep; do require_command "$command"; done

actual_sha256="$(sha256_file "$package")"
[[ "$actual_sha256" == "$expected_sha256" ]] || die "package-sha256-mismatch"
unzip -t "$package" >/dev/null || die "package-zip-invalid"

entries=()
while IFS= read -r entry; do
  entries+=("$entry")
done < <(unzip -Z1 "$package")
((${#entries[@]} > 0)) || die "package-empty"
printf '%s\n' "${entries[@]}" | grep -Fxq 'index.html' || die "package-index-missing"
printf '%s\n' "${entries[@]}" | grep -Fxq 'functions/configuration.defaults.json' || die "package-configuration-missing"
printf '%s\n' "${entries[@]}" | grep -Eq '^assets/' || die "package-assets-missing"
printf '%s\n' "${entries[@]}" | grep -Eq '^js/' || die "package-js-missing"

for entry in "${entries[@]}"; do
  [[ "$entry" != /* ]] || die "package-absolute-path-forbidden"
  [[ "$entry" != ../* && "$entry" != */../* ]] || die "package-path-traversal-forbidden"
  if [[ "$entry" =~ (^|/)(tests|node_modules|\.git|__MACOSX)(/|$) ]] ||
     [[ "$entry" =~ (^|/)(\.env($|\.)|\.DS_Store|firebase\.json|firebase-rules[^/]*|[^/]*\.pem|[^/]*\.key|[^/]*\.log)$ ]]; then
    die "package-forbidden-content:${entry}"
  fi
done

read -r package_build package_checksum < <(
  unzip -p "$package" functions/configuration.defaults.json |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const c=JSON.parse(s);console.log(`${c?.values?.system?.appVersion||""} ${c?.checksum||""}`)})'
)
[[ "$package_build" == "$expected_build" ]] || die "package-build-mismatch"
[[ "$package_checksum" =~ ^[a-f0-9]{64}$ ]] || die "package-checksum-invalid"
if [[ -n "$expected_checksum" ]]; then
  [[ "$package_checksum" == "$expected_checksum" ]] || die "package-checksum-mismatch"
fi

short_sha="$(package_short_sha "$package")"
if git -C "$HOSTINGER_REPO_ROOT" rev-parse --verify "${short_sha}^{commit}" >/dev/null 2>&1; then
  resolved_sha="$(git -C "$HOSTINGER_REPO_ROOT" rev-parse "${short_sha}^{commit}")"
  [[ "$resolved_sha" == "${short_sha}"* ]] || die "package-commit-sha-mismatch"
fi

printf 'PACKAGE_VERIFY=PASS\n'
printf 'PACKAGE=%s\n' "$package"
printf 'PACKAGE_SHA256=%s\n' "$actual_sha256"
printf 'PACKAGE_BUILD=%s\n' "$package_build"
printf 'PACKAGE_CHECKSUM=%s\n' "$package_checksum"
printf 'PACKAGE_FILES=%s\n' "${#entries[@]}"
printf 'PACKAGE_SHORT_SHA=%s\n' "$short_sha"
