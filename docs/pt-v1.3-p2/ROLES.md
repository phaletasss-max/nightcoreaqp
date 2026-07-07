# ROLES.md — PT v1.3 P2

Versión: PT v1.3 P2

> La especificación oficial del sistema de roles (USER / DJ / ADMIN, matriz de permisos,
> principio de menor privilegio, flujo de cambio de rol) **no cambia** y vive en
> [`docs/pt-v1.2-p1/ROLES.md`](../pt-v1.2-p1/ROLES.md). Aquí, solo los deltas de la fase.

---

# ESTADO ACTUAL (implementado en v1.2)

- Cambio de rol real vía RPC `admin_set_role` (SECURITY DEFINER): valida admin, exige
  credencial-hash (bcrypt en `app_secrets`) para promover a ADMIN, audita en `admin_logs`.
- DJ solo accede a Métricas, Consola DJ y Encuestas. La RLS es la fuente de verdad.

---

# DELTAS DE ESTA FASE (seguridad)

- **Verificar** que ninguna policy permita a un no-admin cambiar roles (defensa en profundidad
  además del RPC).
- **Rate limiting** en cambios de rol (anti-abuso).
- Revisar que la credencial-hash siga fuera del frontend y del repo (solo `app_secrets`).
- Confirmar que toda promoción/rebaja quede registrada e inmutable en `admin_logs`.
- Considerar (backlog) el rol **OWNER** solo si aparece una necesidad real, sin migración compleja.

Ningún cambio de esta fase debe ampliar permisos: solo endurecer y auditar.
