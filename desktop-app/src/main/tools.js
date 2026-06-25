// ── Motor de descarga (proceso principal) ────────────────────────────────────
// Auto-instala yt-dlp + ffmpeg en userData/bin (como el .bat de la web) y descarga
// a una carpeta local. Reusa los args probados del media-service.

import { app } from 'electron'
import { spawn } from 'node:child_process'
import {
  existsSync, mkdirSync, writeFileSync, copyFileSync, rmSync, chmodSync, readdirSync, statSync,
} from 'node:fs'
import { join } from 'node:path'

const IS_WIN = process.platform === 'win32'
const BIN = join(app.getPath('userData'), 'bin')
const YTDLP = join(BIN, IS_WIN ? 'yt-dlp.exe' : 'yt-dlp')
const FFMPEG = join(BIN, IS_WIN ? 'ffmpeg.exe' : 'ffmpeg')
const DENO = join(BIN, IS_WIN ? 'deno.exe' : 'deno')

const YTDLP_URL = IS_WIN
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
const FFMPEG_ZIP = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip'
// deno = runtime JS que yt-dlp usa para resolver el reto nsig de YouTube. El zip de Windows
// trae deno.exe en la raíz (se extrae directo a BIN).
const DENO_ZIP_WIN = 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip'

let ytdlpUpdatedThisSession = false

// Carpeta de destino por defecto: Descargas/NightcoreAQP.
export function defaultDownloadDir() {
  return join(app.getPath('downloads'), 'NightcoreAQP')
}

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }) }

// Descarga un archivo por HTTP (fetch sigue redirects de GitHub).
async function downloadTo(url, dest, log) {
  log({ type: 'info', text: `Descargando ${url.split('/').pop()}…` })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} al bajar ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(dest, buf)
  log({ type: 'ok', text: `Guardado (${(buf.length / 1e6).toFixed(1)} MB).` })
}

// Busca un archivo por nombre dentro de una carpeta (recursivo).
function findFile(dir, name) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) { const hit = findFile(full, name); if (hit) return hit }
    else if (entry.toLowerCase() === name.toLowerCase()) return full
  }
  return null
}

function runPowershell(command, log) {
  return new Promise((resolve, reject) => {
    const p = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', command])
    let err = ''
    p.stderr.on('data', (d) => { err += d.toString() })
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim() || `powershell salió con ${code}`))))
  })
}

// Descarga y extrae ffmpeg.exe (+ ffprobe) en BIN. Solo Windows.
async function installFfmpegWin(log) {
  const zip = join(BIN, 'ffmpeg.zip')
  const tmp = join(BIN, 'ffmpeg_tmp')
  await downloadTo(FFMPEG_ZIP, zip, log)
  log({ type: 'info', text: 'Extrayendo ffmpeg…' })
  await runPowershell(`Expand-Archive -Force '${zip}' '${tmp}'`, log)
  const ff = findFile(tmp, 'ffmpeg.exe')
  if (!ff) throw new Error('ffmpeg.exe no estaba en el zip')
  copyFileSync(ff, FFMPEG)
  const probe = findFile(tmp, 'ffprobe.exe')
  if (probe) copyFileSync(probe, join(BIN, 'ffprobe.exe'))
  try { rmSync(zip); rmSync(tmp, { recursive: true, force: true }) } catch { /* limpieza best-effort */ }
  log({ type: 'ok', text: 'ffmpeg listo.' })
}

// Garantiza yt-dlp y ffmpeg disponibles. Devuelve sus rutas.
export async function ensureTools(log) {
  ensureDir(BIN)

  if (!existsSync(YTDLP)) {
    await downloadTo(YTDLP_URL, YTDLP, log)
    if (!IS_WIN) chmodSync(YTDLP, 0o755)
  } else {
    log({ type: 'dim', text: 'yt-dlp ya instalado.' })
    // Mantener yt-dlp al día (YouTube cambia seguido). Una vez por sesión, best-effort.
    if (!ytdlpUpdatedThisSession) {
      ytdlpUpdatedThisSession = true
      log({ type: 'info', text: 'Buscando actualización de yt-dlp…' })
      await new Promise((resolve) => {
        const p = spawn(YTDLP, ['-U'])
        p.stdout.on('data', (d) => { const s = d.toString().trim(); if (s) log({ type: 'dim', text: s }) })
        p.stderr.on('data', () => {})
        p.on('error', () => resolve())
        p.on('close', () => resolve())
      })
    }
  }

  let ffmpegDir = null
  if (existsSync(FFMPEG)) {
    ffmpegDir = BIN
    log({ type: 'dim', text: 'ffmpeg ya instalado.' })
  } else if (IS_WIN) {
    try { await installFfmpegWin(log); ffmpegDir = existsSync(FFMPEG) ? BIN : null }
    catch (e) { log({ type: 'dim', text: `No pude auto-instalar ffmpeg (${e.message}). Usaré el del sistema si está en PATH.` }) }
  } else {
    log({ type: 'dim', text: 'En este SO instala ffmpeg manualmente si falta (brew/apt).' })
  }

  // deno: motor JS para el reto nsig de YouTube (sin él, YouTube suele bloquear).
  if (existsSync(DENO)) {
    log({ type: 'dim', text: 'deno ya instalado.' })
  } else if (IS_WIN) {
    try {
      const zip = join(BIN, 'deno.zip')
      await downloadTo(DENO_ZIP_WIN, zip, log)
      log({ type: 'info', text: 'Extrayendo deno…' })
      await runPowershell(`Expand-Archive -Force '${zip}' '${BIN}'`, log)
      try { rmSync(zip) } catch { /* limpieza best-effort */ }
      log({ type: 'ok', text: 'deno listo (motor JS para YouTube).' })
    } catch (e) {
      log({ type: 'dim', text: `No pude instalar deno (${e.message}). YouTube podría pedir verificación.` })
    }
  }

  return { ytdlp: YTDLP, ffmpegDir }
}

