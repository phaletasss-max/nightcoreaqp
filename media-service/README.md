# Media-service — Nightcore AQP

Microservicio que verifica y descarga audio/video con **yt-dlp** y los respalda en
**Supabase Storage**. Corre en tu **servidor Arch** (no en Vercel: YouTube bloquea las IPs de
la nube y el serverless no permite binarios persistentes).

Adaptado de `bot-erp`.

## Requisitos (Arch Linux)
```bash
sudo pacman -S yt-dlp ffmpeg nodejs npm
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

## Cookies de YouTube en Render (IMPRESCINDIBLE para YouTube)

YouTube bloquea las IPs de datacenter (Render). Sin cookies, `yt-dlp` recibe la petición
pero falla con *"Sign in to confirm you're not a bot"* → no devuelve archivo. TikTok/IG/FB
**sí** funcionan sin cookies. Para YouTube hay que dar cookies de una cuenta:

1. En tu navegador (logueado en YouTube) usa la extensión **"Get cookies.txt LOCALLY"** y
   exporta el `cookies.txt` de `youtube.com` (formato **Netscape**; la primera línea suele
   ser `# Netscape HTTP Cookie File`).
2. En **Render → tu servicio → Environment → Secret Files → Add Secret File**:
   - **Filename:** `cookies.txt`
   - **Contents:** pega TODO el contenido del archivo exportado.
   - Render lo monta en `/etc/secrets/cookies.txt`.
3. En **Environment → Environment Variables** añade:
   - `YTDLP_COOKIES` = `/etc/secrets/cookies.txt`
4. **Manual Deploy → Deploy latest commit** (o espera el auto-deploy).
5. Probar: intenta una descarga de YouTube. En **Logs** debe salir `[DOWNLOAD] OK ...`.
   Si sale `[DOWNLOAD] FALLÓ: ...` el mensaje dice el motivo (cookies vencidas, etc.).

> Las cookies caducan cada cierto tiempo; si vuelve a fallar, re-exporta y reemplaza el
> Secret File. Mantén `yt-dlp` actualizado (la imagen Docker baja la última versión al build).

## PO Tokens (refuerzo anti-bloqueo, ya integrado)

Además de las cookies, la imagen Docker arranca un **provider de PO Tokens** (`bgutil`)
*dentro del mismo contenedor* — no hace falta un segundo servicio. yt-dlp lo usa para
parecer tráfico legítimo y así reducir el *"Sign in to confirm you're not a bot"*.

- Está **activado por defecto**. No requiere configuración: el `Dockerfile` instala el
  plugin y compila el server; `start.sh` lo levanta junto al server Express.
- **Limitación honesta:** un PO Token **ayuda** pero **no garantiza** evadir el bloqueo en
  una IP de datacenter (Render). La combinación más fiable es **PO Tokens + cookies frescas**.
- **RAM (Render gratis, 512 MB):** el provider añade un proceso Node. Si ves reinicios por
  memoria (*OOM*) en los Logs, apágalo con la variable de entorno `ENABLE_POT=false` y
  re-despliega. El servicio vuelve a funcionar como antes (solo cookies).
- Para verificar que está activo: en los Logs de Render al arrancar debe salir
  `[start] PO Token provider ON → http://127.0.0.1:4416`.

> La solución *gratis y definitiva* al bloqueo es correr este servicio en una **IP
> residencial** (un servidor en casa, no datacenter). Ahí YouTube casi nunca bloquea y
> los PO Tokens + cookies dejan de ser imprescindibles.

## Storage en Supabase
Crea un bucket **público** llamado `media` (Storage → New bucket). La clave de servicio
(`SUPABASE_SERVICE_ROLE_KEY`) solo vive aquí, en el backend.

## Nota legal
Descargar y **redistribuir** contenido con copyright es terreno gris. Como el club es público
y sin fines de lucro, usa los respaldos como **comprobante / set del DJ**, no como descarga
masiva pública. La descarga abierta al público se limita a contenido propio.
