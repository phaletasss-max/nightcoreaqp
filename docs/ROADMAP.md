# Nightcore AQP — Plan maestro (v2)

> Club de nightcore de Arequipa. Organiza **Yorch**. Sitio creado por el grupo
> **"Los Simpatizantes de JP"**. Sin fines de lucro, todo público (código y dominios).
> Edición actual: **Nightcore Arequipa 3**.

Este documento traduce la lluvia de ideas en un plan ejecutable. Cada sección mapea
un pedido → solución técnica → fase.

---

## 0. Arquitectura objetivo (3 piezas)

El punto clave: **Vercel/Next.js no puede ejecutar `yt-dlp`** (YouTube bloquea las IPs
de la nube y el serverless no permite binarios de larga duración). Por eso separamos:

```
┌─────────────────────┐     ┌──────────────────────┐     ┌───────────────────────────┐
│  Frontend (Vercel)  │────▶│  Supabase (gratis)   │     │  Media-service (Arch+yt-dlp) │
│  Next.js + React    │     │  Postgres · Auth ·   │◀───▶│  Reusa bot-erp:              │
│  (lo que ya tenemos)│     │  Storage · Realtime  │     │  yt-dlp · ffmpeg · libreoffice│
└─────────────────────┘     └──────────────────────┘     └───────────────────────────┘
```

- **Frontend**: la app actual (ya conectada a Supabase con fallback demo).
- **Supabase**: BD, login, y **Storage** para guardar el mp3/mp4 descargado (el "comprobante").
- **Media-service**: tu propio servidor Arch corriendo una versión de `bot-erp`. Hace el
  trabajo "sucio" (verificar disponibilidad, descargar, convertir) y sube el archivo a
  Supabase Storage. Es la única pieza que toca YouTube, desde tu IP (no la de Vercel).

> Nota legal (importante, lo pediste claro): descargar y **redistribuir** audio/video con
> copyright es terreno gris. Como el club es sin fines de lucro y público, el riesgo es bajo,
> pero lo acotamos así: el archivo descargado se guarda como **respaldo privado / comprobante**
> y para el "set del DJ", no como descarga masiva pública. La descarga pública abierta se
> limita a contenido propio (sets grabados, edits del club). Es la misma línea que ya estaba
> en doc.md.

---

## 1. Fondo de video con scroll + reproductor (Home/Eventos)

**Pedido:** videos de Miku/YOASOBI/artistas de fondo *general* (no del contenedor del evento).
Al bajar, baja la opacidad y aparece otro video de otro autor. Botón global de audio: si lo
activas una vez, al seguir bajando la canción cambia sola. Controles tipo reproductor:
activar audio, pausar video, siguiente, y cambiar de tema **del mismo autor**.

**Solución:** Un componente `VideoBackground` fijo (`position: fixed`, detrás de todo, z-index −1)
que:
- Mantiene una lista de "escenas" (autor → varias pistas). Ej: Miku → [Idol, ...], FNAF → [...].
- Sincroniza la escena activa con el scroll (cross-fade de opacidad entre videos).
- Barra de reproductor flotante (abajo): ▶/⏸ video, 🔊 audio on/off (estado **global**),
  ⏭ siguiente autor, y ⏮/⏭ dentro del mismo autor. "Now playing: artista — pista".
- El audio usa la YouTube IFrame API (postMessage), como ya hicimos en el `CinematicHero`
  (reuso esa lógica, pero como **fondo** y con menos iframes montados a la vez por rendimiento).

**Mejora:** las pistas del fondo salen de **las canciones sugeridas más votadas** (no una lista
fija) → el fondo refleja a la comunidad. *Fase 2.*

---

## 2. Playlist + descarga/validación con yt-dlp (lo que más te gustó)

**Pedido:** sacar el enlace, descargar mp3, descargar mp4. Al sugerir, validar automáticamente
si el link es reproducible; si no, pedir otro (no privado); si no, descargarlo para guardarlo
en la BD como comprobante.

