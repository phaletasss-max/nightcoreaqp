// ── Preload: puente seguro entre el renderer y el proceso principal ───────────
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  defaultFolder: () => ipcRenderer.invoke('default-folder'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  ensureTools: () => ipcRenderer.invoke('ensure-tools'),
  download: (payload) => ipcRenderer.invoke('download', payload),
  // Suscripción a los logs en vivo del proceso principal.
  onLog: (cb) => {
    const handler = (_e, entry) => cb(entry)
    ipcRenderer.on('log', handler)
    return () => ipcRenderer.removeListener('log', handler)
  },
  // Auto-actualización.
  appVersion: () => ipcRenderer.invoke('app-version'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdate: (cb) => {
    const handler = (_e, data) => cb(data)
    ipcRenderer.on('update', handler)
    return () => ipcRenderer.removeListener('update', handler)
  },
})
