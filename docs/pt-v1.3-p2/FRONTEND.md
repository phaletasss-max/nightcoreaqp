# FRONTEND.md — PT v1.3 P2

Versión: PT v1.3 P2

> Hereda [`docs/pt-v1.2-p1/FRONTEND.md`](../pt-v1.2-p1/FRONTEND.md) (estructura, estados,
> responsive, identidad). Aquí, los deltas de seguridad y agilidad en el cliente.

---

# AGILIDAD EN EL CLIENTE

- El frontend debe sentirse ligero: interfaz primero, música, usuario, contenido y
  decoración al final. Nunca invertir ese orden.
- **Diferir lo no crítico** (`next/dynamic`) — como NΞON — para no cargar el hilo inicial.
- **Renders:** reducir los innecesarios; memoizar solo con beneficio medible; evitar
  props que se recrean en cada render.
- **Efectos:** cada `useEffect` con propósito y cleanup (listeners, timers, rAF, canales).
- **Imágenes:** `loading="lazy"`, `decoding="async"`, `width`/`height` para evitar CLS,
  WebP/AVIF. **Video:** `preload="metadata"`, pausar fuera de vista.
- **Animaciones:** 60 FPS; respetar `prefers-reduced-motion`; el glitch solo en momentos
  clave, nunca infinito.

---

# SEGURIDAD EN EL CLIENTE

- El cliente valida por UX, **nunca** es fuente de verdad. La autorización real es la RLS.
- **Cero** `dangerouslySetInnerHTML`/`eval`. Escapar todo contenido de usuario.
- No guardar secretos en el cliente ni en localStorage.
- Preparar el cliente para la **CSP** (evitar inline no controlado; usar nonce/hash).

---

# REGLA

Toda mejora de frontend de esta fase debe mantener o mejorar tiempo de carga, INP y CLS,
sin romper la identidad visual ni la funcionalidad.
