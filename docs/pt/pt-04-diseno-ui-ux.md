# Plan de Trabajo (PT-04) - Diseño UI/UX y Sistema de Identidad

## 1. Filosofía de Diseño: El "Scenecore"
El lenguaje visual de Nightcore AQP abraza la estética *Scenecore*, *Cyber Y2K*, y *Frutiger Aero* oscura. No se trata de un diseño corporativo limpio, sino de una interfaz con mucha "personalidad", vibrante, caótica controlada y nostálgica de la era dorada del internet temprano (MySpace / Foros de anime) combinada con las tendencias actuales de TikTok.

## 2. Paleta de Colores y Variables CSS
Se han definido tokens de diseño centralizados en `global.css`:
*   **Fondos:** Negros profundos (`#0a0a0a`), vidrios esmerilados oscuros (Glassmorphism con `backdrop-blur`).
*   **Acentos Neón (Core):**
    *   Magenta: `#ff00ff` (Primario, agresivo, botones principales).
    *   Cyan: `#00ffff` (Secundario, links, acciones sutiles).
    *   Lime: `#39ff14` (Éxito, confirmaciones, estado "en vivo").
*   **Tipografía:** Alternable en vivo por el admin (vía tabla `site_settings`). Puede ser limpia (Geist), Redondeada, o Pixelada.

## 3. Principios UX
1.  **Feedback Visual Inmediato:** Cada acción del usuario (voto, RSVP, comentario) debe generar un micro-cambio visual (brillo neón, cambio de ícono, progreso) sin recargar la página.
2.  **Reducción de Fricción (Modo Invitado):** Permitir a los usuarios votar y comentar como "invitados" (guardando tracking en localStorage) hasta que intenten realizar acciones críticas (subir foto, RSVP oficial), momento en el cual se pedirá Login.
3.  **Animación "Vibrante":** Elementos como logos, medallas y la propia modal de Miku deben tener animaciones CSS de latido (`animate-pulse` o `animate-bounce`) para inyectar energía a la interfaz.

## 4. Adaptabilidad (Responsive)
*   **Mobile-First:** El 90% del tráfico provendrá de Instagram y TikTok. Las tablas de administración en móviles deben ser "scrollable" horizontalmente, y los botones de acción deben tener un tamaño mínimo de `44px` (Touch target).
*   **Desktop:** En pantallas grandes, las grillas (Eventos, Disfraces) se expanden a 3 o 4 columnas aprovechando el espacio panorámico.
