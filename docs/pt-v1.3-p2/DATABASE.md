# DATABASE.md — PT v1.3 P2

Versión: PT v1.3 P2
Estado: Seguridad y rendimiento de datos (deltas de la fase)

> Hereda [`docs/pt-v1.2-p1/DATABASE.md`](../pt-v1.2-p1/DATABASE.md) (esquema, convenciones,
> índices, RLS). Aquí, el foco de la fase sobre la base de datos.

---

# SEGURIDAD DE DATOS (foco)

## RLS
- Revisar **todas** las policies: lectura pública solo donde deba ser pública; escritura
  siempre acotada a `auth.uid()` o `is_staff()`/rol admin.
- Confirmar que ninguna tabla sensible quedó sin RLS o con policy demasiado amplia.
- `admin_logs`: solo staff lee; nadie inserta/edita/borra directo (solo RPC).
- `app_secrets`: sin policies → sin acceso PostgREST; solo funciones `SECURITY DEFINER`.

## Funciones / RPC
- Toda función `SECURITY DEFINER` con `set search_path = public` y `revoke execute from public`
  + `grant` mínimo. La autorización se valida **dentro** de la función (no confiar en el grant).
- `admin_set_role`: mantener credencial-hash (bcrypt en `app_secrets`) y auditoría.

## Auditoría
- Toda acción administrativa importante registrada en `admin_logs` (inmutable).
  Nunca registrar secretos ni contraseñas.

---

# RENDIMIENTO DE DATOS (foco)

## Consultas
- Evitar `SELECT *` en tablas grandes; pedir solo las columnas necesarias.
- **Paginar** listas largas (canciones, disfraces, historial, logs): `LIMIT`/rango/cursor.
- Deduplicar consultas repetidas entre componentes (ver `getSongs` en `src/lib/data.ts`).

## Índices
- Verificar índices para las consultas frecuentes (ordenar por votos, filtrar por evento/usuario,
  fechas). No crear índices por costumbre; justificar con `EXPLAIN ANALYZE`.

## Realtime
- Suscribirse solo a lo necesario; cancelar canales al desmontar; evitar suscripciones duplicadas.

---

# CHECKLIST ANTES DE EJECUTAR SQL (fase)

□ Idempotente y con rollback pensado.
□ No debilita ninguna RLS.
□ Índices justificados.
□ Probado mentalmente contra el peor caso (datos manipulados desde el cliente).
□ Entregado al propietario para ejecutar en Supabase (no ejecutar a ciegas).

---

# PRINCIPIO

La base de datos define las reglas del sistema. En esta fase no se rediseña el esquema:
se **verifica y endurece** su seguridad y se **agilizan** sus consultas.
