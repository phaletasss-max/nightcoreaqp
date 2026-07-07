'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Camera, Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AttendanceProofModal({ eventId, userId, onClose }: { eventId: string, userId: string | null, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleUpload = async () => {
    if (!file || !userId) return;
    setUploading(true);
    setStatus('idle');

    try {
      // 1. Subir al storage (bucket "media" o crear uno "attendance_proofs")
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/${userId}-${Math.random()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media') // Asumiendo que el bucket media es público o accesible
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // 2. Insertar en la BD
      const { error: dbError } = await supabase
        .from('attendance_proofs')
        .insert({
          event_id: eventId,
          user_id: userId,
          photo_url: publicUrl,
        });

      if (dbError) throw dbError;

      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md bg-surface border-neon-magenta/50 shadow-[0_0_30px_rgba(255,0,255,0.2)] overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white z-10">
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 text-center space-y-6">
          {/* Miku Animation / GIF Placeholder */}
          <div className="mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-neon-cyan shadow-[0_0_15px_#00ffff] bg-black">
            <img loading="lazy" decoding="async" 
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc29wMW42eTRwbmlqa3Z1ajg4eWgxaHNkZWVxbHB1cTBwYXYxZXp0aiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MhAih0q6uGoZa/giphy.gif" 
              alt="Miku animando" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-neon-magenta glow-magenta">¡MANDA UNA FOTO DEL EVENTO!</h2>
            <p className="text-sm text-muted">Para confirmar tu asistencia al 100% y ganar tu insignia permanente, manda una foto real del evento. Los admins la verificarán pronto.</p>
          </div>

          {status === 'success' ? (
            <div className="card accent-lime p-4 flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-neon-lime glow-lime" />
              <p className="font-bold text-white">¡Foto enviada a revisión!</p>
              <button onClick={onClose} className="btn btn-ghost mt-2 w-full">Cerrar</button>
            </div>
          ) : (
            <div className="space-y-4">
              {!userId ? (
                <div className="badge badge-yellow w-full py-3">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Necesitas iniciar sesión para enviar foto.
                </div>
              ) : (
                <>
                  <label className="border-2 border-dashed border-border hover:border-neon-cyan hover:bg-neon-cyan/5 transition-colors cursor-pointer rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                    <Camera className={`h-8 w-8 ${file ? 'text-neon-cyan' : 'text-muted-2'}`} />
                    <span className="text-sm font-semibold text-white">
                      {file ? file.name : 'Toca para elegir una foto'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <button 
                    onClick={handleUpload} 
                    disabled={!file || uploading} 
                    className="btn btn-primary w-full shadow-[0_0_15px_rgba(255,0,255,0.5)]"
                  >
                    {uploading ? 'Enviando...' : (
                      <>Subir Foto <Upload className="h-4 w-4 ml-2" /></>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
