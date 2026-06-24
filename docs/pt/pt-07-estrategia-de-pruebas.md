# Plan de Trabajo (PT-07) - Estrategia de Pruebas

## 1. Alcance
Dado el ritmo acelerado del proyecto, el enfoque de pruebas será una mezcla de automatización crítica (E2E) para flujos monetizables o clave (como RSVP) y pruebas manuales visuales para la estética interactiva.

## 2. Pruebas Unitarias e Integración
*   **Gestión de Datos (`lib/data.ts`):** Escribir tests con Jest/Vitest para validar la lógica del fallback. Verificar que si `Supabase` falla, `localStorage` asume correctamente la carga de datos (Songs, RSVP, Comments).
*   **Cálculo de Rachas (Streaks):** Testear la función SQL RPC de check-in para asegurar que la racha no se reinicia si no han pasado 24h, pero sí se reinicia si pasa de 48h.

## 3. Pruebas End-to-End (E2E) con Playwright / Cypress
Flujos Críticos a automatizar:
1.  **Flujo RSVP:** Llenar el formulario -> Hacer click -> Verificar que el código se genere -> Verificar aparición del modal Miku.
2.  **Flujo de Votación (Demo vs Auth):** Votar sin loguearse -> Votar logueado -> Verificar persistencia.
3.  **Reproductor de Música:** Hacer clic en "Siguiente", verificar sincronización del PlayerContext con el iframe de YouTube y que las canciones saltadas queden marcadas como `played`.

## 4. Pruebas de Carga (Load Testing)
Herramienta: `k6` o `Artillery`.
*   Simular 500 conexiones simultáneas subiendo canciones a la playlist (evento pico).
*   Monitorear cuota de Supabase (Connections y Edge Functions) para asegurar que la capa gratuita/pro soporte el evento.
