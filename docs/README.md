# Documentación — Nightcore AQP

Carpeta de la verdad del proyecto. Antes de implementar algo, se confirma aquí; después de
implementarlo, se registra aquí. Así seguimos la estructura ideal sin perder el hilo.

## Índice

| Documento | Para qué |
|-----------|----------|
| [ROADMAP.md](./ROADMAP.md) | Plan maestro: visión, arquitectura, las 3 fases y cada feature. |
| [DECISIONS.md](./DECISIONS.md) | Decisiones confirmadas (con fecha y por qué). Lo que ya NO se discute. |
| [CHANGELOG.md](./CHANGELOG.md) | Qué se construyó y cuándo. Historial real del código. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Cómo encaja todo: frontend, Supabase, media-service. |

## Cómo usamos estos docs

1. **Idea nueva** → se discute y, si se aprueba, entra a `ROADMAP.md` (fase + feature) y la
   decisión clave a `DECISIONS.md`.
2. **Se implementa** → se registra en `CHANGELOG.md` con fecha.
3. **Cambia la arquitectura** → se actualiza `ARCHITECTURE.md`.

Documentos de infraestructura relacionados (fuera de `/docs`):
- `supabase/README.md` — cómo conectar la base de datos.
- `supabase/schema.sql` — tablas, triggers y RLS.
