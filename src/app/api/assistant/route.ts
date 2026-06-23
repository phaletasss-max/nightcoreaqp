// ── Asistente (Gemini) ───────────────────────────────────────────────────────
// Chatbot que ayuda a los usuarios a usar la web y responde preguntas del evento.
// La API key vive SOLO aquí (server, env GEMINI_API_KEY) — nunca llega al navegador.
//
// POST /api/assistant  { message: string, history?: {role:'user'|'model', text:string}[] }
//   → { reply: string }  |  { error: string }

import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

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

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [...history, { role: 'user', parts: [{ text: message.slice(0, 2000) }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
        }),
        cache: 'no-store',
      },
    );

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return Response.json({ error: `Gemini respondió ${r.status}`, detail: detail.slice(0, 300) }, { status: 502 });
    }

    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim();
    if (!reply) return Response.json({ error: 'La asistente no devolvió respuesta (¿filtro de contenido?).' }, { status: 502 });

    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error al consultar la asistente' }, { status: 500 });
  }
}
