# Guía para IA — Nightcore AQP

> **Léeme antes de tocar código.** Objetivo: que entiendas el proyecto, su meta, y las
> **reglas para no romperlo**. Para el *estado vivo* (qué está hecho / en proceso / pendiente),
> ve a [ESTADO-MAESTRO.md](./ESTADO-MAESTRO.md).

---

## 1. Qué es y para qué

**Nightcore AQP** es un **hub web + comunidad** para las fiestas de música *nightcore/scenecore*
en **Arequipa, Perú**. Organiza **Yorch**; lo hace la comunidad ("Los Simpatizantes de JP"). Sin
fines de lucro, público. En producción: `nightcoreaqp-five.vercel.app`.

No es una landing de evento: es una app **social-gamificada** alrededor de eventos — reservas,
playlist colaborativa que alimenta al DJ, cosplay, encuestas, retos/rachas, perfiles con puntos,
y descargas de música **locales** (en la PC del usuario, no en servidor).

### Problema y origen (el *por qué* nació)

Antes, las fiestas de nightcore/scene en Arequipa se organizaban como cualquier evento suelto
(Facebook/WhatsApp). Eso dejaba **cuatro dolores** que el proyecto ataca:

1. **El DJ perdía horas** cazando y descargando a mano las canciones pedidas → la playlist
   colaborativa vota el Top-N y el **descargador local** se las deja listas (ver
   [DESCARGADOR.md](./DESCARGADOR.md)).
2. **El asistente era pasivo** (solo "asistir") → gamificación: puntos, rachas, insignias, votos.
3. **No había identidad ni memoria de comunidad** → perfiles, cosplay, chat, temáticas, historial.
4. **Todo con presupuesto ≈ 0** y sin depender de plataformas que banean herramientas de descarga →
   tiers gratuitos (Vercel/Supabase/Render) + descargas en la PC del usuario (no server-side).

La apuesta: un **hub vivo** que acompaña el evento **antes** (hype, votación, disfraces), **durante**
(player, fondos, pedidos al DJ) y **después** (fotos-prueba, insignias, top charts). Detalle de
visión/objetivos en [pt/pt-02-objetivos-y-vision.md](./pt/pt-02-objetivos-y-vision.md).

**El "para qué" al tocar código:** sirve a una comunidad real; prioriza que **nada se rompa en
producción** sobre features nuevas. Verifica siempre antes de cerrar.

---

## 2. Arquitectura (3 piezas + 2 apps)

```
Frontend (este repo, src/)      Supabase                    Descargas
Next.js 16 · React 19 ·   ───▶  Postgres · Auth ·     +     · .bat local (web → PC del user)
Tailwind v4 · Vercel            Storage · RLS               · App de escritorio (desktop-app/, Electron)
                                                            · media-service/ (Express+yt-dlp, Render) = respaldo
```

- **Frontend** (`src/`): la web. Vercel. Push a `main` → **deploy automático a producción**.
- **Supabase**: BD + Auth + Storage. La **seguridad real la da la RLS** (el front usa la *anon key*).
- **App de escritorio** (`desktop-app/`): Electron. Descarga música en la PC con yt-dlp (auto-instala
  yt-dlp/ffmpeg/deno). Auto-update por GitHub Releases.
- **media-service** (`media-service/`): Express + yt-dlp en Render. Respaldo de búsqueda/storage.
- **App móvil** (`mobile-app/`): Expo. **Solo el stub** por ahora.

