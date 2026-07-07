# CODE_STYLE.md — PT v1.3 P2

Versión: PT v1.3 P2

> Hereda [`docs/pt-v1.2-p1/CODE_STYLE.md`](../pt-v1.2-p1/CODE_STYLE.md) por completo.
> El estilo del proyecto **no cambia** en esta fase.

---

# RECORDATORIOS APLICABLES A LA FASE

- Consistencia sobre preferencia personal; usar el patrón que ya usa el proyecto.
- Nombres que describan intención; funciones de una sola responsabilidad.
- Comentar solo lo no obvio (algoritmos, decisiones, workarounds, seguridad).
- Sin `catch {}` vacíos: registrar/explicar/recuperar.
- Imports nombrados (tree-shaking); sin imports sin uso; sin dependencias circulares.
- Sin números mágicos: centralizar límites/timeouts/roles/URLs.

---

# NOTAS DE LA FASE

- **Seguridad legible:** el código que valida permisos o maneja secretos debe ser claro y
  auditable; comentar el "porqué" de cada control.
- **Rendimiento medible:** las optimizaciones llevan un comentario corto con el motivo
  (ej. "diferido para aligerar la carga inicial") y su medición queda en el parte de trabajo.
- **Tailwind v4 / Lightning CSS:** no escribir `-webkit-` a mano; evitar `var()` dentro de
  `blur()`; preferir CSS longhand cuando el shorthand dé problemas (ej. `animation`).
