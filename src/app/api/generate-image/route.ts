// ── Generación de imágenes (Gemini / Imagen) ─────────────────────────────────
// Genera un fondo con la estética del sitio. La API key vive SOLO aquí (server,
// GEMINI_API_KEY, la misma del asistente). CUESTA DINERO → exige sesión staff.
//
// POST /api/generate-image  { prompt, theme?, aspect? }   (Authorization: Bearer <supabase access_token>)
//   → { image: 'data:image/png;base64,...', model }  |  { error }

import type { NextRequest } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { buildImagePrompt, ASPECT_RATIO, type ImageAspect } from '@/lib/imagePrompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Modelos a intentar en orden. Los 'imagen-*' usan :predict; el resto :generateContent.
// Se puede forzar uno con GEMINI_IMAGE_MODEL. Los IDs cambian seguido → cascada como en el asistente.
const IMAGE_MODELS = [
  process.env.GEMINI_IMAGE_MODEL,
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-preview-image-generation',
  'imagen-3.0-generate-002',
].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i) as string[];

// Verifica que el llamante sea staff (admin/dj) con su token de Supabase. Sin
// Supabase configurado (modo demo) no se puede gatear, pero ahí falta la key igual.
async function isStaffRequest(req: NextRequest): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return false;
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single();
  return prof?.role === 'admin' || prof?.role === 'dj';
}

// Pide la imagen a un modelo concreto. Devuelve dataURL o null; lanza con el status.
async function tryModel(model: string, prompt: string, aspect: ImageAspect, key: string): Promise<{ dataUrl: string } | { status: number; detail: string }> {
  const base = 'https://generativelanguage.googleapis.com/v1beta/models';

  if (model.startsWith('imagen')) {
    const r = await fetch(`${base}/${model}:predict?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: ASPECT_RATIO[aspect] } }),
    });
    if (!r.ok) return { status: r.status, detail: (await r.text().catch(() => '')).slice(0, 200) };
    const data = await r.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return { status: 502, detail: 'imagen sin datos' };
    return { dataUrl: `data:image/png;base64,${b64}` };
  }

  // gemini-*-image: generateContent con modalidad de imagen.
  const r = await fetch(`${base}/${model}:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  if (!r.ok) return { status: r.status, detail: (await r.text().catch(() => '')).slice(0, 200) };
  const data = await r.json();
  const parts: { inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string; mime_type?: string } }[] =
    data?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    const inline = p.inlineData || p.inline_data;
    const b64 = inline?.data;
    if (b64) {
      const mime = (inline as { mimeType?: string; mime_type?: string }).mimeType || (inline as { mime_type?: string }).mime_type || 'image/png';
      return { dataUrl: `data:${mime};base64,${b64}` };
    }
  }
  return { status: 502, detail: 'respuesta sin imagen (¿modelo no genera imágenes?)' };
}

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'La generación de imágenes no está configurada (falta GEMINI_API_KEY).' }, { status: 503 });

  if (!(await isStaffRequest(request))) {
    return Response.json({ error: 'Solo el staff (admin/DJ) puede generar imágenes.' }, { status: 403 });
  }

  let body: { prompt?: string; theme?: string; aspect?: ImageAspect };
  try { body = await request.json(); } catch { return Response.json({ error: 'Cuerpo inválido' }, { status: 400 }); }

  const aspect: ImageAspect = body.aspect === 'square' || body.aspect === 'og' ? body.aspect : 'banner';
  const prompt = buildImagePrompt(body.prompt || '', body.theme || 'default', aspect);

  let lastStatus = 0;
  let lastDetail = '';
  try {
    for (const model of IMAGE_MODELS) {
      const res = await tryModel(model, prompt, aspect, key);
      if ('dataUrl' in res) return Response.json({ image: res.dataUrl, model });
      lastStatus = res.status; lastDetail = res.detail;
      // 404 (modelo no existe) y 400 (forma no soportada por ese modelo) → probar el siguiente.
      if (res.status === 404 || res.status === 400 || res.status >= 500) continue;
      break; // 401/403/429 → parar (problema de acceso/cuota, no de modelo)
    }
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error al generar la imagen' }, { status: 500 });
  }

  if (lastStatus === 403 || lastStatus === 401) {
    return Response.json({ error: 'Tu GEMINI_API_KEY no tiene acceso a generación de imágenes. Activa Imagen/billing en Google AI Studio.', detail: lastDetail }, { status: 403 });
  }
  if (lastStatus === 429) {
    return Response.json({ error: 'Sin cuota para generar imágenes ahora mismo. Intenta más tarde o revisa tu plan.', detail: lastDetail }, { status: 429 });
  }
  return Response.json({ error: `No se pudo generar la imagen (${lastStatus || 'error'}).`, detail: lastDetail }, { status: 502 });
}
