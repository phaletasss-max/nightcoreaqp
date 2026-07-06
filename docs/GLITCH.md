# Sistema Glitch AQP — rebrand, estética glitch y personalización por usuario

> Referencia de TODO lo añadido en el rebrand a **Glitch AQP** (2026-07-06):
> dónde vive cada pieza, cómo se conectan y cómo repararlas si se rompen.

## 1. Rebrand

"Nightcore AQP" → "Glitch AQP" en todos los textos visibles de la **web**:

| Qué | Archivo |
|---|---|
| Metadata / OG / Twitter / PWA | `src/app/layout.tsx` |
| Manifest (nombre al instalar) | `src/app/manifest.ts` |
| Logo navbar (`GLITCHAQP` + glitch) | `src/components/Navbar.tsx` |
| Footer, chat, historial, perfil, player, `.bat` | reemplazo de string en `src/` |

**NO se renombró** (a propósito, para no romper): `desktop-app/` (appId
`com.nightcoreaqp.downloader` + productName — renombrarlo rompe el auto-update de
las apps instaladas), las URLs de GitHub Releases, la carpeta del repo, ni las
tablas/keys de Supabase. Ese rename va junto con una release nueva del `.exe`.

## 2. Kit CSS glitch (`src/app/globals.css`, bloque "Kit GLITCH")

| Clase | Efecto | Uso |
|---|---|---|
| `.glitch-text` | RGB split magenta/cián con cortes ("slices") | Necesita `data-text="mismo texto"` en el elemento. Con tema glitch corre solo; en otros temas, al hover. Aplicada en logo navbar y H1 del hero. |
| `.glitch-hover` | Sacudida + aberración cromática al hover | Flyers y tarjetas. |
| `.scanlines` | Overlay CRT por sección | Ponla a cualquier contenedor `relative`. |
| `.rainbow-stripe` | Franja de gradiente con colores DEL TEMA | Bordes del hero. |

`text-glow-rainbow` ahora usa variables del tema (`var(--magenta)`, etc.) en vez
de hex fijos → combina con cualquier tema.

Con `html[data-theme="glitch"]` activo, además: scanlines + viñeta CRT global
(`body::after`) y barra de "tear" que cruza la pantalla cada ~7 s (`body::before`).
Todo respeta `prefers-reduced-motion`.

**Si un efecto se rompe**: son solo CSS en `globals.css`; buscar "Kit GLITCH".
Cuidado con las reglas de Lightning CSS (ver GUIA-IA): no `-webkit-` a mano,
no `var()` dentro de `blur()`.

## 3. Tema "Glitch"

- Paleta: `html[data-theme="glitch"]` en `globals.css` (negro `#030306`, magenta
  `#ff00c8`, cián `#00f0ff`, verde `#39ff88`).
- Selector: entrada `glitch` en `THEME_OPTIONS` (`src/lib/designPresets.ts`).
- Se activa como cualquier tema: Admin → Diseño → Tema visual (persiste en
  `site_settings.design_theme`).

## 4. Videos de fondo

| Componente | Qué muestra | Cuándo se ve | z-index |
|---|---|---|---|
| `GlitchBackground.tsx` | `public/glitch-bg.mp4` | Global, SOLO con tema glitch activo (observa `data-theme` con MutationObserver) | -18 |
| `PageVideoManager.tsx` (layout) → `PageVideoBg.tsx` | lo que el admin configure | Por página, según **Admin → Diseño → Videos de fondo por página** | -17 |

Ambos: `<video autoplay muted loop playsinline>`, `position:fixed`, opacidad baja,
y **si el archivo no existe simplemente no se montan** (onError) — nunca rompen la
página. La capa oscura del admin (overlay, z -5) los oscurece.

### Gestor "Videos de fondo por página" (2026-07-06e)

- El admin sube un video (bucket `media`) o pega una URL y marca en qué páginas se ve:
  una, varias o "Todas las páginas". UI: `src/components/PageVideoAdmin.tsx`.
