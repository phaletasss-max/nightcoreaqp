# Cómo generar el APK de Glitch AQP (paso a paso)

> La config ya está lista (nombre "Glitch AQP", permisos de galería, buildType apk).
> Solo tienes que correr los comandos de abajo. El build ocurre en la nube gratis de
> Expo (EAS) — por eso necesita TU cuenta; no se puede automatizar sin tu login.

## Requisitos (una sola vez)
1. Una cuenta gratis en https://expo.dev (regístrate con tu correo).
2. Node instalado (ya lo tienes).

## Pasos

Abre una terminal **dentro de la carpeta `mobile-app`**:

```bash
cd mobile-app

# 1. Instalar dependencias (solo la primera vez, tarda unos minutos)
npm install

# 2. Instalar el CLI de EAS (una sola vez, global). OJO: es "eas-cli", NO "eas".
npm install -g eas-cli

# 3. Iniciar sesión en Expo (te pedirá tu usuario/clave de expo.dev)
eas login

# 4. Vincular el proyecto a tu cuenta (crea el projectId; acepta con Enter)
eas init

# 5. Compilar el APK (sube el código a la nube de Expo y compila ~10-20 min)
eas build -p android --profile preview
```

> Si prefieres no instalar nada global, usa `npx eas-cli@latest login` / `init` /
> `build …` (con el sufijo **`-cli`**). El error "could not determine executable to
> run" aparece justamente por escribir `npx eas` (sin `-cli`).

> Las advertencias de `npm install` (peer deps, "10 moderate vulnerabilities") son
> normales en Expo y NO rompen el build. **No** corras `npm audit fix --force`
> (cambiaría versiones y sí rompería la app).

Al terminar, la terminal te da un **enlace** para descargar el `NightcoreAQP.apk`
(o `Glitch AQP.apk`). Descárgalo.

## Después
1. Sube ese `.apk` a los **Releases de GitHub** del repo (donde está el `.exe`).
   - Renómbralo a **`NightcoreAQP.apk`** para que el proxy lo encuentre por nombre,
     o deja que el proxy tome cualquier `.apk` (ya busca `*.apk`).
2. Listo: el botón "Descargar App (APK)" de la web ya apunta al proxy
   `https://nightcore-media.onrender.com/api/release/apk`, que lo sirve aunque el
   repo sea privado.

## Si algo falla
- **"package is required"** → ya está resuelto (`android.package = com.glitchaqp.app`).
- **Pide credenciales de firma** → elige **"Generate new keystore"** (Expo la guarda
  por ti; no necesitas hacer nada más).
- **El APK no pide permiso de galería al descargar** → ya está resuelto (plugins
  `expo-media-library` y `expo-image-picker` en `app.json`).
- **Cambiaste algo del código** → vuelve a correr solo el paso 4.

## Notas
- Para una versión nueva más adelante: sube `version` y `android.versionCode` en
  `app.json` y repite el paso 4.
- `--profile preview` genera un `.apk` instalable directo (ideal para compartir).
  `--profile production` es para subir a Google Play (genera igual `.apk` aquí).
