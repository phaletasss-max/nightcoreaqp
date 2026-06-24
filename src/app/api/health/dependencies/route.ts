import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || 'http://localhost:8787';

  let dbStatus = 'unreachable';
  let storageStatus = 'unreachable';
  let mediaStatus = 'unreachable';
  let ytDlpVersion = null;
  let ffmpegVersion = null; // media-service ytcheck doesnt return ffmpeg version directly but we report media service status

  try {
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // DB Test
      const { error: dbError } = await supabase.from('site_settings').select('id').limit(1);
      if (!dbError) dbStatus = 'ok';

      // Storage Test
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets && buckets.some(b => b.name === 'media')) {
        storageStatus = 'ok';
      }
    }
  } catch (e) {
    // Ignore and keep as unreachable
  }

  try {
    // Media Service Test
    const mediaRes = await fetch(`${mediaUrl}/api/ytcheck`, { signal: AbortSignal.timeout(5000) });
    if (mediaRes.ok) {
      const data = await mediaRes.json();
      mediaStatus = data.yt_dlp ? 'ok' : 'error';
      ytDlpVersion = data.yt_dlp_version;
      ffmpegVersion = 'installed (inferred via service)';
    }
  } catch (e) {
    // Ignore and keep as unreachable
  }

  return NextResponse.json({
    database: dbStatus,
    storage: storageStatus,
    mediaService: mediaStatus,
    ytDlpVersion,
    ffmpegVersion
  });
}
