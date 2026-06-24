import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar service role para asegurar privilegios

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySupabase() {
  console.log('[VERIFY-SUPABASE] Probando conectividad con Supabase...');
  const start = performance.now();

  try {
    // 1. Consulta simple
    const { error: dbError } = await supabase.from('events').select('id').limit(1);
    if (dbError) throw new Error(`Error en DB: ${dbError.message}`);

    // 2. Verificar Storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) throw new Error(`Error en Storage: ${storageError.message}`);
    const mediaBucket = buckets.find(b => b.name === 'media');
    if (!mediaBucket) console.warn('⚠️ [VERIFY-SUPABASE] El bucket "media" no existe en Storage.');

    // 3. Verificar Auth (ping al endpoint admin)
    const { error: authError } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (authError) throw new Error(`Error en Auth: ${authError.message}`);

    const end = performance.now();
    console.log(`✅ [VERIFY-SUPABASE] Conectividad exitosa. Tiempo de respuesta: ${(end - start).toFixed(2)}ms`);

  } catch (error: any) {
    console.error('❌ [VERIFY-SUPABASE] Fallo de conectividad:', error.message);
    process.exit(1);
  }
}

verifySupabase();
