// ── Lógica de la interfaz (renderer) ─────────────────────────────────────────
const $ = (id) => document.getElementById(id)

const els = {
  urls: $('urls'),
  format: $('format'),
  quality: $('quality'),
  cookies: $('cookies'),
  download: $('download'),
  folderPath: $('folder-path'),
  changeFolder: $('change-folder'),
  openFolder: $('open-folder'),
  log: $('log'),
  status: $('status'),
}

let state = { format: 'mp3', quality: 'best', dest: '', cookiesBrowser: '' }

function logLine(entry) {
  const div = document.createElement('div')
  div.className = `ln ln-${entry.type || 'line'}`
  div.textContent = entry.text
  els.log.appendChild(div)
  els.log.scrollTop = els.log.scrollHeight
}

function setStatus(text, kind = '') {
  els.status.textContent = text
  els.status.className = `status ${kind}`
}

// Logs en vivo desde el proceso principal.
window.api.onLog(logLine)

// Selector de formato.
els.format.querySelectorAll('.seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    els.format.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    state.format = btn.dataset.format
    els.quality.disabled = state.format !== 'mp4'
  })
})

els.quality.addEventListener('change', () => { state.quality = els.quality.value })
els.cookies.addEventListener('change', () => { state.cookiesBrowser = els.cookies.value })

// Carpeta de destino.
async function refreshFolder(path) {
  state.dest = path
  els.folderPath.textContent = path
  els.folderPath.title = path
}
window.api.defaultFolder().then(refreshFolder)

els.changeFolder.addEventListener('click', async () => {
  const picked = await window.api.pickFolder()
  if (picked) refreshFolder(picked)
})
els.openFolder.addEventListener('click', () => state.dest && window.api.openFolder(state.dest))

// Descargar.
els.download.addEventListener('click', async () => {
  const urls = els.urls.value.split('\n').map((s) => s.trim()).filter(Boolean)
  if (!urls.length) { setStatus('Pega al menos un enlace.', 'warn'); return }

  els.download.disabled = true
  setStatus('Descargando…', 'busy')
  els.log.innerHTML = ''
  logLine({ type: 'head', text: `Iniciando ${urls.length} descarga(s) en ${state.format.toUpperCase()}…` })

  const res = await window.api.download({
    urls,
    format: state.format,
    quality: state.quality,
    dest: state.dest,
    cookiesBrowser: state.cookiesBrowser,
  })

  els.download.disabled = false
  if (res.ok) {
    setStatus(res.fail ? `Listo con ${res.fail} error(es)` : `¡Listo! ${res.ok} descargada(s)`, res.fail ? 'warn' : 'ok')
  } else {
    setStatus('Error: ' + (res.error || 'desconocido'), 'error')
  }
})

// Pre-instala yt-dlp/ffmpeg al abrir (no bloquea la UI).
setStatus('Preparando herramientas…', 'busy')
window.api.ensureTools().then((r) => {
  setStatus(r.ok ? 'Listo para descargar.' : 'Revisa el registro.', r.ok ? 'ok' : 'error')
})

// ── Versión + auto-actualización ─────────────────────────────────────────────
window.api.appVersion().then((v) => { $('version').textContent = `v${v}` })

const updateBar = $('update-bar')
const updateText = $('update-text')
const updateInstall = $('update-install')

window.api.onUpdate((d) => {
  switch (d.state) {
    case 'checking':
      updateBar.classList.remove('hidden'); updateBar.className = 'update-bar info'
      updateText.textContent = 'Buscando actualizaciones…'; break
    case 'available':
      updateBar.className = 'update-bar info'
      updateText.textContent = `Nueva versión ${d.version} encontrada. Descargando…`; break
    case 'downloading':
      updateBar.className = 'update-bar info'
      updateText.textContent = `Descargando actualización… ${d.percent}%`; break
    case 'ready':
      updateBar.className = 'update-bar ready'
      updateText.textContent = `Actualización ${d.version} lista.`
      updateInstall.classList.remove('hidden'); break
    case 'error':
      updateBar.classList.add('hidden'); break // sin internet / sin releases: no molestar
    case 'none':
    default:
      updateBar.classList.add('hidden'); break
  }
})

updateInstall.addEventListener('click', () => window.api.installUpdate())
