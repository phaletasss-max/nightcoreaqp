// ── DJScreen — Panel DJ móvil ──────────────────────────────────────────────────
// Permite a DJs y administradores gestionar la playlist en cabina en tiempo real.
// Muestra el setlist ordenado por votos, permite marcar canciones como tocadas,
// y lista a los asistentes confirmados del evento activo.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Alert, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEvents, getSongs, setSongPlayed, getAttendees } from '../lib/data';
import { useAuth } from '../lib/auth';
import { theme, radius, space } from '../lib/theme';
import type { EventItem, Song, Attendee } from '../lib/types';

export default function DJScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, refresh } = useAuth();
  const userId = session?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const canAccess = profile?.role === 'dj' || profile?.role === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    const [evs, sgs, atts] = await Promise.all([
      getEvents(),
      getSongs(),
      getAttendees(),
    ]);
    setEvents(evs);
    setSongs(sgs);
    setAttendees(atts);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (canAccess) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [canAccess, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const [sgs, atts] = await Promise.all([getSongs(), getAttendees()]);
    setSongs(sgs);
    setAttendees(atts);
    setRefreshing(false);
  };

  const handleTogglePlayed = async (song: Song) => {
    const nextPlayed = !song.played;
    // Optimista
    setSongs((prev) =>
      prev.map((s) => (s.id === song.id ? { ...s, played: nextPlayed } : s))
    );
    await setSongPlayed(song.id, nextPlayed);
  };

  if (loading) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={theme.cyan} size="large" />
      </View>
    );
  }

  // Guard de acceso
  if (!canAccess) {
    return (
      <View style={[styles.safe, styles.center, { padding: space.xl }]}>
        <Ionicons name="alert-circle" size={64} color={theme.pink} style={{ marginBottom: space.md }} />
        <Text style={styles.errorTitle}>Panel solo para DJs</Text>
        <Text style={styles.errorText}>
          Esta sección es para cuentas con rol DJ o administrador de Nightcore AQP.
        </Text>
        <Pressable style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  // Evento activo
  const activeEvent = events.find((e) => e.status === 'confirmed') ?? events[0] ?? null;

  // Setlist ordenado: sin tocar arriba por votos; tocadas abajo
  const setlist = [...songs].sort(
    (a, b) => Number(a.played) - Number(b.played) || b.votes_count - a.votes_count
  );

  const pendingCount = setlist.filter((s) => !s.played).length;

  // Confirmados
  const confirmedAttendees = activeEvent
    ? attendees.filter((a) => a.event_id === activeEvent.id && a.status === 'confirmed')
    : [];

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Panel DJ móvil</Text>
        <Pressable onPress={handleRefresh} disabled={refreshing} hitSlop={12}>
          <Ionicons
            name="refresh"
            size={22}
            color={refreshing ? theme.muted2 : theme.cyan}
            style={refreshing && styles.spin}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl * 2 }}>
        {/* Resumen */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {activeEvent ? activeEvent.title : 'Sin evento confirmado'}
          </Text>
          <View style={styles.summaryStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>en cola</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{confirmedAttendees.length}</Text>
              <Text style={styles.statLabel}>confirmados</Text>
            </View>
          </View>
        </View>

        {/* Setlist */}
        <Text style={styles.sectionTitle}>Setlist sugerido por votos</Text>
        {setlist.length === 0 ? (
          <Text style={styles.muted}>No hay canciones en la lista.</Text>
        ) : (
          setlist.map((item, index) => {
            const played = item.played;
            return (
              <View key={item.id} style={[styles.songCard, played && styles.songCardPlayed]}>
                <Text style={styles.rank}>{index + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {item.artist}
                    {item.suggested_by_name ? ` · pedido por ${item.suggested_by_name}` : ''}
                  </Text>
                </View>
                <View style={styles.votesContainer}>
                  <Text style={styles.votesCount}>{item.votes_count} ▲</Text>
                  <Pressable
                    style={[styles.playBtn, played && styles.playBtnActive]}
                    onPress={() => handleTogglePlayed(item)}
                  >
                    <Ionicons
                      name={played ? 'checkmark-circle' : 'play-circle-outline'}
                      size={24}
                      color={played ? theme.lime : theme.muted}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {/* Asistentes Confirmados */}
        <Text style={[styles.sectionTitle, { marginTop: space.xl }]}>
          Asistentes confirmados ({confirmedAttendees.length})
        </Text>
        {confirmedAttendees.length === 0 ? (
          <Text style={styles.muted}>No hay confirmados todavía.</Text>
        ) : (
          <View style={styles.attendeeListCard}>
            {confirmedAttendees.map((a) => (
              <View key={a.id} style={styles.attendeeRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarText}>{a.name ? a.name[0].toUpperCase() : '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attendeeName}>{a.name || 'Invitado'}</Text>
                  {a.code && <Text style={styles.attendeeCode}>#{a.code}</Text>}
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>VIP</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  spin: { opacity: 0.5 },

  // Guard de error
  errorTitle: { color: theme.pink, fontSize: 20, fontWeight: '800', marginTop: space.md },
  errorText: { color: theme.muted, fontSize: 14, textAlign: 'center', marginVertical: space.md, lineHeight: 20 },
  errorBtn: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.xl, paddingVertical: 12 },
  errorBtnText: { color: theme.cyan, fontWeight: '800', fontSize: 14 },

  // Resumen
  summaryCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg },
  summaryTitle: { color: theme.text, fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: space.md },
  summaryStatsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statBox: { alignItems: 'center' },
  statNumber: { color: theme.cyan, fontSize: 24, fontWeight: '900' },
  statLabel: { color: theme.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  // Lista
  sectionTitle: { color: theme.text, fontSize: 15, fontWeight: '800', marginBottom: space.sm },
  muted: { color: theme.muted, fontSize: 13, paddingVertical: space.sm },

  // Canción
  songCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  songCardPlayed: { opacity: 0.4, borderColor: 'rgba(255,255,255,0.05)' },
  rank: { color: theme.muted2, fontWeight: '800', width: 20, textAlign: 'center' },
  songTitle: { color: theme.text, fontWeight: '700', fontSize: 14 },
  songArtist: { color: theme.muted, fontSize: 12, marginTop: 2 },
  votesContainer: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  votesCount: { color: theme.cyan, fontWeight: '800', fontSize: 13 },
  playBtn: { padding: 4 },
  playBtnActive: { opacity: 0.9 },

  // Confirmados
  attendeeListCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.md },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, borderBottomColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1 },
  avatarMini: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: 'rgba(57, 255, 20, 0.1)', borderColor: 'rgba(57, 255, 20, 0.3)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.lime, fontSize: 12, fontWeight: '800' },
  attendeeName: { color: theme.text, fontWeight: '700', fontSize: 13 },
  attendeeCode: { color: theme.muted2, fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  statusPill: { backgroundColor: 'rgba(57, 255, 20, 0.1)', borderColor: 'rgba(57, 255, 20, 0.4)', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { color: theme.lime, fontSize: 9, fontWeight: '800' },
});
