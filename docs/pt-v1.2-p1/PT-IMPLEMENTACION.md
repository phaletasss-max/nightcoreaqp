# PT — Implementación (Roles · NΞON · Rendimiento)

Versión: PT v1.2 P1
Fecha: 2026-07-07
Estado: **Implementado en código, pendiente de aplicar SQL en Supabase + revisión final.**

> Parte de trabajo para revisión y handoff. Nada de esto se ha subido a `main`
> todavía (git push queda a la espera de autorización). El SQL **no se ejecutó**:
> se dejó preparado en archivos para aplicarlo cuando se indique.

---

## P1 — Sistema de roles (CRÍTICA) ✅ código / 🟡 pendiente SQL

### Causa raíz encontrada
El cambio de rol desde el panel no persistía por **tres fallos encadenados**:

1. `updateProfileRole` hacía `supabase.from('profiles').update({ role })` **sin leer
   `.error`**. Cuando la RLS filtra la fila, PostgREST devuelve `200` con **0 filas**
   (no lanza error) → la función no se enteraba.
2. El panel actualizaba el estado local de forma **optimista** y su `try/catch` nunca
   disparaba (el error viaja en `.error`, no como excepción) → el rol "cambiaba" en
   pantalla y volvía a USER al recargar.
3. El flujo violaba ROLES.md/SECURITY.md: sin validación de backend garantizada, sin
   auditoría (`admin_logs` ni existía) y sin credencial-hash para ADMIN.

### Solución (implementada)
- **RPC `admin_set_role` (SECURITY DEFINER)** — única vía autorizada. Valida sesión +
  rol admin, exige credencial-hash para promover a ADMIN, actualiza el rol y registra
  en `admin_logs`. Equivalente Supabase-nativo a la Edge Function que pide el doc, y
  consistente con los RPC ya usados (`daily_check_in`, `add_points`).
- **Credencial-hash de ADMIN**: tabla `app_secrets` con RLS que niega TODO acceso; solo
  el RPC (owner) la lee. Se guarda como hash bcrypt (`crypt`+`gen_salt('bf')`). Nunca
  llega al frontend/JS/localStorage.
- **Auditoría**: tabla `admin_logs` (staff lee; nadie inserta/edita/borra directo).
- Frontend: `updateProfileRole` ahora llama al RPC y **devuelve `{ ok, error }`**; el
  panel pide la credencial con `prompt` al promover a ADMIN y muestra el error real.

### Archivos
- `supabase/phase-roles.sql` — **NUEVO** (aplicar en Supabase).
- `src/lib/data.ts` — `updateProfileRole` → RPC + retorno `{ ok, error }`.
- `src/app/admin/page.tsx` — `handleRoleChange` pide credencial + muestra error.

### ⚠️ SQL a aplicar cuando se indique (2 pasos)
1. Ejecutar `supabase/phase-roles.sql` completo.
2. Fijar la clave (una vez, reemplazando el secreto):
   ```sql
   insert into app_secrets (key, value)
   values ('admin_promo', crypt('TU-CLAVE-SECRETA', gen_salt('bf')))
   on conflict (key) do update set value = excluded.value, updated_at = now();
   ```

### DJ solo ve lo suyo ✅
- `src/app/admin/page.tsx`: un DJ solo ve **Métricas, Consola DJ y Encuestas**
  (`DJ_TABS`); el admin ve todo. Guard extra: si un DJ cae en una pestaña restringida,
  vuelve a Métricas. La seguridad real la sigue dando la RLS.

---

## P2 — Rendimiento (ALTA) ✅ primeras mejoras

- **Un solo video de fondo** confirmado: `fondoscenecoe.mp4` vía `GlobalPlayer`
  (una sola instancia). No quedan referencias a los borrados `glitch-bg.mp4` /
  `section-glitch.mp4`.
- **Código muerto eliminado**: `VideoBackground.tsx` y `ScenecoreBackground.tsx`
  estaban **importados en `page.tsx` pero nunca renderizados** (canvas de estrellas +
  iframes de YouTube que no se montaban). Se quitaron los imports y se borraron los
  archivos → menos bundle en la home.

- **Fondo idle pausa en pestañas ocultas** (`GlobalPlayer.tsx`): efecto
  `visibilitychange` que pausa `fondoscenecoe` cuando `document.hidden` (ahorro real de
  CPU/GPU/batería) y lo reanuda al volver. No afecta la música del usuario (yt/stream).
  Verificado: con la pestaña oculta el `<video>` queda `paused`; sin errores.
- **Barrido de código muerto**: borrado `CommunityFeed.tsx` (huérfano, reemplazado por
  `LiveFeed`).

