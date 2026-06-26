# HANDOFF — empieza aquí

> Nota corta para quien retoma el proyecto (humano o IA). El estado vivo y detallado está en
> [`docs/ESTADO-MAESTRO.md`](docs/ESTADO-MAESTRO.md), sección **⭐ PARA LA SIGUIENTE IA**.

## 1. Lee primero (reglas para no romper)
1. [`AGENTS.md`](AGENTS.md) — reglas críticas (capa de datos dual, RLS, Tailwind v4, no secretos).
2. [`docs/GUIA-IA.md`](docs/GUIA-IA.md) — objetivo, arquitectura y reglas de no-romper.
3. [`docs/ESTADO-MAESTRO.md`](docs/ESTADO-MAESTRO.md) → sección **⭐ PARA LA SIGUIENTE IA** (estado
   de cada área + dónde continuar) y [`CHANGELOG.md`](CHANGELOG.md).

## 2. Cómo se trabaja aquí
Todo en **partes de trabajo (PT) por fases**. Cada fase queda documentada con su **estado** y un
**punto de continuidad**. Al terminar algo: **verificar** (`tsc`/`build`/`expo export`) →
**documentar** (`ESTADO-MAESTRO.md` + `CHANGELOG.md`) → **commit + push a `main`** (push = deploy
a producción en Vercel; nunca commitees secretos).

## 3. Estado por área (2026-06-26)
| Área | Hecho | Siguiente |
|---|---|---|
| **Perfil hi5** (web, §14) | Fase A ✅ desplegada | Fase B: guestbook + reactions (necesita migraciones nuevas) |
| **Panel DJ + roles** (web, §15) | Fase A + B ✅ desplegadas | Fase C (vincular DJ↔perfil) ⏸️ |
| **App móvil** (Expo, §16) | Fases 0+1+2 ✅ (6 pantallas; `tsc`+`expo export` OK, **sin probar en dispositivo**) | Fase 3 (PT 3.x): subir foto, DJ móvil, encuestas |

## 4. Reglas de oro (no romper)
1. Descargas **siempre locales** (`.bat` web / Electron) — nunca server-side (Vercel/Render bloqueados por YouTube).
2. Seguridad = **RLS de Supabase**, no el cliente.
3. Capa de datos dual `if(cfg())` en `src/lib/data.ts` (Supabase **o** localStorage demo).
4. El móvil (`mobile-app/`) **no importa** nada de `src/`.
5. Tailwind v4 / Lightning CSS: sin `-webkit-` a mano, sin `var()` dentro de `blur()`.

## 5. Acciones que solo hace el dueño (no la IA)
Repo → público (auto-update desktop) · probar el móvil en Expo Go · correr SQL en Supabase ·
decisiones de producto (Play Store vs APK, push). Las 10 migraciones de features ya están
corridas (2026-06-26); solo faltaría `site_settings_setup.sql` si el gestor de diseño no persiste.

## 6. Verificar antes de cerrar
- Web: `npx tsc --noEmit` y/o `npm run build`.
- Móvil (`cd mobile-app`): `npm install --legacy-peer-deps` → `npx tsc --noEmit` →
  `npx expo export --platform android` (no hay emulador en el entorno de la IA; probar runtime en Expo Go).
