import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('[VERIFY-SCHEMA] Validando integridad de base de datos...');

  try {
    // 1. Validar tabla 'events' y sus columnas
    const { data: events, error: e1 } = await supabase.from('events').select('id, title, date, is_visible').limit(1);
    if (e1 && e1.code !== 'PGRST116') throw new Error(`Tabla 'events' falló: ${e1.message}`);

    // 2. Validar tabla 'costumes' (disfraces)
    const { data: costumes, error: e2 } = await supabase.from('costumes').select('id, char_name, photo_url, user_id, event_id').limit(1);
    if (e2 && e2.code !== 'PGRST116') throw new Error(`Tabla 'costumes' falló: ${e2.message}`);

    // 3. Validar tabla 'site_settings'
    const { data: settings, error: e3 } = await supabase.from('site_settings').select('id, setting_key, setting_value').limit(1);
    if (e3 && e3.code !== 'PGRST116') throw new Error(`Tabla 'site_settings' falló: ${e3.message}`);

    // 4. Validar Bucket de Storage 'media'
    const { data: buckets, error: e4 } = await supabase.storage.listBuckets();
    if (e4) throw new Error(`Error leyendo Buckets: ${e4.message}`);
    const mediaBucket = buckets.find(b => b.name === 'media');
    if (!mediaBucket) throw new Error(`Bucket crítico 'media' no encontrado.`);

    console.log('✅ [VERIFY-SCHEMA] Esquema de BD e integridad de tablas confirmada.');

  } catch (error: any) {
    console.error('❌ [VERIFY-SCHEMA] Fallo de integridad:', error.message);
    process.exit(1);
  }
}

verifySchema();
