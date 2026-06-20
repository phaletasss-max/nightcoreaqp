// ── Subida a Supabase Storage ────────────────────────────────────────────────
// Sube el archivo descargado al bucket `media` y devuelve la URL pública.
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (clave de servicio, solo backend).

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'media';

const supabase = url && key ? createClient(url, key) : null;

function isConfigured() {
  return !!supabase;
}

async function uploadBuffer(buffer, filename, format) {
  if (!supabase) throw new Error('Supabase Storage no configurado en el media-service');
  const path = `${format}/${Date.now()}-${filename}`;
  const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { isConfigured, uploadBuffer };
