# Actualización: Nightcore AQP - Scenecore Revamp

## 🎨 1. Nueva Estética Scenecore
El proyecto ha sido rediseñado para adoptar la estética "Scenecore", representativa de la cultura emo/scene, anime y cyberpunk.
- **Paleta de Colores**: Se actualizaron las variables globales en `globals.css` a tonos neón vibrantes:
  - Magenta Caliente (`--magenta`: `#ff00ff`)
  - Cian Eléctrico (`--cyan`: `#00ffff`)
  - Verde Lima (`--lime`: `#39ff14`)
  - Rosa Chicle (`--hot-pink`: `#ff69b4`)
  - Púrpura Intenso (`--purple`: `#9933ff`)
- **Fondo Animado (`ScenecoreBackground.tsx`)**: Se implementó un nuevo componente de fondo usando un Canvas. Renderiza estrellas flotantes de 4 puntas, un patrón sutil de ajedrez (checkerboard), y bandas arcoíris diagonales, todo con animaciones suaves y opacidad baja para no saturar el texto.
- **Componentes**: Botones y tarjetas adaptaron un diseño _glassmorphism_ con bordes brillantes que reaccionan al `:hover` (efecto arcoíris y glows de neón).

## 🎪 2. Nuevo Evento: Nightcore Fest 2.0 (Cyberpunk)
Se eliminaron los datos de demostración genéricos y se preparó el terreno para el "Nightcore Fest 2.0".
- Se creó el script `supabase/seed-clean.sql` para limpiar las tablas existentes sin afectar a los usuarios (`auth.users` y `profiles`).
- Este script inserta los datos oficiales del evento (fecha, lugar, promociones) y lanza una nueva encuesta para decidir la temática del "Nightcore Fest 3.0".
- En la interfaz principal (Hero), se destacó a los DJs confirmados (Lobito, Matt, Mely) junto con los extras de la fiesta.

## 🎬 3. Fondo Musical Toggleable (`VideoBackground.tsx`)
Para mejorar la experiencia y el rendimiento, el fondo de videos (YouTube / MP4s de la playlist) ya no es obligatorio.
- Por defecto, los usuarios ven el fondo estático/animado `ScenecoreBackground`.
- Se añadió un botón de "TV" (📺) en el reproductor inferior flotante para **activar el fondo musical**. Al activarlo, comienza a reproducirse la playlist del DJ como fondo de video a pantalla completa, respetando el "scroll animation" entre canciones/DJs.

## 📥 4. Descargador y Media-Service (Python / yt-dlp)
Se integró completamente la funcionalidad de descarga de medios en la plataforma.
- **Nueva página**: `/perfil/descargas`.
- **Soporte Multi-plataforma**: La UI detecta y soporta descargas de **YouTube, Instagram y TikTok**.
- **Motor Python**: Se verificó que el `media-service` (basado en Express) invoca internamente a `yt-dlp` (Python). yt-dlp soporta nativamente la extracción de videos de IG y TikTok sin requerir adaptaciones adicionales.
- **Flujos Implementados**:
  1. **Descarga Personal**: El usuario pega un link, selecciona MP3 o MP4, y lo descarga a su dispositivo de inmediato.
  2. **Sugerencia al DJ**: El usuario sugiere un track; el backend lo valida, lo añade a la Base de Datos pública, y (si el storage está configurado) descarga un MP4 de respaldo directamente a Supabase Storage para ser usado en el evento.
