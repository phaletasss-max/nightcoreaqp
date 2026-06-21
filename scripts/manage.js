require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan las credenciales NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const action = process.argv[2];

async function main() {
  if (action === 'clear-songs') {
    console.log('🗑️  Borrando todas las canciones de Supabase...');
    const { data, error } = await supabase.from('songs').delete().neq('id', 'dummy');
    
    if (error) {
      console.error('❌ Error al vaciar canciones:', error.message);
    } else {
      console.log('✅ Base de datos (songs) limpiada con éxito.');
    }
  } 
  else {
    console.log(`
Comandos disponibles:
  node scripts/manage.js clear-songs    -> Vacía la tabla de canciones en Supabase
    `);
  }
}

main();
