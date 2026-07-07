# DOWNLOADS.md — PT v1.3 P2

Versión: PT v1.3 P2

> La arquitectura del descargador (descargas locales `.bat`/`.exe`, media-service,
> deno para YouTube, APK) vive en [`docs/pt-v1.2-p1/DOWNLOADS.md`](../pt-v1.2-p1/DOWNLOADS.md)
> y en el doc maestro [`docs/DESCARGADOR.md`](../DESCARGADOR.md). Aquí, deltas de la fase.

---

# ESTADO ACTUAL (implementado en v1.2)

- Descargas **locales** (nunca server-side): `.bat` de la web, app `.exe` (Electron),
  APK (Expo). Lanzador `Instalar_Descargador.bat`; "Exportar herramientas" en el `.exe`.
- Proxy de releases en `media-service` (`/api/release/exe|apk`) con `GITHUB_TOKEN`; busca
  en los últimos 15 releases (el APK sobrevive a nuevas versiones del `.exe`).

---

# DELTAS DE ESTA FASE (seguridad + agilidad)

- **Seguridad:** el sistema de descargas nunca ejecuta código recibido del usuario; validar
  plataformas permitidas; el `.bat` lanzador solo baja del release oficial; `GITHUB_TOKEN`
  solo en el server; no loguear secretos. Rate limiting a las descargas.
- **Agilidad:** el descargador está aislado del reproductor (si falla, la música sigue). Su
  UI no debe pesar en la carga de la web principal.
- **Backlog:** muro de comentarios de disfraces en el APK; reescribir
  `docs/pt/pt-11-app-movil-descargas.md`; decidir repo público vs distribución propia.
