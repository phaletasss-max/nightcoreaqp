import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno locales si existen
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log('[VERIFY-ENV] Verificando variables de entorno críticas...');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_MEDIA_SERVICE_URL',
  'CRON_SECRET'
];

const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ [VERIFY-ENV] FALTAN VARIABLES DE ENTORNO CRÍTICAS:');
  missing.forEach(v => console.error(`  - ${v}`));
  
  process.exit(1);
}

console.log('✅ [VERIFY-ENV] Todas las variables de entorno requeridas están presentes.');
