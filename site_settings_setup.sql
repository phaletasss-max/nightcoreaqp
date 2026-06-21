-- Query para configurar la tabla site_settings en Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto en Supabase (https://supabase.com/dashboard/project/_/sql)

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Habilitar RLS (Seguridad a nivel de filas)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública a todos
CREATE POLICY "Lectura publica site_settings" 
ON public.site_settings FOR SELECT USING (true);

-- Permitir escritura pública a todos (Controlado por código frontend con isStaff)
CREATE POLICY "Escritura publica site_settings (Insert)" 
ON public.site_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Escritura publica site_settings (Update)" 
ON public.site_settings FOR UPDATE USING (true);
