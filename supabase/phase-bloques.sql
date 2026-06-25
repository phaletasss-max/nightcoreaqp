-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase Bloques (contenido personalizado del admin)
--  Correr en el SQL Editor de Supabase. Idempotente.
--
--  Crea: tabla custom_blocks. El admin puede añadir anuncios, textos, enlaces,
--  imágenes y videos embebidos sin tocar código. La RLS permite leer los
--  bloques visibles a cualquier visitante; crear/editar/borrar solo al staff.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.custom_blocks (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('anuncio', 'texto', 'enlace', 'imagen', 'video')),
  title      text null,
  content    text null,
  url        text null,
  img_url    text null,
  accent     text not null default 'cyan',
  section    text not null default 'home',
  position   int  not null default 0,
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists custom_blocks_section_pos
  on public.custom_blocks (section, position);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.custom_blocks enable row level security;

-- Los visitantes ven bloques visibles; el staff ve todos.
drop policy if exists custom_blocks_select on public.custom_blocks;
create policy custom_blocks_select on public.custom_blocks
  for select using (visible = true or is_staff());

-- Solo el staff puede crear, modificar y borrar.
drop policy if exists custom_blocks_staff on public.custom_blocks;
create policy custom_blocks_staff on public.custom_blocks
  for all using (is_staff()) with check (is_staff());
