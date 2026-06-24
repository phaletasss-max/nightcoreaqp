@echo off
setlocal enabledelayedexpansion
title Nightcore AQP - Crate Builder
color 0D
cd /d "%~dp0"

REM ============================================================================
REM  Nightcore AQP - Crate Builder (descarga local)
REM  Descarga YouTube / TikTok / Instagram en TU PC (no en el servidor), asi
REM  YouTube nunca bloquea (tu IP es residencial). No instala nada en el sistema:
REM  guarda yt-dlp y ffmpeg en una subcarpeta "_tools" junto a este archivo.
REM ============================================================================

echo.
echo  =========================================================
echo            NIGHTCORE AQP  -  CRATE BUILDER
echo  =========================================================
echo.

REM --- Carpeta de herramientas (junto al .bat) ---
set "TOOLS=%~dp0_tools"
if not exist "%TOOLS%" mkdir "%TOOLS%"
set "YTDLP=%TOOLS%\yt-dlp.exe"
set "FFMPEG=%TOOLS%\ffmpeg.exe"
set "FFPROBE=%TOOLS%\ffprobe.exe"

REM --- Descargar yt-dlp.exe la primera vez ---
if not exist "%YTDLP%" (
  echo [1/2] Descargando yt-dlp ^(una sola vez^)...
  curl -L --progress-bar -o "%YTDLP%" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
  if not exist "%YTDLP%" (
    echo.
    echo  ERROR: no se pudo descargar yt-dlp. Revisa tu conexion a internet.
    pause & exit /b 1
  )
)

REM --- Descargar ffmpeg la primera vez (necesario para MP3 y para unir video+audio) ---
if not exist "%FFMPEG%" (
  echo [2/2] Descargando ffmpeg ^(una sola vez, puede tardar^)...
  curl -L --progress-bar -o "%TOOLS%\ffmpeg.zip" "https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip"
  echo  Extrayendo ffmpeg...
  powershell -NoProfile -Command "Expand-Archive -Force '%TOOLS%\ffmpeg.zip' '%TOOLS%\ffmpeg_tmp'" >nul 2>&1
  for /r "%TOOLS%\ffmpeg_tmp" %%F in (ffmpeg.exe) do copy /y "%%F" "%FFMPEG%" >nul
  for /r "%TOOLS%\ffmpeg_tmp" %%F in (ffprobe.exe) do copy /y "%%F" "%FFPROBE%" >nul
  del /q "%TOOLS%\ffmpeg.zip" >nul 2>&1
  rmdir /s /q "%TOOLS%\ffmpeg_tmp" >nul 2>&1
)

REM --- Mantener yt-dlp al dia (YouTube cambia seguido) ---
"%YTDLP%" -U >nul 2>&1

:MENU
echo.
echo  ---------------------------------------------------------
set "LINK="
set /p "LINK=  Pega el LINK (YouTube/TikTok/Instagram): "
if "%LINK%"=="" (echo  Sin link. Saliendo... & goto END)

echo.
echo  Obteniendo informacion del video...
for /f "delims=" %%T in ('""%YTDLP%" --no-warnings --no-playlist --print "%%(title)s" "%LINK%" 2^>nul"') do set "VTITLE=%%T"
if "%VTITLE%"=="" (
  echo  No se pudo leer ese link. Verifica que sea valido y publico.
  echo.
  goto AGAIN
)
echo  Titulo: !VTITLE!

echo.
echo    [1] MP3  (solo audio)
echo    [2] MP4  (video)
set "FMT="
set /p "FMT=  Elige formato (1/2): "

if "%FMT%"=="1" goto AUDIO
goto VIDEO

:AUDIO
set "QSEL=bestaudio/best"
echo.
echo  Tamano aprox del audio:
for /f "delims=" %%S in ('""%YTDLP%" --no-warnings --no-playlist -f "bestaudio/best" --print "%%(filesize_approx,filesize)#B" "%LINK%" 2^>nul"') do echo    ~ %%S
set "OUTEXT=mp3"
set "DLARGS=-x --audio-format mp3 --audio-quality 0"
goto FOLDER

:VIDEO
echo.
echo    [1] 360p     [2] 480p     [3] 720p     [4] 1080p     [5] Maxima
set "QV="
set /p "QV=  Elige calidad (1-5): "
if "%QV%"=="1" set "H=360"
if "%QV%"=="2" set "H=480"
if "%QV%"=="3" set "H=720"
if "%QV%"=="4" set "H=1080"
if "%QV%"=="5" set "H=9999"
if "%H%"=="" set "H=720"
echo.
echo  Tamano aprox del video:
for /f "delims=" %%S in ('""%YTDLP%" --no-warnings --no-playlist -f "bestvideo[height<=%H%]+bestaudio/best[height<=%H%]" --print "%%(filesize_approx,filesize)#B" "%LINK%" 2^>nul"') do echo    ~ %%S
set "OUTEXT=mp4"
set "DLARGS=-f bestvideo[height<=%H%]+bestaudio/best[height<=%H%] --merge-output-format mp4"
goto FOLDER

:FOLDER
echo.
set "DEST=%USERPROFILE%\Desktop\NightcoreAQP"
set "INDEST="
set /p "INDEST=  Carpeta destino (ENTER = %DEST%): "
if not "%INDEST%"=="" set "DEST=%INDEST%"
if not exist "%DEST%" mkdir "%DEST%"

echo.
echo  Descargando en: %DEST%
echo  ---------------------------------------------------------
"%YTDLP%" --no-playlist --ffmpeg-location "%TOOLS%" %DLARGS% -o "%DEST%\%%(title)s.%%(ext)s" "%LINK%"

if errorlevel 1 (
  echo.
  echo  Hubo un problema con la descarga. Intenta otra calidad o revisa el link.
) else (
  echo.
  echo  =========================================================
  echo   LISTO! Archivo guardado en:
  echo     %DEST%
  echo.
  echo   Ahora sube la cancion a la playlist para que otros
  echo   la escuchen en el evento!  =^)
  echo  =========================================================
)

:AGAIN
echo.
set "MAS="
set /p "MAS=  Descargar otra? (s/n): "
if /i "%MAS%"=="s" goto MENU

:END
echo.
echo  Gracias por usar Nightcore AQP Crate Builder.
pause
endlocal
