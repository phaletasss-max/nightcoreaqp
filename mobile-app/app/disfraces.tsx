// ── CostumesScreen — galería de cosplay + voto ────────────────────────────────
// Ruta de stack (no tab). Lista los disfraces por votos; con sesión permite dar/
// quitar "me gusta" (voto binario → costume_votes). Subir foto queda para una PT
// posterior (necesita el bucket de Storage + image picker).

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isConfigured } from '../lib/supabase';
import { getCostumes, setCostumeVote } from '../lib/data';
import { useAuth } from '../lib/auth';
import { theme, radius, space } from '../lib/theme';
import type { Costume } from '../lib/types';

export default function CostumesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [costumes, setCostumes] = useState<Costume[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setCostumes(await getCostumes(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const toggleVote = async (c: Costume) => {
    if (!userId) return;
    const next = !c.voted;
    setCostumes((prev) => prev.map((x) =>
      x.id === c.id ? { ...x, voted: next, votes_count: x.votes_count + (next ? 1 : -1) } : x,
    ));
    await setCostumeVote(c.id, next, userId);
  };

  const renderItem = ({ item }: { item: Costume }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.photo_url }} style={styles.photo} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.charName} numberOfLines={1}>{item.char_name}</Text>
        <Text style={styles.muted} numberOfLines={1}>de {item.anime}</Text>
      </View>
      <Pressable
        style={[styles.voteBtn, item.voted && styles.voteBtnOn]}
        onPress={() => toggleVote(item)}
        disabled={!userId}
      >
        <Ionicons name={item.voted ? 'heart' : 'heart-outline'} size={16} color={item.voted ? '#0a0410' : theme.pink} />
        <Text style={[styles.voteCount, item.voted && styles.voteCountOn]}>{item.votes_count}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Disfraces</Text>
        <View style={{ width: 24 }} />
      </View>

      {!userId && isConfigured && (
        <Text style={[styles.muted, styles.hint]}>Inicia sesión para votar.</Text>
      )}

      {loading ? (
        <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
      ) : (
        <FlatList
          data={costumes}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl * 2 }}
          ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
          ListEmptyComponent={
            <Text style={styles.muted}>
              {isConfigured ? 'Aún no hay disfraces.' : 'Configura Supabase para ver los disfraces.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  hint: { paddingHorizontal: space.lg, marginBottom: space.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.sm },
  photo: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: '#000' },
  info: { flex: 1 },
  charName: { color: theme.text, fontWeight: '800', fontSize: 15 },
  muted: { color: theme.muted, fontSize: 13 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6, minWidth: 56, justifyContent: 'center' },
  voteBtnOn: { backgroundColor: theme.pink, borderColor: theme.pink },
  voteCount: { color: theme.pink, fontWeight: '800', fontSize: 13 },
  voteCountOn: { color: '#0a0410' },
});
