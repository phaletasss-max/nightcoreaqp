# Plan de Trabajo: APK Móvil con Descargas Nativas

## 1. El Problema Actual
Actualmente, en la página de `/perfil/descargas`, el botón "En celular" envía a los usuarios al GitHub de una app de terceros (**YTDLnis**). 
Esto se hizo porque el motor que usamos para burlar los bloqueos de YouTube (`yt-dlp`) es un ejecutable de PC (Windows/Linux/Mac) y **no corre de forma nativa en un celular normal** sin hacer modificaciones profundas al sistema operativo Android.

## 2. El Objetivo
Crear un archivo **`.apk` oficial de Nightcore AQP** que los usuarios puedan instalar.
Esta app debe:
1. Contener toda la experiencia de la comunidad (Home, Perfil, Playlist, Disfraces, DJ, etc.).
2. Incluir una función interna para **descargar MP3/MP4 directamente al celular** sin mandarlos a GitHub.

---

## 3. Arquitectura de Solución (El cómo hacerlo)

Dado que no podemos correr el `.bat` ni el archivo ejecutable `yt-dlp.exe` dentro de Android, la descarga móvil debe apoyarse en un servidor externo (nuestro `media-service` alojado en Render).

### Fase A: Preparación de la Pantalla de Descargas en la App Móvil
Actualmente, la carpeta `mobile-app/` ya tiene casi toda la página web construida de forma nativa (Fases 0, 1, 2 y 3 están listas). Falta añadirle la pantalla de Descargas.
1. **Crear `mobile-app/app/descargas.tsx`**: Una interfaz nativa idéntica a la de la web (input para pegar link de YouTube, selector MP3/MP4).
2. **Conexión al Backend**: En lugar de generar un `.bat`, esta pantalla enviará el enlace a nuestro backend `media-service` (`https://nightcore-media.onrender.com/api/store`).
3. **Descarga al Dispositivo**: El backend procesa el video y devuelve el MP3. La app móvil usará `expo-file-system` y `expo-media-library` para guardar la canción directamente en la carpeta "Música" o "Descargas" del celular del usuario.

### Fase B: Compilación del APK Oficial (EAS Build)
Para transformar el código de `mobile-app/` en un instalable `.apk`:
1. Instalar la herramienta de Expo en nuestra terminal: `npm install -g eas-cli`.
2. Iniciar sesión en Expo: `eas login`.
3. Configurar el proyecto para crear APKs (en el archivo `eas.json`):
   ```json
   {
     "build": {
       "preview": {
         "android": { "buildType": "apk" }
       }
     }
   }
   ```
4. Ejecutar la compilación en la nube de Expo: `eas build -p android --profile preview`.
5. Esto nos arrojará un archivo `NightcoreAQP.apk`.

### Fase C: Distribución y Enlace en la Web
1. Subir el archivo `NightcoreAQP.apk` generado a los **Releases de GitHub** (al lado de donde ya está el `.exe` de Windows).
2. **Modificar la Web**: Editar el archivo `src/components/DownloadInstructionsModal.tsx` de la web.
   - Quitar toda mención a YTDLnis.
   - Cambiar el botón para que diga **"Descargar App para Android (APK)"**.
   - Apuntar el enlace de ese botón a nuestro `NightcoreAQP.apk`.

---

## 4. Limitaciones a tener en cuenta (Importante)
- **Bloqueos de YouTube en Servidor**: Al depender del `media-service` (Render) para las descargas móviles, es posible que YouTube bloquee ocasionalmente la IP del servidor en la nube y las descargas fallen con error `HTTP 403`. 
  - *Mitigación:* Si esto ocurre, la mejor solución será implementar un sistema donde nuestra App envíe "Intents" (comandos ocultos) a Seal/YTDLnis por detrás, o montar el `media-service` en una IP residencial.
- **Tiempos del Servidor Gratuito**: Como Render duerme las apps gratuitas si no se usan, la primera descarga desde el celular puede tardar ~40 segundos en iniciar mientras el servidor despierta.

## 5. Estado (2026-07-07)

- **Fase A ✅ HECHA**: `mobile-app/app/descargas.tsx` creada — input de enlace,
  MP3/MP4 (720p), descarga vía `GET media-service /api/download` con
  `File.downloadFileAsync` (expo-file-system SDK 56) y guardado en galería con
  `Asset.create` (expo-media-library, pide permiso antes de descargar). Avisa del
  cold start de Render (~40 s) y maneja errores con mensajes simples. El acceso
  "Descargas" de la home del APK ya apuntaba a `/descargas` (estaba roto; ya no).
- **Fase B (te toca)**: compilar el APK — `cd mobile-app && npx eas build -p android
  --profile preview` (requiere `eas login`). Sale `NightcoreAQP.apk`.
- **Fase C (semi-hecha)**: subes el `.apk` al release de GitHub y LISTO — la web ya
  apunta al proxy `https://nightcore-media.onrender.com/api/release/apk`, que lo
  sirve aunque el repo sea privado (ver DESCARGADOR.md §4.5; requiere `GITHUB_TOKEN`
  en Render).
