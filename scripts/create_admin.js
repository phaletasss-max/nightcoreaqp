/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer variables de entorno de .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const lines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

lines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('Creando usuario administrador...');
  const { data, error } = await supabase.auth.signUp({
    email: 'manchuriam@nightcore.aqp.fest.com',
    password: 'Nakamura321.',
    options: {
      data: {
        username: 'manchuriam'
      }
    }
  });

  if (error) {
    console.error('❌ Error creando usuario:', error.message);
  } else {
    console.log('✅ Usuario CREADO CORRECTAMENTE:', data.user.email);
    console.log('Ahora puedes iniciar sesión con:');
    console.log('Correo: manchuriam@nightcore.aqp.fest.com');
    console.log('Contraseña: Nakamura321.');
  }
}

createAdmin();
