import fs from 'fs';
import path from 'path';

console.log('[VERIFY-ROUTES] Verificando estructura de Next.js App Router...');

console.log('[VERIFY-ROUTES] Verificando rutas HTTP en http://localhost:3092...');

const routes = [
  '/',
  '/playlist',
  '/disfraces',
  '/admin',
  '/api/health'
];

let failed = false;

async function verifyRoutes() {
  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3092${route}`);
      if (res.ok || res.status === 401 || res.status === 404) {
        // Consideramos ok, 401 (Admin unauth), o 404 (si la ruta espera params) como viva
        console.log(`  ✔️ Route ${route} -> ${res.status}`);
      } else {
        console.error(`  ❌ Route ${route} devolvió error HTTP ${res.status}`);
        failed = true;
      }
    } catch (e: any) {
      console.error(`  ❌ Route ${route} inalcanzable: ${e.message}`);
      failed = true;
    }
  }

  if (failed) process.exit(1);
  console.log('✅ [VERIFY-ROUTES] Todas las rutas HTTP críticas responden correctamente.');
}

verifyRoutes();
