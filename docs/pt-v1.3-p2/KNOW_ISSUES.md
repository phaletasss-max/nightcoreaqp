# KNOW_ISSUES.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Registro vivo de problemas conocidos

> Hereda [`docs/pt-v1.2-p1/KNOW_ISSUES.md`](../pt-v1.2-p1/KNOW_ISSUES.md). Problemas
> conocidos, su estado y workaround.

---

## Formato

| Id | Problema | Estado | Workaround / plan |
|---|---|---|---|

---

## Issues al arranque de la fase

| Id | Problema | Estado | Workaround / plan |
|---|---|---|---|
| KI-1 | Repo privado → descarga anónima del `.exe`/`.apk` da 404 | Mitigado | Proxy en `media-service` (`/api/release/*`) con `GITHUB_TOKEN` |
| KI-2 | Proxy solo miraba `releases/latest` | Resuelto (v1.2) | Ahora busca en los últimos 15 releases; requiere redeploy en Render |
| KI-3 | Push a GitHub a veces "Repository not found" (intermitente) | Observado | Reintentar; suele ser propagación temporal |
| KI-4 | Sin CSP → XSS no totalmente mitigado | Abierto | Sub-fase 2 (report-only → enforce) |
| KI-5 | Sin rate limiting explícito | Abierto | Sub-fase 3 |
| KI-6 | APK: falta muro de comentarios de disfraces (sí tiene el de eventos) | Abierto | Backlog móvil |

---

## Regla

Todo issue nuevo se registra aquí con su estado real. Al resolverse, se marca y se
documenta la solución (con el commit) en `PT-IMPLEMENTACION.md`/`CHANGELOG.md`.
