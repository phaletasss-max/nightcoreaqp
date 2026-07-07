# CLAUDE.md — PT v1.3 P2

# Glitch AQP — Fase Ciberseguridad + Agilidad

Versión del Proyecto: PT v1.3 P2
Estado: Producción Activa

> Este documento **hereda** todas las reglas de
> [`docs/pt-v1.2-p1/CLAUDE.md`](../pt-v1.2-p1/CLAUDE.md) (metodología, KISS/DRY/YAGNI,
> mínimo impacto, seguridad y rendimiento por diseño). Aquí solo se registran los
> **énfasis y reglas específicas** de esta fase.

---

# OBJETIVO DE LA FASE

Convertir Glitch AQP en una plataforma **más segura y más ágil**, sin añadir
funciones nuevas y sin cambiar su identidad. Dos ejes:

1. **Ciberseguridad** — reducir superficie de ataque, endurecer cada capa y hacer
   auditable el sistema.
2. **Agilidad web** — mejorar tiempo de carga, tiempo hasta interacción y fluidez
   (FPS), especialmente en dispositivos modestos.

---

# PRIORIDADES DE LA FASE

1. Estabilidad (no romper producción).
2. **Seguridad** (foco).
3. **Rendimiento / agilidad** (foco).
4. Experiencia de usuario.
5. Mantenibilidad.

Nunca sacrificar seguridad por comodidad, ni identidad por rendimiento.

---

# METODOLOGÍA OBLIGATORIA (igual que v1.2)

Analizar → Diagnosticar → Planificar → Estimar impacto → Implementar en fases
pequeñas → Verificar (`tsc`/build/lint + prueba real) → Documentar → Actualizar
roadmap. **Medir antes de optimizar.** No optimizar por intuición.

---

# REGLAS ESPECÍFICAS DE ESTA FASE

## Seguridad

- La **RLS de Supabase es la fuente de verdad**. Ningún cambio puede debilitarla.
- **Nunca** introducir secretos en el repo (repo puede ser público). Todo secreto
  vive en variables de entorno del server o en la BD bloqueada.
- Toda funcionalidad nueva pasa una **revisión de seguridad** antes de cerrarse.
- Cambios en **auth, roles, RLS, Edge/RPC o CSP** = RIESGO ALTO → explicar y
  verificar con especial cuidado; si requieren SQL, entregarlo para ejecutar en
  Supabase (no ejecutarlo a ciegas).
- Preferir **defensa en profundidad**: cliente valida por UX, backend valida de
  verdad.

## Rendimiento

- **Medir primero** (build, Network, Performance API, Lighthouse) y documentar el
  número antes/después de cada optimización.
- Preferir mejoras de **bajo riesgo y alto impacto**: recursos (video/imágenes),
  code-splitting, lazy, consultas duplicadas, renders innecesarios.
- No romper la identidad visual ni funcionalidades por ganar milisegundos.
- Respetar `prefers-reduced-motion`.

---

# CHECKLIST DE CIERRE DE TAREA (fase 2)

□ `npx tsc --noEmit` limpio.
□ `npm run build` verde.
□ ESLint de `src` limpio.
□ Verificado en preview (comportamiento real, no solo compilación).
□ Si toca seguridad: revisión de amenazas hecha; RLS intacta o reforzada.
□ Si toca rendimiento: medición antes/después registrada.
□ Documentado en `PT-IMPLEMENTACION.md` + `CHANGELOG.md`.
□ Sin secretos en el diff.

---

# GIT / DEPLOY

`main` = producción (Vercel). Commits pequeños, una idea cada uno. Documentar cada
cambio. Push según la política vigente del propietario (ver memoria del proyecto).
