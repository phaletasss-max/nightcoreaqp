# Esquema de Funcionamiento - Nightcore AQP

```mermaid
graph TD
    %% Usuarios
    U[Usuarios / Geeks] -->|Visita la App| F[Frontend - Next.js]
    DJ[DJs / Admins] -->|Panel Admin| F

    %% Frontend
    subgraph Frontend [Next.js App Router]
        F --> P1[Página Principal / RSVP]
        F --> P2[Playlist / Feed Personalizado]
        F --> P3[Disfraces / Muro de Fama]
        F --> P4[Perfil y Modo DJ]
        
        P1 -->|Genera Ticket| Supabase
        P2 -->|Sugerencias & Votos| Supabase
        P3 -->|Sube WIPs & Fotos| Supabase
        P4 -->|Rachas y Puntaje| Supabase
    end

    %% Backend y DB
    subgraph Backend [Supabase Cloud]
        Supabase[(Base de Datos\nPostgreSQL)]
        Auth[Autenticación\nMagic Links / Passwords]
        Storage[Almacenamiento\nFotos / Eventos]
        
        Supabase --- Auth
        Supabase --- Storage
        
        %% Tablas clave
        Supabase -.-> T1[songs & tags]
        Supabase -.-> T2[costumes & is_wip]
        Supabase -.-> T3[profiles & points]
        Supabase -.-> T4[events & rsvp]
    end

    %% Procesos automatizados
    subgraph Automatizaciones
        GH[GitHub Actions] -->|Typecheck & Lint| Vercel
        Vercel[Vercel CI/CD] -->|Despliega| F
        VercelCron[Vercel Cron Jobs] -->|Llama api/cron/cleanup| Supabase
    end

    %% Media Service (Opcional / Crate)
    subgraph MediaService [Crate Builder]
        API[api/crate/download] -->|yt-dlp| YT[(YouTube)]
        API -->|Comprime| ZIP[Crate.zip]
        ZIP -->|Descarga| DJ
    end
```

## Flujos Principales Implementados

1. **El Hype (Pre-Evento):** Los usuarios interactúan con `Disfraces` subiendo fotos de sus WIPs (Work in Progress). Votan en temáticas para los próximos eventos y reservan sus tickets RSVP (lo que incrementa la urgencia debido al contador de aforo restante).
2. **El Feed Personalizado:** A través de la página `/playlist`, las sugerencias de canciones se agrupan por `tags`. El usuario puede filtrar su lista y el frontend calcula dinámicamente qué mostrar.
3. **El Evento en Vivo (Modo DJ):** El DJ accede a `/admin` y genera un "Crate" en ZIP. En el panel, proyecta el reproductor visual con fondo de video y pone el `GlobalPlayer` para reproducir las canciones más votadas en tiempo real.
4. **Post-Evento y Retención:** El sistema otorga puntos y rachas (`streaks`) a los usuarios que asistieron (probado mediante fotos Miku-Modal). El CronJob semanal limpia la base de datos de archivos de caché pesados para evitar costos de hosting excesivos en Supabase.
