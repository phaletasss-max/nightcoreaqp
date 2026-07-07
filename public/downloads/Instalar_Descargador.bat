@echo off
setlocal
title Glitch AQP - Descargador (instalador automatico)
color 0D
REM ============================================================================
REM  Glitch AQP - Lanzador del Descargador
REM  Este script NO descarga canciones: instala o abre la APP oficial.
REM   1) Si la app ya esta instalada  -> la abre.
REM   2) Si no esta instalada         -> baja el instalador OFICIAL del release
REM      de GitHub del proyecto y lo ejecuta (2 clics y listo).
REM  La app descarga musica/videos de YouTube, TikTok, Instagram y Facebook.
REM ============================================================================

set "APPDIR=%LOCALAPPDATA%\Programs\Nightcore AQP Downloader"
set "APPEXE=%APPDIR%\Nightcore AQP Downloader.exe"
set "SETUPURL=https://github.com/phaletasss-max/nightcoreaqp/releases/latest/download/NightcoreAQP-Downloader-Setup.exe"
set "SETUP=%TEMP%\NightcoreAQP-Downloader-Setup.exe"

echo.
echo  =========================================================
echo        GLITCH AQP  -  DESCARGADOR DE MUSICA Y VIDEOS
echo        (YouTube / TikTok / Instagram / Facebook)
echo  =========================================================
echo.

if exist "%APPEXE%" (
  echo  La app ya esta instalada. Abriendola...
  start "" "%APPEXE%"
  goto FIN
)

echo  La app no esta instalada todavia.
echo  Descargando el instalador oficial (unos MB, una sola vez)...
echo.
curl -L --progress-bar -o "%SETUP%" "%SETUPURL%"
if not exist "%SETUP%" (
  echo.
  echo  ERROR: no se pudo descargar el instalador.
  echo  Revisa tu conexion a internet e intenta de nuevo.
  pause
  goto FIN
)

echo.
echo  Abriendo el instalador...
echo  NOTA: si Windows muestra "Windows protegio tu PC", haz clic en
echo  "Mas informacion" y luego "Ejecutar de todas formas" (la app es
echo  segura; solo no esta firmada digitalmente).
echo.
start "" "%SETUP%"

:FIN
timeout /t 4 >nul
endlocal
