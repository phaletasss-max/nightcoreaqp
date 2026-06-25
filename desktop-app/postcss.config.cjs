// La app de escritorio usa CSS plano (sin Tailwind/PostCSS). Este archivo vacío hace que
// la búsqueda de configuración de PostCSS se detenga AQUÍ y no suba a la raíz del repo,
// donde el postcss.config.mjs del sitio web requiere @tailwindcss/postcss (que no se
// instala en el build de la app → rompía el build en CI).
module.exports = {}
