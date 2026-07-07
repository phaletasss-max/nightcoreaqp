# ARCHITECTURE.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Consideraciones de arquitectura de la fase

> Hereda [`docs/pt-v1.2-p1/ARCHITECTURE.md`](../pt-v1.2-p1/ARCHITECTURE.md)
> (frontend/backend, capas, BaaS, modularidad). Aquí solo los **deltas** de esta fase.

---

# CONTEXTO

Stack sin cambios: Next.js 16 (App Router, Turbopack) + React + TypeScript + Tailwind v4,
Supabase (Auth/Postgres/RLS/Storage/Realtime), media-service (Render), desktop-app
(Electron), mobile-app (Expo). La fase **no reestructura**: endurece y agiliza.

---

# PRINCIPIOS DE LA FASE

- **Mínimo impacto**: preferir cambios localizados y reversibles.
- **Defensa en profundidad**: cliente para UX, backend (RLS/RPC) para la verdad.
- **Flujo de datos**: UI → Hook → Service (`src/lib/data.ts`) → Supabase. No consultar
  desde componentes grandes; centralizar para poder cachear y auditar.

---

# PUNTOS DE ATENCIÓN (seguridad)

- **Capa de datos dual** (`src/lib/data.ts`): mantener el contrato (`if (cfg())`);
  cualquier caché nueva no debe filtrar datos entre usuarios ni saltarse la RLS.
- **Rutas `/api/*`**: revisar autorización y validación de entrada; no exponer detalles.
- **Proxy de releases** (`media-service`): `GITHUB_TOKEN` solo en el server; no loguear secretos.
- **CSP**: es transversal (afecta iframes de YouTube, imágenes, fuentes) → cambio de
  arquitectura de cliente, tratar con cuidado y `report-only` primero.

---

# PUNTOS DE ATENCIÓN (rendimiento)

- **Contextos globales** (`PlayerContext`, `AuthProvider`, providers del layout): su
  cambio de estado re-renderiza árboles amplios. Medir antes de memoizar.
- **Componentes always-on** del layout: cada uno cuesta en carga/hidratación. Preferir
  diferir (`next/dynamic`) los no críticos (ya hecho con NΞON).
- **Caché de datos**: `src/lib/data.ts` es el lugar natural para deduplicar consultas
  (p. ej. `getSongs`) sin tocar las páginas.

---

# REGLA DE EVOLUCIÓN

Añadir seguridad y rendimiento **sin** cambiar la arquitectura ni la identidad. Si una
mejora exige un cambio arquitectónico, registrarlo en [ADR.md](./ADR.md) con su motivo,
alternativas y riesgo antes de implementarlo.
