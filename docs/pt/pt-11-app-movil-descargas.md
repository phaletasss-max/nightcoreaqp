> ⚠️ **SUPERADO / desactualizado.** El descargador ya **no** funciona vía media-service como se
> describe aquí: las descargas son **locales** (`.bat` de la web + app de escritorio `.exe`). La
> doc vigente es **[DESCARGADOR.md](../DESCARGADOR.md)**. Esta sección queda solo como referencia
> histórica del plan APK (la app móvil sigue siendo solo el stub de Expo).

# PT-11: App Móvil (APK) y Descargador Universal

## 1. Descargador Universal (yt-dlp Nativo)
El `media-service` alojado en Render usa `yt-dlp` internamente. Dado que `yt-dlp` soporta miles de plataformas de video y audio (TikTok, Instagram, SoundCloud, X/Twitter, etc.), no hace falta crear un nuevo backend. Solo debemos:
- **Abrir la validación:** Modificar la lógica actual que solo permite `youtube.com` o `youtu.be` para que permita URLs generales de plataformas compatibles.
- **Seguridad y Abuso:** Añadir `Rate Limiting` y Auth Headers al `media-service` para evitar que usuarios sin sesión (o atacantes) agoten los recursos de ancho de banda y CPU de tu servidor Render de forma maliciosa.
- **Legalidad y TOS:** La herramienta debe tener un **Aviso Legal (Disclaimer)**. Al ser un APK externo, eludimos la moderación de la Play Store (que banea este tipo de herramientas). La responsabilidad final del uso de la descarga recae en el usuario.

## 2. Aplicación Móvil (React Native + Expo)
Hemos inicializado un nuevo proyecto React Native en la carpeta `/mobile-app`. 

### Stack Tecnológico Móvil
- **Framework:** Expo (React Native) con TypeScript.
- **Backend:** Supabase (usando `@supabase/supabase-js`).
- **Almacenamiento Local:** `@react-native-async-storage/async-storage` para mantener las sesiones abiertas.
- **Distribución:** EAS Build para compilar un archivo `.apk` de Android que puede ser alojado en tu sitio web Next.js para su descarga.

### Medidas de Seguridad & OTA
1. **Actualizaciones OTA (Over The Air):** A través de EAS Update, cuando el Admin haga cambios en la UI o arregle bugs, la app de los usuarios se actualizará automáticamente sin necesidad de instalar un nuevo APK.
2. **Autenticación Compartida:** Al conectar la App al mismo proyecto de Supabase, los asistentes que inicien sesión en el APK aparecerán automáticamente en tu Dashboard Admin en la web.
3. **CORS y API:** El `media-service` en Render deberá incluir la firma de la App Móvil en `ALLOWED_ORIGINS` para prevenir Hotlinking (robo de ancho de banda).
