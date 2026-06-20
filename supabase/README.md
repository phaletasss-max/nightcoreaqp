# Supabase — Setup de Nightcore AQP

Backend de la app: base de datos Postgres, autenticación, storage y realtime.

## Pasos para conectarlo

### 1. Crear el proyecto
1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Elige región cercana (por ejemplo *São Paulo* para Perú) y una contraseña de DB.
3. Espera ~2 min a que se aprovisione.

### 2. Cargar el esquema y las políticas (RLS)
1. En el dashboard: **SQL Editor → New query**.
2. Pega el contenido de [`schema.sql`](./schema.sql) y dale **Run**.
   - Crea todas las tablas, triggers (votos, racha) y las políticas de seguridad.
   - Es idempotente: lo puedes correr varias veces sin romper nada.
3. (Opcional) Pega y corre [`seed.sql`](./seed.sql) para arrancar con eventos,
   canciones y una encuesta de ejemplo en vez de la app vacía.

### 3. Variables de entorno
1. **Project Settings → API**: copia *Project URL* y la *anon public key*.
2. En la raíz del repo: copia `.env.local.example` a `.env.local` y pega los valores.
3. Reinicia el dev server (`npm run dev`) para que Next.js lea las variables.

### 4. Autenticación
- **Authentication → Providers**: deja activo *Email* (o agrega Google si quieres login social).
- **Authentication → Providers → Email → "Confirm email": ON** (anti-multicuenta, fase 1).
  Así el usuario debe confirmar su correo antes de poder iniciar sesión. El `AuthModal` del
  frontend ya muestra el mensaje "revisa tu correo" tras registrarse.
- (Opcional, fase posterior) OTP por WhatsApp/SMS vía Twilio: **Authentication → Providers →
  Phone** y configurar Twilio/Twilio Verify. Tiene costo (~US$0.05/verificación).
- Al registrarse un usuario, su fila en `profiles` se crea automáticamente
  (trigger `on_auth_user_created`). El `username` sale del metadata o del correo.
- Para volver **admin/DJ** a alguien, corre en el SQL Editor:
  ```sql
  update profiles set role = 'admin' where username = 'TU_USUARIO';
  ```

### 5. Storage (fotos de disfraces y sets del DJ)
- **Storage → New bucket**: crea `costumes` (público) y `dj-sets` (público).
- Más adelante la página de disfraces subirá imágenes a `costumes` en vez de pedir URL.

## Modelo de datos (resumen)

| Tabla | Para qué |
|-------|----------|
| `profiles` | usuarios (username, rol, puntos, racha) — 1:1 con `auth.users` |
| `events` | eventos (estado: planning/confirmed/paused) |
| `event_attendees` | RSVP + reserva de entrada (con código) |
| `songs` / `song_votes` | playlist colaborativa y votos ↑/↓ |
| `event_comments` | muro de comentarios del evento |
| `costumes` / `costume_votes` / `costume_comments` | concurso de disfraces |
| `surveys` / `survey_options` / `survey_responses` | encuesta del día |
| `daily_checkins` | racha diaria (función RPC `daily_check_in`) |
| `push_subscriptions` | notificaciones Web Push |
| `media_recordings` | grabaciones propias del DJ (descarga libre) |

## Funciones útiles (RPC)
- `daily_check_in()` → registra el check-in del día, actualiza la racha y suma +5 pts. Devuelve la racha.
- `event_attendee_count(event_id)` → conteo público de asistentes sin exponer correos.
- `is_staff()` → usada internamente por las RLS para permisos de admin/DJ.

## Las métricas del panel admin
No necesitan tablas nuevas: se calculan con SQL sobre `event_attendees`, `song_votes`
y `survey_responses` (% de asistencia, canción más pedida, día preferido, crecimiento
mes a mes). Se pueden montar como *views* de Postgres cuando se conecte el panel.
