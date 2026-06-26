// ── Mi actividad ──────────────────────────────────────────────────────────────
// Ruta de stack. Resume la participación propia: reservas (event_attendees con mi
// user_id) y canciones que sugerí. Sustituye a un sistema de notificaciones real
// (no hay tabla de notificaciones en la BD); es un "feed personal" derivado.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isConfigured } from '../lib/supabase';
import { getAttendees, getMySuggestedSongs } from '../lib/data';
import { useAuth } from '../lib/auth';
import { theme, radius, space } from '../lib/theme';
import type { Attendee, Song } from '../lib/types';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<Attendee[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const [allAtt, mySongs] = await Promise.all([getAttendees(), getMySuggestedSongs(userId)]);
    setRsvps(allAtt.filter((a) => a.user_id === userId));
    setSongs(mySongs);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Mi actividad</Text>
        <View style={{ width: 24 }} />
      </View>

      {!userId ? (
        <Text style={[styles.muted, { padding: space.lg }]}>
          {isConfigured ? 'Inicia sesión en Perfil para ver tu actividad.' : 'Configura Supabase.'}
        </Text>
      ) : loading ? (
        <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl * 2 }}>
          <Text style={styles.sectionTitle}>Mis reservas ({rsvps.length})</Text>
          {rsvps.length === 0 ? (
            <Text style={styles.muted}>Aún no te has inscrito a ningún evento.</Text>
          ) : rsvps.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardTitle}>{r.status === 'confirmed' ? '✓ Confirmado' : '★ Interesado'}</Text>
              {r.code ? <Text style={styles.muted}>Código: {r.code}</Text> : null}
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: space.xl }]}>Mis canciones ({songs.length})</Text>
          {songs.length === 0 ? (
            <Text style={styles.muted}>No has sugerido canciones todavía.</Text>
          ) : songs.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{s.title}</Text>
                <Text style={styles.muted} numberOfLines={1}>{s.artist}</Text>
              </View>
              <Text style={styles.votes}>{s.votes_count} ▲</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: space.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  cardTitle: { color: theme.text, fontWeight: '700', fontSize: 14 },
  muted: { color: theme.muted, fontSize: 13 },
  votes: { color: theme.cyan, fontWeight: '800' },
});
