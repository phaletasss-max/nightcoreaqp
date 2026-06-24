import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || 'http://localhost:8787';

async function verifyMediaService() {
  console.log(`[VERIFY-MEDIA-SERVICE] Probando disponibilidad en ${baseUrl}...`);

  try {
    // 1. Endpoint /health
    const healthRes = await fetch(`${baseUrl}/health`);
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
    const healthData = await healthRes.json();
    if (healthData.status !== 'OK') throw new Error('Status no es OK en /health');

    // 2. Verificación de yt-dlp y dependencias
    const ytRes = await fetch(`${baseUrl}/api/ytcheck`);
    if (!ytRes.ok) throw new Error(`ytcheck falló: HTTP ${ytRes.status}`);
    const ytData = await ytRes.json();
    
    if (!ytData.yt_dlp) {
      throw new Error('yt-dlp no está instalado o falló en el servidor media');
    }

    console.log(`✅ [VERIFY-MEDIA-SERVICE] Servicio saludable. yt-dlp detectado: ${ytData.yt_dlp_version}`);

  } catch (error: any) {
    console.error(`❌ [VERIFY-MEDIA-SERVICE] Error conectando al Media Service: ${error.message}`);
    process.exit(1);
  }
}

verifyMediaService();
