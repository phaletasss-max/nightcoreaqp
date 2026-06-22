// ── Cliente del convertidor (Fase F) ─────────────────────────────────────────
// Habla con el media-service (mismo servidor Arch) para convertir archivos:
// PDF⇄Word, JPG/PNG/WebP, MP4→MP3. Si no está configurado, las funciones degradan.

import { isMediaConfigured } from './media';

const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || '').replace(/\/$/, '');

export interface ConvertOption {
  id: string;
  name: string;
  input: string[];
  output: string;
}

// Lista de conversiones disponibles (las define el servidor).
export async function getConvertOptions(): Promise<ConvertOption[]> {
  if (!isMediaConfigured()) return [];
  try {
    const r = await fetch(`${MEDIA_URL}/api/convert/options`);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.options as ConvertOption[]) ?? [];
  } catch {
    return [];
  }
}

// Convierte un archivo y lo descarga en el navegador. `outName` ya incluye extensión.
export async function convertFile(tipo: string, file: File, outName: string): Promise<void> {
  if (!isMediaConfigured()) throw new Error('El convertidor estará disponible al conectar el servicio.');
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(`${MEDIA_URL}/api/convert/${tipo}`, { method: 'POST', body: fd });
  if (!r.ok) {
    let msg = 'Error en la conversión';
    try { const j = await r.json(); msg = j.error || msg; } catch { /* respuesta no-JSON */ }
    throw new Error(msg);
  }
  const blob = await r.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = outName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}
