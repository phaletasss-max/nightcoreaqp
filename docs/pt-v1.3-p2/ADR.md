# ADR.md — PT v1.3 P2 (Architecture Decision Records)

Versión: PT v1.3 P2
Estado: Registro vivo de decisiones de la fase

> Cada decisión de arquitectura relevante de esta fase se registra aquí con: contexto,
> decisión, alternativas, consecuencias y estado. Formato ligero.

---

## ADR-0 (plantilla)

- **Título:**
- **Fecha:**
- **Estado:** propuesto / aceptado / rechazado / reemplazado
- **Contexto:** qué problema/necesidad.
- **Decisión:** qué se hará.
- **Alternativas:** otras opciones y por qué no.
- **Consecuencias:** impacto, riesgos, deuda que genera.

---

## Decisiones previstas en esta fase (a completar al implementar)

### ADR-1 — Estrategia de CSP
- **Contexto:** falta una CSP; el sitio embebe YouTube, imágenes externas y fuentes.
- **Decisión (propuesta):** CSP `report-only` primero, con allowlist explícita; enforce
  tras validar sin violaciones legítimas. Preferir `nonce`/`hash` a `unsafe-inline`.
- **Alternativas:** no poner CSP (rechazada: deja XSS sin mitigar); CSP estricta directa
  (rechazada: riesgo de romper producción).

### ADR-2 — Caché/dedup de consultas de datos
- **Contexto:** `getSongs` hace doble fetch y varias páginas lo llaman por separado.
- **Decisión (propuesta):** introducir dedup/caché en la capa `src/lib/data.ts` (no en las
  páginas), con TTL corto y sin filtrar datos entre usuarios.
- **Alternativas:** librería de data-fetching (evaluar coste/beneficio vs deps mínimas).

### ADR-3 — Rate limiting
- **Contexto:** endpoints sensibles sin límites explícitos.
- **Decisión (propuesta):** definir dónde vive (RPC/Edge/middleware) sin depender del cliente.
- **Alternativas:** solo cliente (rechazada: no protege de verdad).

> Estas propuestas se confirman/ajustan al llegar a su sub-fase, tras el diagnóstico.
