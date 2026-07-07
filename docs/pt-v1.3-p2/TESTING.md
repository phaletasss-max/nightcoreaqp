# TESTING.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Plan de pruebas de la fase

> Hereda [`docs/pt-v1.2-p1/TESTING.md`](../pt-v1.2-p1/TESTING.md). Foco: pruebas de
> **seguridad** y **rendimiento**, más regresión funcional.

---

# GATES OBLIGATORIOS (cada cambio)

- `npx tsc --noEmit` → 0.
- `npm run build` → verde.
- `npx eslint src` → limpio.
- Verificación en preview del comportamiento real (no solo compilación).

---

# PRUEBAS DE SEGURIDAD

- **RLS:** intentar leer/escribir datos de otro usuario desde el cliente (debe fallar).
- **Roles:** un no-admin no puede cambiar roles; ADMIN exige credencial; queda en `admin_logs`.
- **CSP:** validar en `report-only` que no rompe YouTube/imágenes/fuentes antes de enforce.
- **XSS:** inyectar `<script>`/HTML en comentarios, guestbook y chat → debe escaparse.
- **Secretos:** `git log`/scan del repo sin claves; `/api/*` no filtra info sensible.
- **Rate limiting:** repetir login/registro/roles/NΞON/descargas → debe limitar.
- **Dependencias:** `npm audit` en los 4 paquetes.

---

# PRUEBAS DE RENDIMIENTO

- **Base:** Lighthouse + Web Vitals (LCP/INP/CLS) en Home, Playlist, Disfraces, Perfil.
  Registrar números antes de optimizar.
- **Red:** confirmar que recursos pesados no bloquean la carga inicial (video parcial,
  imágenes lazy). Contar consultas por página (deben bajar tras dedup).
- **Después:** volver a medir y comparar; registrar en `PT-IMPLEMENTACION.md`.
- **Equipo modesto:** probar con CPU throttling (4–6x) en DevTools para simular tirones.

---

# REGRESIÓN FUNCIONAL (antes de cerrar la fase)

Login · registro · roles (persistencia + credencial admin) · perfil · reproductor ·
playlists · buscador · favoritos · NΞON (comandos/botones/permisos) · eventos · admin ·
panel DJ · descargador (.bat/.exe) · APK (comunidad + descargas).

Toda regresión detectada tiene prioridad sobre nuevas mejoras.
