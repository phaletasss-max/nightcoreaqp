// ── HomeScreen — próximo evento + RSVP ────────────────────────────────────────
// Lee el evento activo y permite reservar (interesado/confirmado) si hay sesión.
// La reserva pasa por createRsvp → tabla event_attendees (misma RLS que la web).

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isConfigured } from '../../lib/supabase';
import { getNextEvent, getAttendees, createRsvp, getComments, addComment } from '../../lib/data';
import { useAuth } from '../../lib/auth';
import { theme, radius, space } from '../../lib/theme';
import type { EventItem, RsvpStatus, EventComment } from '../../lib/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [counts, setCounts] = useState({ confirmed: 0, interested: 0 });
  const [myStatus, setMyStatus] = useState<RsvpStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const ev = await getNextEvent();
    setEvent(ev);
    if (ev) {
      const [att, cms] = await Promise.all([getAttendees(ev.id), getComments(ev.id)]);
      setCounts({
        confirmed: att.filter((a) => a.status === 'confirmed').length,
        interested: att.filter((a) => a.status === 'interested').length,
      });
      const mine = att.find((a) => a.user_id === session?.user?.id);
      setMyStatus(mine?.status ?? null);
      setComments(cms);
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  const rsvp = async (status: RsvpStatus) => {
    if (!event || !session?.user) return;
    setSaving(true);
    const created = await createRsvp({
      event_id: event.id,
      user_id: session.user.id,
      name: profile?.username ?? 'Invitado',
      email: profile?.email ?? session.user.email ?? '',
      status,
    });
    if (created) {
      setMyStatus(status);
      setCounts((c) => ({ ...c, [status]: c[status] + 1 }));
    }
    setSaving(false);
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!event || !session?.user || !text) return;
    setSendingComment(true);
    const row = await addComment(event.id, session.user.id, profile?.username ?? 'Invitado', text);
    if (row) {
      setComments((prev) => [row, ...prev]);
      setCommentText('');
    }
    setSendingComment(false);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

  return (
    <ScrollView style={styles.safe} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space.lg }]}>
      <Text style={styles.brand}>NIGHTCORE<Text style={styles.brandAccent}>AQP</Text></Text>
      <Text style={styles.subtitle}>El club de nightcore de Arequipa</Text>

      {!isConfigured && (
        <View style={[styles.card, styles.warnCard]}>
          <Text style={styles.warnTitle}>Falta configurar Supabase</Text>
          <Text style={styles.muted}>
            Crea <Text style={styles.code}>.env</Text> en mobile-app/ con
            {' '}<Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text> y
            {' '}<Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>.
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Próximo evento</Text>
          {event ? (
            <View style={[styles.card, styles.eventCard]}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.tagline ? <Text style={styles.muted}>{event.tagline}</Text> : null}
              {event.location ? <Text style={styles.eventMeta}>📍 {event.location}</Text> : null}
              <Text style={styles.eventMeta}>
                🎟️ {counts.confirmed} confirmados · {counts.interested} interesados
              </Text>

              {/* RSVP */}
              {session?.user ? (
                myStatus ? (
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>
                      {myStatus === 'confirmed' ? '✓ Asistencia confirmada' : '✓ Marcado como interesado'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.rsvpRow}>
                    <Pressable style={[styles.btn, styles.btnGhost]} disabled={saving} onPress={() => rsvp('interested')}>
                      <Text style={styles.btnGhostText}>Me interesa</Text>
                    </Pressable>
                    <Pressable style={[styles.btn, styles.btnPrimary]} disabled={saving} onPress={() => rsvp('confirmed')}>
                      <Text style={styles.btnPrimaryText}>{saving ? '...' : 'Confirmar'}</Text>
                    </Pressable>
                  </View>
                )
              ) : (
                <Text style={[styles.muted, { marginTop: space.md }]}>
                  Inicia sesión en la pestaña Perfil para reservar.
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.muted}>
              {isConfigured ? 'No hay eventos en agenda.' : 'Configura Supabase para ver los eventos.'}
            </Text>
          )}

          {/* Muro de comentarios del evento */}
          {event && (event.comments_enabled ?? true) && (
            <>
              <Text style={styles.sectionTitle}>Muro del evento</Text>
              {session?.user ? (
                <View style={styles.commentBox}>
                  <TextInput
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Escribe un comentario…"
                    placeholderTextColor={theme.muted2}
                    multiline
                    maxLength={500}
                    editable={!sendingComment}
                  />
                  <Pressable
                    style={[styles.commentSend, (!commentText.trim() || sendingComment) && { opacity: 0.4 }]}
                    onPress={submitComment}
                    disabled={!commentText.trim() || sendingComment}
                  >
                    <Ionicons name="send" size={16} color={theme.bg} />
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.muted, { marginBottom: space.sm }]}>
                  Inicia sesión en Perfil para comentar.
                </Text>
              )}

              {comments.length === 0 ? (
                <Text style={styles.muted}>Sé el primero en comentar. 💬</Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.commentCard}>
                    <View style={styles.commentHead}>
                      <Text style={styles.commentUser}>{c.username || 'Invitado'}</Text>
                      <Text style={styles.commentDate}>{fmtDate(c.created_at)}</Text>
                    </View>
                    <Text style={styles.commentText}>{c.content}</Text>
                  </View>
                ))
              )}
            </>
          )}
        </>
      )}

      {/* Comunidad — accesos a las pantallas */}
      <Text style={styles.sectionTitle}>Comunidad</Text>
      <View style={styles.navGrid}>
        {([
          { href: '/disfraces', icon: 'shirt', label: 'Disfraces' },
          { href: '/chat', icon: 'chatbubbles', label: 'Chat' },
          { href: '/encuestas', icon: 'checkbox-outline', label: 'Retos/Votos' },
          { href: '/historial', icon: 'trophy-outline', label: 'Historial' },
          { href: '/actividad', icon: 'sparkles', label: 'Mi actividad' },
          { href: '/descargas', icon: 'cloud-download-outline', label: 'Descargas' },
        ] as const).map((n) => (
          <Link key={n.href} href={n.href} asChild>
            <Pressable style={styles.navCard}>
              <Ionicons name={n.icon} size={22} color={theme.cyan} />
              <Text style={styles.navLabel} numberOfLines={1}>{n.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={styles.footer}>Organiza Yorch · hecho por Los Simpatizantes de JP</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2 },
  brand: { color: theme.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  brandAccent: { color: theme.magenta },
  subtitle: { color: theme.muted, fontSize: 13, marginTop: 2, marginBottom: space.lg },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginTop: space.xl, marginBottom: space.sm },
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, marginBottom: space.sm },
  eventCard: { borderColor: 'rgba(0,255,255,0.3)' },
  eventTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  eventMeta: { color: theme.muted2, fontSize: 12, marginTop: space.xs },
  statusPill: { alignSelf: 'flex-start', marginTop: space.md, backgroundColor: 'rgba(57,255,20,0.12)', borderColor: 'rgba(57,255,20,0.4)', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  statusText: { color: theme.lime, fontSize: 12, fontWeight: '800' },
  rsvpRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  btn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  btnGhost: { borderWidth: 1, borderColor: theme.border },
  btnGhostText: { color: theme.muted, fontWeight: '700' },
  btnPrimary: { backgroundColor: theme.magenta },
  btnPrimaryText: { color: '#0a0410', fontWeight: '800' },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  navCard: { width: '45%', flexGrow: 1, minWidth: 140, alignItems: 'center', gap: space.xs, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, paddingVertical: space.md },
  navLabel: { color: theme.text, fontSize: 12, fontWeight: '700' },
  commentBox: { flexDirection: 'row', gap: space.sm, marginBottom: space.md, alignItems: 'flex-end' },
  commentInput: { flex: 1, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, color: theme.text, paddingHorizontal: space.md, paddingVertical: space.sm, fontSize: 13, maxHeight: 100 },
  commentSend: { backgroundColor: theme.magenta, borderRadius: radius.md, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  commentCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  commentHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { color: theme.cyan, fontSize: 12, fontWeight: '800' },
  commentDate: { color: theme.muted2, fontSize: 11 },
  commentText: { color: theme.text, fontSize: 13, lineHeight: 18 },
  warnCard: { borderColor: 'rgba(255,240,31,0.4)', marginTop: space.lg },
  warnTitle: { color: theme.yellow, fontWeight: '800', marginBottom: space.xs },
  muted: { color: theme.muted, fontSize: 13, lineHeight: 19 },
  code: { color: theme.cyan, fontFamily: 'monospace', fontSize: 12 },
  footer: { color: theme.muted2, fontSize: 11, textAlign: 'center', marginTop: space.xl * 1.5 },
});
