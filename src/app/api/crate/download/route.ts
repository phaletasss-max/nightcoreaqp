import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require('archiver');

const execAsync = promisify(exec);

export const maxDuration = 300; // 5 minutos (solo Vercel Pro/Local)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const format = searchParams.get('format') || 'mp3';
    
    // Inicializar Supabase cliente
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // NOTA: Para una seguridad robusta en un link directo (window.open), 
    // se requeriría pasar un token o usar SSR auth real. 
    // Por ahora obtenemos las canciones directamente.

    // Fetch songs
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('played', false)
      .order('votes_count', { ascending: false })
      .limit(limit);

    if (error || !songs || songs.length === 0) {
      return new NextResponse('No hay canciones en cola', { status: 404 });
    }

    // Prepare temp dir
    const tmpDir = path.join(os.tmpdir(), `crate_${crypto.randomUUID()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Download using yt-dlp (child_process to handle args better)
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      try {
        const safeTitle = `${String(i + 1).padStart(2, '0')} - ${song.artist} - ${song.title}`.replace(/[/\\?%*:|"<>]/g, '-');
        const outputPath = path.join(tmpDir, `${safeTitle}.%(ext)s`);
        
        let cmd = '';
        if (format === 'mp3') {
          cmd = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${song.youtube_url}"`;
        } else {
          cmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${song.youtube_url}"`;
        }
        
        await execAsync(cmd);
      } catch (err) {
        const e = err as Error;
        console.error(`Error descargando ${song.title}:`, e);
        // Continue with the next song even if one fails
      }
    }

    // Create readable stream for the ZIP
    const stream = new ReadableStream({
      start(controller) {
        const archive = archiver('zip', { zlib: { level: 5 } });
        
        archive.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        archive.on('end', () => {
          controller.close();
          // Clean temp dir after sending
          fs.rmSync(tmpDir, { recursive: true, force: true });
        });
        archive.on('error', (err: Error) => controller.error(err));
        
        archive.directory(tmpDir, false);
        archive.finalize();
      }
    });

    const filename = `NightcoreAQP_Crate_${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err: unknown) {
    const e = err as Error;
    console.error('Error en Crate Builder:', e);
    return new NextResponse(`Error interno: ${e.message}`, { status: 500 });
  }
}
