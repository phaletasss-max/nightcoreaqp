# Plan de Trabajo (PT-06) - Implementación Fases 3 y 4: Feed y Comunidad

## 1. Fase 3: Feed Personalizado y Hashtags
El objetivo es transformar la plataforma de una "lista" a un "feed" basado en intereses.

### A. Modificación de Esquema (BD)
1.  Modificar la tabla `songs` y `costumes` añadiendo una columna `tags JSONB` o creando una tabla intermedia `post_tags` si se busca alta normalización. Por simplicidad y velocidad, `tags text[]` (Array de strings) en Supabase Postgres es ideal.
2.  Crear tabla `user_interests (user_id, tag, weight INT)`.

### B. Tracking de Interacciones
1.  En la UI (`page.tsx`), al hacer un "upvote" a una canción que tenga el tag `#vocaloid`, disparar una llamada asíncrona a un RPC `increment_user_interest(user_id, '#vocaloid', 1)`.
2.  Al abrir un disfraz con `#cyberpunk`, hacer `increment_user_interest(user_id, '#cyberpunk', 0.5)`.

### C. Algoritmo de Priorización
1.  Al renderizar el feed de canciones en `/playlist`, en lugar de ordenar solo por `votes_count DESC`, usar una vista SQL o RPC que multiplique el peso de los tags coincidentes del usuario por los votos base.
2.  Añadir un componente "Filtro de Tags" en la parte superior que permita a los usuarios aislar el feed a un solo hashtag con un clic.

## 2. Fase 4: Temáticas Comunitarias
Generar sentido de pertenencia permitiendo que los usuarios elijan la temática de la próxima edición de Nightcore AQP.

### A. Componente "Propuestas"
1.  Crear `src/components/ThemeProposals.tsx`.
2.  Permitir a los usuarios proponer un tema (ej. "Cyberpunk Y2K", "Maid Cafe", "E-girl/E-boy").
3.  Votación de estilo Reddit (+1 / -1).

### B. Muro de la Fama
1.  Crear la ruta `src/app/history/page.tsx` o un componente en el perfil.
2.  Mostrar el "Hall of Fame":
    *   Geek con la Racha más alta (Top Streak).
    *   Canción más tocada en la historia del club.
    *   Disfraces que ganaron ediciones pasadas.
