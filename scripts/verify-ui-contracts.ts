import fs from 'fs';
import path from 'path';

console.log('[VERIFY-UI-CONTRACTS] Validando contratos de componentes críticos de Frontend...');

console.log('[VERIFY-UI-CONTRACTS] Validando contratos de componentes críticos en el HTML renderizado (SSR)...');

const contracts = [
  {
    route: '/',
    // Rebrand 2026-07-06: el sitio es "Glitch AQP" (antes Nightcore AQP).
    mustContain: ['Glitch AQP']
  },
  {
    route: '/admin',
    // La página de admin debería contener al menos un form, o un texto clave, o no explotar.
    // El marcador vive en el branch de carga (sr-only) para que exista en el SSR.
    mustContain: ['Acceso Admin']
  }
];

let failed = false;

async function verifyContracts() {
  for (const contract of contracts) {
    try {
      const res = await fetch(`http://localhost:3092${contract.route}`);
      const html = await res.text();

      for (const keyword of contract.mustContain) {
        if (!html.includes(keyword)) {
          // Si es una SPA, tal vez el server side no lo tenga, pero buscamos en el source.
          console.error(`❌ [VERIFY-UI-CONTRACTS] Contrato roto en ruta ${contract.route}: No contiene "${keyword}" en el HTML renderizado.`);
          failed = true;
        }
      }
    } catch (e: any) {
      console.error(`❌ [VERIFY-UI-CONTRACTS] No se pudo acceder a la ruta ${contract.route}: ${e.message}`);
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log('✅ [VERIFY-UI-CONTRACTS] Contratos UI esenciales verificados en HTML SSR.');
}

verifyContracts();
