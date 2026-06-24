import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// Ruta protegida por Vercel Cron Secret o llamada manual
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[FASE 9] Iniciando limpieza automática de archivos viejos...');
    
    // Asumiendo que guardamos MP4s descargados en un bucket llamado 'media'
    const { data: files, error: listError } = await supabase.storage.from('media').list();
    if (listError) throw listError;

    // Buscar archivos de más de 7 días
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oldFiles = files?.filter(file => file.created_at && new Date(file.created_at) < oneWeekAgo) || [];
    const filesToDelete = oldFiles.map(f => f.name);

    if (filesToDelete.length > 0) {
      const { error: removeError } = await supabase.storage.from('media').remove(filesToDelete);
      if (removeError) throw removeError;
      console.log(`[FASE 9] Limpieza completada. Eliminados ${filesToDelete.length} archivos antiguos.`);
    } else {
      console.log('[FASE 9] No se encontraron archivos para limpiar.');
    }

    // 2. Opcional: Archivar o eliminar comentarios antiguos para liberar base de datos.
    // ...

    return NextResponse.json({ success: true, deletedCount: filesToDelete.length });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[FASE 9] Error en limpieza de storage:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
