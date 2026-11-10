#!/usr/bin/env bash
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/tunnel.sh" start >/dev/null 2>&1 || true
exec node "$DIR/bridge.mjs"
