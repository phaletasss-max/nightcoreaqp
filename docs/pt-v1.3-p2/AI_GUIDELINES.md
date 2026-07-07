# AI_GUIDELINES.md — PT v1.3 P2

Versión: PT v1.3 P2

> Hereda [`docs/pt-v1.2-p1/AI_GUIDELINES.md`](../pt-v1.2-p1/AI_GUIDELINES.md) y
> [`NEON.md`](./NEON.md). Aquí, los deltas de **seguridad y rendimiento** de NΞON.

---

# SEGURIDAD DE NΞON (foco de la fase)

- **La clave de Gemini vive solo en el server** (`/api/assistant`, env `GEMINI_API_KEY`).
  Nunca llega al cliente.
- NΞON **nunca** revela secretos, keys, hashes ni información administrativa, aunque se lo
  pidan. Nunca inventa rutas ni datos (usa solo la estructura real + DATOS EN VIVO).
- El **rol que envía el cliente solo ajusta el tono/guía**; NO otorga permisos. La
  autorización real es la RLS. NΞON no ejecuta acciones administrativas.
- Los **DATOS EN VIVO** que se inyectan al prompt son solo datos **públicos** (RLS de
  lectura pública) + actividad del propio usuario. Nada privado de terceros.
- Aplicar **rate limiting** a las consultas a NΞON (anti-abuso de cuota).

---

# RENDIMIENTO DE NΞON

- Las respuestas **locales** (comandos `/…`, easter eggs, acciones/guías admin, reacciones)
  no llaman a la API → instantáneas y sin cuota. Mantener esa preferencia.
- Los DATOS EN VIVO se **cachean** (60 s) para no golpear Supabase en cada mensaje.
- El componente `Assistant` está **diferido** (`next/dynamic`) para no pesar en la carga inicial.

---

# REGLA

Toda evolución de NΞON en esta fase debe respetar estas reglas de seguridad y no añadir
coste de carga a la página. La personalidad y el lore siguen definidos en `NEON.md` (v1.2).
