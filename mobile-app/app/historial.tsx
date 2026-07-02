// ── HistorialScreen — Historial de eventos y Muro de la Fama ──────────────────
// Muestra la lista de eventos pasados indicando en cuáles participó el usuario,
// y presenta el Muro de la Fama (ranking de fans, canciones e himnos de cosplay).

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEvents, getSongs, getCostumes, getProfiles, getAttendees } from '../lib/data';
import { useAuth } from '../lib/auth';
import { theme, radius, space } from '../lib/theme';
import type { EventItem, Song, Costume, Profile, Attendee } from '../lib/types';

export default function HistorialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [myEventIds, setMyEventIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'events' | 'fame'>('events');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [evs, sgs, cos, profs, atts] = await Promise.all([
      getEvents(),
      getSongs(),
      getCostumes(),
      getProfiles(),
      getAttendees(),
    ]);

    setEvents(evs);
    setSongs(sgs);
    setCostumes(cos);
    setProfiles(profs);

    if (userId) {
      const myAtt = atts.filter((a) => a.user_id === userId && a.status === 'confirmed');
      setMyEventIds(new Set(myAtt.map((a) => a.event_id)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar eventos pasados
  const today = new Date();
  const pastEvents = events.filter((e) => new Date(e.date) < today);

  // Top rankings
  const topGeeks = [...profiles].sort((a, b) => b.points - a.points).slice(0, 5);
  const topSongs = [...songs].sort((a, b) => b.votes_count - a.votes_count).slice(0, 5);
  const topCostumes = [...costumes].sort((a, b) => b.votes_count - a.votes_count).slice(0, 3);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Historial y Fama</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'events' && styles.tabActive]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
            Eventos Pasados
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'fame' && styles.tabActive]}
          onPress={() => setActiveTab('fame')}
        >
          <Text style={[styles.tabText, activeTab === 'fame' && styles.tabTextActive]}>
            Muro de la Fama
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl * 2 }}>
          {activeTab === 'events' ? (
            // PESTAÑA: EVENTOS PASADOS
            <View>
              {pastEvents.length === 0 ? (
                <Text style={styles.muted}>Aún no hay eventos pasados registrados.</Text>
              ) : (
                pastEvents.map((e) => {
                  const attended = myEventIds.has(e.id);
                  return (
                    <View key={e.id} style={styles.eventCard}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventDate}>{formatDate(e.date)}</Text>
                        {attended && (
                          <View style={styles.attendedBadge}>
                            <Ionicons name="medal" size={12} color={theme.yellow} />
                            <Text style={styles.attendedBadgeText}>Asistí</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.eventTitle}>{e.title}</Text>
                      {e.tagline ? <Text style={styles.eventTagline}>{e.tagline}</Text> : null}
                      {e.location ? (
                        <Text style={styles.eventLocation}>📍 {e.location}</Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            // PESTAÑA: MURO DE LA FAMA
            <View style={{ gap: space.xl }}>
              {/* TOP GEEKS */}
              <View>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={18} color={theme.yellow} />
                  <Text style={styles.subSectionTitle}>Top Fans Activos</Text>
                </View>
                <View style={styles.listCard}>
                  {topGeeks.map((geek, index) => (
                    <View key={geek.id} style={styles.geekRow}>
                      <View
                        style={[
                          styles.rankBadge,
                          index === 0 && styles.rankGold,
                          index === 1 && styles.rankSilver,
                          index === 2 && styles.rankBronze,
                        ]}
                      >
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.geekName} numberOfLines={1}>
                          {geek.username || 'Usuario Anon'}
                        </Text>
                        <Text style={styles.geekSub}>Racha: {geek.streak_count} días</Text>
                      </View>
                      <Text style={styles.pointsText}>{geek.points} pts</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* TOP HIMNOS */}
              <View>
                <View style={styles.sectionHeader}>
                  <Ionicons name="musical-notes" size={18} color={theme.cyan} />
                  <Text style={styles.subSectionTitle}>Himnos de Nightcore AQP</Text>
                </View>
                <View style={styles.listCard}>
                  {topSongs.length === 0 ? (
                    <Text style={styles.muted}>No hay canciones votadas.</Text>
                  ) : (
                    topSongs.map((song, index) => (
                      <View key={song.id} style={styles.songRow}>
                        <Text style={styles.songRank}>{index + 1}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.songTitle} numberOfLines={1}>
                            {song.title}
                          </Text>
                          <Text style={styles.songArtist} numberOfLines={1}>
                            {song.artist}
                          </Text>
                        </View>
                        <Text style={styles.songVotes}>{song.votes_count} ▲</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>

              {/* TOP COSPLAY */}
              <View>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={18} color={theme.pink} />
                  <Text style={styles.subSectionTitle}>Hall del Cosplay</Text>
                </View>
                <View style={styles.cosplayGrid}>
                  {topCostumes.length === 0 ? (
                    <Text style={styles.muted}>Aún no hay disfraces.</Text>
                  ) : (
                    topCostumes.map((cos, index) => (
                      <View key={cos.id} style={styles.cosplayCard}>
                        {cos.photo_url ? (
                          <Image source={{ uri: cos.photo_url }} style={styles.cosplayImage as any} />
                        ) : (
                          <View style={[styles.cosplayImage as any, styles.cosplayImageFallback]}>
                            <Ionicons name="image" size={32} color={theme.muted2} />
                          </View>
                        )}
                        <View style={styles.cosplayOverlay}>
                          <View style={styles.cosplayRankTag}>
                            <Text style={styles.cosplayRankTagText}>#{index + 1}</Text>
                          </View>
                          <Text style={styles.cosplayChar} numberOfLines={1}>
                            {cos.char_name}
                          </Text>
                          <Text style={styles.cosplayAnime} numberOfLines={1}>
                            {cos.anime}
                          </Text>
                          <View style={styles.cosplayVotes}>
                            <Ionicons name="heart" size={10} color={theme.pink} />
                            <Text style={styles.cosplayVotesText}>{cos.votes_count}</Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },

  // Tabs
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: space.lg },
  tab: { flex: 1, paddingVertical: space.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.cyan },
  tabText: { color: theme.muted, fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: theme.cyan },

  // Eventos pasados
  eventCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, marginBottom: space.sm },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs },
  eventDate: { color: theme.muted2, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  attendedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 240, 31, 0.1)', borderColor: 'rgba(255, 240, 31, 0.4)', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  attendedBadgeText: { color: theme.yellow, fontSize: 10, fontWeight: '800' },
  eventTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
  eventTagline: { color: theme.muted, fontSize: 12, marginTop: 2 },
  eventLocation: { color: theme.muted2, fontSize: 12, marginTop: space.sm },

  // Muro de la fama
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  subSectionTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
  listCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.sm },

  // Geek Row
  geekRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.sm, borderBottomColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1 },
  rankBadge: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  rankGold: { backgroundColor: 'rgba(255, 240, 31, 0.15)', borderColor: theme.yellow, borderWidth: 1 },
  rankSilver: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: '#cccccc', borderWidth: 1 },
  rankBronze: { backgroundColor: 'rgba(205, 127, 50, 0.15)', borderColor: '#cd7f32', borderWidth: 1 },
  rankText: { color: theme.text, fontSize: 11, fontWeight: '800' },
  geekName: { color: theme.text, fontWeight: '700', fontSize: 13 },
  geekSub: { color: theme.muted, fontSize: 11, marginTop: 1 },
  pointsText: { color: theme.pink, fontWeight: '800', fontSize: 13 },

  // Song Row
  songRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.sm, borderBottomColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1 },
  songRank: { color: theme.muted2, fontWeight: '800', width: 16, textAlign: 'center' },
  songTitle: { color: theme.text, fontWeight: '700', fontSize: 13 },
  songArtist: { color: theme.muted, fontSize: 11, marginTop: 1 },
  songVotes: { color: theme.cyan, fontWeight: '800', fontSize: 12 },

  // Cosplay Grid
  cosplayGrid: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  cosplayCard: { width: '31%', minWidth: 100, flexGrow: 1, height: 140, borderRadius: radius.md, overflow: 'hidden', borderColor: theme.border, borderWidth: 1, backgroundColor: theme.surface },
  cosplayImage: { width: '100%', height: '100%', position: 'absolute' },
  cosplayImageFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface2 },
  cosplayOverlay: { flex: 1, backgroundColor: 'rgba(10, 4, 16, 0.7)', justifyContent: 'flex-end', padding: space.sm },
  cosplayRankTag: { position: 'absolute', top: space.sm, left: space.sm, backgroundColor: 'rgba(255, 240, 31, 0.25)', borderColor: theme.yellow, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  cosplayRankTagText: { color: theme.yellow, fontSize: 9, fontWeight: '900' },
  cosplayChar: { color: theme.text, fontWeight: '700', fontSize: 11 },
  cosplayAnime: { color: theme.muted, fontSize: 9 },
  cosplayVotes: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cosplayVotesText: { color: theme.pink, fontSize: 10, fontWeight: '800' },

  muted: { color: theme.muted, fontSize: 13 },
});
