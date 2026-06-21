# 🔧 Configuración de Supabase - Pasos para Ejecutar

## Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Click en **"New Project"**
3. Rellena:
   - **Project Name**: `nightcore-aqp`
   - **Database Password**: guarda bien esta contraseña
   - **Region**: `South America (São Paulo)` (más cercano a Perú)
   - **Organization**: crea una si no tienes
4. Click **"Create new project"** (tarda ~2 minutos)
5. **Espera a que termine** ✓

---

## Paso 2: Copiar Credenciales

Una vez que el proyecto está listo:

1. Ve a **Settings → API** (esquina superior derecha)
2. Copia estos valores:
   - `Project URL` → copiar a `.env.local` como `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` (llave pública) → copiar a `.env.local` como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Actualiza tu `.env.local`:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...tu-anon-key-aqui...
NEXT_PUBLIC_MEDIA_SERVICE_URL=
```

(Déjalo en blanco por ahora, lo configuramos después)

---

## Paso 3: Ejecutar el Schema en SQL Editor

1. En Supabase Dashboard, ve a **SQL Editor** (icono de código)
2. Click **"New query"**
3. **Borra todo lo que haya** y copia-pega TODO el contenido de:
   ```
   supabase/schema.sql
   ```
4. Click **"Run"** (botón azul abajo derecho)
5. **Verifica que NO haya errores** (debe verse verde) ✓

---

## Paso 4: Ejecutar el Seed (Datos de Prueba)

Haz lo mismo que en Paso 3, pero con:
```
supabase/seed.sql
```

---

## Paso 5: Verificar en Table Editor

1. En Supabase, ve a **Table Editor** (icono de tabla)
2. Deberías ver:
   - ✓ `events` (con 2 eventos: 15 mayo y 12 junio)
   - ✓ `profiles` (vacío, se llena cuando usuarios se registren)
   - ✓ `songs`, `surveys`, `costumes`, etc.

---

## Paso 6: Configurar Autenticación (Opcional por ahora)

Si quieres:
1. Ve a **Authentication → Providers**
2. Habilita Google / GitHub (aunque funciona sin esto)

---

## Paso 7: En tu terminal, instala dependencias Supabase

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Paso 8: Verifica que funciona

```bash
npm run dev
```

Abre http://localhost:3092 y si ves los 2 eventos sin errores en consola → **¡Listo! ✓**

---

## ⚠️ Si hay errores

- **"401 Unauthorized"**: Verifica que .env.local tenga las credenciales correctas
- **"Table does not exist"**: Ejecuta el schema.sql de nuevo
- **"CORS error"**: Configura en Supabase Dashboard → Settings → API → CORS allowed origins (agrega tu dominio)

---

**Una vez que completes estos pasos, avísame y hacemos `git push` a GitHub + deploy en Vercel** 🚀
