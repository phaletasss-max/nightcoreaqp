# Media-service (descargas yt-dlp) — listo para Render / Oracle / cualquier Docker.
FROM node:20-bookworm-slim

# Versión fijada del provider de PO Tokens (bgutil). Bump manual cuando salga
# una nueva release estable en github.com/Brainicism/bgutil-ytdlp-pot-provider/releases.
ARG BGUTIL_VERSION=1.3.1

# ffmpeg (procesado) + yt-dlp standalone (no requiere Python aparte) + deno
# (runtime JS que yt-dlp necesita para el reto nsig de YouTube) + git (para clonar bgutil).
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg curl ca-certificates unzip git \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
      -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
 && rm -rf /var/lib/apt/lists/*

# Verifica que deno quedó en el PATH (falla el build si no, para no desplegar roto).
RUN deno --version

# ── PO Token provider (bgutil) ───────────────────────────────────────────────
# Combate el bloqueo "Sign in to confirm you're not a bot" en IPs de datacenter.
# Dos piezas, ambas DENTRO de este contenedor (no hace falta un 2º servicio):
#   1. El plugin de yt-dlp (extractor) → se instala en /opt/ytdlp-plugins.
#   2. El server HTTP que genera los tokens → se compila en /opt/bgutil/server.
# En runtime, start.sh arranca el server y downloader.js apunta yt-dlp a él.
RUN mkdir -p /opt/ytdlp-plugins \
 && curl -L "https://github.com/Brainicism/bgutil-ytdlp-pot-provider/releases/download/${BGUTIL_VERSION}/bgutil-ytdlp-pot-provider.zip" \
      -o /tmp/bgutil-plugin.zip \
 && unzip -q /tmp/bgutil-plugin.zip -d /opt/ytdlp-plugins \
 && rm /tmp/bgutil-plugin.zip \
 && git clone --depth 1 --single-branch --branch "${BGUTIL_VERSION}" \
      https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil \
 && cd /opt/bgutil/server \
 && npm ci \
 && npx tsc \
 && npm prune --omit=dev

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Entrypoint: levanta el provider de PO Tokens (si ENABLE_POT != false) y luego server.js.
RUN chmod +x /app/start.sh

# NO fijamos PORT: Render (y otros hosts) inyectan su propia variable PORT en
# runtime y server.js la usa (process.env.PORT). Fijarla aquí causaba que la app
# escuchara en 8787 mientras Render esperaba otro puerto → health-check fallido → reinicios.
EXPOSE 10000
CMD ["/app/start.sh"]
