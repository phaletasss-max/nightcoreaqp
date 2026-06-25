import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

// Config mínima de electron-vite. Estructura por defecto:
//   src/main/index.js · src/preload/index.js · src/renderer/index.html
// `npm run dev` levanta el dev server del renderer (un puerto) y abre la ventana de
// Electron cargándolo, con los logs en la terminal.
export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    // El renderer usa CSS plano (sin Tailwind). `postcss: {}` (config inline vacía)
    // evita que Vite suba al postcss.config.mjs del sitio web en la raíz del repo,
    // que requiere @tailwindcss/postcss (no instalado en el build de la app).
    css: { postcss: {} }
  }
})
