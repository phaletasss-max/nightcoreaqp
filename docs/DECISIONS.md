# Decisiones confirmadas

Registro de decisiones cerradas. Si algo está aquí, ya se acordó y no se vuelve a discutir
(salvo que se anote explícitamente un cambio con nueva fecha).

---

### 2026-06-20 — Identidad del proyecto
- Club organizado por **Yorch**. Web hecha por **"Los Simpatizantes de JP"**.
- **Sin fines de lucro**, público (código y dominios). Edición actual: **Nightcore Arequipa 3**.

### 2026-06-20 — Arquitectura: 3 piezas
- **Frontend** Next.js/Vercel + **Supabase** (BD/Auth/Storage/Realtime) + **media-service**
  (servidor Arch propio con `yt-dlp`/`ffmpeg`, reusando `bot-erp`).
- Motivo: `yt-dlp` **no puede correr en Vercel** (YouTube bloquea IPs de cloud).
- Ver [ARCHITECTURE.md](./ARCHITECTURE.md).

### 2026-06-20 — Verificación de cuentas
- **Fase 1: confirmación por email** (nativa de Supabase, gratis).
- WhatsApp/SMS OTP vía Twilio → **diferido** a fase posterior, solo si hay abuso real y Yorch
  asume el costo (~US$0.05/verificación).

### 2026-06-20 — Tagline
- Se descarta "Música acelerada, eventos reales".
- Provisional: **"El club de nightcore de Arequipa."** (fácil de cambiar; pendiente versión final).

### 2026-06-20 — Navegación (IA)
- **Quitar `Admin` y `Retos`** del nav público.
- `Admin`/Consola DJ: solo por URL directa con rol `dj`/`admin` (credenciales se crean luego).
- Contenido de `Retos` (racha, encuesta del día, fans del mes, historial) → se mueve al **feed
  de Eventos**.
- `Perfil`: solo accesible con sesión iniciada.
- **Notificaciones**: ícono en la barra superior (para usuarios logueados).

### 2026-06-20 — Orden de trabajo
- Empezar **Fase 1** (solo frontend + Supabase, sin servidor) de inmediato.
- Media-service (Fase 2) en paralelo cuando se confirme acceso HTTPS al servidor Arch.

---

## Pendiente de decidir
- ¿Servidor Arch siempre encendido y accesible por internet (dominio/IP/túnel HTTPS)?
- Tagline definitivo.
- Método de verificación de asistencia a eventos (QR en puerta vs código de staff).

## Plan de trabajo (anotado, no ejecutado aún)
- **Script de instalación del media-service** para Arch (`setup.sh`): instalar `yt-dlp` +
  `ffmpeg`, configurar `pm2` y un túnel HTTPS (Cloudflare Tunnel), en un solo comando.
  Pendiente hasta decidir el despliegue del servidor.
