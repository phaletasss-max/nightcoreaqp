# PT — Implementación (parte de trabajo vivo) · v1.3 P2

Versión: PT v1.3 P2
Fecha de apertura: 2026-07-07
Estado: **Planificación** (sin implementación aún)

> Parte de trabajo / handoff **vivo** de la fase. Se actualiza a medida que se
> implementa cada sub-fase, con: qué se hizo, archivos, verificación (incl. medición
> antes/después en rendimiento) y punto de continuidad. Espeja el formato del cierre de
> [v1.2 P1](../pt-v1.2-p1/PT-IMPLEMENTACION.md).

---

## Objetivo de la fase

Ciberseguridad + agilidad web, sin funciones nuevas ni cambios de identidad. Ver
[README.md](./README.md), [SECURITY.md](./SECURITY.md), [PERFORMANCE.md](./PERFORMANCE.md),
[TODO.md](./TODO.md) y [ROADMAP.md](./ROADMAP.md).

---

## Estado por sub-fase

| Sub-fase | Tema | Estado |
|---|---|---|
| 1 | Diagnóstico y medición (base) | ⛔ pendiente |
| 2 | Ciberseguridad: hardening (CSP, cabeceras, validación) | ⛔ pendiente |
| 3 | Ciberseguridad: anti-abuso (rate limiting, incidentes) | ⛔ pendiente |
| 4 | Agilidad: datos y consultas | ⛔ pendiente |
| 5 | Agilidad: recursos y bundle | ⛔ pendiente |
| 6 | Regresión y cierre | ⛔ pendiente |

---

## Registro de trabajo

> (Se irá llenando por sub-fase. Plantilla por entrada abajo.)

### [SUB-FASE X · fecha] — título
- **Diagnóstico:** …
- **Cambios:** archivos y qué se hizo.
- **Medición (rendimiento):** antes → después (LCP/INP/CLS, consultas, peso).
- **Seguridad:** qué se endureció; RLS intacta/reforzada.
- **Verificación:** `tsc`/build/lint + prueba real en preview.
- **Commits:** …

---

## Base heredada de v1.2 (punto de partida)

- Roles reales (RPC + credencial + auditoría). Cabeceras de seguridad básicas.
- Ligereza inicial: video `preload=metadata`, imgs lazy, flyer WebP, NΞON diferido,
  código muerto purgado.
- Sin secretos en el repo; sin `dangerouslySetInnerHTML`/`eval`.

## Punto de continuidad (arranque)

1. Ejecutar **Sub-fase 1**: auditoría de seguridad + medición de rendimiento base
   (registrar números y hallazgos priorizados aquí).
2. Con el diagnóstico, confirmar/ajustar las propuestas de [ADR.md](./ADR.md) (CSP,
   caché de datos, rate limiting).
3. Implementar por sub-fases, verificando y midiendo cada una.
4. Regresión final + documentación + actualizar `ESTADO-MAESTRO.md` y `CHANGELOG.md`.
