# PT v1.3 · P2 — Ciberseguridad + Agilidad Web

Versión: PT v1.3 P2
Estado: **Planificación** (arranca sobre la base cerrada de PT v1.2 P1)

> Segunda fase de partes de trabajo (PT). Hereda la estructura y las reglas de
> [`docs/pt-v1.2-p1/`](../pt-v1.2-p1/). El **foco de esta fase** es doble:
>
> 1. **Ciberseguridad** — endurecer el sistema de punta a punta (RLS, cabeceras,
>    CSP, rate limiting, auditoría, secretos, dependencias).
> 2. **Agilidad web** — que la página cargue y responda rápido incluso en equipos
>    modestos (bundle, renders, consultas, recursos, percepción de velocidad).
>
> No se añaden funciones nuevas salvo que sean necesarias para seguridad o
> rendimiento. La identidad, funcionalidades y arquitectura de v1.2 se preservan.

---

## Índice de documentos

| Documento | Propósito |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | Metodología obligatoria de la fase (hereda v1.2 + foco). |
| [PROJECT_PHILOSOPHY.md](./PROJECT_PHILOSOPHY.md) | Principios y prioridades de la fase. |
| [TODO.md](./TODO.md) | Tareas concretas de la fase (seguridad + agilidad). |
| [ROADMAP.md](./ROADMAP.md) | Plan por sub-fases con criterios de cierre. |
| [SECURITY.md](./SECURITY.md) | **Núcleo.** Política, threat model, hardening y checklist. |
| [PERFORMANCE.md](./PERFORMANCE.md) | **Núcleo.** Plan de agilidad, presupuesto y métricas. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Consideraciones de arquitectura para la fase. |
| [DATABASE.md](./DATABASE.md) | Seguridad y rendimiento de datos (RLS, índices, consultas). |
| [FRONTEND.md](./FRONTEND.md) | Reglas de frontend para agilidad y seguridad de cliente. |
| [TESTING.md](./TESTING.md) | Plan de pruebas de seguridad y rendimiento. |
| [CODE_STYLE.md](./CODE_STYLE.md) | Estilo (hereda v1.2 + notas de la fase). |
| [AI_GUIDELINES.md](./AI_GUIDELINES.md) | Guías de IA para la fase (seguridad de NΞON). |
| [ROLES.md](./ROLES.md) | Roles/permisos (hereda v1.2 + deltas de seguridad). |
| [NEON.md](./NEON.md) | NΞON (hereda v1.2 + deltas de seguridad/rendimiento). |
| [DOWNLOADS.md](./DOWNLOADS.md) | Descargador (hereda v1.2 + deltas de seguridad). |
| [GAME_DESIGN.md](./GAME_DESIGN.md) | Gamificación (hereda v1.2; sin cambios de fase). |
| [ADR.md](./ADR.md) | Registro de decisiones de arquitectura de la fase. |
| [TECH_DEBT.md](./TECH_DEBT.md) | Deuda técnica priorizada. |
| [KNOW_ISSUES.md](./KNOW_ISSUES.md) | Problemas conocidos y su estado. |
| [PT-IMPLEMENTACION.md](./PT-IMPLEMENTACION.md) | Parte de trabajo vivo de la fase (handoff). |

---

## Regla de herencia

Los documentos de esta carpeta **no repiten** las especificaciones estables de
v1.2 (roles, base de datos, NΞON, descargador): las **heredan** y solo registran
los **deltas** de esta fase. Ante conflicto, gana el documento más reciente
(v1.3 P2) para lo relativo a seguridad y rendimiento; el resto sigue vigente en
v1.2 P1.
