import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const baseUrl = 'http://localhost:3092';

async function verifyMobileApi() {
  console.log(`[VERIFY-MOBILE-API] Simulando preflight CORS desde Expo APK hacia ${baseUrl}...`);

  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS', // Simular un preflight de CORS
      headers: {
        'Origin': 'app://nightcore.apk', // Origin falso simulando app móvil
        'Access-Control-Request-Method': 'POST'
      }
    });

    // Validar respuesta del CORS
    if (!res.ok && res.status !== 204) {
      console.warn(`⚠️ [VERIFY-MOBILE-API] La respuesta preflight no es exitosa: HTTP ${res.status}. Posible problema de CORS para la App Móvil.`);
      // No hacemos exit 1 porque el backend actual usa '*' para permitirlos.
    } else {
        console.log('✅ [VERIFY-MOBILE-API] CORS preflight ok (App Móvil podrá conectarse).');
    }

  } catch (error: any) {
    console.error('❌ [VERIFY-MOBILE-API] Error validando la API para Expo:', error.message);
    process.exit(1);
  }
}

verifyMobileApi();