Detalle: [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 3. ⚠️ Reglas de oro (romper esto = romper producción)

1. **Next.js 16 NO es el que conoces.** Tiene breaking changes vs tu entrenamiento. **Lee
   `node_modules/next/dist/docs/`** antes de escribir código de Next. Heed deprecation notices.

2. **La capa de datos es ÚNICA y dual** — [`src/lib/data.ts`](../src/lib/data.ts). Es la única API
   que usan las páginas. Cada función hace `if (cfg())` → Supabase, si no → `localStorage` + demo.
   **Mantén ese patrón.** Así la app corre con o sin credenciales.

3. **Seguridad = RLS, no el cliente.** El front usa la *anon key* (pública, normal). El panel
   `/admin` exige **sesión REAL de Supabase** con `role` admin/dj (lo valida `is_staff()` en la RLS).
   **NO** reintroduzcas logins/contraseñas/claves hardcodeadas en el código (se limpiaron a
   propósito; el repo puede ser público).

4. **Push a `main` = deploy a Vercel (producción).** No commitees secretos. Los secretos viven en
   env de Vercel/Render y en `.env.local` (gitignored), nunca en el repo.

5. **Desktop: `deno` es obligatorio para YouTube.** yt-dlp lo necesita para el reto `nsig`; sin él,
   YouTube bloquea. La app auto-instala yt-dlp/ffmpeg/deno a `userData/bin` y los pone en el `PATH`
   del proceso yt-dlp (ver [`desktop-app/src/main/tools.js`](../desktop-app/src/main/tools.js)).

6. **Tailwind v4 / Lightning CSS — gotchas reales (ya nos mordieron):**
   - **No escribas `-webkit-` a mano** junto a la propiedad estándar con el mismo valor: Lightning
     las dedupea y deja solo la `-webkit-` (Chrome la ignora). Escribe solo la estándar; Lightning
     prefija solo.
   - **No metas `var()` dentro de `blur()`** (`backdrop-filter: blur(var(--x))`): Lightning descarta
     la propiedad. Guarda el valor completo en la variable (`--card-backdrop: blur(12px)`).
   - `desktop-app/` tiene su **propio `postcss.config.cjs` vacío** para que su build NO agarre el
     `postcss.config.mjs` del sitio web (que pide `@tailwindcss/postcss`, ausente en ese build).

7. **El `.bat` de descargas** ([`src/lib/crate.ts`](../src/lib/crate.ts)) tiene trampas de `cmd`:
   - **NO** uses `for %%U in (...)` con URLs — el `?` de YouTube se interpreta como comodín.
   - Las URLs van **entre comillas** (por el `&` de las playlists).
   - El selector `-f` va **entre comillas** (por el `<` de `height<=`).
   - El `.bat` se **autoelimina** al cerrar (`(goto) 2>nul & del "%~f0"`).

8. **Temas/personalización = variables CSS + `data-theme`.** Web: `DesignLoader` aplica tokens a
   `<html>`. Desktop: panel "Personalizar". Para que un tema recoloree **todo**, usa `var(--magenta)`
   etc., **no** colores fijos (`#ff00ff`); si necesitas opacidad sobre una variable, usa
   `color-mix(in srgb, var(--x) N%, transparent)`. (Excepciones a propósito: badges de estado
   verde/amarillo/rojo, el título arcoíris.)

9. **YouTube hoy:** el **audio (MP3)** baja sin sesión; el **video (MP4)** de music videos gateados
   exige login → **cookies** (la app tiene opción `cookies.txt`). TikTok elige H.264 (no HEVC) para
   que reproduzca en Windows. Esto es regla de YouTube, no bug.

10. **Verifica antes de cerrar.** Web: `npx tsc --noEmit` y/o `npm run build`. Desktop:
    `npm run build` en `desktop-app/`. Luego **documenta** en `ESTADO-MAESTRO.md` y `CHANGELOG.md`.

---

## 4. Mapa de archivos clave

| Archivo | Qué es |
|---|---|
| `src/lib/data.ts` | **Capa de datos dual** (Supabase ↔ localStorage). API única de las páginas. |
| `src/lib/auth.tsx` | Auth (`AuthProvider`/`useAuth`). `isStaff` = rol real en BD. |
| `src/lib/crate.ts` | Genera el `.bat` de descarga local (DJ + usuario). |
| `src/lib/types.ts` | Tipos del dominio (reflejan `supabase/schema.sql`). |
| `src/components/DesignLoader.tsx` | Aplica temas/tokens del admin a `<html>`. |
| `src/app/globals.css` | Tokens de diseño + presets de tema (`html[data-theme=...]`). |
| `src/app/admin/page.tsx` | Panel admin/DJ (requiere sesión real). |
| `src/app/api/*` | Rutas server: `assistant` (Gemini), `spotify/tracks`, `youtube/search`, `health`, `cron/cleanup`. |
| `supabase/schema.sql` | Tablas + RLS + funciones. Migraciones extra: `phase-*.sql`, `fixes.sql`. |
| `desktop-app/src/main/tools.js` | **Motor** del descargador: auto-instala tools + arma args yt-dlp. |
| `desktop-app/src/main/index.js` | Proceso Electron + IPC + auto-update. |
| `.github/workflows/desktop-release.yml` | Compila y publica el `.exe` (GitHub Actions). |

---

## 5. Cómo trabajar en este repo

1. **Lee primero:** este archivo → [ESTADO-MAESTRO.md](./ESTADO-MAESTRO.md) (estado) →
   [ARCHITECTURE.md](./ARCHITECTURE.md) (cómo encaja).
2. **Si tocas LLM/IA** (assistant, Gemini): revisa la referencia de la API correspondiente.
3. **Haz el cambio mínimo** que mantenga el estilo del código vecino.
4. **Verifica** (build/typecheck; si aplica, levanta el preview).
5. **Documenta**: actualiza `ESTADO-MAESTRO.md` (estado) y `CHANGELOG.md` (qué se hizo).
6. **Convención de cierre:** algo pasa a 🔒 *cerrado* solo cuando funciona en prod + está
   verificado + documentado. Lo 🔒 no se toca "de pasada".

---

## 6. Estado actual (resumen; detalle en ESTADO-MAESTRO)

- ✅ **Comprobado:** web en prod (eventos, playlist, disfraces, temas/personalización, descarga
  masiva); **app de escritorio** descargando YouTube/Instagram (deno) y TikTok en H.264, con
  auto-update e instalador.
- 🟡 **En proceso:** repo → público (para que el auto-update del desktop funcione). App móvil
  Expo con Fases 0/1/2 en código (falta probar en dispositivo).
- ✅ **Migraciones de Supabase corridas** (2026-06-26) — chat, perfil, buzón, bloques, etc.
- ⛔ **Pendiente:** publicar APK móvil, icono propio del `.exe`, firma de código.

> Estado vivo y detallado + **puntos de continuidad por fase** en
> [ESTADO-MAESTRO.md](./ESTADO-MAESTRO.md) (sección **⭐ PARA LA SIGUIENTE IA**).
