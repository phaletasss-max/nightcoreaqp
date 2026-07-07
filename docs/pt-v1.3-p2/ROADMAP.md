# ROADMAP.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Planificación

> Plan por sub-fases. Cada una se cierra solo cuando: funciona en prod, está
> verificada (prueba registrada) y documentada. No saltar etapas.

---

## Leyenda
✅ hecho · 🟡 en proceso · ⛔ pendiente · ⏸️ aparcado

---

## Sub-fase 1 — Diagnóstico y medición (base) ⛔
Objetivo: tener números y un mapa de riesgos antes de tocar nada.
- ⛔ Auditoría de seguridad (RLS, funciones, `/api`, secretos, `npm audit`).
- ⛔ Medición de rendimiento base (Web Vitals, bundle, recursos).
- **Cierre:** informe de hallazgos priorizado por impacto/riesgo.

## Sub-fase 2 — Ciberseguridad: hardening de bajo riesgo ⛔
- ⛔ CSP en `report-only` → enforce.
- ⛔ Afinar cabeceras + HSTS.
- ⛔ Validación/sanitización de entradas en backend.
- ⛔ Revisión de policies de Storage.
- **Cierre:** sin regresiones; RLS/CSP verificadas; checklist de despliegue seguro.

## Sub-fase 3 — Ciberseguridad: anti-abuso ⛔
- ⛔ Rate limiting (login, registro, roles, NΞON, descargas).
- ⛔ Procedimiento de respuesta a incidentes y rotación de claves.
- **Cierre:** límites probados; documentación de incidentes.

## Sub-fase 4 — Agilidad: datos y consultas ⛔
- ⛔ Dedup/caché de `getSongs`; agrupar consultas; paginación.
- ⛔ Limpieza de Realtime/listeners/timers.
- **Cierre:** menos consultas por página (medido); sin fugas.

## Sub-fase 5 — Agilidad: recursos y bundle ⛔
- ⛔ Recomprimir video; imágenes a WebP/AVIF; responsive.
- ⛔ Code-splitting de vistas pesadas.
- **Cierre:** Web Vitals mejorados vs base (medido).

## Sub-fase 6 — Regresión y cierre ⛔
- ⛔ Regresión funcional completa.
- ⛔ Documentación final (antes/después de rendimiento, estado de seguridad).
- **Cierre:** fase publicada y documentada.

---

## Dependencias entre sub-fases
La Sub-fase 1 (diagnóstico) **habilita** el resto: no se optimiza ni se endurece
sin medir/mapear primero. Las de seguridad (2–3) y agilidad (4–5) pueden avanzar
en paralelo si no se pisan; la 6 cierra.
