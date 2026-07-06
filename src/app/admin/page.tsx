'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Users, Music, TrendingUp, BarChart3, Trash2, Check,
  Plus, Calendar, Eye, EyeOff, Sparkles, Radio, Download, Film, Loader2,
  Palette, Type, SlidersHorizontal, X, Search, Inbox, Mail, MailOpen, Megaphone,
  Layout, ArrowUp, ArrowDown, ExternalLink, Link as LinkIcon, Image as ImageIcon, Video,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  getEvents, saveEvent, deleteEvent, getSongs, setSongPlayed, deleteSong,
  getAttendees, launchSurvey, setSongFileUrl, clearSongs,
  getProfiles, updateProfileRole, deleteProfile, getAllComments, deleteCostume,
  adminResetPassword, deleteComment, getCostumes, getSiteSettings, updateSiteSetting,
  getBannedWords, addBannedWord, removeBannedWord, approveComment, uploadMediaFile,
  getAttendanceProofs, setAttendanceProofStatus,
  getSuggestions, markSuggestionRead, deleteSuggestion,
  getCustomBlocks, saveCustomBlock, deleteCustomBlock, moveCustomBlock, toggleCustomBlockVisible,
} from '@/lib/data';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { storeBackup, isMediaConfigured } from '@/lib/media';
import { buildCrateBat, downloadTextFile } from '@/lib/crate';
import type { EventItem, Song, Attendee, EventStatus, Profile, Costume, EventComment, AttendanceProof, Suggestion, CustomBlock, BlockType } from '@/lib/types';
// Catálogos de temas/fuentes/acentos: compartidos con el panel "Mi estilo" del perfil.
import { THEME_OPTIONS, FONT_OPTIONS, BODY_FONT_OPTIONS, ACCENT_OPTIONS } from '@/lib/designPresets';
import PageVideoAdmin from '@/components/PageVideoAdmin';
import { PAGE_VIDEO_KEY } from '@/lib/pageVideos';

type Tab = 'kpi' | 'dj' | 'survey' | 'events' | 'users' | 'posts' | 'comments' | 'design' | 'proofs' | 'buzon' | 'bloques';

// Hosts que yt-dlp puede descargar (Spotify no: DRM). Spotify solo sirve de pedido.
const DOWNLOADABLE_HOSTS = /(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com)/i;

// Secciones de la home que el admin puede activar/desactivar.
const HOME_SECTIONS = [
  { key: 'rsvp', label: 'Reservas / RSVP' },
  { key: 'wall', label: 'Muro de comentarios' },
  { key: 'challenges', label: 'Retos / Racha' },
  { key: 'feed', label: 'Novedades de la comunidad' },
  { key: 'themes', label: 'Temáticas' },
  { key: 'sets', label: 'Sets del DJ' },
];


// Confirmación anti-accidentes para acciones DESTRUCTIVAS (vaciar playlist, borrar
// usuarios/eventos). Es solo un freno; la seguridad real la da la RLS de Supabase (solo
// staff con sesión real puede escribir). Sin clave hardcodeada → se escribe "ELIMINAR".
function askDangerKey(action: string): boolean {
  if (typeof window === 'undefined') return false;
  const v = window.prompt(`⚠️ ACCIÓN PELIGROSA: ${action}\n\nEscribe ELIMINAR para confirmar:`);
  if (v === null) return false;               // canceló
  if (v.trim().toUpperCase() === 'ELIMINAR') return true;
  alert('Confirmación incorrecta. Acción cancelada.');
  return false;
}

