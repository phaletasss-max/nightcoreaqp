# Nightcore AQP — léeme antes de tocar código

Hub web + comunidad para fiestas de nightcore/scenecore en Arequipa (Vercel + Supabase + app de
escritorio Electron + media-service). Sin fines de lucro, en producción.

**Guías:** [docs/GUIA-IA.md](docs/GUIA-IA.md) — objetivo, arquitectura y **reglas para no romper**.
· [docs/ESTADO-MAESTRO.md](docs/ESTADO-MAESTRO.md) — estado vivo (hecho / en proceso / pendiente).
· [docs/DESCARGADOR.md](docs/DESCARGADOR.md) — el descargador (.bat web + .exe + media-service) y sus reglas.

## Reglas críticas (resumen — detalle en docs/GUIA-IA.md)

- **Capa de datos dual** (`src/lib/data.ts`): API única de las páginas; Supabase **o** localStorage
  demo (`if (cfg())`). No la rompas.
- **Seguridad = RLS de Supabase**, no el cliente. El admin exige sesión real (rol admin/dj). **No**
  metas credenciales/claves hardcodeadas (el repo puede ser público).
- **Push a `main` = deploy a producción (Vercel).** No commitees secretos.
- **Tailwind v4 / Lightning CSS**: no escribas `-webkit-` a mano; no metas `var()` dentro de
  `blur()`. `desktop-app/` tiene su propio `postcss.config.cjs` vacío a propósito.
- **Desktop**: `deno` es obligatorio para YouTube (nsig); las tools se auto-instalan a `userData/bin`.
- **Verifica** (`npx tsc --noEmit` / `npm run build`) y **documenta** (`ESTADO-MAESTRO.md`,
  `CHANGELOG.md`) antes de cerrar.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
