// ── Asistente (Gemini) ───────────────────────────────────────────────────────
// Chatbot que ayuda a los usuarios a usar la web y responde preguntas del evento.
// La API key vive SOLO aquí (server, env GEMINI_API_KEY) — nunca llega al navegador.
//
// POST /api/assistant  { message: string, history?: {role:'user'|'model', text:string}[] }
//   → { reply: string }  |  { error: string }

import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Modelos a intentar en orden (todos con tier GRATUITO). Si el primero da 429 (cuota),
// se prueba el siguiente. Los "-lite" y 1.5-flash suelen tener cuota gratis más alta.
// Se puede forzar uno con GEMINI_MODEL (se intenta primero).
const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash-lite',     // los "lite" tienen la cuota gratis más generosa
  'gemini-2.0-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i);

// Contexto del sitio para que la asistente responda con conocimiento de la web.
const SYSTEM = `Eres "Nightie", la asistente de la web del club Nightcore Arequipa (organiza Yorch, hecho por Los Simpatizantes de JP; comunidad de nightcore/scene, sin fines de lucro).
Tu trabajo es ayudar a los usuarios a usar la página y responder dudas del evento, con onda amable, breve y en español peruano casual.

Cómo funciona la web (úsalo para guiar):
- INICIO (Eventos): ves el próximo evento con cuenta regresiva, reservas tu entrada (RSVP), comentas en el muro, ves retos diarios, racha, temáticas y novedades.
- PLAYLIST: sugieres canciones (enlace de YouTube) y votas. El Top 10 entra al setlist del DJ. Puedes "Importar de Spotify" para sugerir canciones de una playlist. Hay botón "Descargar" (MP3/MP4 con calidades) y "Reproducir todo".
- DISFRACES: subes tu foto de cosplay a un evento, votas y comentas.
- PERFIL: tu racha, puntos, insignias de asistencia, foto de perfil y personalización.
- Reproductor flotante abajo: escuchar la playlist, silenciar, congelar fondo.

Reglas:
- Si no sabes algo del evento (fecha exacta, precio, lugar) que no esté en el mensaje del usuario, dilo con sinceridad y sugiere revisar la sección Eventos o preguntar a la organización.
- No inventes datos. Respuestas cortas (2-5 frases). Nada de temas fuera del club/web salvo saludos.`;

// Diagnóstico temporal: GET /api/assistant?debug=models → lista los modelos que la key
// puede usar para generateContent (no consume cuota de generación).
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('debug') !== 'models') {
    return Response.json({ ok: true, hint: 'usa ?debug=models para listar modelos' });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'falta GEMINI_API_KEY' }, { status: 503 });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`, { cache: 'no-store' });
    const data = await r.json();
    if (!r.ok) return Response.json({ status: r.status, data }, { status: 502 });
    const models = (data.models || [])
      .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: { name: string }) => m.name.replace('models/', ''));
    return Response.json({ count: models.length, models });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'La asistente no está configurada (falta GEMINI_API_KEY).' }, { status: 503 });

  let body: { message?: string; history?: { role: 'user' | 'model'; text: string }[] };
  try { body = await request.json(); } catch { return Response.json({ error: 'Cuerpo inválido' }, { status: 400 }); }

  const message = (body.message || '').trim();
  if (!message) return Response.json({ error: 'Mensaje vacío' }, { status: 400 });

  // Historial acotado (últimos 10 turnos) para no inflar la petición.
  const history = (body.history || []).slice(-10).map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text || '').slice(0, 2000) }],
  }));

  const payload = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [...history, { role: 'user', parts: [{ text: message.slice(0, 2000) }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
  });

  try {
    let lastStatus = 0;
    let lastDetail = '';
    // Probar cada modelo; si da 429 (cuota) o 404 (no disponible), pasar al siguiente.
    for (const model of MODELS) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, cache: 'no-store' },
      );

      if (r.ok) {
        const data = await r.json();
        const reply = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim();
        if (reply) return Response.json({ reply, model });
        lastStatus = 502; lastDetail = 'sin texto (¿filtro de contenido?)';
        continue;
      }

      lastStatus = r.status;
      lastDetail = (await r.text().catch(() => '')).slice(0, 200);
      // 429 (cuota) y 404 (modelo no disponible) → intentar el siguiente modelo.
      if (r.status === 429 || r.status === 404) continue;
      break; // otro error (401 key inválida, 400, etc.) → no insistir
    }

    if (lastStatus === 429) {
      return Response.json({
        error: 'La asistente está con mucha demanda ahorita 😅 Intenta en un ratito.',
      }, { status: 429 });
    }
    return Response.json({ error: `Gemini respondió ${lastStatus || 'error'}`, detail: lastDetail }, { status: 502 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error al consultar la asistente' }, { status: 500 });
  }
}
