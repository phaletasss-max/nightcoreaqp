-- ==============================================================================
-- FASE 3 y 4: Feed Personalizado, Hashtags y Temáticas (Nightcore AQP)
-- Instrucciones: Ejecuta este código en tu SQL Editor de Supabase.
-- ==============================================================================

-- 1. Añadir 'tags' a canciones y disfraces (array de texto)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE costumes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Tabla para rastrear intereses discretos del usuario
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tag text NOT NULL,
  affinity_score int DEFAULT 1, -- Sube con likes, clicks o sugerencias
  last_interacted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tag)
);

-- Políticas para user_interests
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own interests" ON user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own interests" ON user_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interests" ON user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Permitimos lectura anónima o admin si es necesario para analíticas:
CREATE POLICY "Admin can view all interests" ON user_interests FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dj'))
);

-- 3. Tabla para sugerencias de temáticas (Votación estilo Reddit)
CREATE TABLE IF NOT EXISTS theme_proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  votes_count int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' -- pending, accepted, rejected
);

-- Políticas para theme_proposals
ALTER TABLE theme_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view theme proposals" ON theme_proposals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert proposals" ON theme_proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Votos (upvotes) lo haremos mediante una función RPC para evitar fraudes, o actualizando con RLS
CREATE POLICY "Users can update proposals (votes)" ON theme_proposals FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Función RPC para registrar afinidad de forma atómica (upsert)
CREATE OR REPLACE FUNCTION increment_user_interest(p_user_id uuid, p_tag text, p_weight int DEFAULT 1)
RETURNS void AS $$
BEGIN
  INSERT INTO user_interests (user_id, tag, affinity_score, last_interacted_at)
  VALUES (p_user_id, p_tag, p_weight, now())
  ON CONFLICT (user_id, tag)
  DO UPDATE SET 
    affinity_score = user_interests.affinity_score + EXCLUDED.affinity_score,
    last_interacted_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
