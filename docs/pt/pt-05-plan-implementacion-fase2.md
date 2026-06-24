# Plan de Trabajo (PT-05) - Implementación Fase 2: "Crate Builder"

## 1. Contexto y Problema
Actualmente, el DJ (Lobito, Matt, Mely) revisa las canciones más votadas en `/admin` y debe descargarlas manualmente una por una (usualmente convirtiéndolas en alguna web externa de YouTube-a-MP3), lo que consume horas de trabajo.

## 2. Solución Propuesta
Desarrollar el "Crate Builder". Un botón en la consola de DJ que tomará las canciones seleccionadas (ej. Top 20), orquestará su descarga desde el servidor usando `yt-dlp` en formato de alta calidad (`--extract-audio --audio-format mp3 --audio-quality 0`), agrupará los archivos en un solo `.zip` usando `archiver`, y se lo entregará al usuario.

## 3. Arquitectura de la Solución (Node.js)
1.  **Endpoint:** `GET /api/crate/download`
2.  **Parámetros:** `?limit=20&format=mp3&min_votes=5`
3.  **Lógica del Servidor:**
    *   Verificar autenticación del usuario (debe tener rol `dj` o `admin`).
    *   Hacer un `SELECT` a la tabla `songs` ordenado por `votes_count DESC`.
    *   Crear un directorio temporal en el servidor (ej. `/tmp/crate_uuid/`).
    *   Para cada URL, disparar `yt-dlp` guardando en el directorio temporal.
    *   Crear un stream `archiver('zip')` e ir metiendo los archivos procesados.
    *   Retornar el `.zip` al cliente como stream para no saturar memoria.
    *   Limpiar el directorio temporal.

## 4. Retos Técnicos y Mitigaciones
*   **Timeouts de Vercel (Hobby):** Vercel tiene un límite estricto de ejecución en rutas Serverless (10-15 segundos). La descarga de 20 canciones tomará más de eso.
    *   *Solución A (Recomendada):* Trasladar esta carga pesada a un servicio VPS externo gestionado por el cliente, o usar Supabase Edge Functions con mayor timeout, pero lo ideal es un microservicio en un droplet/VPS que exponga una ruta que retorne el ZIP (ya que es CPU y Red intensivo).
    *   *Solución B:* Cambiar la aproximación. Que el DJ seleccione las canciones, el servidor las procesa asíncronamente (background) y sube el `.zip` resultante a Supabase Storage, enviándole un correo al DJ cuando esté listo.

## 5. UI Requerida
En `src/app/admin/page.tsx`, dentro de la pestaña "Consola DJ":
*   Añadir un "Crate Selector" modal al hacer clic en "Descargar set".
*   Opciones: "Formato (MP3 / MP4)" y "Cantidad (Top 10, Top 30, Todas)".
*   Barra de progreso si se implementa mediante descargas secuenciales desde el frontend al media-service.
