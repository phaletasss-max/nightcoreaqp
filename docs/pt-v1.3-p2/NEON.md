# NEON.md — PT v1.3 P2

Versión: PT v1.3 P2

> La especificación oficial de NΞON (identidad, lore 2012, personalidad, tono, comandos,
> easter eggs, memoria) **no cambia** y vive en
> [`docs/pt-v1.2-p1/NEON.md`](../pt-v1.2-p1/NEON.md). Aquí, solo los deltas de esta fase.

---

# ESTADO ACTUAL (implementado en v1.2)

- Identidad NΞON (ya no "Nightie"): lore, tono, lenguaje de frecuencias/BPM.
- Local sin API: saludo 1ª visita/regreso y por hora, comandos `/…`, easter eggs 2000s,
  reacciones a la música (con límites).
- DATOS EN VIVO: eventos, top playlist, encuesta activa + actividad del usuario.
- Copiloto: botones que navegan y resaltan; guía del panel admin (abre pestañas, pasos
  reales); conciencia de permisos; la IA no inventa rutas.

---

# DELTAS DE ESTA FASE

- **Seguridad:** ver [AI_GUIDELINES.md](./AI_GUIDELINES.md) — sin secretos, sin inventar,
  rol solo ajusta tono, rate limiting, datos en vivo solo públicos.
- **Rendimiento:** mantener lo local sin API; caché de datos en vivo; componente diferido.
- **Sin cambios de personalidad ni de lore.** Cualquier evolución nueva (memoria contextual,
  reacciones a logros) es backlog y debe respetar seguridad y coste de carga.