export default function AdminPage() {
  const { isStaff, loading, signIn, signOut, configured, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('kpi');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [rsvps, setRsvps] = useState<Attendee[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [downloadingSet, setDownloadingSet] = useState(false);
  const [showCrateModal, setShowCrateModal] = useState(false);
  const [crateLimit, setCrateLimit] = useState(20);
  const [crateFormat, setCrateFormat] = useState('mp3');
  const [storingId, setStoringId] = useState<string | null>(null);
  // ── Búsqueda + orden por tabla ──
  const [djSearch, setDjSearch] = useState('');
  const [djSort, setDjSort] = useState<'votes' | 'title' | 'status'>('votes');
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<'points' | 'streak' | 'name' | 'role'>('points');
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [costumeSearch, setCostumeSearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');
  const [commentOnlyFlagged, setCommentOnlyFlagged] = useState(false);
  const [design, setDesign] = useState<Record<string, string>>({});
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [proofs, setProofs] = useState<AttendanceProof[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [blocks, setBlocks] = useState<CustomBlock[]>([]);
  // form bloque
  const EMPTY_BLOCK: Omit<CustomBlock, 'created_at'> = { id: '', type: 'anuncio', title: '', content: '', url: '', img_url: '', accent: 'cyan', section: 'home', position: 0, visible: true };
  const [blkForm, setBlkForm] = useState(EMPTY_BLOCK);
  const [blkSaving, setBlkSaving] = useState(false);

  // form encuesta
  const [sQuestion, setSQuestion] = useState('');
  const [sOptions, setSOptions] = useState('');

  // form evento
  const [evTitle, setEvTitle] = useState('');
  const [evTagline, setEvTagline] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evDate, setEvDate] = useState('2026-08-25T18:00');
  const [evLocation, setEvLocation] = useState('');
  const [evPrice, setEvPrice] = useState('0');
  const [evCap, setEvCap] = useState(150);
  const [evStatus, setEvStatus] = useState<EventStatus>('planning');
  const [evComments, setEvComments] = useState(true);
  
  const [evFlyer, setEvFlyer] = useState('');
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const [evThemes, setEvThemes] = useState('');
  const [evDetails, setEvDetails] = useState('');
  const [evGoogleMaps, setEvGoogleMaps] = useState('');
  const [evTikToksList, setEvTikToksList] = useState<{title: string; url: string}[]>([]);
  const [evDJs, setEvDJs] = useState<{ name: string; tel: string; color: string; bg_url: string }[]>([]);

  // Acceso al panel: con Supabase configurado se exige SESIÓN REAL de Supabase. La RLS solo
  // deja GUARDAR ajustes/eventos con un JWT real + rol staff; el viejo login "maestro"
  // hardcodeado abría la UI pero sus escrituras daban 401 (bug B1). En modo demo (sin
  // Supabase) se entra como staff y todo persiste en localStorage.
  const [realSession, setRealSession] = useState<boolean | null>(configured ? null : true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!configured) { setRealSession(true); return; }
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setRealSession(!!session?.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setRealSession(!!session?.user);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [configured]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    const { error } = await signIn(loginEmail.trim(), loginPass);
    setLoggingIn(false);
    if (error) setLoginError(error);
    // onAuthStateChange refresca realSession; el contexto recarga perfil/rol.
  };

  // En producción, el acceso depende del rol REAL en la BD (lo que valida is_staff() en la
  // RLS). En demo basta con isStaff del contexto.
  const roleIsStaff = profile?.role === 'admin' || profile?.role === 'dj';
  const canAccess = configured ? roleIsStaff : isStaff;

  const PRESET_DJS = [
    { name: 'DJ Lobito', tel: '946 388 627', color: 'neon-magenta', bg_url: '/fondoscenecoe.mp4' },
    { name: 'DJ Matt', tel: '944 506 957', color: 'neon-lime', bg_url: '/fondoscenecoe.mp4' },
    { name: 'DJ Mely', tel: '951 710 227', color: 'neon-cyan', bg_url: '/mikualentadora.jpg' }
  ];

  useEffect(() => {
    getEvents().then(setEvents);
    getSongs().then(setSongs);
    getAttendees().then(setRsvps);
    getProfiles().then(setProfiles);
    getAllComments().then(setComments);
    getCostumes().then(setCostumes);
    getSiteSettings().then(setDesign);
    getBannedWords().then(setBannedWords);
    getAttendanceProofs().then(setProofs);
    getSuggestions().then(setSuggestions);
    // Bloques de la home + de "Sets del DJ" (el selector del form elige dónde va cada uno)
    Promise.all([getCustomBlocks('home'), getCustomBlocks('sets')])
      .then(([h, s]) => setBlocks([...h, ...s]));
  }, []);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    await addBannedWord(w);
    setBannedWords((prev) => prev.includes(w) ? prev : [...prev, w]);
    setNewWord('');
  };
  const handleRemoveWord = async (w: string) => {
    await removeBannedWord(w);
    setBannedWords((prev) => prev.filter((x) => x !== w));
  };
  const handleApproveComment = async (id: string) => {
    await approveComment(id);
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, flagged: false } : c));
  };

  // Cambia el rol de un usuario. Promover a admin pide confirmación (es poderoso:
  // da acceso total al panel). La escritura pasa por updateProfileRole (RLS).
  const handleRoleChange = async (p: Profile, newRole: 'user' | 'dj' | 'admin') => {
    if (newRole === p.role) return;
    if (newRole === 'admin' && !confirm(`¿Promover a ${p.username || p.email || 'este usuario'} a ADMINISTRADOR?\n\nTendrá control total del panel (eventos, usuarios, diseño).`)) {
      return;
    }
    setSavingRoleId(p.id);
    try {
      await updateProfileRole(p.id, newRole);
      setProfiles((prev) => prev.map((x) => x.id === p.id ? { ...x, role: newRole } : x));
    } catch {
      alert('No se pudo cambiar el rol. ¿Tienes permisos de admin?');
    } finally {
      setSavingRoleId(null);
    }
  };

  // Guarda un ajuste de diseño y lo aplica en vivo (DesignLoader escucha el evento).
  const setDesignKey = async (key: string, value: string) => {
    const next = { ...design, [key]: value };
    setDesign(next);
    await updateSiteSetting(key, value);
    window.dispatchEvent(new CustomEvent('nq-design-updated', { detail: next }));
  };

  // 1) Verificando sesión.
  if (loading || (configured && realSession === null)) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-4">
        {/* Marcador para el contrato UI del pipeline (verify-ui-contracts): el
            guard "Acceso Admin" real solo aparece client-side; este sr-only
            garantiza que el SSR de /admin siempre lo contenga. */}
        <span className="sr-only">Acceso Admin</span>
        <Loader2 className="h-8 w-8 text-neon-cyan mx-auto animate-spin" />
        <p className="text-sm text-muted">Verificando sesión…</p>
      </div>
    );
  }

  // 2) En producción sin sesión real → login REAL de Supabase. Su JWT es lo que la RLS exige
  //    para que los ajustes se GUARDEN (el login hardcodeado anterior daba 401).
  if (configured && !realSession) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-neon-pink mx-auto mb-3" />
        <h1 className="section-title text-xl">Acceso Admin</h1>
        <p className="text-sm text-muted">Inicia sesión con tu <strong>cuenta real de Supabase</strong> (rol admin/DJ). Solo así se guardan los cambios.</p>
        <form onSubmit={handleAdminLogin} className="space-y-4 mt-4">
          <input type="email" required className="input w-full text-center" placeholder="Correo electrónico" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
          <input type="password" required className="input w-full text-center" placeholder="Contraseña" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
          {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
          <button type="submit" disabled={loggingIn} className="btn btn-primary w-full">
            {loggingIn ? 'Ingresando…' : 'Ingresar a Consola'}
          </button>
        </form>
        <p className="text-[11px] text-muted-2 pt-3 border-t border-border leading-relaxed">
          ¿Aún no eres admin? Regístrate normal en la app y promueve tu cuenta en Supabase:<br />
          <code className="text-neon-cyan">update profiles set role=&apos;admin&apos; where email=&apos;TU_CORREO&apos;;</code>
        </p>
      </div>
    );
  }

  // 3) Hay sesión real pero la cuenta no tiene rol staff (sus escrituras darían 401).
  if (!canAccess) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-neon-pink mx-auto mb-3" />
        <h1 className="section-title text-xl">Sin permisos</h1>
        <p className="text-sm text-muted">
          Tu cuenta <strong>{profile?.email || ''}</strong> no tiene rol <strong>admin</strong> ni <strong>DJ</strong>.
          Promuévela en el SQL Editor de Supabase:
        </p>
        <code className="text-neon-cyan text-xs block break-all">update profiles set role=&apos;admin&apos; where email=&apos;{profile?.email || 'TU_CORREO'}&apos;;</code>
        <button onClick={() => signOut()} className="text-xs text-neon-cyan font-bold hover:underline">Cerrar sesión</button>
      </div>
    );
  }

  const countRsvp = (eventId: string, type?: 'confirmed' | 'interested') =>
    rsvps.filter((r) => r.event_id === eventId && (!type || r.status === type)).length;
  const totalConfirmed = rsvps.filter((r) => r.status === 'confirmed').length;

  // ── Métricas reales (calculadas de los datos cargados) ──
  const totalInterested = rsvps.filter((r) => r.status === 'interested').length;
  const totalRsvp = totalConfirmed + totalInterested;
  const conversion = totalRsvp ? Math.round((totalConfirmed / totalRsvp) * 100) : 0;
  const topSong = [...songs].sort((a, b) => b.votes_count - a.votes_count)[0];
  const totalVotes = songs.reduce((s, x) => s + Math.max(x.votes_count, 0), 0);
  // Canciones que el .bat puede bajar (YouTube/TikTok/IG; Spotify no). El DJ elige
  // cuántas de estas tocar → se descarga ese Top-N más votado.
  const downloadableCount = songs.filter((s) => DOWNLOADABLE_HOSTS.test(s.youtube_url)).length;

  // Listas filtradas + ordenadas para las tablas del admin.
  const inText = (q: string, ...fields: (string | null | undefined)[]) =>
    !q.trim() || fields.some((f) => (f || '').toLowerCase().includes(q.toLowerCase()));

  const djSongs = [...songs]
    .filter((s) => inText(djSearch, s.title, s.artist, s.suggested_by_name))
    .sort((a, b) => {
      if (djSort === 'title') return a.title.localeCompare(b.title);
      if (djSort === 'status') return Number(a.played) - Number(b.played) || b.votes_count - a.votes_count;
      return b.votes_count - a.votes_count;
    });

  const userRows = [...profiles]
    .filter((p) => inText(userSearch, p.username, p.email))
    .sort((a, b) => {
      if (userSort === 'name') return (a.username || '').localeCompare(b.username || '');
      if (userSort === 'streak') return b.streak_count - a.streak_count;
      if (userSort === 'role') return (a.role || '').localeCompare(b.role || '');
      return b.points - a.points;
    });

  const costumeRows = costumes.filter((c) => inText(costumeSearch, c.char_name, c.anime, c.description));
  const commentRows = comments
    .filter((c) => !commentOnlyFlagged || c.flagged)
    .filter((c) => inText(commentSearch, c.username, c.content));
  const flaggedComments = comments.filter((c) => c.flagged).length;
  // Asistencia por evento (para la barra de "asistencia por evento").
  const eventStats = events
    .map((e) => ({ title: e.title, confirmed: countRsvp(e.id, 'confirmed'), total: countRsvp(e.id) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
  const maxEventTotal = Math.max(1, ...eventStats.map((e) => e.total));

  const toggleStatus = async (ev: EventItem) => {
    const order: EventStatus[] = ['planning', 'confirmed', 'paused'];
    const next = order[(order.indexOf(ev.status) + 1) % 3];
    const updated = { ...ev, status: next };
    setEvents((p) => p.map((e) => e.id === ev.id ? updated : e));
    await saveEvent(updated);
  };
  const toggleComments = async (ev: EventItem) => {
    const updated = { ...ev, comments_enabled: !ev.comments_enabled };
    setEvents((p) => p.map((e) => e.id === ev.id ? updated : e));
    await saveEvent(updated);
  };
  const removeEvent = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    if (!askDangerKey('Eliminar evento')) return;
    setEvents((p) => p.filter((e) => e.id !== id));
    await deleteEvent(id);
  };
  const togglePlayed = async (s: Song) => {
    setSongs((p) => p.map((x) => x.id === s.id ? { ...x, played: !x.played } : x));
    await setSongPlayed(s.id, !s.played);
  };
  const removeSong = async (id: string) => {
    setSongs((p) => p.filter((x) => x.id !== id));
    await deleteSong(id);
  };
  const handleClearSongs = async () => {
    if (!confirm('¿ESTÁS SEGURO? Esto eliminará TODAS las canciones de la base de datos de Supabase. Esta acción no se puede deshacer.')) return;
    if (!askDangerKey('Vaciar TODA la playlist')) return;
    await clearSongs();
    setSongs([]);
    alert('Playlist vaciada con éxito.');
  };

  // Genera un .bat con los links del top-N incrustados. El DJ lo ejecuta en SU PC:
  // descarga yt-dlp/ffmpeg solo, baja todas las canciones (IP residencial → sin
  // bloqueo de YouTube) y las guarda en el Escritorio. No usa el servidor.
  const handleGenerateCrate = () => {
    setShowCrateModal(false);
    const top = [...songs]
      .filter((s) => DOWNLOADABLE_HOSTS.test(s.youtube_url))
      .sort((a, b) => b.votes_count - a.votes_count)
      .slice(0, crateLimit);
    if (!top.length) { alert('No hay canciones descargables (YouTube/TikTok/IG) en la playlist.'); return; }

    const fmt = crateFormat === 'mp3' ? 'mp3' : 'mp4';
    const bat = buildCrateBat(top.map((s) => s.youtube_url), fmt, {
      title: `Crate Top ${top.length}`,
      dest: '%USERPROFILE%\\Desktop\\NightcoreAQP_Crate',
    });
    downloadTextFile(`NightcoreAQP_Crate_Top${top.length}_${crateFormat}.bat`, bat);
  };

  // Descarga el MP4 de la canción (vía media-service → Supabase Storage) y lo marca
  // para usarse de fondo. Resuelve los videos de YouTube que no permiten embed.
  const handleStoreBackground = async (s: Song) => {
    setStoringId(s.id);
    try {
      const fileUrl = await storeBackup(s.youtube_url, 'mp4');
      if (fileUrl) {
        await setSongFileUrl(s.id, fileUrl);
        setSongs((prev) => prev.map((x) => x.id === s.id ? { ...x, file_url: fileUrl } : x));
      } else {
        alert('No se pudo descargar (¿media-service conectado?).');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar a fondo');
    } finally {
      setStoringId(null);
    }
  };

  const handleLaunchSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sQuestion) return;
    const opts = sOptions.split(',').map((o) => o.trim()).filter(Boolean);
    await launchSurvey(sQuestion, opts);
    setSQuestion(''); setSOptions('');
    alert('Encuesta publicada.');
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle) return;
    const ev: EventItem = {
      id: `e-${Date.now()}`,
      title: evTitle,
      tagline: evTagline || null,
      description: evDesc || null,
      date: `${evDate}:00-05:00`,
      location: evLocation || null,
      ticket_price: Number(evPrice) || 0,
      total_tickets: Number(evCap),
      available_tickets: Number(evCap),
      status: evStatus,
      comments_enabled: evComments,
      flyer_url: evFlyer || null,
      themes: evThemes || null,
      details: evDetails || null,
      google_maps_url: evGoogleMaps || null,
      tiktok_urls: evTikToksList.length > 0 ? JSON.stringify(evTikToksList) : null,
      djs: evDJs.length > 0 ? evDJs : undefined,
    };
    setEvents((p) => [...p, ev]);
    await saveEvent(ev);
    setEvTitle(''); setEvTagline(''); setEvDesc(''); setEvLocation(''); setEvPrice('0'); setEvCap(150); setEvStatus('planning'); setEvComments(true);
    setEvFlyer(''); setEvThemes(''); setEvDetails(''); setEvGoogleMaps(''); setEvTikToksList([]); setEvDJs([]);
  };

  const handleAddDJ = () => setEvDJs([...evDJs, { name: '', tel: '', color: 'neon-lime', bg_url: '' }]);
  const handleRemoveDJ = (idx: number) => setEvDJs(evDJs.filter((_, i) => i !== idx));
  const handleUpdateDJ = (idx: number, field: string, val: string) => {
    const newDjs = [...evDJs];
    newDjs[idx] = { ...newDjs[idx], [field]: val };
    setEvDJs(newDjs);
  };

  const handleMarkSuggestionRead = async (s: Suggestion, read: boolean) => {
    setSuggestions((prev) => prev.map((x) => x.id === s.id ? { ...x, read } : x));
    await markSuggestionRead(s.id, read);
  };

  const handleDeleteSuggestion = async (id: string) => {
    setSuggestions((prev) => prev.filter((x) => x.id !== id));
    await deleteSuggestion(id);
  };

  const unreadCount = suggestions.filter((s) => !s.read).length;

  // ── Handlers de bloques ──
  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlkSaving(true);
    const toSave: CustomBlock = {
      ...blkForm,
      id: blkForm.id || 'blk-new',
      position: blkForm.id ? blkForm.position : blocks.length,
      created_at: '',
    };
    const saved = await saveCustomBlock(toSave);
    if (saved) {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === saved.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      setBlkForm({ ...EMPTY_BLOCK });
    }
    setBlkSaving(false);
  };

  const handleDeleteBlock = async (b: CustomBlock) => {
    setBlocks((prev) => prev.filter((x) => x.id !== b.id));
    await deleteCustomBlock(b.id, b.section);
  };

  const handleToggleBlock = async (b: CustomBlock) => {
    const next = !b.visible;
    setBlocks((prev) => prev.map((x) => x.id === b.id ? { ...x, visible: next } : x));
    await toggleCustomBlockVisible(b.id, next, b.section);
  };

  const handleMoveBlock = async (b: CustomBlock, dir: 'up' | 'down') => {
    const sorted = [...blocks].sort((a, x) => a.position - x.position);
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) return;
    const posA = sorted[idx].position;
    const posB = sorted[swap].position;
    setBlocks((prev) => prev.map((x) => {
      if (x.id === sorted[idx].id) return { ...x, position: posB };
      if (x.id === sorted[swap].id) return { ...x, position: posA };
      return x;
    }));
    await moveCustomBlock(b.id, dir, b.section);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'kpi', label: 'Métricas' },
    { id: 'dj', label: 'Consola DJ' },
    { id: 'survey', label: 'Encuestas' },
    { id: 'events', label: 'Eventos' },
    { id: 'users', label: 'Usuarios' },
    { id: 'posts', label: 'Disfraces' },
    { id: 'comments', label: 'Comentarios' },
    { id: 'proofs', label: 'Insignias' },
    { id: 'buzon', label: 'Buzón' },
    { id: 'bloques', label: 'Bloques' },
    { id: 'design', label: 'Diseño' },
  ];

  const cardOpacity = parseFloat(design.design_card_opacity || '0.75');
  const overlay = parseFloat(design.design_overlay || '0');
  const currentFont = design.design_font || 'default';
  const currentBodyFont = design.design_body_font || 'default';
  const currentTheme = design.design_theme || 'default';
  const currentAccent = design.design_accent || '';
  const fontScale = parseFloat(design.design_font_scale || '1');

  // Borra todas las claves de diseño (vuelve al look base limpio). Se construye el
  // objeto completo y se despacha UNA vez (evita pisar el estado en cada vuelta).
  const resetDesign = async () => {
    const keys = Object.keys(design).filter((k) => k.startsWith('design_'));
    if (!keys.length) return;
    const next = { ...design };
    keys.forEach((k) => { next[k] = ''; });
    setDesign(next);
    for (const k of keys) await updateSiteSetting(k, '');
    window.dispatchEvent(new CustomEvent('nq-design-updated', { detail: next }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h1 className="section-title flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-neon-pink" /> Panel admin / DJ</h1>
          <p className="text-sm text-muted mt-1">Métricas, consola de playlist, encuestas y eventos.</p>
        </div>
        <span className="badge badge-red self-start sm:self-auto"><Radio className="h-3.5 w-3.5 animate-soft-pulse" /> Live</span>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide gap-1 border-b border-border -mx-1 px-1 pb-px">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 -mb-px transition-colors flex items-center gap-1.5 shrink-0 ${
              tab === t.id ? 'border-neon-pink text-neon-pink' : 'border-transparent text-muted hover:text-white'
            }`}>
            {t.label}
            {t.id === 'buzon' && unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-neon-pink text-black text-[10px] font-extrabold leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {tab === 'kpi' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Users, color: 'text-neon-pink', label: 'Asistentes confirmados', value: totalConfirmed, sub: 'RSVP totales' },
              { icon: TrendingUp, color: 'text-neon-cyan', label: 'Eventos activos', value: events.length, sub: 'en agenda' },
              { icon: Music, color: 'text-neon-purple', label: 'Temas en playlist', value: songs.length, sub: 'sugeridos' },
            ].map((k) => (
              <div key={k.label} className="card p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-border"><k.icon className={`h-6 w-6 ${k.color}`} /></div>
                <div>
                  <span className="text-xs text-muted-2 uppercase font-bold block">{k.label}</span>
                  <span className="text-2xl font-extrabold text-white">{k.value}</span>
                  <span className="text-[10px] text-muted block">{k.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Segunda fila de KPIs reales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Usuarios registrados', value: profiles.length },
              { label: 'Disfraces', value: costumes.length },
              { label: 'Comentarios', value: comments.length },
              { label: 'Votos totales', value: totalVotes },
            ].map((k) => (
              <div key={k.label} className="card p-4">
                <span className="text-2xl font-extrabold text-white block">{k.value}</span>
                <span className="text-[10px] text-muted-2 uppercase font-bold">{k.label}</span>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Asistencia por evento (real) */}
            <div className="card accent-cyan p-6 space-y-4">
              <h3 className="section-title text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-neon-cyan" /> Asistencia por evento</h3>
              {eventStats.length === 0 ? (
                <p className="text-xs text-muted-2 py-4 text-center">Sin reservas todavía.</p>
              ) : eventStats.map((e) => (
                <div key={e.title} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted truncate max-w-[180px]">{e.title}</span>
                    <span className="text-neon-cyan">{e.total} ({e.confirmed} conf.)</span>
                  </div>
                  <div className="track"><span style={{ width: `${Math.round((e.total / maxEventTotal) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
            {/* Resumen real */}
            <div className="card p-6 space-y-3">
              <h3 className="section-title text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-neon-purple" /> Resumen del club</h3>
              {[
                ['Interesados (RSVP)', String(totalInterested)],
                ['Confirmados (RSVP)', String(totalConfirmed)],
                ['Conversión interés→confirmado', `${conversion}%`],
                ['Canción más votada', topSong ? `${topSong.title} (${topSong.votes_count})` : '—'],
                ['Comentarios por revisar', String(flaggedComments)],
              ].map(([k, v], i, arr) => (
                <div key={k} className={`flex justify-between text-sm gap-3 ${i < arr.length - 1 ? 'border-b border-border pb-2' : ''}`}>
                  <span className="text-muted shrink-0">{k}</span><span className="font-bold text-white truncate text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DJ console */}
      {tab === 'dj' && (
        <div className="card accent-pink p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="section-title text-base flex items-center gap-2"><Music className="h-5 w-5 text-neon-pink" /> Control de playlist</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">En cola: {songs.length}</span>
              <button onClick={() => setShowCrateModal(true)} className="btn btn-ghost px-3 py-1.5 text-xs border border-neon-pink/30 hover:bg-neon-pink/10">
                <Download className="h-3.5 w-3.5" /> Generar Crate (.bat)
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button onClick={handleClearSongs} className="btn border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1.5 text-xs">
                <Trash2 className="h-3.5 w-3.5" /> Vaciar Playlist
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-2" />
              <input className="input pl-9 text-sm w-full" value={djSearch} onChange={(e) => setDjSearch(e.target.value)} placeholder="Buscar canción, artista o quién la sugirió…" />
            </div>
            <select className="input text-sm sm:w-52" value={djSort} onChange={(e) => setDjSort(e.target.value as 'votes' | 'title' | 'status')}>
              <option value="votes">Ordenar: más votadas</option>
              <option value="title">Ordenar: título (A-Z)</option>
              <option value="status">Ordenar: en cola primero</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-2 text-xs uppercase">
                  <th className="py-2.5 px-3">Canción</th>
                  <th className="py-2.5 px-3 text-center">Votos</th>
                  <th className="py-2.5 px-3">Sugerido</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {djSongs.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-2 text-xs">{songs.length ? 'Sin resultados para tu búsqueda.' : 'No hay canciones en la cola.'}</td></tr>
                )}
                {djSongs.map((s) => (
                  <tr key={s.id} className={s.played ? 'opacity-50' : ''}>
                    <td className="py-3 px-3"><div className="font-bold text-white">{s.title}</div><div className="text-xs text-muted">{s.artist}</div></td>
                    <td className="py-3 px-3 text-center font-bold text-neon-cyan">{s.votes_count}</td>
                    <td className="py-3 px-3 text-muted">{s.suggested_by_name}</td>
                    <td className="py-3 px-3 text-center"><span className={`badge ${s.played ? 'badge-green' : 'badge-pink'}`}>{s.played ? 'Tocada' : 'En cola'}</span></td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        {isMediaConfigured() && (
                          <button onClick={() => handleStoreBackground(s)} disabled={storingId === s.id}
                            title={s.file_url ? 'Ya está en el fondo · re-descargar' : 'Descargar MP4 y usar de fondo'}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${s.file_url ? 'border-neon-pink/40 text-neon-pink' : 'border-border text-muted hover:text-white'}`}>
                            {storingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                          </button>
                        )}
                        <button onClick={() => togglePlayed(s)} title="Marcar tocada"
                          className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${s.played ? 'border-green-500/30 text-green-400' : 'border-border text-muted hover:text-white'}`}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeSong(s.id)} title="Eliminar"
                          className="h-8 w-8 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showCrateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="card w-full max-w-sm p-6 bg-surface border-neon-magenta/50 shadow-[0_0_30px_rgba(255,0,255,0.2)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-neon-magenta" /> Crate Builder
                  </h3>
                  <button onClick={() => setShowCrateModal(false)} className="text-muted hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <p className="text-xs text-muted mb-4">Genera un <strong>.bat</strong> con los links del Top que vas a tocar. Ejecútalo en <strong>tu PC</strong>: descarga yt-dlp solo y baja todo a tu Escritorio (sin bloqueos de YouTube).</p>

                <div className="space-y-4">
                  <div>
                    <label className="label">Formato</label>
                    <select className="input text-sm" value={crateFormat} onChange={(e) => setCrateFormat(e.target.value)}>
                      <option value="mp3">MP3 (Solo Audio - Alta Calidad)</option>
                      <option value="mp4">MP4 (Video para fondo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">¿Cuántas canciones vas a tocar?</label>
                    <p className="text-[11px] text-muted-2 mb-2">Se descarga el Top-N más votado. Hay <strong>{downloadableCount}</strong> canciones descargables en la cola.</p>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(downloadableCount, 1)}
                      className="input text-sm"
                      value={crateLimit}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (Number.isNaN(n)) { setCrateLimit(1); return; }
                        setCrateLimit(Math.max(1, Math.min(n, Math.max(downloadableCount, 1))));
                      }}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[10, 12, 20].map((n) => (
                        <button key={n} type="button" onClick={() => setCrateLimit(Math.min(n, Math.max(downloadableCount, 1)))}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${crateLimit === n ? 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta' : 'border-border text-muted hover:text-white'}`}>
                          Top {n}
                        </button>
                      ))}
                      <button type="button" onClick={() => setCrateLimit(Math.max(downloadableCount, 1))}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${crateLimit >= downloadableCount ? 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta' : 'border-border text-muted hover:text-white'}`}>
                        Todas ({downloadableCount})
                      </button>
                    </div>
                  </div>
                  <button onClick={handleGenerateCrate} disabled={downloadableCount === 0} className="btn btn-primary w-full mt-2">
                    Generar .bat ({Math.min(crateLimit, downloadableCount)} canciones)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Survey config */}
      {tab === 'survey' && (
        <form onSubmit={handleLaunchSurvey} className="card p-6 sm:p-8 space-y-4 max-w-2xl mx-auto animate-fade-in">
          <h3 className="section-title text-base flex items-center gap-2 border-b border-border pb-4"><Plus className="h-5 w-5 text-neon-cyan" /> Lanzar encuesta</h3>
          <div>
            <label className="label">Pregunta</label>
            <input className="input" required value={sQuestion} onChange={(e) => setSQuestion(e.target.value)} placeholder="Ej. ¿Qué temática para el próximo concurso?" />
          </div>
          <div>
            <label className="label">Opciones (separadas por comas)</label>
            <input className="input" required value={sOptions} onChange={(e) => setSOptions(e.target.value)} placeholder="Cyberpunk, Vocaloid, Jujutsu Kaisen, Evangelion" />
          </div>
          <button type="submit" className="btn btn-cyan w-full"><Sparkles className="h-4 w-4" /> Publicar y reemplazar activa</button>
        </form>
      )}

      {/* Events management */}
      {tab === 'events' && (
        <div className="grid lg:grid-cols-3 gap-8 items-start animate-fade-in">
          <form onSubmit={handleAddEvent} className="card p-6 space-y-4 text-sm">
            <h3 className="section-title text-base flex items-center gap-2 border-b border-border pb-3"><Plus className="h-5 w-5 text-neon-cyan" /> Agregar evento</h3>
            <div><label className="label">Título</label><input className="input" required value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Ej. Nightcore Friki Fest" /></div>
            <div><label className="label">Tagline</label><input className="input" value={evTagline} onChange={(e) => setEvTagline(e.target.value)} placeholder="Ej. Miku & FNAF" /></div>
            <div><label className="label">Descripción</label><textarea className="input resize-none" rows={3} value={evDesc} onChange={(e) => setEvDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Flyer (Imagen, MP4, MP3)</label>
                <input className="input" value={evFlyer} onChange={(e) => setEvFlyer(e.target.value)} placeholder="https://... o sube un archivo" />
                <label className="mt-1.5 flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-neon-cyan/40 hover:bg-neon-cyan/10 rounded cursor-pointer text-[10px] font-bold text-neon-cyan transition-colors">
                  {uploadingFlyer ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {uploadingFlyer ? 'Subiendo...' : 'Subir archivo'}
                  <input type="file" accept="image/*,video/mp4,audio/mp3" className="hidden" disabled={uploadingFlyer}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingFlyer(true);
                      try {
                        const url = await uploadMediaFile(file);
                        if (url) setEvFlyer(url);
                        else alert('No se pudo subir (revisa el bucket "media").');
                      } finally { setUploadingFlyer(false); }
                    }} />
                </label>
              </div>
              <div><label className="label">Temáticas</label><input className="input" value={evThemes} onChange={(e) => setEvThemes(e.target.value)} placeholder="Cyberpunk, Vocaloid" /></div>
            </div>
            <div><label className="label">Detalles del Flyer (Bullets)</label><textarea className="input resize-none" rows={2} value={evDetails} onChange={(e) => setEvDetails(e.target.value)} placeholder="Shots gratis, Cóctel gratis..." /></div>
            <div className="space-y-3">
              <div><label className="label">Google Maps Link</label><input className="input" value={evGoogleMaps} onChange={(e) => setEvGoogleMaps(e.target.value)} placeholder="https://maps.app.goo.gl/..." /></div>
              <div className="space-y-2 border-l-2 border-neon-cyan/30 pl-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Enlaces Informativos (TikTok, Posts...)</label>
                  <button type="button" onClick={() => setEvTikToksList([...evTikToksList, {title: '', url: ''}])} className="btn btn-ghost px-2 py-1 text-xs"><Plus className="h-3 w-3" /> Añadir URL</button>
                </div>
                {evTikToksList.map((tkk, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input className="input flex-1 text-xs" placeholder="Título (ej. Dresscode TikTok)" value={tkk.title} onChange={e => {
                      const n = [...evTikToksList]; n[idx].title = e.target.value; setEvTikToksList(n);
                    }} />
                    <input className="input flex-[2] text-xs" placeholder="https://..." value={tkk.url} onChange={e => {
                      const n = [...evTikToksList]; n[idx].url = e.target.value; setEvTikToksList(n);
                    }} />
                    <button type="button" onClick={() => setEvTikToksList(evTikToksList.filter((_, i) => i !== idx))} className="btn btn-ghost p-2"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Fecha</label><input className="input" type="datetime-local" required value={evDate} onChange={(e) => setEvDate(e.target.value)} /></div>
              <div><label className="label">Capacidad</label><input className="input" type="number" required value={evCap} onChange={(e) => setEvCap(Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Precio (S/.)</label><input className="input" required value={evPrice} onChange={(e) => setEvPrice(e.target.value)} /></div>
              <div><label className="label">Estado</label>
                <select className="input" value={evStatus} onChange={(e) => setEvStatus(e.target.value as EventStatus)}>
                  <option value="planning">Planeación</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="paused">Pausado</option>
                </select>
              </div>
            </div>
            <div><label className="label">Ubicación</label><input className="input" value={evLocation} onChange={(e) => setEvLocation(e.target.value)} placeholder="Ej. Casona San Francisco 308" /></div>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={evComments} onChange={(e) => setEvComments(e.target.checked)} className="accent-[var(--cyan)]" /> Habilitar comentarios
            </label>

            {/* Configuración de DJs */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <label className="label mb-0">DJs del Evento</label>
                <select className="input max-w-[150px] text-xs py-1" value="" onChange={(e) => {
                  if(!e.target.value) return;
                  if (e.target.value === 'custom') {
                    handleAddDJ();
                  } else {
                    const dj = PRESET_DJS.find(d => d.name === e.target.value);
                    if (dj && !evDJs.some(ex => ex.name === dj.name)) setEvDJs([...evDJs, dj]);
                  }
                }}>
                  <option value="">Añadir DJ...</option>
                  {PRESET_DJS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  <option value="custom">Otro DJ (Manual)</option>
                </select>
              </div>
              {evDJs.map((dj, idx) => (
                <div key={idx} className="p-3 bg-white/5 border border-border rounded-lg space-y-3 relative">
                  <button type="button" onClick={() => handleRemoveDJ(idx)} className="absolute top-2 right-2 p-1 text-muted hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <div><input className="input text-xs" placeholder="Nombre (ej. DJ MELY)" value={dj.name} onChange={(e) => handleUpdateDJ(idx, 'name', e.target.value)} required /></div>
                    <div><input className="input text-xs" placeholder="Teléfono" value={dj.tel} onChange={(e) => handleUpdateDJ(idx, 'tel', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><input className="input text-xs" placeholder="Color neón (ej. neon-lime)" value={dj.color} onChange={(e) => handleUpdateDJ(idx, 'color', e.target.value)} /></div>
                    <div><input className="input text-xs" placeholder="Fondo URL (ej. https://...)" value={dj.bg_url} onChange={(e) => handleUpdateDJ(idx, 'bg_url', e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-cyan w-full mt-4"><Plus className="h-4 w-4" /> Registrar</button>
          </form>

          <div className="lg:col-span-2 space-y-6">
            <div className="card accent-cyan p-6 space-y-4">
              <h3 className="section-title text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-neon-cyan" /> Agenda de eventos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-2 uppercase">
                      <th className="py-2 px-2">Evento</th>
                      <th className="py-2 px-2 text-center">Estado</th>
                      <th className="py-2 px-2 text-center">Chat</th>
                      <th className="py-2 px-2 text-center">Inscritos</th>
                      <th className="py-2 px-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td className="py-3 px-2">
                          <div className="font-bold text-white">{ev.title}</div>
                          <div className="text-[10px] text-muted truncate max-w-[180px]">{ev.location}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => toggleStatus(ev)} className={`badge ${ev.status === 'confirmed' ? 'badge-green' : ev.status === 'paused' ? 'badge-red' : 'badge-yellow'}`}>
                            {ev.status === 'confirmed' ? 'Confirmado' : ev.status === 'paused' ? 'Pausado' : 'Planeación'}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => toggleComments(ev)} className={`p-1.5 rounded-lg border transition-colors ${ev.comments_enabled ? 'border-neon-cyan/30 text-neon-cyan' : 'border-red-500/30 text-red-400'}`}>
                            {ev.comments_enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-white">
                          {countRsvp(ev.id)}<span className="text-[9px] text-muted-2 block">({countRsvp(ev.id, 'confirmed')} conf.)</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${expandedEvent === ev.id ? 'bg-white text-black border-white' : 'border-border text-muted hover:text-white'}`}>
                              {expandedEvent === ev.id ? 'Ocultar' : 'Ver'}
                            </button>
                            <button onClick={() => removeEvent(ev.id)} className="p-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {expandedEvent && (
              <div className="card p-6 space-y-3 animate-fade-in">
                <h4 className="font-bold text-white text-sm">Asistentes — {events.find((e) => e.id === expandedEvent)?.title}</h4>
                {rsvps.filter((r) => r.event_id === expandedEvent).length === 0 ? (
                  <p className="text-xs text-muted-2 text-center py-4">Sin registros todavía.</p>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b border-border text-muted-2 uppercase"><th className="py-1.5 px-2">Nombre</th><th className="py-1.5 px-2">Correo</th><th className="py-1.5 px-2">Código</th><th className="py-1.5 px-2 text-right">Estado</th></tr></thead>
                    <tbody className="divide-y divide-border text-muted">
                      {rsvps.filter((r) => r.event_id === expandedEvent).map((a) => (
                        <tr key={a.id}>
                          <td className="py-2 px-2 font-bold text-white">{a.name}</td>
                          <td className="py-2 px-2">{a.email}</td>
                          <td className="py-2 px-2 font-mono text-neon-cyan">{a.code ?? 'N/A'}</td>
                          <td className="py-2 px-2 text-right"><span className={`badge ${a.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>{a.status === 'confirmed' ? 'Conf.' : 'Int.'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: USUARIOS */}
      {tab === 'users' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-neon-pink" /> Gestión de Usuarios
            </h2>
            <p className="text-xs text-muted mt-1">Modifica roles, restablece contraseñas o elimina perfiles.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-2" />
              <input className="input pl-9 text-sm w-full" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar por usuario o correo…" />
            </div>
            <select className="input text-sm sm:w-52" value={userSort} onChange={(e) => setUserSort(e.target.value as 'points' | 'streak' | 'name' | 'role')}>
              <option value="points">Ordenar: más puntos</option>
              <option value="streak">Ordenar: mayor racha</option>
              <option value="name">Ordenar: nombre (A-Z)</option>
              <option value="role">Ordenar: rol</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-muted-2 uppercase font-bold text-xs">
                  <th className="py-3 px-2">Usuario</th>
                  <th className="py-3 px-2">Correo</th>
                  <th className="py-3 px-2 text-center">Puntos</th>
                  <th className="py-3 px-2 text-center">Racha</th>
                  <th className="py-3 px-2 text-center">Rol</th>
                  <th className="py-3 px-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted">
                {userRows.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-2 text-xs">{profiles.length ? 'Sin resultados.' : 'No hay usuarios.'}</td></tr>
                )}
                {userRows.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center text-[10px] text-neon-pink uppercase font-extrabold">
                        {p.username ? p.username[0] : '?'}
                      </div>
                      {p.username || 'Invitado'}
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">{p.email || 'N/A'}</td>
                    <td className="py-3 px-2 text-center text-neon-cyan font-bold">{p.points}</td>
                    <td className="py-3 px-2 text-center text-neon-lime font-bold">{p.streak_count}d</td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={p.role}
                          disabled={savingRoleId === p.id}
                          onChange={(e) => handleRoleChange(p, e.target.value as 'user' | 'dj' | 'admin')}
                          className="bg-black border border-border rounded px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          <option value="user">Usuario</option>
                          <option value="dj">DJ</option>
                          <option value="admin">Administrador</option>
                        </select>
                        {savingRoleId === p.id && <Loader2 className="h-3.5 w-3.5 text-neon-cyan animate-spin" />}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <Link href={`/perfil/${p.id}`} className="px-2 py-1 rounded text-[10px] font-bold border border-border text-muted hover:text-white transition-colors">Ver</Link>
                      {p.email && (
                        <button
                          onClick={async () => {
                            const ok = await adminResetPassword(p.email!);
                            if (ok) alert(`Correo de restauración enviado a ${p.email}`);
                            else alert('Error al enviar el correo');
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                        >
                          Reiniciar Clave
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm(`¿Eliminar al usuario ${p.username}?`)) return;
                          if (!askDangerKey(`Eliminar al usuario ${p.username}`)) return;
                          await deleteProfile(p.id);
                          setProfiles(prev => prev.filter(x => x.id !== p.id));
                        }}
                        className="p-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: DISFRACES */}
      {tab === 'posts' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-lime" /> Moderación de Disfraces
            </h2>
            <p className="text-xs text-muted mt-1">Elimina disfraces inapropiados sugeridos para el concurso.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-2" />
            <input className="input pl-9 text-sm w-full" value={costumeSearch} onChange={(e) => setCostumeSearch(e.target.value)} placeholder="Buscar por personaje, anime o descripción…" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costumeRows.map((c) => (
              <div key={c.id} className="border border-border rounded-xl overflow-hidden bg-white/5 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-video w-full bg-cover bg-center" style={{ backgroundImage: `url(${c.photo_url})` }} />
                  <div className="p-4 space-y-2">
                    <span className="badge badge-yellow text-[9px] uppercase font-bold">{c.anime}</span>
                    <h3 className="font-bold text-white text-base">{c.char_name}</h3>
                    {c.description && <p className="text-xs text-muted line-clamp-2">{c.description}</p>}
                    <div className="text-[10px] text-muted-2">Votos: <strong className="text-white">{c.votes_count}</strong></div>
                  </div>
                </div>
                <div className="p-4 border-t border-border flex justify-end">
                  <button
                    onClick={async () => {
                      if (!confirm('¿Eliminar este disfraz de la competencia?')) return;
                      await deleteCostume(c.id);
                      setCostumes(prev => prev.filter(x => x.id !== c.id));
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
            {costumeRows.length === 0 && (
              <p className="text-xs text-muted text-center py-6 col-span-full">{costumes.length ? 'Sin resultados para tu búsqueda.' : 'No hay disfraces postulados.'}</p>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: COMENTARIOS */}
      {tab === 'comments' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-neon-pink" /> Moderación de Comentarios
            </h2>
            <p className="text-xs text-muted mt-1">Revisa, aprueba o elimina comentarios. Los marcados ⚠️ contienen palabras de tu filtro.</p>
          </div>

          {/* Filtros de palabras */}
          <div className="card bg-black/30 p-4 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-neon-yellow" /> Filtros de palabras</h3>
            <form onSubmit={handleAddWord} className="flex gap-2 max-w-sm">
              <input className="input flex-1 py-1 px-2 text-xs" required value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Ej. palabraMala" />
              <button type="submit" className="btn btn-cyan px-3 py-1 text-xs">Agregar</button>
            </form>
            <div className="flex flex-wrap gap-2 pt-2">
              {bannedWords.map(w => (
                <span key={w} className="badge badge-yellow text-xs gap-1">
                  {w}
                  <button onClick={() => handleRemoveWord(w)} className="hover:text-red-500 ml-1"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {bannedWords.length === 0 && <span className="text-xs text-muted">No hay palabras bloqueadas.</span>}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-2" />
              <input className="input pl-9 text-sm w-full" value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} placeholder="Buscar por autor o contenido…" />
            </div>
            <button type="button" onClick={() => setCommentOnlyFlagged((v) => !v)}
              className={`btn px-3 py-1.5 text-xs shrink-0 ${commentOnlyFlagged ? 'btn-cyan' : 'btn-ghost border border-border'}`}>
              <ShieldAlert className="h-3.5 w-3.5" /> {commentOnlyFlagged ? 'Solo marcados ✓' : 'Solo marcados'}
            </button>
          </div>
          <div className="space-y-3">
            {commentRows.length === 0 && (
              <p className="text-xs text-muted-2 text-center py-6">{comments.length ? 'Sin resultados.' : 'No hay comentarios.'}</p>
            )}
            {commentRows.map((c) => (
              <div key={c.id} className={`p-4 rounded-xl border ${c.flagged ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-border bg-white/5'} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neon-cyan">{c.username}</span>
                    {c.flagged && <span className="badge badge-yellow">⚠️ Marcado por filtro</span>}
                  </div>
                  <span className="text-xs text-muted">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-white bg-black/30 p-3 rounded">{c.content}</p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  {c.flagged && (
                    <button onClick={() => handleApproveComment(c.id)} className="btn border border-green-500/30 text-green-400 hover:bg-green-500/10 px-3 py-1 text-xs">
                      <Check className="h-3 w-3" /> Aprobar y mostrar
                    </button>
                  )}
                  <button onClick={async () => {
                    if (confirm('¿Eliminar comentario permanentemente?')) {
                      await deleteComment(c.id);
                      setComments(prev => prev.filter(x => x.id !== c.id));
                    }
                  }} className="btn border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1 text-xs">
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-muted text-center py-6">No hay comentarios en la plataforma.</p>}
          </div>
        </div>
      )}

      {/* PESTAÑA: PRUEBAS DE ASISTENCIA (INSIGNIAS) */}
      {tab === 'proofs' && (
        <div className="card p-6 space-y-6 animate-fade-in accent-lime">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-neon-lime" /> Verificación de Asistencia
            </h2>
            <p className="text-xs text-muted mt-1">Aprueba las fotos reales del evento para otorgar la insignia de asistencia y puntos al usuario.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {proofs.map((p) => (
              <div key={p.id} className="border border-border rounded-xl overflow-hidden bg-white/5 flex flex-col justify-between relative group">
                <div className="absolute top-2 right-2 z-10">
                  {p.status === 'pending' ? <span className="badge badge-yellow">Pendiente</span> : 
                   p.status === 'approved' ? <span className="badge badge-green">Aprobado</span> : 
                   <span className="badge badge-red">Rechazado</span>}
                </div>
                
                <div className="aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                  <img src={p.photo_url} alt="Prueba" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neon-lime/20 flex items-center justify-center text-[10px] text-neon-lime uppercase font-bold">
                      {p.profiles?.username ? p.profiles.username[0] : '?'}
                    </div>
                    <span className="font-bold text-sm text-white">{p.profiles?.username || 'Usuario Desconocido'}</span>
                  </div>
                  <div className="text-[10px] text-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(p.created_at).toLocaleDateString()}
                  </div>
                  
                  {p.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-border mt-3">
                      <button 
                        onClick={async () => {
                          await setAttendanceProofStatus(p.id, 'approved');
                          setProofs(prev => prev.map(x => x.id === p.id ? { ...x, status: 'approved' } : x));
                        }}
                        className="flex-1 btn bg-green-500/20 text-green-400 hover:bg-green-500/40 border border-green-500/50 py-1.5 text-xs font-bold"
                      >
                        <Check className="h-3.5 w-3.5" /> Es real
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('¿Rechazar esta foto?')) {
                            await setAttendanceProofStatus(p.id, 'rejected');
                            setProofs(prev => prev.map(x => x.id === p.id ? { ...x, status: 'rejected' } : x));
                          }
                        }}
                        className="flex-1 btn bg-red-500/10 text-red-400 hover:bg-red-500/30 border border-red-500/30 py-1.5 text-xs font-bold"
                      >
                        <X className="h-3.5 w-3.5" /> Falsa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {proofs.length === 0 && (
              <div className="col-span-full py-10 text-center border border-dashed border-border rounded-xl">
                <Check className="h-8 w-8 text-muted/30 mx-auto mb-2" />
                <p className="text-sm text-muted">No hay fotos pendientes de verificación.</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── BLOQUES ──────────────────────────────────────────────────── */}
      {tab === 'bloques' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Layout className="h-5 w-5 text-neon-cyan" /> Bloques de contenido
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Añade anuncios, textos, enlaces, imágenes o videos a la home sin tocar código.
            </p>
          </div>

          {/* Form añadir / editar */}
          <form onSubmit={handleSaveBlock} className="card p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-neon-lime" />
              {blkForm.id ? 'Editar bloque' : 'Añadir bloque'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['anuncio', 'texto', 'enlace', 'imagen', 'video'] as BlockType[]).map((t) => {
                const icons = { anuncio: Megaphone, texto: Type, enlace: LinkIcon, imagen: ImageIcon, video: Video };
                const Icon = icons[t];
                return (
                  <button key={t} type="button"
                    onClick={() => setBlkForm((f) => ({ ...f, type: t }))}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold capitalize transition-colors ${blkForm.type === t ? 'border-neon-cyan/60 text-neon-cyan bg-neon-cyan/10' : 'border-border text-muted hover:text-white'}`}
                  >
                    <Icon className="h-4 w-4" /> {t}
                  </button>
                );
              })}
            </div>

            {/* Campos comunes */}
            {blkForm.type !== 'imagen' && blkForm.type !== 'video' && (
              <input value={blkForm.title ?? ''} onChange={(e) => setBlkForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título (opcional)" className="input w-full text-sm" />
            )}
            {(blkForm.type === 'anuncio' || blkForm.type === 'texto' || blkForm.type === 'enlace') && (
              <textarea value={blkForm.content ?? ''} onChange={(e) => setBlkForm((f) => ({ ...f, content: e.target.value }))}
                rows={3} placeholder={blkForm.type === 'enlace' ? 'Descripción (opcional)' : 'Contenido *'}
                className="input w-full text-sm resize-none" />
            )}
            {(blkForm.type === 'enlace' || blkForm.type === 'video') && (
              <input value={blkForm.url ?? ''} onChange={(e) => setBlkForm((f) => ({ ...f, url: e.target.value }))}
                placeholder={blkForm.type === 'video' ? 'URL de YouTube *' : 'URL destino *'}
                className="input w-full text-sm" />
            )}
            {blkForm.type === 'imagen' && (
              <>
                <input value={blkForm.img_url ?? ''} onChange={(e) => setBlkForm((f) => ({ ...f, img_url: e.target.value }))}
                  placeholder="URL de la imagen *" className="input w-full text-sm" />
                <input value={blkForm.title ?? ''} onChange={(e) => setBlkForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Caption (opcional)" className="input w-full text-sm" />
              </>
            )}
            {blkForm.type === 'video' && (
              <input value={blkForm.title ?? ''} onChange={(e) => setBlkForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título del video (opcional)" className="input w-full text-sm" />
            )}

            {/* Acento de color */}
            {(blkForm.type === 'anuncio' || blkForm.type === 'enlace') && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted font-bold">Color:</span>
                {['cyan', 'magenta', 'lime', 'yellow', 'purple'].map((c) => {
                  const bg: Record<string, string> = { cyan: 'bg-neon-cyan', magenta: 'bg-neon-magenta', lime: 'bg-neon-lime', yellow: 'bg-neon-yellow', purple: 'bg-neon-purple' };
                  return (
                    <button key={c} type="button"
                      onClick={() => setBlkForm((f) => ({ ...f, accent: c }))}
                      className={`h-6 w-6 rounded-full ${bg[c]} ${blkForm.accent === c ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : 'opacity-60 hover:opacity-100'}`}
                      title={c}
                    />
                  );
                })}
              </div>
            )}

            {/* Dónde se muestra el bloque */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted font-bold">Sección:</span>
              {[{ k: 'home', l: '🏠 Home' }, { k: 'sets', l: '🎧 Sets del DJ' }].map((s) => (
                <button key={s.k} type="button"
                  onClick={() => setBlkForm((f) => ({ ...f, section: s.k }))}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors ${
                    blkForm.section === s.k ? 'border-neon-magenta/60 bg-neon-magenta/15 text-white' : 'border-border text-muted hover:text-white'
                  }`}>
                  {s.l}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={blkSaving}
                className="btn btn-primary py-2 px-4 text-sm disabled:opacity-50 flex items-center gap-2">
                {blkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {blkForm.id ? 'Guardar cambios' : 'Añadir bloque'}
              </button>
              {blkForm.id && (
                <button type="button" onClick={() => setBlkForm({ ...EMPTY_BLOCK })}
                  className="text-xs text-muted hover:text-white">
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de bloques */}
          {blocks.length === 0 ? (
            <div className="card p-10 text-center text-muted-2 space-y-2">
              <Layout className="h-9 w-9 mx-auto opacity-40" />
              <p className="text-sm font-bold">Sin bloques todavía</p>
              <p className="text-xs">Usa el formulario de arriba para añadir el primero.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...blocks].sort((a, b) => a.position - b.position).map((b, i, arr) => {
                const icons = { anuncio: Megaphone, texto: Type, enlace: ExternalLink, imagen: ImageIcon, video: Video };
                const Icon = icons[b.type];
                return (
                  <div key={b.id} className={`card p-4 flex items-center gap-3 ${!b.visible ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleMoveBlock(b, 'up')} disabled={i === 0}
                        className="text-muted hover:text-white disabled:opacity-20 p-0.5"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleMoveBlock(b, 'down')} disabled={i === arr.length - 1}
                        className="text-muted hover:text-white disabled:opacity-20 p-0.5"><ArrowDown className="h-3.5 w-3.5" /></button>
                    </div>
                    <Icon className="h-4 w-4 text-neon-cyan shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{b.title || b.content || b.url || '(sin texto)'}</p>
                      <span className="text-[10px] text-muted-2 capitalize">{b.type} · {b.section}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleToggleBlock(b)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[11px] text-muted hover:text-white transition-colors">
                        {b.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setBlkForm({ id: b.id, type: b.type, title: b.title ?? '', content: b.content ?? '', url: b.url ?? '', img_url: b.img_url ?? '', accent: b.accent, section: b.section, position: b.position, visible: b.visible })}
                        className="px-2 py-1 rounded-lg border border-border text-[11px] text-muted hover:text-white transition-colors">
                        Editar
                      </button>
                      <button onClick={() => handleDeleteBlock(b)}
                        className="px-2 py-1 rounded-lg border border-red-500/20 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: DISEÑO */}
      {tab === 'design' && (
        <div className="space-y-6 animate-fade-in max-w-3xl">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-neon-magenta" /> Diseño y personalización
            </h2>
            <p className="text-xs text-muted mt-1">Los cambios se aplican en vivo para todos. (Para fondos por sección, usa el editor 🖼️ en cada contenedor de la home.)</p>
          </div>

          {/* Tema visual (presets de paleta) */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-neon-magenta" /> Tema visual</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button key={t.key} onClick={() => setDesignKey('design_theme', t.key)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    currentTheme === t.key ? 'border-neon-magenta bg-neon-magenta/10' : 'border-border hover:border-border-strong'
                  }`}>
                  <span className="flex gap-1 mb-2">
                    {t.colors.map((c) => (
                      <span key={c} className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className={`block text-xs font-bold ${currentTheme === t.key ? 'text-neon-magenta' : 'text-white'}`}>{t.label}</span>
                  <span className="block text-[10px] text-muted-2 mt-0.5">{t.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-2">Cada tema cambia toda la paleta. Afínalo con la fuente y el color de acento de abajo.</p>
          </div>

          {/* Color de acento (token sobre el tema) */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-neon-cyan" /> Color de acento</h3>
            <div className="flex flex-wrap gap-2 items-center">
              {ACCENT_OPTIONS.map((a) => (
                <button key={a.key || 'theme'} onClick={() => setDesignKey('design_accent', a.key)}
                  title={a.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                    currentAccent === a.key ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-border text-muted hover:text-white'
                  }`}>
                  <span className="h-4 w-4 rounded-full border border-white/20"
                    style={a.color === 'transparent'
                      ? { backgroundImage: 'linear-gradient(135deg, #ff00ff, #00ffff, #39ff14)' }
                      : { backgroundColor: a.color }} />
                  {a.label}
                </button>
              ))}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border">
                <span className="text-xs font-bold text-muted">A medida:</span>
                <input
                  type="color"
                  value={currentAccent.startsWith('#') && !ACCENT_OPTIONS.some(o => o.key === currentAccent) ? currentAccent : '#ffffff'}
                  onChange={(e) => setDesignKey('design_accent', e.target.value)}
                  className="h-6 w-8 rounded bg-transparent border-0 cursor-pointer p-0"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-2">Tiñe el color primario (botones, títulos) por encima del tema. &quot;Del tema&quot; usa la paleta original.</p>
          </div>

          {/* Fuente de títulos */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Type className="h-4 w-4 text-neon-cyan" /> Fuente de títulos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FONT_OPTIONS.map((f) => (
                <button key={f.key} onClick={() => setDesignKey('design_font', f.key)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-colors ${
                    currentFont === f.key ? 'border-neon-magenta bg-neon-magenta/10 text-neon-magenta' : 'border-border text-muted hover:text-white'
                  }`}>{f.label}</button>
              ))}
            </div>
            <p className="text-[11px] text-muted-2">Afecta a los títulos de sección y el hero. La fuente del texto se elige abajo.</p>
          </div>

          {/* Fuente del cuerpo (las "letras") */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Type className="h-4 w-4 text-neon-lime" /> Fuente del texto (las letras)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BODY_FONT_OPTIONS.map((f) => (
                <button key={f.key} onClick={() => setDesignKey('design_body_font', f.key)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-colors ${
                    currentBodyFont === f.key ? 'border-neon-lime bg-neon-lime/10 text-neon-lime' : 'border-border text-muted hover:text-white'
                  }`}>{f.label}</button>
              ))}
            </div>
            <p className="text-[11px] text-muted-2">Cambia TODO el texto del sitio. Evita las pixeladas para textos largos (cansan la vista).</p>
          </div>

          {/* Colores a medida (sobre el tema) */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-neon-pink" /> Colores a medida</h3>
            <p className="text-[11px] text-muted-2">Pisan el color del tema. Déjalos vacíos (botón ✕) para usar la paleta del tema.</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'design_color_bg', label: 'Fondo', fallback: '#0a0a0f' },
                { key: 'design_color_surface', label: 'Superficie / tarjetas', fallback: '#160a20' },
                { key: 'design_color_text', label: 'Texto', fallback: '#f0e6ff' },
              ] as const).map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <label className="label text-[10px]">{c.label}</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={design[c.key] || c.fallback}
                      onChange={(e) => setDesignKey(c.key, e.target.value)}
                      className="h-9 w-full rounded-lg bg-transparent border border-border cursor-pointer" />
                    {design[c.key] && (
                      <button onClick={() => setDesignKey(c.key, '')} title="Quitar (usar el del tema)"
                        className="px-2 py-1.5 rounded-lg border border-border text-muted-2 hover:text-white text-xs">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opacidades */}
          <div className="card p-5 space-y-5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-neon-lime" /> Opacidad</h3>
            <div>
              <label className="label flex justify-between"><span>Opacidad de contenedores</span><span className="text-neon-cyan font-mono">{Math.round(cardOpacity * 100)}%</span></label>
              <input type="range" min="0.2" max="1" step="0.05" value={cardOpacity}
                onChange={(e) => setDesignKey('design_card_opacity', e.target.value)}
                className="w-full accent-neon-magenta cursor-pointer" />
              <p className="text-[11px] text-muted-2 mt-1">Qué tan sólidos se ven las tarjetas/paneles (más bajo = se ve más el fondo).</p>
            </div>
            <div>
              <label className="label flex justify-between"><span>Oscurecer fondo general</span><span className="text-neon-cyan font-mono">{Math.round(overlay * 100)}%</span></label>
              <input type="range" min="0" max="0.85" step="0.05" value={overlay}
                onChange={(e) => setDesignKey('design_overlay', e.target.value)}
                className="w-full accent-neon-magenta cursor-pointer" />
              <p className="text-[11px] text-muted-2 mt-1">Capa oscura sobre el fondo (útil si pusiste imágenes muy brillantes detrás).</p>
            </div>
          </div>

          {/* Formas y Contenedores */}
          <div className="card p-5 space-y-5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-neon-yellow" /> Formas y Contenedores</h3>
            <div>
              <label className="label flex justify-between"><span>Redondeo de bordes (Radius)</span><span className="text-neon-cyan font-mono">{design.design_radius || '16'}px</span></label>
              <input type="range" min="0" max="32" step="1" value={design.design_radius || '16'}
                onChange={(e) => setDesignKey('design_radius', e.target.value)}
                className="w-full accent-neon-magenta cursor-pointer" />
              <p className="text-[11px] text-muted-2 mt-1">Controla si los contenedores y botones son cuadrados (0px) o redondeados.</p>
            </div>
            <div>
              <label className="label flex justify-between"><span>Desenfoque (Glassmorphism Blur)</span><span className="text-neon-cyan font-mono">{design.design_glass_blur || '12'}px</span></label>
              <input type="range" min="0" max="32" step="1" value={design.design_glass_blur || '12'}
                onChange={(e) => setDesignKey('design_glass_blur', e.target.value)}
                className="w-full accent-neon-magenta cursor-pointer" />
              <p className="text-[11px] text-muted-2 mt-1">Qué tan borroso se ve el fondo detrás de las tarjetas transparentes.</p>
            </div>
            <div>
              <label className="label flex justify-between"><span>Tamaño de letra</span><span className="text-neon-cyan font-mono">{Math.round(fontScale * 100)}%</span></label>
              <input type="range" min="0.9" max="1.15" step="0.05" value={fontScale}
                onChange={(e) => setDesignKey('design_font_scale', e.target.value)}
                className="w-full accent-neon-magenta cursor-pointer" />
              <p className="text-[11px] text-muted-2 mt-1">Escala todo el texto y la interfaz (90%–115%).</p>
            </div>
          </div>

          {/* Secciones visibles */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-neon-cyan" /> Secciones de la home</h3>
            <p className="text-[11px] text-muted-2">Activa o desactiva secciones para todos los visitantes.</p>
            <div className="space-y-2">
              {HOME_SECTIONS.map((s) => {
                const off = design[`section_${s.key}_off`] === 'true';
                return (
                  <div key={s.key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border">
                    <span className={`text-sm font-bold ${off ? 'text-muted-2 line-through' : 'text-white'}`}>{s.label}</span>
                    <button onClick={() => setDesignKey(`section_${s.key}_off`, off ? 'false' : 'true')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                        off ? 'border-red-500/30 text-red-400' : 'border-neon-lime/30 text-neon-lime'
                      }`}>
                      {off ? <><EyeOff className="h-3.5 w-3.5" /> Oculta</> : <><Eye className="h-3.5 w-3.5" /> Visible</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Videos de fondo por página (subir + elegir dónde se muestran) */}
          <PageVideoAdmin raw={design[PAGE_VIDEO_KEY]} onSave={(v) => setDesignKey(PAGE_VIDEO_KEY, v)} />

          {/* Restablecer */}
          <div className="card p-5 flex items-center justify-between gap-3 border-dashed">
            <div>
              <h3 className="font-bold text-white text-sm">Restablecer diseño</h3>
              <p className="text-[11px] text-muted-2 mt-0.5">Vuelve al look base (Scenecore) y borra colores, fuentes y tamaños personalizados.</p>
            </div>
            <button onClick={resetDesign}
              className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold shrink-0">
              Restablecer
            </button>
          </div>
        </div>
      )}

      {/* ── BUZÓN ───────────────────────────────────────────────────── */}
      {tab === 'buzon' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                <Inbox className="h-5 w-5 text-neon-cyan" /> Buzón de sugerencias y denuncias
              </h2>
              <p className="text-xs text-muted mt-0.5">Solo visible para el staff. Los visitantes envían desde <strong>/sugerencias</strong>.</p>
            </div>
            {unreadCount > 0 && (
              <span className="badge badge-cyan">{unreadCount} sin leer</span>
            )}
          </div>

          {suggestions.length === 0 ? (
            <div className="card p-10 text-center text-muted-2 space-y-2">
              <Inbox className="h-9 w-9 mx-auto opacity-40" />
              <p className="text-sm font-bold">El buzón está vacío</p>
              <p className="text-xs">Cuando alguien envíe una sugerencia o denuncia aparecerá aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div key={s.id} className={`card p-4 flex flex-col sm:flex-row gap-3 ${s.read ? 'opacity-60' : ''}`}>
                  {/* Icono + badge */}
                  <div className="shrink-0 flex sm:flex-col items-center gap-2">
                    {s.category === 'denuncia'
                      ? <ShieldAlert className="h-5 w-5 text-neon-pink" />
                      : <Megaphone className="h-5 w-5 text-neon-cyan" />}
                    <span className={`badge text-[10px] ${s.category === 'denuncia' ? 'badge-red' : 'badge-cyan'}`}>
                      {s.category}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm text-white whitespace-pre-wrap break-words">{s.content}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-2">
                      <span>{new Date(s.created_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {s.contact && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {s.contact}
                        </span>
                      )}
                      {!s.read && <span className="badge badge-yellow text-[9px] py-0 px-1.5">nuevo</span>}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleMarkSuggestionRead(s, !s.read)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[11px] text-muted hover:text-white hover:border-neon-cyan/40 transition-colors"
                      title={s.read ? 'Marcar como no leído' : 'Marcar como leído'}
                    >
                      {s.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                      {s.read ? 'No leído' : 'Leído'}
                    </button>
                    <button
                      onClick={() => handleDeleteSuggestion(s.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/20 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