**Solución (reusa `bot-erp`):**
1. **Al sugerir canción** → el frontend llama a `POST {media-service}/api/info` (usa
   `yt-dlp --dump-json --no-download`, ya existe en tu `videoDownloader.js`). Devuelve
   título, autor, duración, thumbnail, `esLive`. 
   - Si responde OK y es embebible → se guarda el link normal. ✅ "Comprobante: reproducible".
   - Si falla / es privado / no embebible → se pide otro link **o** se marca para descarga.
2. **Descarga de respaldo** → `POST {media-service}/api/descargar` (tu `streamDownload`, mp3/mp4,
   con el fix de TikTok HEVC ya incluido) → el archivo se sube a **Supabase Storage**
   (`bucket: media`) y se guarda la `file_url` en la tabla `songs`.
3. **Botones en cada canción**: "Copiar enlace", "Descargar MP3", "Descargar MP4". Si hay
   respaldo en Storage, descarga de ahí; si no, stream en vivo desde el media-service.

**Tablas nuevas:** ya están previstas (`media_recordings`) + columnas en `songs`
(`file_url`, `is_playable`, `checked_at`). Lo añadiré al `schema.sql`.

**Consola DJ:** botón "Descargar set" → zip de las canciones del Top N para que el DJ arme su
crate. Mismo media-service.

---

## 3. Reestructura de navegación (IA)

**Pedido:** quitar **Admin** del nav (será solo para DJ/usuarios con credenciales). **Retos**
no tiene sentido como página: encuesta del día, racha diaria, fans del mes e historial pasan a
**Eventos**. Perfil solo si está registrado. Notificaciones arriba (junto a admin).

**Nuevo nav:**
```
Eventos (feed)  ·  Playlist  ·  Disfraces  ·  [🔔 Notificaciones]  ·  Perfil
                                          (Admin/DJ y Notificaciones: solo logueados con rol)
```
- **Eventos** se vuelve un **feed**: arriba el evento activo (banner + countdown + RSVP), y
  debajo un feed mezclado: encuesta del día, racha, fans del mes, posts de disfraces, debates,
  preguntas. Contenido **nuevo y no repetido**; lo viejo se revisita en su sección.
- **Retos** desaparece; su contenido vive en el feed de Eventos.
- **Perfil** redirige a login si no hay sesión.
- **Admin** sale del nav; se entra por `/admin` solo con rol `dj`/`admin`.

---

## 4. Feed de Eventos (algoritmo)

**Pedido:** feed sugerido, personalizado (si te gustan los disfraces, salen más), sin repetir,
solo cosas nuevas; encuestas/debates/preguntas mezclados.

**Solución (Fase 2–3):** tabla `feed_items` (tipo: costume | poll | debate | question | event)
+ tabla `feed_seen` (qué vio cada usuario). El feed sirve items no vistos, ponderados por las
categorías con las que más interactúa el usuario (likes/clicks). Empezamos simple
(cronológico + "no visto") y luego añadimos el peso por interés.

---

## 5. Disfraces

**Pedido:** añadir fecha y dejar elegir **a qué evento** pertenece la foto. Solo se puede subir a
un evento hasta **1 semana después** de que terminó; luego ya no.

**Solución:** la tabla `costumes` ya tiene `event_id`. Añadir validación: al subir, solo se
listan eventos cuya `date` sea futura o haya terminado hace ≤ 7 días. Mostrar la fecha/edición
("Nightcore AQP 3") en cada tarjeta. Insignia de asistencia se cruza con `event_attendees`.

---

## 6. Perfil enriquecido

**Pedido:** mostrar lo publicado, lo comentado, likes dados, e **insignias de asistencia**
("asistió a Nightcore 3"). Verificación de asistencia: a definir.

**Solución:** consultas a `costumes`, `*_comments`, `*_votes`, y `event_attendees` por usuario.
Insignias = filas en `event_attendees` con asistencia confirmada (la verificación real —QR en
puerta, código del staff— se decide luego).

---

## 7. Temáticas sugeridas por la comunidad

**Pedido:** que sugieran temáticas; las 10 más clickeadas = las más populares.

