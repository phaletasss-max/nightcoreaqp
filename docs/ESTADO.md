# Estado del proyecto y pendientes — Nightcore AQP

Resumen de todo lo implementado y lo que falta, para retomar el trabajo (sobre todo
las **descargas**, que se terminarán "en casa").

Última actualización: 2026-06-22.

---

## 1. Funcionalidades — estado

| Función | Estado | Notas |
|---|---|---|
| Sugerir canciones de Spotify al DJ | ✅ en producción | Ruta `/api/spotify/tracks` (Client Credentials). Requiere `SPOTIFY_CLIENT_ID/SECRET` en Vercel (ya puestos). **No** funciona con playlists **editoriales** de Spotify (devuelven 502/404 por límite de la API) → usar playlists propias/públicas de usuario. |
| Gestor de diseño en `/admin` | ✅ | Fuentes, opacidad de contenedores, overlay de fondo, activar/ocultar secciones. Aplica en vivo (`DesignLoader`). Persiste en `site_settings`. |
| Reproductor (radio) | ✅ | "Escuchar playlist", autoplay siguiente, menú ⋮ (congelar fondo, sugerir, cerrar). |
| Perfiles públicos + privacidad | ✅ | `/perfil/[id]`; toggle privado en el perfil propio. **Requiere `phase-de.sql`.** |
| Moderación por filtros de palabras | ✅ | Admin define palabras; el comentario se publica pero sale censurado `***` hasta aprobarlo. **Requiere `phase-de.sql`.** |
| Votos de canciones | ✅ | Bug corregido (columna `vote` + `onConflict`). |
| Persistencia (eventos/canciones) | ✅ | `saveEvent` inserta sin id no-uuid; escrituras con logs. **Requiere columnas extra de `events` (en `phase-de.sql`).** |
| **Descargas (MP3/MP4)** | ✅ en producción | Media-service mitigado (anti-0MB y spoofing de cliente). |
| Convertidor de archivos | ⏸️ aparcado | Carpeta `convertidor/` (proyecto propio, fuera del repo). Se reactiva si se conecta un servicio. |
| **Arquitectura CI/CD** | ✅ estricto | Zero Trust Pipeline (`deploy-check.sh` + `pipeline.ts` + `ci-policy.ts`). Bloqueo estricto, anti-falsos positivos, hashing de manifest. Tests E2E en Playwright activos. |

---

## 2. SQL pendiente de correr en Supabase (IMPORTANTE)

En el **SQL Editor** de Supabase, correr (si no se ha hecho):

1. [`supabase/fixes.sql`](../supabase/fixes.sql) — políticas del bucket `media` + cierre de `site_settings` + admin real. *(Ya corrido según la sesión.)*
2. [`supabase/phase-de.sql`](../supabase/phase-de.sql) — **PENDIENTE**. Crea:
   - columnas extra de `events` (flyer, temáticas, DJs, maps, tiktoks),
   - `profiles.is_private` (perfiles privados),
   - tabla `banned_words` + `event_comments.flagged` (moderación).
   - Sin esto: el front degrada (no rompe), pero moderación/privacidad y campos extra de eventos no funcionan, y verás `404` de `banned_words` en consola.

**Admin real:** entra a la app con un usuario registrado de verdad y hazlo admin:
```sql
update public.profiles set role='admin'
  where id = (select id from auth.users where email='TU_CORREO');
```
El login "de emergencia" (hardcodeado) NO tiene sesión real → la RLS rechaza sus escrituras.

---

## 3. Descargas — arquitectura y cómo terminarlas

### Por qué no es trivial
`yt-dlp` (descargas) y la conversión son **binarios del sistema**: **no corren en Vercel**
(serverless + YouTube bloquea IPs de datacenter). Necesitan un **servidor**.

### Cómo está montado el código
- Front: `downloadMedia()` en [`src/lib/media.ts`](../src/lib/media.ts):
  1. Si `NEXT_PUBLIC_MEDIA_SERVICE_URL` está configurado → descarga por **tu** servicio (`media-service`).
  2. Si no → cae al proxy [`/api/download`](../src/app/api/download/route.ts) (Vercel → instancia pública de **Cobalt**, configurable con `COBALT_API_URL`).
- En ambos casos el archivo se descarga **en el dispositivo del cliente** (quien pega el link); el servidor no lo guarda.

### El `media-service` (carpeta [`media-service/`](../media-service))
- Express + yt-dlp + ffmpeg. Endpoints: `/health`, `/api/info`, `/api/download`, `/api/store`.
- Tiene [`Dockerfile`](../media-service/Dockerfile) listo (yt-dlp standalone + ffmpeg).
- **NO** fijar `PORT` en el Docker (Render inyecta el suyo; `server.js` usa `process.env.PORT`).
- `/health` responde **al instante** (no spawnea yt-dlp) para no romper el health-check de Render.
- Soporta **cookies** de YouTube vía `YTDLP_COOKIES` (ruta a un `cookies.txt`).

