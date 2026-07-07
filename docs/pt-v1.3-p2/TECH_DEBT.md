# TECH_DEBT.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Registro vivo de deuda técnica

> Hereda [`docs/pt-v1.2-p1/TECH_DEBT.md`](../pt-v1.2-p1/TECH_DEBT.md). Cada deuda:
> descripción, impacto, riesgo, prioridad y propuesta.

---

## Formato

| Id | Descripción | Impacto | Riesgo | Prioridad | Propuesta |
|---|---|---|---|---|---|

---

## Deuda identificada (arranque de la fase)

| Id | Descripción | Impacto | Riesgo | Prioridad | Propuesta |
|---|---|---|---|---|---|
| TD-1 | `getSongs` hace doble fetch (local+remoto) y varias páginas lo llaman por separado | Consultas repetidas / carga | Medio | Alta | Dedup/caché en `src/lib/data.ts` |
| TD-2 | Falta CSP; XSS solo mitigado parcialmente | Seguridad | Medio | Alta | CSP report-only → enforce (ADR-1) |
| TD-3 | Sin rate limiting explícito en endpoints sensibles | Abuso/bots | Medio | Alta | Límites en RPC/Edge (ADR-3) |
| TD-4 | `fondoscenecoe.mp4` 2.7 MB (ya `preload=metadata`, pero pesado) | Carga/red | Bajo | Media | Recomprimir bitrate/resolución |
| TD-5 | Warnings de `npm` en mobile-app (peer deps, "moderate vulnerabilities") | Mantenimiento | Bajo | Media | Revisar con `npm audit`; no `--force` |
| TD-6 | `docs/pt/pt-11-app-movil-descargas.md` desactualizado (APK) | Documentación | Bajo | Baja | Reescribir al retomar el APK |
| TD-7 | Repo privado obliga a proxy para `.exe`/`.apk` | Infra/distribución | Bajo | Baja | Decidir público vs Storage propio |

---

## Regla

No acumular deuda en silencio: registrar aquí al detectarla, y resolver la de prioridad
alta dentro de la fase. La deuda de rendimiento/seguridad tiene prioridad sobre nuevas
mejoras estéticas.
