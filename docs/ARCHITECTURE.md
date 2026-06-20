# Arquitectura

```
┌─────────────────────┐     ┌──────────────────────┐     ┌────────────────────────────┐
│  Frontend (Vercel)  │────▶│  Supabase (gratis)   │     │  Media-service (Arch)       │
│  Next.js 16 + React │     │  Postgres · Auth ·   │◀───▶│  bot-erp: yt-dlp · ffmpeg · │
│  19 · Tailwind v4   │     │  Storage · Realtime  │     │  libreoffice · imagemagick  │
└─────────────────────┘     └──────────────────────┘     └────────────────────────────┘
```

## Frontend (este repo)
- Next.js App Router, client components que hablan con Supabase vía **anon key + RLS**.
- **Capa de datos**: `src/lib/data.ts` — API única para las páginas. Modo dual:
  - Supabase configurado → habla con la BD.
  - Sin configurar → fallback a `localStorage` + datos demo (`src/lib/demo-data.ts`).
- **Auth**: `src/lib/auth.tsx` (`AuthProvider` + `useAuth`). Sesión real con Supabase o
  invitado demo.
- **Diseño**: sistema de tokens y utilidades en `src/app/globals.css` (`.card`, `.btn`,
  `.input`, `.badge`, `.track`).

## Supabase
- Esquema, triggers (votos, racha) y RLS en `supabase/schema.sql`. Seed en `supabase/seed.sql`.
- **Storage** (bucket `media`): respaldo de mp3/mp4 descargados por el media-service.
- **Auth**: email + confirmación (fase 1). Roles `user`/`dj`/`admin` vía `is_staff()`.

## Media-service (servidor Arch, reusa `bot-erp`)
- Node/Express que hace `spawn` de binarios del sistema. **Única pieza que toca YouTube**
  (desde IP residencial, no la de Vercel).
- Piezas reutilizables de `bot-erp`:
  - `videoDownloader.js`: `getInfo()` (verificar disponibilidad = "comprobante"),
    `getQualities()`, `streamDownload()` (mp3/mp4, fix TikTok HEVC).
  - `fileConverter.js`: LibreOffice / ImageMagick / FFmpeg.
- Endpoints: `/api/info`, `/api/descargar`, `/api/converter`.
- Flujo: el frontend pide `/api/info` al sugerir una canción → si no es reproducible, se
  descarga con `/api/descargar` y se sube a Supabase Storage.

## Por qué separado
`yt-dlp` necesita proceso persistente y una IP no bloqueada por YouTube. Vercel/serverless no
cumple ninguna de las dos. Por eso vive en el servidor Arch.
