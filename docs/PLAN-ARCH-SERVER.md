# Plan — Migración al servidor Arch (fase final / plan B)

> **Estado:** PLANEADO, no implementado. Es la fase secundaria a probar **después** de
> que el modelo de descarga local (PC `.bat` / celular APK) esté funcionando.
> **Objetivo:** evaluar si correr el `media-service` en el servidor Arch de casa (IP
> **residencial**) sale más rentable y fiable que Render.

## Por qué

YouTube bloquea las IPs de **datacenter** (Render, Vercel). Una IP **residencial**
(casa) casi nunca se bloquea. Si el `media-service` corre en el Arch:
- La búsqueda de respaldo (yt-dlp) y `storeBackup` (fondos del DJ) vuelven a ser fiables.
- Opcionalmente se podría reactivar la descarga en-web (sin depender del `.bat`), aunque
  el modelo local ya cubre eso y conviene mantenerlo como camino principal.

## Lo que YA está listo para esto (no hay que construirlo)

- `media-service/` completo: Node + Express + yt-dlp + ffmpeg, con **PO Tokens (bgutil)**
  y manejo de cookies. Diseñado originalmente para Arch.
- El frontend ya consume `NEXT_PUBLIC_MEDIA_SERVICE_URL` para:
  - búsqueda de respaldo (`searchYouTubeList` → media-service si la Data API no da),
  - `storeBackup` (fondos del DJ en `/admin`).
- README del media-service con los pasos de instalación en Arch.

## Pasos (cuando se decida probar)

1. **En el Arch** (vía SSH):
   - `sudo pacman -S yt-dlp ffmpeg nodejs npm` (o usar la imagen Docker del repo).
   - `cd media-service && npm install && cp .env.example .env` y completar valores.
2. **Dejarlo siempre encendido** con `systemd` o `pm2` (que sobreviva al cierre de la
   sesión SSH):
   - `pm2 start server.js --name nightcore-media --node-args="--env-file=.env"`
   - `pm2 save && pm2 startup`
3. **Exponer por HTTPS sin abrir puertos** → **Cloudflare Tunnel** (`cloudflared`):
   - Da un hostname HTTPS estable aunque la IP de casa sea **dinámica** (no necesita IP fija).
   - Alternativa: nginx + Let's Encrypt si hay dominio e IP estable.
4. **Apuntar el frontend**: en Vercel, `NEXT_PUBLIC_MEDIA_SERVICE_URL = https://<tunnel>` → Redeploy.
5. **Cookies de YouTube**: subir `cookies.txt` fresco (ver README). Con IP residencial + PO
   Tokens + cookies, el bloqueo debería desaparecer casi por completo.

## Decisión de rentabilidad (lo que vamos a medir)

| Criterio | Arch (casa) | Render |
|---|---|---|
| Bloqueo de YouTube | Casi nulo (IP residencial) | Frecuente (datacenter) |
| Costo | Luz + PC encendida 24/7 | Gratis (con límites) / pago |
| Uptime | Depende de luz/internet de casa | Alta (nube) |
| Mantenimiento | Manual (SSH, actualizaciones) | Casi nulo |
| IP dinámica | Resuelta con Cloudflare Tunnel | N/A |

**Criterio de éxito:** si el Arch baja de YouTube de forma estable y el costo/uptime es
aceptable → se queda como backend del media-service. Si la luz/internet de casa lo hacen
inestable → volver a Render (o dejar `NEXT_PUBLIC_MEDIA_SERVICE_URL` vacío y operar 100%
con descarga local).

## Rollback

Quitar/!cambiar `NEXT_PUBLIC_MEDIA_SERVICE_URL` en Vercel y redeploy. El sitio sigue
funcionando con la Data API (búsqueda) y la descarga local (`.bat`/APK); solo se pierde
`storeBackup` de fondos hasta reconfigurar.

## Riesgos / notas

- El servicio debe correr como daemon (systemd/pm2), **no** atado a la sesión SSH.
- Cloudflare Tunnel evita exponer la IP de casa y no requiere puertos abiertos.
- Mantener `yt-dlp` actualizado (`yt-dlp -U` periódico o en el arranque).
