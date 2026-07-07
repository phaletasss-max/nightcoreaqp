# PERFORMANCE.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Plan de agilidad de la fase (núcleo)

> Hereda [`docs/pt-v1.2-p1/PERFORMANCE.md`](../pt-v1.2-p1/PERFORMANCE.md). Aquí se
> define el **plan de agilidad** de esta fase: qué medir, qué optimizar y en qué orden.

---

# PRINCIPIO

**Medir antes de optimizar. Optimizar. Medir de nuevo. Documentar.** Nunca optimizar
por intuición. La página debe sentirse rápida incluso en equipos modestos, sin
sacrificar la identidad (glitch/scenecore/Winamp) ni funcionalidades.

---

# MÉTRICAS OBJETIVO (Web Vitals)

| Métrica | Objetivo | Dónde |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5 s | Home, Playlist, Disfraces |
| INP (Interaction to Next Paint) | < 200 ms | interacciones clave |
| CLS (Cumulative Layout Shift) | < 0.1 | todas |
| TTI / bloqueo del hilo | mínimo | Home |
| Peso inicial transferido | lo menor posible | Home |

Herramientas: Lighthouse, panel Network, `PerformanceObserver`/Web Vitals, y el
propio build de Next.

---

# YA HECHO EN v1.2 (base de la que partimos)

- Un solo video de fondo; pausa en pestaña oculta (`visibilitychange`).
- Video `preload="metadata"` (descarga parcial, no los 2.7 MB de golpe).
- 28 `<img>` con `loading="lazy" decoding="async"`.
- Flyer default a WebP (1.22 MB → 190 KB).
- NΞON diferido (`next/dynamic ssr:false`).
- Código muerto y assets sin uso purgados.

---

# PLAN DE OPTIMIZACIÓN (esta fase, por impacto/riesgo)

## Nivel 1 — Datos y consultas (alto impacto, riesgo medio)
- **`getSongs` hace doble fetch** (localStorage + Supabase) en cada llamada, y lo
  invocan varias páginas por separado → deduplicar/cachear (p. ej. un cache en memoria
  con TTL corto, o un provider). Medir consultas antes/después.
- Agrupar consultas de montaje con `Promise.all`; paginar listas largas (canciones,
  disfraces, historial, logs).
- Revisar suscripciones Realtime: limpieza correcta y sin duplicados.

## Nivel 2 — Render y reactividad (medio, riesgo medio)
- Auditar `useEffect`/listeners/`setInterval`/`requestAnimationFrame` sin cleanup.
- Reducir re-renders por contextos que cambian seguido (`PlayerContext`, `AuthProvider`):
  memoizar donde haya beneficio **medible**, no por costumbre.

## Nivel 3 — Recursos (medio, riesgo bajo)
- Recomprimir `fondoscenecoe.mp4` a menor bitrate/resolución manteniendo el look.
- Migrar imágenes restantes a WebP/AVIF; añadir `width`/`height` para evitar CLS;
  `srcset`/tamaños responsivos donde aporte.

## Nivel 4 — Bundle (medio, riesgo bajo)
- `next/dynamic` para vistas pesadas y poco usadas (paneles admin, modales grandes).
- Confirmar tree-shaking de `lucide-react` (imports nombrados) y que no entren libs
  innecesarias. Revisar chunks grandes del build.

## Nivel 5 — Percepción (bajo, riesgo bajo)
- Skeletons/placeholders en contenedores que traen datos (evitar saltos y "vacíos").
- Priorizar el contenido "above the fold"; diferir lo decorativo.

---

# REGLAS

- Cada optimización registra su medición **antes/después** en `PT-IMPLEMENTACION.md`.
- No romper la identidad visual ni funcionalidades por rendimiento.
- Respetar `prefers-reduced-motion`.
- Preferir bajo riesgo/alto impacto; los cambios en la capa de datos core requieren
  verificación extra.

---

# DEFINICIÓN DE ÉXITO DE LA FASE

Web Vitals mejorados respecto a la base medida, menos consultas por página, bundle
inicial más liviano, y sensación de fluidez en equipos modestos — todo sin
regresiones funcionales ni pérdida de identidad.