// Traduce el stderr de yt-dlp a algo legible.
function humanize(stderr) {
  if (!stderr) return null
  const s = stderr.toLowerCase()
  if (s.includes('could not copy') && s.includes('cookie'))
    return 'No pude leer las cookies de tu navegador (pasa si está abierto). Cierra Chrome/Edge y reintenta, o elige Firefox en "Cookies" (no necesita cerrarse). Con deno instalado, normalmente NO necesitas cookies.'
  if (s.includes("confirm you're not a bot") || s.includes('sign in to confirm'))
    return 'YouTube pide verificación (anti-bot). Reintenta (al instalar deno suele resolverse); si insiste, elige tu navegador en "Cookies".'
  if (s.includes('private video')) return 'El video es privado.'
  if (s.includes('video unavailable') || s.includes('not available')) return 'El video no está disponible o fue eliminado.'
  if (s.includes('unsupported url')) return 'Enlace no soportado.'
  const lines = stderr.trim().split('\n').filter(Boolean)
  return lines.length ? lines[lines.length - 1].slice(0, 200) : null
}

// Args de yt-dlp según formato/calidad. Descarga a archivo (no a stdout).
function buildArgs(url, format, quality, dest, ffmpegDir, cookiesBrowser) {
  const isTikTok = url.includes('tiktok.com')
  // --restrict-filenames: nombres ASCII sin espacios ni '#'. Evita el bug de Windows que
  // recorta el espacio final del nombre (TikTok: "#foryou .mp4") y rompe ffprobe al
  // extraer MP3 ("unable to obtain file audio codec with ffprobe").
  const a = ['--no-playlist', '--newline', '--no-warnings', '--restrict-filenames',
    '--extractor-args', 'youtube:player_client=android,web_creator,default',
    '-o', join(dest, '%(title)s.%(ext)s')]
  if (ffmpegDir) a.unshift('--ffmpeg-location', ffmpegDir)
  // Cookies del navegador del usuario → pasa la verificación anti-bot de YouTube.
  if (cookiesBrowser) a.push('--cookies-from-browser', cookiesBrowser)
  if (format === 'mp3') {
    a.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
  } else if (isTikTok) {
    // TikTok suele venir en HEVC/H.265 → Windows no lo reproduce (error 0xc00d5212).
    // Recodificamos a H.264 + AAC para que reproduzca en cualquier reproductor.
    a.push('-f', 'best[ext=mp4]/best', '--recode-video', 'mp4',
      '--postprocessor-args', 'VideoConvertor:-c:v libx264 -preset fast -crf 23 -c:a aac')
  } else if (quality && quality !== 'best' && /^\d+$/.test(String(quality))) {
    a.push('-f', `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`, '--merge-output-format', 'mp4')
  } else {
    a.push('-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4')
  }
  a.push(url)
  return a
}

function runYtdlp(bin, args, log) {
  return new Promise((resolve, reject) => {
    // Pone la carpeta bin en el PATH para que yt-dlp encuentre deno (reto nsig de YouTube)
    // y ffmpeg sin rutas absolutas.
    const env = { ...process.env, PATH: `${BIN}${IS_WIN ? ';' : ':'}${process.env.PATH || ''}` }
    const p = spawn(bin, args, { env })
    let err = ''
    p.stdout.on('data', (d) => d.toString().split(/\r?\n/).forEach((l) => l.trim() && log({ type: 'line', text: l.trim() })))
    p.stderr.on('data', (d) => { const s = d.toString(); err += s; s.split(/\r?\n/).forEach((l) => l.trim() && log({ type: 'dim', text: l.trim() })) })
    p.on('error', () => reject(new Error('No se pudo ejecutar yt-dlp')))
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(humanize(err) || `yt-dlp salió con código ${code}`))))
  })
}

// Descarga una lista de URLs a `dest`, en secuencia, reportando logs.
export async function downloadAll({ urls, format = 'mp3', quality = 'best', dest, cookiesBrowser }, log) {
  const list = (urls || []).map((u) => String(u).trim()).filter(Boolean)
  if (!list.length) throw new Error('No hay enlaces para descargar.')
  const target = dest || defaultDownloadDir()
  ensureDir(target)

  const { ytdlp, ffmpegDir } = await ensureTools(log)
  if (cookiesBrowser) log({ type: 'dim', text: `Usando cookies de: ${cookiesBrowser}` })

  let ok = 0, fail = 0
  for (let i = 0; i < list.length; i++) {
    log({ type: 'head', text: `[${i + 1}/${list.length}] ${list[i]}` })
    try {
      await runYtdlp(ytdlp, buildArgs(list[i], format, quality, target, ffmpegDir, cookiesBrowser), log)
      ok++; log({ type: 'ok', text: `✓ Descargada (${i + 1}/${list.length})` })
    } catch (e) {
      fail++; log({ type: 'error', text: `✗ Falló: ${e.message}` })
    }
  }
  log({ type: fail ? 'info' : 'ok', text: `Terminado: ${ok} ok · ${fail} con error. Carpeta: ${target}` })
  // OJO: la clave es `done` (no `ok`) para no chocar con el `ok: true` del IPC.
  return { done: ok, fail, dest: target }
}
