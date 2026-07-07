# TODO.md — PT v1.3 P2 (Ciberseguridad + Agilidad)

Versión: PT v1.3 P2
Estado: Planificación

> Antes de tocar código: analizar, diagnosticar y medir. Implementar por fases
> pequeñas, verificando cada una. No romper funcionalidades ni identidad.

---

## EJE A — CIBERSEGURIDAD

### A1. Auditoría de seguridad (diagnóstico) — ALTA
- [ ] Revisar TODAS las policies RLS: cada tabla sensible con lectura/escritura correctas.
- [ ] Revisar funciones `SECURITY DEFINER` (search_path fijo, `revoke from public`).
- [ ] Buscar secretos/keys en el repo y el historial de git.
- [ ] Revisar rutas `/api/*`: qué exponen, quién puede llamarlas, validación de entrada.
- [ ] `npm audit` (web, mobile, media-service, desktop-app) → clasificar vulnerabilidades.

### A2. Cabecera de seguridad + CSP — ALTA
- [ ] Añadir **Content-Security-Policy** (con pruebas: YouTube iframe, i.ytimg, Supabase,
      data: URIs, fuentes). Empezar en `report-only`, luego enforce.
- [ ] Revisar/afinar las cabeceras ya puestas (X-Frame-Options, Referrer-Policy, etc.).
- [ ] `Strict-Transport-Security` (HSTS) donde aplique.

### A3. Rate limiting y anti-abuso — ALTA
- [ ] Límites en: login, registro, cambios de rol, consultas a NΞON, descargas, inserts masivos.
- [ ] Definir dónde vive (Edge/RPC/middleware) sin depender solo del cliente.

### A4. Validación y sanitización — MEDIA
- [ ] Validar toda entrada de usuario en backend (nombres, comentarios, URLs, playlists).
- [ ] Confirmar que no hay `dangerouslySetInnerHTML`/`eval` ni XSS reflejado/almacenado.

### A5. Storage y datos — MEDIA
- [ ] Revisar policies de cada bucket (público vs privado). URLs firmadas donde corresponda.
- [ ] Confirmar que `admin_logs`/`app_secrets` siguen bloqueadas.

### A6. Dependencias y supply chain — MEDIA
- [ ] Actualizar dependencias con CVE (sin romper). Fijar versiones.
- [ ] Revisar scripts de build/CI por ejecución de código no confiable.

### A7. Respuesta a incidentes — BAJA
- [ ] Documentar procedimiento de rotación de claves y recuperación de acceso admin.

---

## EJE B — AGILIDAD WEB

### B1. Medición base (antes de optimizar) — ALTA
- [ ] Lighthouse / Web Vitals (LCP, INP, CLS) en Home, Playlist, Disfraces, Perfil.
- [ ] Tamaño de bundle por ruta y peso de recursos. Registrar números base.

### B2. Datos y consultas — ALTA
- [ ] Deduplicar/cachear `getSongs` (doble fetch local+remoto; varias páginas lo llaman).
- [ ] Detectar consultas repetidas al montar; agrupar/`Promise.all`; paginar listas.
- [ ] Revisar canales Realtime: que se limpien y no se dupliquen.

### B3. Render y reactividad — MEDIA
- [ ] Auditar `useEffect`/listeners/timers/rAF sin cleanup.
- [ ] Reducir re-renders por contexto que cambia seguido (memo donde aporte, medido).

### B4. Recursos — MEDIA
- [ ] Recomprimir `fondoscenecoe.mp4` (bitrate/resolución) manteniendo el look.
- [ ] Resto de imágenes a WebP/AVIF donde aporte; `srcset`/tamaños responsivos.

### B5. Bundle — MEDIA
- [ ] Code-splitting de vistas pesadas poco usadas (paneles) con `next/dynamic`.
- [ ] Confirmar tree-shaking de iconos (lucide) y que no entren libs innecesarias.

### B6. Percepción de velocidad — BAJA
- [ ] Skeletons/estados de carga en los contenedores que traen datos.
- [ ] Priorizar el contenido "above the fold".

---

## Cierre de la fase
- [ ] Regresión completa (login, roles, reproductor, playlists, IA, admin, DJ, descargador, APK).
- [ ] Documentar antes/después de rendimiento y el estado de seguridad.
- [ ] Actualizar `ROADMAP.md`, `CHANGELOG.md`, `ESTADO-MAESTRO.md`.
