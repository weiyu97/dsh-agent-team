#!/usr/bin/env bash
# SCNet 客户端 CDP 隧道：dfy:9223 -> ITX:9223
set -u
F="${SCNET_SSH_PASS_FILE:-$HOME/.dsh/creds/itx.pass}"
H="${SCNET_SSH:-administrator@192.168.198.237}"
P="${SCNET_CDP_PORT:-9223}"
PAT="${P}:127.0.0.1:${P}"
case "${1:-start}" in
  start)
    if pgrep -f "$PAT" >/dev/null; then echo "already up"; exit 0; fi
    setsid nohup sshpass -f "$F" ssh -N -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes -L "$P:127.0.0.1:$P" "$H" >/tmp/scnet_tun.log 2>&1 &
    sleep 2
    curl -s -m 5 "http://127.0.0.1:$P/json/version" >/dev/null && echo "up" || echo "FAILED (client not running with --remote-debugging-port?)"
    ;;
  stop) pkill -f "$PAT" 2>/dev/null; echo "stopped" ;;
  status) pgrep -af "$PAT" | grep -v bash || echo "down" ;;
esac