### Pendiente P2 (auditoría PAUSADA hasta mañana por tokens)
- Se lanzó una auditoría multi-agente (7 dimensiones + verificación adversarial) pero se
  **detuvo por límite de tokens**. Retomar mañana para el diagnóstico completo.
- Ya identificado a mano: doble-fetch en `getSongs` (local + remoto en cada llamada) y
  consultas repetidas; auditar listeners/`requestAnimationFrame`/timers y `useEffect`.

---

## P3 — NΞON (MEDIA) ✅ Fase 1

Evolución del asistente "Nightie" → **NΞON** (no rehecho, evolucionado):

- `src/app/api/assistant/route.ts`: nuevo `SYSTEM` con identidad, lore 2012, tono y
  lenguaje (frecuencias/BPM/glitches, con moderación), regla de no-secretos y errores
  "humanizados". Acepta `role` y `page` para **ajustar el tono** (el rol NO da permisos,
  solo tono). Conserva el conocimiento práctico de la web.
- `src/components/Assistant.tsx`: renombrado a NΞON, **saludo de primera visita/regreso**
  (localStorage, sin API) y **comandos `/…` locales** (`/help /status /neon /version
  /ping /glitch /profile /music /party`) que responden al instante **sin gastar cuota**.
- Verificado en preview: la home renderiza sin los componentes borrados; NΞON abre con
  su saludo e identidad, y `/status` responde local ("Signal Stable 🔷…").

### P3 Fase 2 ✅ (local, sin coste de API)
- **Easter eggs** de cultura 2000s (NEON.md): Konata, Miku/Vocaloid, Windows XP, MSN,
  Ares, Rakion, GunBound, StepMania/Audition, Happy Hardcore → respuesta local con
  personalidad, solo en mensajes cortos (no secuestra preguntas reales). Verificado:
  "Konata" → "Konata Izumi detectada 🎧…".
- **Saludo según la hora** (madrugada/mañana/tarde/noche) en el regreso.

### P3 Fase 3 ✅ — reacciones a la música (local, sin API)
- Con el chat abierto, al arrancar una canción NΞON comenta (frases rotativas de
  NEON.md). Límites: máx. 1 reacción cada 2 min, nunca con el fondo idle, nunca repite
  la misma pista (`Assistant.tsx` + `usePlayer`). Pendiente probar con música real en prod.

### Pendiente P3 (fases siguientes)
- Reacciones a logros/racha; estados del sistema y memoria contextual.

---

## P4 — Descargador / APK (MEDIA) 🟡 documentación + UX

- **Copy del modal más claro** (`src/components/DownloadInstructionsModal.tsx`): ahora
  dice que descarga de **YouTube/TikTok/Instagram/Facebook** (MP3/MP4) y explica que el
  instalador **prepara solo yt-dlp/ffmpeg** (el usuario no instala nada a mano).
  Verificado en preview. El `.exe` sigue siendo el botón principal; el `.bat` es
  secundario ("¿sin instalar?").
- **Lanzador `.bat`** ✅ `public/downloads/Instalar_Descargador.bat`: detecta el `.exe`
  instalado (lo abre) o baja el Setup del release oficial y lo ejecuta, explicando todo.
- **Exportar herramientas** ✅ en `desktop-app`: botón "🧰 Exportar herramientas" →
  copia yt-dlp/ffmpeg/ffprobe/deno (sin canciones) a una carpeta elegida + LEEME.txt.
  Archivos: `src/main/index.js` (IPC `export-tools`), `src/preload/index.js`,
  `src/renderer/index.html`, `src/renderer/src/main.js`. Sintaxis validada con Node;
  el `.exe` lo compila el CI en la próxima release (v0.1.8).
- Pendiente P4: APK (reescribir doc al retomarlo).

---

## P5 — Estabilidad (ALTA, al final) 🟡

- Hecho: eliminación de **3 componentes muertos** (`VideoBackground`,
  `ScenecoreBackground`, `CommunityFeed`); `tsc --noEmit` limpio y **`npm run build` OK**
  tras todos los cambios.
- Pendiente: barrido de código muerto restante (exports/utils sin uso), simplificaciones
  y **regresión final** (login, registro, roles, reproductor, playlists, IA, admin, DJ,
  descargador).

---

## Verificación registrada
- `npx tsc --noEmit` → **exit 0** tras todos los cambios.
- Preview (`next dev`): home OK sin errores de consola; NΞON abre, saluda y ejecuta
  comandos locales.

## Punto de continuidad
1. Aplicar `phase-roles.sql` + fijar la clave admin en Supabase.
2. Probar en prod: DJ persiste; ADMIN pide clave; auditoría en `admin_logs`.
3. Continuar P2 (consultas/renders) y P3 (reacciones NΞON).
4. Regresión final y, con autorización, commit + push.
