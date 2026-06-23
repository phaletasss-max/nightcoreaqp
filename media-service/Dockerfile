# Media-service (descargas yt-dlp) — listo para Render / Oracle / cualquier Docker.
FROM node:20-bookworm-slim

# ffmpeg (procesado) + yt-dlp standalone (no requiere Python aparte) + deno
# (runtime JS que yt-dlp necesita para el reto nsig de YouTube).
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg curl ca-certificates unzip \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
      -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
 && rm -rf /var/lib/apt/lists/*

# Verifica que deno quedó en el PATH (falla el build si no, para no desplegar roto).
RUN deno --version

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# NO fijamos PORT: Render (y otros hosts) inyectan su propia variable PORT en
# runtime y server.js la usa (process.env.PORT). Fijarla aquí causaba que la app
# escuchara en 8787 mientras Render esperaba otro puerto → health-check fallido → reinicios.
EXPOSE 10000
CMD ["node", "server.js"]
