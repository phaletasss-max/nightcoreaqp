import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

// Config mínima de electron-vite. Estructura por defecto:
//   src/main/index.js · src/preload/index.js · src/renderer/index.html
// `npm run dev` levanta el dev server del renderer (un puerto) y abre la ventana de
// Electron cargándolo, con los logs en la terminal.
export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {}
})