- Persistencia: `site_settings[design_page_videos]` = JSON `{ pageKey: url }`.
  Catálogo de páginas + resolver: `src/lib/pageVideos.ts` (una página específica
  pisa la clave `all`). **Default de fábrica**: Playlist → `/section-glitch.mp4`
  (aplica solo si el admin nunca guardó nada; se quita desde el panel).
- Render: `PageVideoManager` (montado en `layout.tsx`) resuelve la ruta actual y
  pinta `PageVideoBg`; se actualiza en vivo con el evento `nq-design-updated` y
  cachea en `localStorage[nq_page_videos_cache]`.
- **Anti-superposición**: `GlobalPlayer` usa `usePageVideoUrl()` y oculta el fondo
  idle de la radio (`fondoscenecoe.mp4`) en cualquier página con video asignado.
  Al reproducir una canción, el visual del player sí se muestra.

Videos generados con **Veo 3** (~2.7 MB cada uno, tamaño ideal ≤10 MB).

## 5. Personalización por usuario ("Mi estilo")

**Modelo**: el admin define el **default global** (site_settings, como siempre);
cada usuario puede **pisar** SOLO sus claves de estilo, guardadas en
`localStorage['nq_user_design_<userId>']` (funciona igual con Supabase o demo).

- Claves que el usuario puede pisar: `USER_DESIGN_KEYS` en
  `src/lib/designPresets.ts` (tema, acento, fuente títulos, fuente texto, tamaño).
  Colores a medida, opacidades y secciones siguen siendo solo del admin.
- Catálogos de temas/fuentes/acentos: **únicos** en `src/lib/designPresets.ts`
  (el admin y el perfil importan de ahí — no dupliques).
- Merge: `DesignLoader.tsx` aplica `{...site_settings, ...getUserDesign(userId)}`.
  Eventos: `nq-design-updated` (admin guarda) y `nq-user-design-updated`
  (usuario cambia su estilo) re-aplican en vivo.
- UI: `src/components/UserDesignPanel.tsx`, aparece en `/perfil` al pulsar
  "Personalizar perfil". "Del sitio" = quitar overrides.

**Si el diseño de un usuario "se queda pegado"**: borrar
`localStorage['nq_user_design_...']` y `nq_design_cache`.

**Pendiente opcional**: persistir los overrides en una columna
`profiles.design_prefs jsonb` para que sigan al usuario entre dispositivos
(requiere migración SQL; hoy es por navegador).

## 6. Arreglos de perfil (2026-07-06)

- `uploadMediaFile` en modo demo devolvía `URL.createObjectURL` (blob que muere
  al recargar → "la foto se pierde"). Ahora `fileToPersistentUrl` en
  `src/lib/data.ts`: imágenes → dataURL webp reescalado a máx 1280px (no revienta
  localStorage); media grande → objectURL (solo esa sesión).
- `updateProfileAvatar` en demo escribía solo en `nq_profiles`, pero el perfil
  demo vive en `nq_demo_profile`/`nq_local_profile` → ahora actualiza ambos.
- Fondo del perfil: se quitó `mix-blend-screen` → el slider de opacidad se aplica
  literal (antes las imágenes se "lavaban").

## 7. Eventos completos en la home

- Tarjetas de DJs: salen para **cualquier** evento con DJs configurados en el
  admin (antes: hardcode `title.includes('Cyberpunk')` + DJs de relleno).
- "Extras del evento": usa el campo `details` real (bullets separados por coma).
- Detalle del evento: muestra flyer (columna derecha), precio
  (`ticket_price`, "Entrada gratuita" si 0) y bullets de `details`.
- Hero: flyer visible también en móvil/tablet (antes solo `lg:`), con botón
  "Conoce los detalles".
- `src/components/FlyerMedia.tsx` (nuevo): renderiza el flyer según su tipo
  real — imagen, MP4 (video en loop) o MP3 (player) — usado por Hero y la home.

## 8. Verificación

`npx tsc --noEmit` limpio + `npm run build` OK + revisión visual en localhost
(home, playlist, perfil con "Mi estilo", admin) el 2026-07-06.
