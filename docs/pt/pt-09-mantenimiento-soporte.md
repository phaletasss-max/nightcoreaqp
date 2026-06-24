# Plan de Trabajo (PT-09) - Mantenimiento, Soporte y Moderación

## 1. Mantenimiento Post-Lanzamiento
El mantenimiento de la app no solo involucra código, sino la administración de los activos digitales generados (MP4s, Fotos, Logs).

*   **Limpieza de Storage (Supabase):** Implementar un cron (o script manual en Node) que se ejecute 1 semana después de cada evento para eliminar MP4s cacheados de `media-service` y liberar espacio en la capa gratuita.
*   **Rotación de Base de Datos:** Archivar comentarios de eventos pasados (`event_comments`) para evitar lentitud en queries globales.

## 2. Soporte al Usuario
*   **Problemas de Acceso (Login):** Si un usuario pierde acceso a su cuenta (Magic Link no llega), usar la función de la consola `/admin` ("Reiniciar Clave") para forzar reseteos de contraseñas u otorgar cuentas temporales.
*   **Recuperación de Códigos RSVP:** Proveer una forma en `/perfil` o enviando un correo automático (con Resend/SendGrid) donde el usuario consulte su ticket si borró su caché.

## 3. Políticas de Moderación Constante
1.  **Filtro Automático de Palabras (Banned Words):**
    *   Mantener la lista negra actualizada desde el panel de Admin.
    *   Revisar semanalmente los comentarios marcados con "⚠️ en revisión" en la pestaña de Moderación del panel `/admin`.
2.  **Moderación de Disfraces/Fotos:**
    *   Verificación estricta humana de las fotos subidas a `attendance_proofs` (Modal Miku) antes de otorgar puntos.
    *   Asegurar de banear/borrar cuentas que suban contenido inapropiado (NSFW).
