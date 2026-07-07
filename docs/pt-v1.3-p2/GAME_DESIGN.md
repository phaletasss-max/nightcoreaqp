# GAME_DESIGN.md — PT v1.3 P2

Versión: PT v1.3 P2

> La especificación de gamificación (reputación, insignias, logros, eventos, easter eggs,
> economía de puntos) vive en [`docs/pt-v1.2-p1/GAME_DESIGN.md`](../pt-v1.2-p1/GAME_DESIGN.md)
> y **no cambia** en esta fase.

---

# NOTA DE LA FASE

Esta fase (ciberseguridad + agilidad) **no** añade ni modifica mecánicas de juego. Solo
aplican dos consideraciones transversales:

- **Seguridad:** los puntos/racha/logros se otorgan por backend (RPC como `add_points`,
  `daily_check_in`), nunca desde el cliente directamente — verificar que sigue siendo así
  para evitar que se "hackeen" desde la consola.
- **Rendimiento:** los contenedores de gamificación (retos, feed, rankings) deben cargar
  sin bloquear y con paginación/skeletons donde aporte.

Cualquier mecánica nueva es backlog de una fase posterior.
