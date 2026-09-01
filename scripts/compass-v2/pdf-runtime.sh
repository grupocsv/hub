#!/usr/bin/env bash
set -euo pipefail

readonly IMAGE='mcr.microsoft.com/playwright:v1.62.0-noble@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07'
readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ $# -eq 0 ]]; then
  printf '%s\n' 'Uso: npm run compass:pdf:runtime -- <comando> [argumentos...]' >&2
  exit 64
fi

exec sudo -n docker run --rm \
  --network host \
  --ipc host \
  --user "$(id -u):$(id -g)" \
  --env PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  --volume "$REPO_ROOT:$REPO_ROOT" \
  --workdir "$REPO_ROOT" \
  "$IMAGE" \
  "$@"