**Solución:** tabla `themes` (nombre, creado_por, clicks). Tabla `theme_clicks`. Ranking por
clicks. Las top 10 alimentan las temáticas del fondo de video y las votaciones de próximos eventos.

---

## 8. Verificación de cuenta (anti multi-cuenta) — INVESTIGACIÓN

**Pedido:** ¿se puede mandar correo o WhatsApp para confirmar el Gmail y evitar multicuentas?

**Resultados:**

| Opción | Cómo | Costo | Veredicto |
|--------|------|-------|-----------|
| **Confirmación por email** | Nativo en Supabase Auth (link de confirmación). Ya soportado. | **Gratis** | ✅ **Empezar aquí.** Frena bots casuales. |
| **OTP por SMS** | Supabase Phone Auth → proveedor Twilio. | ~US$0.05 + SMS por verificación | Opcional. Más fricción = menos multicuenta. |
| **OTP por WhatsApp** | Supabase Phone Auth, pero **WhatsApp solo vía Twilio/Twilio Verify**. Requiere aprobar un *sender* de WhatsApp Business. | Similar a SMS (~US$0.05/verif.), WhatsApp no cobra no-entregados | Opcional, mejor UX en Perú (todos tienen WhatsApp), pero hay que montar Twilio + WhatsApp Business. |

**Recomendación:** Fase 1 → **confirmación por email** (gratis, nativo, suficiente para un club).
Fase 2 (si hay abuso real) → **OTP de WhatsApp vía Twilio**, con *fallback* a SMS. El número de
teléfono único por cuenta es lo que de verdad corta las multicuentas (un email es gratis e
infinito; un número de WhatsApp, no tanto). Como el proyecto es público/sin fines de lucro,
el costo de Twilio sería el único gasto real — habría que ver si Yorch quiere asumirlo.

---

## 9. yt-dlp — INVESTIGACIÓN (hosting y límites)

- **No corre en Vercel/serverless**: YouTube bloquea IPs de cloud; el binario necesita proceso
  persistente. → Debe correr en **tu servidor Arch** (IP residencial), reusando `bot-erp`.
- **Límites**: ~300 videos/hora como invitado, ~2000/hora con cuenta (cookies). Para un club es
  más que suficiente. Si crece, se exportan cookies de una cuenta dedicada.
- **Mantenimiento**: `yt-dlp` se actualiza seguido (YouTube cambia su web). Hay que tenerlo
  actualizado (`pip install -U yt-dlp` por cron).
- **Plataformas que ya soporta tu código**: YouTube, Facebook, Instagram, TikTok (con fix HEVC).

---

## Branding / copy

- Quitar el tagline **"Música acelerada, eventos reales"** (no gusta).
- Reflejar: organiza **Yorch**, hecho por **"Los Simpatizantes de JP"**, por diversión, público.
- Pendiente: elegir el nuevo tagline (te paso 3 opciones para que escojas).

---

## Secuencia propuesta

| Fase | Entregable | Depende de |
|------|-----------|------------|
| **1** | IA nueva (quitar Retos/Admin del nav, feed básico en Eventos, perfil tras login), disfraces con evento+fecha, temáticas sugeridas, confirmación por email, branding nuevo. | Solo frontend + Supabase. **Sin servidor extra.** |
| **2** | Fondo de video con scroll + reproductor global. Validación de links con `/api/info`. | Media-service desplegado (bot-erp en Arch) + Supabase Storage. |
| **3** | Descarga mp3/mp4 + respaldo en Storage, "Descargar set" del DJ, feed personalizado por interés, OTP WhatsApp (si se decide). | Fase 2 estable. |

---

## Decisiones que necesito (de Yorch / ti)

1. **Verificación**: ¿arrancamos solo con email (gratis) y dejamos WhatsApp para después?
2. **Media-service**: ¿el servidor Arch estará siempre encendido y accesible por internet
   (IP pública / dominio / túnel)? El frontend en Vercel necesita poder llamarlo por HTTPS.
3. **Tagline nuevo**: te paso opciones.
4. **¿Empiezo por la Fase 1 ya** (no necesita servidor) mientras se decide lo del media-service?
