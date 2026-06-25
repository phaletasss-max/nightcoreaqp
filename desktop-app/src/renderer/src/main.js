// ── Lógica de la interfaz (renderer) ─────────────────────────────────────────
const $ = (id) => document.getElementById(id)

const els = {
  urls: $('urls'),
  format: $('format'),
  quality: $('quality'),
  cookies: $('cookies'),
  cookiesFile: $('cookies-file'),
  download: $('download'),
  folderPath: $('folder-path'),
  changeFolder: $('change-folder'),
  openFolder: $('open-folder'),
  log: $('log'),
  status: $('status'),
}

let state = { format: 'mp3', quality: 'best', dest: '', cookiesBrowser: '', cookiesFile: '' }

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

// Archivo cookies.txt (lo más fiable para MP4). Clic: elige; si ya hay uno, lo quita.
els.cookiesFile.addEventListener('click', async () => {
  if (state.cookiesFile) {
    state.cookiesFile = ''
    els.cookiesFile.textContent = '📄 cookies.txt'
    els.cookiesFile.classList.remove('active')
    return
  }
  const path = await window.api.pickCookies()
  if (path) {
    state.cookiesFile = path
    els.cookiesFile.textContent = '✓ cookies.txt'
    els.cookiesFile.classList.add('active')
  }
})

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
    cookiesFile: state.cookiesFile,
  })

  els.download.disabled = false
  if (res.ok) {
    setStatus(res.fail ? `Listo con ${res.fail} error(es) — revisa el registro` : `¡Listo! ${res.done} descargada(s)`, res.fail ? 'warn' : 'ok')
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
      updateBar.classList.remove('hidden'); updateBar.className = 'update-bar ready'
      updateText.textContent = `Actualización ${d.version} lista.`
      updateInstall.classList.remove('hidden'); break
    case 'error':
      updateBar.classList.remove('hidden'); updateBar.className = 'update-bar info'
      updateText.textContent = 'Auto-update: ' + (d.text || 'error')
      updateInstall.classList.add('hidden'); break
    case 'none':
      updateBar.classList.remove('hidden'); updateBar.className = 'update-bar info'
      updateText.textContent = 'Estás en la última versión.'
      setTimeout(() => updateBar.classList.add('hidden'), 4000); break
    default:
      updateBar.classList.add('hidden'); break
  }
})

updateInstall.addEventListener('click', () => window.api.installUpdate())

// ── Personalización (tema + imagen de fondo), guardada en localStorage ────────
const pz = {
  panel: $('personalize'), toggle: $('personalize-toggle'), themes: $('pz-themes'),
  bgLayer: $('bg-layer'), bgFile: $('bg-file'), bgClear: $('bg-clear'), bgOpacity: $('bg-opacity'),
}

pz.toggle.addEventListener('click', () => pz.panel.classList.toggle('hidden'))

function applyTheme(t) {
  if (t && t !== 'default') document.documentElement.dataset.theme = t
  else delete document.documentElement.dataset.theme
  pz.themes.querySelectorAll('.pz-theme').forEach((b) => b.classList.toggle('active', b.dataset.theme === (t || 'default')))
}
function applyBg(dataUrl) { pz.bgLayer.style.backgroundImage = dataUrl ? `url(${dataUrl})` : '' }
function applyBgOpacity(o) { pz.bgLayer.style.opacity = o }

pz.themes.querySelectorAll('.pz-theme').forEach((b) => b.addEventListener('click', () => {
  applyTheme(b.dataset.theme)
  try { localStorage.setItem('pz_theme', b.dataset.theme) } catch { /* ignore */ }
}))

pz.bgFile.addEventListener('change', (e) => {
  const f = e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => {
    applyBg(r.result)
    try { localStorage.setItem('pz_bg', r.result) } catch { setStatus('Imagen muy grande para guardar; usa una más liviana.', 'warn') }
  }
  r.readAsDataURL(f)
})
pz.bgClear.addEventListener('click', () => { applyBg(''); try { localStorage.removeItem('pz_bg') } catch { /* ignore */ } })
pz.bgOpacity.addEventListener('input', () => {
  applyBgOpacity(pz.bgOpacity.value)
  try { localStorage.setItem('pz_bg_opacity', pz.bgOpacity.value) } catch { /* ignore */ }
})

// Cargar lo guardado al iniciar.
applyTheme(localStorage.getItem('pz_theme') || 'default')
const savedBg = localStorage.getItem('pz_bg'); if (savedBg) applyBg(savedBg)
const savedOp = localStorage.getItem('pz_bg_opacity')
if (savedOp) { pz.bgOpacity.value = savedOp; applyBgOpacity(savedOp) } else { applyBgOpacity(0.5) }
