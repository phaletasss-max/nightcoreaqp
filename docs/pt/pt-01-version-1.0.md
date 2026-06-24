# Plan de Trabajo (Versión 1.0) - Nightcore AQP

Alcanzamos un punto fuerte y maduro en la plataforma. Este plan marca la **Versión 1.0**, priorizando la creación de dinámicas interactivas y divertidas antes de enfocarnos en limpieza técnica estricta.

---

## 🛠️ FASE 1: Gamificación de Asistencia (Insignias por Fotos)
Incentivar la participación con una validación humana interactiva.

*   [x] **Paso 1: Interfaz "Miku Pop-up"**
    *   Crear una modal/pop-up interactiva (animación/GIF) al confirmar asistencia.
    *   Mensaje: *"¡MANDA UNA FOTO DEL EVENTO!"*
    *   Formulario para subir 1 sola foto conectada a Supabase Storage.
*   [x] **Paso 2: Base de Datos (Cola de Verificación)**
    *   Tabla `attendance_proofs` vinculada al `event_id` y `user_id`.
    *   Estados: `pendiente`, `aprobado`, `rechazado`.
*   [x] **Paso 3: Panel Admin de Aprobación**
    *   Mini-panel en `/admin` para ver la foto y el usuario.
    *   Botón "Es real" para aprobar, cambiar estado y otorgar la insignia en el perfil.

---

## 💿 FASE 2: Descargas en ZIP para el DJ ("Crate Builder")
Facilitar la vida del DJ con un empaquetado automático.

*   **Paso 1: API de compresión (`yt-dlp` + Node)**
    *   Ruta en el servidor `/api/crate/download` para procesar colas de descarga.
    *   Uso de `yt-dlp` en servidor para obtener MP3 (o MP4 si se selecciona video) desde las URLs sugeridas.
    *   Empaquetar los archivos usando una librería como `archiver`.
*   **Paso 2: UI en Consola DJ**
    *   Sección `/admin/dj` con selector: "Top 20 más votadas", "Solo aprobadas", o "Todas".
    *   Selector de formato: `[ ] MP3 (Solo audio)` o `[ ] MP4 (Videos de fondo)`.
    *   Botón "Generar Crate" y retorno de archivo `NightcoreAQP_Set.zip` con metadatos.

---

## 🏷️ FASE 3: Feed Personalizado y Hashtags
Hacer la experiencia adictiva basada en intereses.

*   **Paso 1: Interfaz de Sugerencia con Tags**
    *   Soporte para etiquetas (`#fnaf`, `#vocaloid`, `#numetal`, `#jpop`) en sugerencias de canciones y en disfraces.
    *   Modificar esquema de la BD (tabla `tags` o columna `jsonb array` en `songs` y `costumes`).
*   **Paso 2: Tracking Discreto de Intereses**
    *   Crear la tabla `user_interests` para ponderar los clicks.
    *   Si un usuario le da like a un posteo `#vocaloid`, se incrementa su afinidad.
*   **Paso 3: Algoritmo de Priorización (Feed)**
    *   Reestructurar `/playlist` y la portada para mostrar contenido afín.
    *   Añadir filtros visuales (chips) en la parte superior del feed para saltar de temática en temática de manera fluida.

---

## 🏆 FASE 4: Temáticas Comunitarias y Rankings
Dar poder a la comunidad y generar FOMO.

*   **Paso 1: Creación Comunitaria de Temáticas**
    *   En `/perfil`, los usuarios podrán proponer la "Temática del próximo evento".
    *   Votación estilo Reddit. Las temáticas ganadoras aparecerán con "corona" dorada.
*   **Paso 2: Muros de la Fama y Top DJ**
    *   Componente histórico en `/history`: Top canciones históricas, los asistentes con rachas más largas (insignias diamantes) y mejor disfraz.
    *   Destacar a los "Geeks" que más puntos de participación acumulan.

---

## 🛡️ FASE 5: Revisión Técnica Total
Limpieza y estabilidad.

*   **Paso 1: Consolidación SQL**
    *   Ejecutar y pulir migraciones pendientes (`phase-de.sql`).
    *   Asegurar políticas RLS estrictas.
*   **Paso 2: Corrección de Bugs**
    *   Fix del loop de render en `/perfil` (`useCallback`).
    *   Manejo de errores 502/404 de Spotify.
*   **Paso 3: Monitorización**
    *   Pruebas de estrés para las descargas y el empaquetado ZIP.
