#!/bin/sh
# ── Entrypoint del media-service ─────────────────────────────────────────────
# Arranca (opcionalmente) el provider de PO Tokens de bgutil en segundo plano y
# luego el server Express. El provider ayuda a yt-dlp a evadir el bloqueo de
# YouTube a IPs de datacenter. Se apaga con ENABLE_POT=false (p. ej. si Render
# gratis se queda sin RAM y reinicia en bucle).
set -e

POT_PORT="${POT_PORT:-4416}"

if [ "${ENABLE_POT:-true}" != "false" ]; then
  echo "[start] PO Token provider ON → http://127.0.0.1:${POT_PORT}"
  node /opt/bgutil/server/build/main.js --port "${POT_PORT}" &
else
  echo "[start] PO Token provider OFF (ENABLE_POT=false)"
fi

# exec → server.js recibe las señales de Render (SIGTERM) directamente.
exec node server.js
