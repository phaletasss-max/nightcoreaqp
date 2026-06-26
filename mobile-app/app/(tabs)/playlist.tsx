// ── PlaylistScreen — top votado + votar ───────────────────────────────────────
// Lista las canciones por votos. Con sesión, permite votar ▲ (toggle). El voto va
// a song_votes (misma RLS que la web); votes_count lo mantiene un trigger en BD,
// pero aquí actualizamos de forma optimista para feedback inmediato.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isConfigured } from '../../lib/supabase';
import { getSongs, setSongVote } from '../../lib/data';
import { useAuth } from '../../lib/auth';
import { theme, radius, space } from '../../lib/theme';
import type { Song } from '../../lib/types';

export default function PlaylistScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setSongs(await getSongs(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const toggleVote = async (song: Song) => {
    if (!userId) return;
    const wasVoted = song.userVote === 'upvote';
    const next = wasVoted ? null : 'upvote';
    // Optimista
    setSongs((prev) => prev.map((s) =>
      s.id === song.id
        ? { ...s, userVote: next, votes_count: s.votes_count + (wasVoted ? -1 : 1) }
        : s,
    ));
    await setSongVote(song.id, userId, next);
  };

  const renderItem = ({ item, index }: { item: Song; index: number }) => {
    const voted = item.userVote === 'upvote';
    return (
      <View style={styles.row}>
        <Text style={styles.rank}>{index + 1}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.muted} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Pressable
          style={[styles.voteBtn, voted && styles.voteBtnOn]}
          onPress={() => toggleVote(item)}
          disabled={!userId}
        >
          <Ionicons name="arrow-up" size={16} color={voted ? '#0a0410' : theme.cyan} />
          <Text style={[styles.voteCount, voted && styles.voteCountOn]}>{item.votes_count}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top + space.lg }]}>
      <Text style={styles.title}>Playlist</Text>
      <Text style={styles.subtitle}>Las más votadas suben al setlist del DJ</Text>

      {!userId && isConfigured && (
        <Text style={[styles.muted, { marginBottom: space.sm }]}>Inicia sesión para votar.</Text>
      )}

      {loading ? (
        <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: space.xl * 2 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.muted}>
              {isConfigured ? 'Aún no hay canciones.' : 'Configura Supabase para ver la playlist.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: space.lg },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: theme.muted, fontSize: 13, marginTop: 2, marginBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  sep: { height: 1, backgroundColor: theme.border },
  rank: { color: theme.muted2, fontWeight: '800', width: 22, textAlign: 'center' },
  songTitle: { color: theme.text, fontWeight: '700', fontSize: 14 },
  muted: { color: theme.muted, fontSize: 13 },
  voteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: theme.border, borderRadius: radius.pill,
    paddingHorizontal: space.md, paddingVertical: 6, minWidth: 56, justifyContent: 'center',
  },
  voteBtnOn: { backgroundColor: theme.cyan, borderColor: theme.cyan },
  voteCount: { color: theme.cyan, fontWeight: '800', fontSize: 13 },
  voteCountOn: { color: '#0a0410' },
});
