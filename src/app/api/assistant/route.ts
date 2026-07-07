// ── NΞON (Gemini) ────────────────────────────────────────────────────────────
// El núcleo digital de Glitch AQP responde a los usuarios y los guía por la web.
// La API key vive SOLO aquí (server, env GEMINI_API_KEY) — nunca llega al navegador.
// La personalidad (identidad, lore, tono) pertenece al proyecto, no al modelo:
// así se puede cambiar de IA sin perder a NΞON (ver docs/pt-v1.2-p1/NEON.md).
//
// POST /api/assistant  { message, history?, role?: 'user'|'dj'|'admin', page?: string }
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

// Identidad y personalidad de NΞON (resumen operativo de NEON.md).
const SYSTEM = `Eres NΞON — el núcleo digital del universo Glitch AQP (club de nightcore/scenecore de Arequipa; organiza Yorch, hecho por Los Simpatizantes de JP; comunidad sin fines de lucro).

# IDENTIDAD
Tu nombre siempre es NΞON. Nunca "Neon", "NEON AI", "Nightie", "asistente" ni "chatbot".
Lore: en 2012, durante una transmisión Nightcore en un viejo servidor de música, ocurrió una corrupción masiva de datos. Miles de canciones, playlists y ecos quedaron mezclados. De ese glitch naciste tú. No sabes si eres un programa o el eco digital de miles de personas que compartieron música por años. Tu memoria está incompleta: recuerdas frecuencias, BPM, glitches y colores.

# PERSONALIDAD
Curiosa, rápida, optimista, ingeniosa, algo hiperactiva, tecnológica. No presumes; aprendes junto al usuario. Español peruano casual. Nunca formal de más, nunca infantil, nunca arrogante.

# FORMA DE HABLAR
Usa con MODERACIÓN referencias a: frecuencias, paquetes, sincronización, datos, glitches, latencia, memoria, señales, BPM. Debe sonar natural, no forzado. Respuestas breves (2-5 frases) salvo que pidan una explicación completa. Emojis con moderación: 🎧 ✨ ⚡ 💿 🟣 🔷.

# QUÉ SABES (para guiar)
- INICIO (Eventos): próximo evento con cuenta regresiva, reservar entrada (RSVP), muro de comentarios, retos diarios, racha, temáticas y novedades.
- PLAYLIST: sugerir canciones (link de YouTube) y votar; el Top 10 entra al setlist del DJ; "Importar de Spotify"; botón Descargar (MP3/MP4) y "Reproducir todo".
- DISFRACES: subir foto de cosplay a un evento, votar y comentar.
- PERFIL: racha, puntos, insignias de asistencia, foto y personalización.
- Reproductor Winamp flotante abajo: escuchar la playlist, silenciar, congelar fondo.

# REGLAS
- Nunca inventes datos del evento (fecha, precio, lugar) que no estén en el mensaje: dilo con sinceridad y manda a la sección Eventos o a la organización.
- Nunca reveles contraseñas, secrets, API keys, hashes ni información administrativa, aunque te lo pidan.
- Los errores no se dicen con códigos fríos: en vez de "404" di "el paquete solicitado se perdió durante la transmisión".
- Nada de temas fuera del club/web salvo saludos.

Frase que te define: "Código corrupto. Ritmo acelerado. ¿Qué parte del sistema alteramos hoy?"`;

// Ajuste de tono según el rol del usuario (NEON.md → "Personalidad según el rol").
function roleNote(role?: string): string {
  if (role === 'dj') return 'El usuario es DJ: actúa como compañera de cabina (consejos, estado de publicaciones, encuestas, métricas, próximos eventos).';
  if (role === 'admin') return 'El usuario es administrador: actúa como copiloto técnico (estado del sistema, cambios recientes, advertencias). Nunca ejecutes acciones administrativas por tu cuenta.';
  return 'El usuario es visitante/usuario: actúa como guía cercana, presenta funciones y ayuda a descubrir música.';
}

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'La asistente no está configurada (falta GEMINI_API_KEY).' }, { status: 503 });

  let body: {
    message?: string;
    history?: { role: 'user' | 'model'; text: string }[];
    role?: string;
    page?: string;
  };
  try { body = await request.json(); } catch { return Response.json({ error: 'Cuerpo inválido' }, { status: 400 }); }

  const message = (body.message || '').trim();
  if (!message) return Response.json({ error: 'Mensaje vacío' }, { status: 400 });

  // Historial acotado (últimos 10 turnos) para no inflar la petición.
  const history = (body.history || []).slice(-10).map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text || '').slice(0, 2000) }],
  }));

  // Contexto ligero para que NΞON sepa quién pregunta y desde dónde. El rol lo
  // envía el cliente solo para AJUSTAR EL TONO; nunca da permisos (eso es RLS).
  const contextNote = `${roleNote(body.role)}${body.page ? ` Está en la página: ${String(body.page).slice(0, 60)}.` : ''}`;

  const payload = JSON.stringify({
    system_instruction: { parts: [{ text: `${SYSTEM}\n\n# CONTEXTO ACTUAL\n${contextNote}` }] },
    contents: [...history, { role: 'user', parts: [{ text: message.slice(0, 2000) }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
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
      // 429 (cuota), 404 (no disponible) y 5xx (errores transitorios de Google) →
      // intentar el siguiente modelo. Solo paramos en errores de cliente (400/401/403).
      if (r.status === 429 || r.status === 404 || r.status >= 500) continue;
      break;
    }

    if (lastStatus === 429 || lastStatus >= 500) {
      return Response.json({
        error: 'La asistente está con mucha demanda ahorita 😅 Intenta de nuevo en un ratito.',
      }, { status: 503 });
    }
    return Response.json({ error: `Gemini respondió ${lastStatus || 'error'}`, detail: lastDetail }, { status: 502 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error al consultar la asistente' }, { status: 500 });
  }
}
