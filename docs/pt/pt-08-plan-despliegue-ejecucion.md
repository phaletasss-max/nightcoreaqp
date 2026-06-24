# Plan de Trabajo (PT-08) - Plan de Despliegue y Ejecución

## 1. Entorno de Producción
*   **Hosting Frontend:** Vercel (ideal para Next.js App Router).
*   **Base de Datos:** Supabase Cloud (Proyect Region: N. Virginia o la más cercana a Perú para menor latencia).
*   **Media Service VPS (Opcional pero recomendado):** Instancia EC2 o DigitalOcean Droplet con Python/FastAPI + `yt-dlp` expuesto para delegar la descarga de MP3/MP4, evitando bloqueos de Vercel (Timeouts de 10s).

## 2. CI/CD (Integración y Despliegue Continuo)
1.  **Ramas Git:**
    *   `main`: Entorno de producción (despliega automático en Vercel).
    *   `develop`: Entorno local de pruebas.
2.  **Verificación Pre-Deploy:**
    *   Uso de GitHub Actions para correr `npm run typecheck` y `npm run lint` antes de permitir un merge a `main`.
3.  **Variables de Entorno Estrictas:**
    *   Asegurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurados en Vercel.

## 3. Migraciones de Base de Datos
1.  Nunca editar el esquema en vivo durante un evento.
2.  Mantener control de versiones de la BD usando el CLI de Supabase (`supabase db push`).
3.  Todas las migraciones (como `phase-1-attendance.sql` y `phase-de.sql`) deben tener scripts de "rollback" probados en local antes de impactar producción.

## 4. Día del Evento (Ejecución)
*   Bloquear despliegues (Freezes) 24 horas antes del evento.
*   Tener el dashboard de Supabase abierto para monitorear errores de autenticación o bloqueos de Storage (Límites de ancho de banda).
