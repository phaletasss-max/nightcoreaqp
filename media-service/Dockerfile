# Media-service (descargas yt-dlp) — listo para Render / Oracle / cualquier Docker.
FROM node:20-bookworm-slim

# ffmpeg (procesado) + yt-dlp standalone (no requiere Python aparte).
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg curl ca-certificates \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
      -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# NO fijamos PORT: Render (y otros hosts) inyectan su propia variable PORT en
# runtime y server.js la usa (process.env.PORT). Fijarla aquí causaba que la app
# escuchara en 8787 mientras Render esperaba otro puerto → health-check fallido → reinicios.
EXPOSE 10000
CMD ["node", "server.js"]
