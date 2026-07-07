# SECURITY.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Política de seguridad de la fase (núcleo)

> Hereda [`docs/pt-v1.2-p1/SECURITY.md`](../pt-v1.2-p1/SECURITY.md) (política oficial,
> RBAC, threat model base). Aquí se define el **plan de endurecimiento** de esta fase.

---

# PRINCIPIO

La seguridad es parte de la arquitectura, no un añadido. Ante conflicto entre
comodidad y seguridad, gana la seguridad, cuidando la experiencia. Orden inviolable:
**Security by Design → Least Privilege → Defense in Depth → Fail Secure → Auditability**.

---

# CAPAS Y RESPONSABILIDAD

| Capa | Qué protege | Verdad |
|---|---|---|
| Cliente (React) | UX, validación temprana | ❌ no confiable |
| Cabeceras HTTP / CSP | XSS, clickjacking, sniffing | parcial |
| Supabase Auth / JWT | identidad | sí |
| **RLS (PostgreSQL)** | autorización de datos | ✅ fuente de verdad |
| Edge Functions / RPC | lógica sensible, secretos | sí |
| Storage policies | acceso a archivos | sí |
| Logs / auditoría | trazabilidad | sí |

---

# ÁREAS DE ENDURECIMIENTO (esta fase)

## 1. RLS y funciones
- Cada tabla sensible con policies mínimas y explícitas (una por acción).
- Funciones `SECURITY DEFINER`: `set search_path = public` y `revoke execute from public`
  + `grant` solo al rol que corresponda. Validación interna (no depender del grant).
- `admin_logs` y `app_secrets` permanecen bloqueadas (sin acceso PostgREST).

## 2. Content-Security-Policy (CSP)
- Objetivo: bloquear XSS y cargas no autorizadas sin romper el sitio.
- **Fuentes a permitir explícitamente:** `self`, YouTube (`youtube.com`, `youtube-nocookie.com`),
  `i.ytimg.com`, Supabase (URL del proyecto), `data:` (imágenes/fuentes), y los inline
  necesarios (evaluar `nonce`/`hash` en vez de `unsafe-inline`).
- **Método:** desplegar primero como `Content-Security-Policy-Report-Only`, revisar
  violaciones reales, y recién entonces poner en enforce.

## 3. Cabeceras
- Ya presentes: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`. Añadir `Strict-Transport-Security` (HSTS) y revisar `X-Frame-Options`
  vs `frame-ancestors` de la CSP (preferir CSP).

## 4. Rate limiting / anti-abuso
- Aplicar límites a: inicio de sesión, registro, cambios de rol, consultas a NΞON,
  descargas y operaciones administrativas. Backend, no cliente.

## 5. Validación y sanitización
- Toda entrada de usuario validada en backend. Escapar contenido mostrado. Cero
  `dangerouslySetInnerHTML`/`eval`. Verificar XSS almacenado (comentarios, guestbook, chat).

## 6. Secretos y variables
- Nunca en el repo (ni en el historial). Service Role Key, Gemini/YouTube keys, hashes,
  `GITHUB_TOKEN` del proxy → solo en el entorno del server. Rotación documentada.

## 7. Dependencias (supply chain)
- `npm audit` en web/mobile/media-service/desktop-app. Actualizar CVE sin romper.

---

# THREAT MODEL (resumen; detalle en v1.2)

Amenazas principales y mitigación de la fase:

| Amenaza | Mitigación de esta fase |
|---|---|
| XSS | CSP + sanitización + sin HTML arbitrario |
| Clickjacking | `frame-ancestors`/`X-Frame-Options` |
| Escalada de privilegios | RLS + RPC `admin_set_role` + credencial-hash + auditoría |
| Fuga de secretos | env-only + scan del repo + rotación |
| Abuso de APIs / bots | rate limiting + validación |
| Acceso indebido a Storage | policies por bucket + URLs firmadas |
| Dependencias vulnerables | `npm audit` + actualización controlada |

---

# CHECKLIST DE DESPLIEGUE SEGURO (fase)

□ RLS activa y verificada en todas las tablas sensibles.
□ CSP validada (report-only sin violaciones legítimas) antes de enforce.
□ Cabeceras correctas (incl. HSTS).
□ Sin secretos en el diff ni en el repo.
□ `npm audit` sin vulnerabilidades altas/críticas sin justificar.
□ Rate limiting activo en endpoints sensibles.
□ Auditoría (`admin_logs`) registrando acciones críticas.

---

# PRINCIPIO FINAL

Reducir la probabilidad, limitar el impacto y facilitar la recuperación. Ante la
duda sobre quién puede hacer algo: **denegar por defecto** hasta que exista una
regla explícita que lo permita.
