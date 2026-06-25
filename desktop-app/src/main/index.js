// ── Proceso principal de Electron ────────────────────────────────────────────
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'node:path'
import { appendFileSync } from 'node:fs'
import electronUpdater from 'electron-updater'
import { ensureTools, downloadAll, defaultDownloadDir } from './tools.js'

const { autoUpdater } = electronUpdater

let win = null

// ── Auto-actualización (GitHub Releases) ─────────────────────────────────────
// Compara la versión instalada con la última publicada; baja el parche completo
// (renderer = CSS/JS + proceso principal) y lo aplica al reiniciar. Solo corre en
// la app empaquetada (en `npm run dev` no hay updater).
// Log del updater a userData/updater.log (para diagnosticar si algo falla).
function updaterLog(line) {
  try {
    appendFileSync(join(app.getPath('userData'), 'updater.log'), `[${new Date().toISOString()}] ${line}\n`)
  } catch { /* best-effort */ }
}

function setupUpdater() {
  const send = (data) => win?.webContents.send('update', data)
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => { updaterLog('checking'); send({ state: 'checking' }) })
  autoUpdater.on('update-available', (info) => { updaterLog('available ' + info.version); send({ state: 'available', version: info.version }) })
  autoUpdater.on('update-not-available', (info) => { updaterLog('none (latest=' + (info?.version || '?') + ')'); send({ state: 'none' }) })
  autoUpdater.on('download-progress', (p) => send({ state: 'downloading', percent: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (info) => { updaterLog('downloaded ' + info.version); send({ state: 'ready', version: info.version }) })
  autoUpdater.on('error', (e) => { updaterLog('error ' + (e?.stack || e?.message || e)); send({ state: 'error', text: e?.message || String(e) }) })
}

// Se llama cuando el renderer ya cargó (evita perder los primeros eventos).
function checkUpdates() {
  if (!app.isPackaged) { updaterLog('skip (dev, no packaged)'); return }
  updaterLog('app v' + app.getVersion() + ' → checkForUpdates')
  autoUpdater.checkForUpdates().catch((e) => updaterLog('checkForUpdates threw ' + (e?.message || e)))
  // Re-chequeo cada 30 min por si publican mientras la app está abierta.
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000)
}

function createWindow() {
  win = new BrowserWindow({
    width: 920,
    height: 700,
    minWidth: 740,
    minHeight: 560,
    backgroundColor: '#0a0a0f',
    title: 'Nightcore AQP · Descargador',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // el preload necesita require('electron'); el contexto sigue aislado
    },
  })

  win.once('ready-to-show', () => win.show())

  // En dev, electron-vite expone el dev server del renderer en esta env var.
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Buscar actualizaciones SOLO cuando el renderer ya cargó (así recibe los eventos).
  win.webContents.once('did-finish-load', checkUpdates)
}

// ── IPC ──────────────────────────────────────────────────────────────────────
ipcMain.handle('default-folder', () => defaultDownloadDir())

ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] })
  return r.canceled ? null : r.filePaths[0]
})

ipcMain.handle('open-folder', (_e, p) => shell.openPath(p))

ipcMain.handle('download', async (_e, payload) => {
  const log = (entry) => win?.webContents.send('log', entry)
  try {
    const result = await downloadAll(payload, log)
    return { ok: true, ...result }
  } catch (e) {
    log({ type: 'error', text: e.message })
    return { ok: false, error: e.message }
  }
})

// Pre-calienta las herramientas al abrir (descarga yt-dlp/ffmpeg si faltan).
ipcMain.handle('ensure-tools', async () => {
  const log = (entry) => win?.webContents.send('log', entry)
  try { await ensureTools(log); return { ok: true } }
  catch (e) { log({ type: 'error', text: e.message }); return { ok: false, error: e.message } }
})

// Versión instalada (para mostrarla en la UI).
ipcMain.handle('app-version', () => app.getVersion())

// Reinicia e instala la actualización ya descargada.
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall())

// ── Ciclo de vida ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  setupUpdater()
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
