'use client';

// ── Panel DJ (Fase 15-A) ──────────────────────────────────────────────────────
// Pantalla simplificada para el DJ en cabina: el setlist más votado del evento
// activo, descarga del crate (.bat local) y la lista de asistentes confirmados.
// Reutiliza el mismo backend y guard que /admin (useAuth + rol dj/admin). No es
// un sistema de auth paralelo. La seguridad real la da la RLS de Supabase.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music, Download, Check, Loader2, Users, Disc3, ShieldAlert, RefreshCw, Film,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getEvents, getSongs, setSongPlayed, getAttendees } from '@/lib/data';
import { buildCrateBat, downloadTextFile } from '@/lib/crate';
import type { EventItem, Song, Attendee } from '@/lib/types';

// Hosts que yt-dlp puede descargar (Spotify no: DRM). Igual que en /admin.
const DOWNLOADABLE_HOSTS = /(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com)/i;

export default function DJPage() {
  const router = useRouter();
  const { isStaff, loading, configured, profile } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [crateFormat, setCrateFormat] = useState<'mp3' | 'mp4'>('mp3');

  // Mismo criterio de acceso que /admin: en prod exige rol real dj/admin; en
  // demo basta con isStaff del contexto.
  const roleIsStaff = profile?.role === 'admin' || profile?.role === 'dj';
  const canAccess = configured ? roleIsStaff : isStaff;

  useEffect(() => {
    let active = true;
    Promise.all([getEvents(), getSongs(), getAttendees()]).then(([evs, sgs, att]) => {
      if (!active) return;
      setEvents(evs);
      setSongs(sgs);
      setAttendees(att);
      setDataLoading(false);
    });
    return () => { active = false; };
  }, []);

  // Mientras carga la sesión no decidimos nada (evita parpadeo del guard).
  if (loading) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-4">
        <Loader2 className="h-8 w-8 text-neon-cyan mx-auto animate-spin" />
        <p className="text-sm text-muted">Verificando sesión…</p>
      </div>
    );
  }

  // Guard: sin rol dj/admin → fuera. (La RLS igual bloquearía las escrituras.)
  if (!canAccess) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-neon-pink mx-auto" />
        <h1 className="section-title text-xl">Panel solo para DJs</h1>
        <p className="text-sm text-muted">
          Esta sección es para cuentas con rol <strong>DJ</strong> o <strong>admin</strong>.
        </p>
        <button onClick={() => router.push('/')} className="btn btn-primary">Volver al inicio</button>
      </div>
    );
  }

  // Evento activo: el confirmado, o el primero de la agenda (igual que la home).
  const activeEvent = events.find((e) => e.status === 'confirmed') ?? events[0] ?? null;

  // Setlist: más votadas primero, las ya tocadas al fondo.
  const setlist = [...songs].sort((a, b) => Number(a.played) - Number(b.played) || b.votes_count - a.votes_count);
  const downloadable = setlist.filter((s) => DOWNLOADABLE_HOSTS.test(s.youtube_url));
  const pending = setlist.filter((s) => !s.played).length;

  // Asistentes confirmados del evento activo (solo lectura).
  const confirmed = activeEvent
    ? attendees.filter((a) => a.event_id === activeEvent.id && a.status === 'confirmed')
    : [];

  const togglePlayed = async (s: Song) => {
    setSongs((prev) => prev.map((x) => x.id === s.id ? { ...x, played: !x.played } : x));
    await setSongPlayed(s.id, !s.played);
  };

  // Genera el .bat con TODO el setlist descargable más votado. El DJ lo corre en
  // su PC (IP residencial → sin bloqueos de YouTube). No usa el servidor.
  const handleDownloadSet = () => {
    if (!downloadable.length) {
      alert('No hay canciones descargables (YouTube/TikTok/IG) en el setlist.');
      return;
    }
    const bat = buildCrateBat(downloadable.map((s) => s.youtube_url), crateFormat, {
      title: `Set ${activeEvent?.title ?? 'Nightcore AQP'}`,
      dest: '%USERPROFILE%\\Desktop\\NightcoreAQP_Set',
    });
    downloadTextFile(`NightcoreAQP_Set_${crateFormat}.bat`, bat);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h1 className="section-title flex items-center gap-2"><Disc3 className="h-6 w-6 text-neon-magenta" /> Panel DJ</h1>
          <p className="text-sm text-muted mt-1">
            {activeEvent ? <>Set de <strong className="text-white">{activeEvent.title}</strong></> : 'Sin evento activo'}
            {' · '}{pending} en cola · {confirmed.length} confirmados
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost px-3 py-1.5 text-xs border border-border self-start sm:self-auto">
          Ir al panel admin
        </Link>
      </div>

      {/* Descarga del set */}
      <div className="card accent-pink p-5 space-y-4">
        <h2 className="section-title text-base flex items-center gap-2"><Download className="h-5 w-5 text-neon-pink" /> Descargar set</h2>
        <p className="text-xs text-muted">
          Genera un <strong>.bat</strong> con las <strong>{downloadable.length}</strong> canciones descargables del setlist.
          Ejecútalo en <strong>tu PC</strong>: baja yt-dlp solo y guarda todo en tu Escritorio (sin bloqueos de YouTube).
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs font-bold shrink-0">
            <button onClick={() => setCrateFormat('mp3')}
              className={`px-4 py-2 transition-colors ${crateFormat === 'mp3' ? 'bg-neon-magenta/20 text-neon-magenta' : 'text-muted hover:text-white'}`}>
              MP3 (audio)
            </button>
            <button onClick={() => setCrateFormat('mp4')}
              className={`px-4 py-2 transition-colors flex items-center gap-1.5 ${crateFormat === 'mp4' ? 'bg-neon-magenta/20 text-neon-magenta' : 'text-muted hover:text-white'}`}>
              <Film className="h-3.5 w-3.5" /> MP4 (video)
            </button>
          </div>
          <button onClick={handleDownloadSet} disabled={downloadable.length === 0} className="btn btn-primary flex-1 sm:flex-initial">
            <Download className="h-4 w-4" /> Descargar set ({downloadable.length} · {crateFormat.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Setlist */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-base flex items-center gap-2"><Music className="h-5 w-5 text-neon-cyan" /> Setlist más votado</h2>
          <button onClick={() => { setDataLoading(true); getSongs().then((s) => { setSongs(s); setDataLoading(false); }); }}
            className="btn btn-ghost px-2 py-1 text-xs border border-border" title="Refrescar">
            <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-2 text-xs uppercase">
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3">Canción</th>
                <th className="py-2.5 px-3 text-center">Votos</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dataLoading && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-2 text-xs animate-pulse">Cargando setlist…</td></tr>
              )}
              {!dataLoading && setlist.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-2 text-xs">No hay canciones en la cola.</td></tr>
              )}
              {!dataLoading && setlist.map((s, i) => (
                <tr key={s.id} className={s.played ? 'opacity-45' : ''}>
                  <td className="py-3 px-3 text-muted-2 font-bold">{i + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{s.title}</div>
                    <div className="text-xs text-muted">{s.artist}{s.suggested_by_name ? ` · pedido por ${s.suggested_by_name}` : ''}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-neon-cyan">{s.votes_count}</td>
                  <td className="py-3 px-3 text-center"><span className={`badge ${s.played ? 'badge-green' : 'badge-pink'}`}>{s.played ? 'Tocada' : 'En cola'}</span></td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => togglePlayed(s)} title={s.played ? 'Marcar en cola' : 'Marcar tocada'}
                      className={`h-8 w-8 rounded-lg inline-flex items-center justify-center border transition-colors ${s.played ? 'border-green-500/30 text-green-400' : 'border-border text-muted hover:text-white'}`}>
                      <Check className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asistentes confirmados */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title text-base flex items-center gap-2"><Users className="h-5 w-5 text-neon-lime" /> Confirmados {activeEvent ? `· ${activeEvent.title}` : ''} ({confirmed.length})</h2>
        {confirmed.length === 0 ? (
          <p className="text-xs text-muted-2 py-4 text-center">Aún no hay asistentes confirmados.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {confirmed.map((a) => (
              <div key={a.id} className="flex items-center gap-2 bg-white/[0.03] border border-border rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-neon-lime/10 border border-neon-lime/30 flex items-center justify-center text-[10px] text-neon-lime uppercase font-extrabold shrink-0">
                  {a.name ? a.name[0] : '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{a.name || 'Invitado'}</div>
                  {a.code && <div className="text-[10px] text-muted-2 font-mono">#{a.code}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
