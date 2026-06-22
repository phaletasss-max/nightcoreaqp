# Media-service — Nightcore AQP

Microservicio que verifica y descarga audio/video con **yt-dlp** y los respalda en
**Supabase Storage**. Corre en tu **servidor Arch** (no en Vercel: YouTube bloquea las IPs de
la nube y el serverless no permite binarios persistentes).

Adaptado de `bot-erp`.

## Requisitos (Arch Linux)
```bash
# Descargas (yt-dlp) + conversión de archivos (LibreOffice/ImageMagick/FFmpeg)
sudo pacman -S yt-dlp ffmpeg imagemagick libreoffice-fresh nodejs npm
# Mantén yt-dlp actualizado (YouTube cambia seguido):
#   sudo pacman -Syu yt-dlp   (o)   yt-dlp -U
```

## Instalación
```bash
cd media-service
npm install
cp .env.example .env   # y completa los valores
node --env-file=.env server.js   # Node 20+
```

Para producción, déjalo siempre encendido con **pm2** o **systemd**:
```bash
npm i -g pm2
pm2 start server.js --name nightcore-media --node-args="--env-file=.env"
pm2 save && pm2 startup
```

## Exponer por HTTPS
El frontend en Vercel necesita llamarlo por **https**. Opciones:
- **Cloudflare Tunnel** (`cloudflared`) → da un dominio HTTPS sin abrir puertos. Recomendado.
- Nginx/Apache como reverse-proxy con certificado (Let's Encrypt) sobre tu dominio.

Luego pon esa URL en el frontend: `NEXT_PUBLIC_MEDIA_SERVICE_URL=https://media.tudominio.com`.

## Endpoints
| Método | Ruta | Cuerpo | Devuelve |
|--------|------|--------|----------|
| GET | `/health` | — | estado + si `yt-dlp` y Storage están OK |
| POST | `/api/info` | `{ url }` | `{ available, embeddable, title, author, thumbnail, availability }` — el "comprobante" |
| POST | `/api/download` | `{ url, format, quality }` | stream del archivo (mp3/mp4) |
| POST | `/api/store` | `{ url, format }` | `{ url }` — descarga y sube a Supabase Storage |
| GET | `/api/convert/options` | — | lista de conversiones disponibles |
| POST | `/api/convert/:tipo` | multipart, campo `file` | el archivo convertido (descarga) |

**Conversiones** (`:tipo`): `pdf-to-word`, `word-to-pdf`, `jpg-to-png`, `png-to-jpg`, `webp-to-jpg`, `jpg-to-webp`, `mp4-to-mp3`.
Requiere instalar `npm install` (ahora incluye `multer`) y tener LibreOffice/ImageMagick/FFmpeg en el sistema.

## Storage en Supabase
Crea un bucket **público** llamado `media` (Storage → New bucket). La clave de servicio
(`SUPABASE_SERVICE_ROLE_KEY`) solo vive aquí, en el backend.

## Nota legal
Descargar y **redistribuir** contenido con copyright es terreno gris. Como el club es público
y sin fines de lucro, usa los respaldos como **comprobante / set del DJ**, no como descarga
masiva pública. La descarga abierta al público se limita a contenido propio.