### Terminarlo EN CASA (recomendado, IP residencial = YouTube funciona)
1. En tu PC/servidor (Linux o WSL): instalar `yt-dlp`, `ffmpeg`, `node`.
2. `cd media-service && npm install`
3. `cp .env.example .env` → editar `ALLOWED_ORIGINS=https://nightcoreaqp-five.vercel.app`
4. `node --env-file=.env server.js` → probar `http://localhost:8787/health`
5. Exponer por HTTPS con **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:8787` → da una URL `https://...trycloudflare.com`.
6. En **Vercel** → env var `NEXT_PUBLIC_MEDIA_SERVICE_URL` = esa URL → Redeploy.
7. Para YouTube: exportar `cookies.txt` (extensión "Get cookies.txt LOCALLY") y `YTDLP_COOKIES=/ruta/cookies.txt`.

> IP residencial (casa) = YouTube descarga sin problemas. En nube (Render/Oracle), YouTube
> necesita cookies y aun así puede fallar (bloqueo de IPs de datacenter). TikTok/Instagram
> funcionan en cualquier caso.

### Estado actual en Render (Producción)
- Servicio `nightcore-media` desplegado; arranca en puerto dinámico (PORT).
- Se implementó **spoofing de cliente** (`player_client=android,web_creator,default`) para mitigar el bloqueo de IP por parte de YouTube.
- Se implementó **buffer anti-0MB**: si `yt-dlp` es bloqueado por bot detection, el servidor aborta la descarga sin enviar cabeceras vacías (retorna Error 500 legible).
- **Importante:** Si YouTube invalida las cookies (`YTDLP_COOKIES`), el servidor seguirá reportando "Sign in to confirm you're not a bot". Actualizar `cookies.txt` en Render sigue siendo el único bypass 100% definitivo a los baneos de Datacenter.

---

## 4. Variables de entorno

### Vercel (frontend)
| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Base de datos / auth |
| `NEXT_PUBLIC_MEDIA_SERVICE_URL` | URL del media-service propio (descargas). Si vacío → usa Cobalt. |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Leer tracks de playlists de Spotify (server-side). |
| `COBALT_API_URL` (opcional) | Instancia de Cobalt para `/api/download` si no hay media-service. |
| `COBALT_API_KEY` (opcional) | Si la instancia de Cobalt requiere key. |

### media-service (servidor)
| Variable | Para qué |
|---|---|
| `ALLOWED_ORIGINS` | CORS: dominio del frontend. |
| `YTDLP_COOKIES` | Ruta a `cookies.txt` (para YouTube). |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_BUCKET` | Solo si se usa `/api/store`. |

---

## 5. Problemas conocidos / a investigar

1. **Spotify 502** con ciertas playlists → son **editoriales** de Spotify (la API ya no las
   sirve con client-credentials). Usar playlists de usuario.
2. **Render free** se duerme (cold-start ~30s en el primer request).
3. **YouTube** requiere cookies y/o IP residencial para descargar de forma fiable.
4. **Posible loop de render en `/perfil`** al vincular Spotify (se vio spam de
   `scheduleCallback`/postMessage en consola). A investigar: el listener de mensajes de
   `GlobalPlayer` usa `playNext` sin `useCallback` (cambia de identidad cada render) → el
   `useEffect` se re-suscribe en cada render. Memorizar las funciones del `PlayerContext`
   (envolverlas en `useCallback`/`useMemo`) es la corrección recomendada.
5. **Vercel "Lint" check** puede salir en rojo aunque el deploy quede "Ready"; el build
   local pasa el lint, es un check no bloqueante.

---

## 6. Comandos útiles

```bash
# Frontend
npm run dev      # dev en :3092
npm run build    # build de producción (corre TS + eslint)

# media-service (en el servidor/casa)
cd media-service && npm install
node --env-file=.env server.js
curl http://localhost:8787/health
```

---

## 7. Arquitectura CI/CD (Zero Trust)

Recientemente refactorizado de scripts en bash a un sistema robusto:
1. `pipeline.ts`: Runner puro. Corre Next.js build, Playwright (E2E Tests), UI Contracts, Rutas, etc. Escribe evidencia en `pipeline-manifest.json`.
2. `ci-policy.ts`: Motor de políticas. Audita el hash del manifest (State Spoofing protection), calcula el `Integrity Score`, y si no alcanza 100% lanza Exit 1.
3. `deploy-check.sh`: Control de flujo que envuelve todo. Se ejecuta con `npm run deploy:check`. Ya **no** hay bypasses locales (estado "SAFE FOR LOCAL"). Es Zero Trust absoluto.

---

## 8. Convertidor (proyecto propio aparte)

La carpeta `convertidor/` (antes `bot-erp`) quedó **fuera del repo** (gitignored), con
`README` y `LICENSE` (MIT), lista para publicar como repo independiente. Hace conversión de
archivos (PDF⇄Word, imágenes, MP4→MP3) y descargas. No está conectada al web app por ahora.
