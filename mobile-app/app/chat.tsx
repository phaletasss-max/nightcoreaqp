// ── ChatScreen — chat de comunidad en vivo ────────────────────────────────────
// Ruta de stack. Lee el historial y se suscribe a nuevos mensajes vía Supabase
// Realtime (subscribeChat). REQUIERE la migración `phase-chat.sql` corrida en
// Supabase (tabla chat_messages + Realtime); sin ella la lista sale vacía y el
// envío falla en silencio.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isConfigured } from '../lib/supabase';
import { getChatMessages, sendChatMessage, subscribeChat } from '../lib/data';
import { useAuth } from '../lib/auth';
import { theme, radius, space } from '../lib/theme';
import type { ChatMessage } from '../lib/types';

const ROOM = 'general';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessages(await getChatMessages(ROOM));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Suscripción Realtime: añade mensajes nuevos evitando duplicar el propio eco.
  useEffect(() => {
    const unsub = subscribeChat(ROOM, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    });
    return unsub;
  }, []);

  const send = async () => {
    const body = text.trim();
    if (!body || !userId) return;
    setSending(true);
    setText('');
    const sent = await sendChatMessage(ROOM, body, userId, profile?.username ?? 'Invitado');
    if (sent) {
      setMessages((prev) => (prev.some((x) => x.id === sent.id) ? prev : [...prev, sent]));
    }
    setSending(false);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.user_id === userId;
    return (
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        {!mine && <Text style={styles.author}>{item.username}</Text>}
        <Text style={styles.msgText}>{item.content}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.safe, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Chat de la comunidad</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.md }}
          ItemSeparatorComponent={() => <View style={{ height: space.xs }} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.muted}>
              {isConfigured
                ? 'Sin mensajes todavía. ¡Saluda! (Si no carga, falta correr phase-chat.sql.)'
                : 'Configura Supabase para usar el chat.'}
            </Text>
          }
        />
      )}

      {userId ? (
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + space.sm }]}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={theme.muted2}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable style={styles.sendBtn} onPress={send} disabled={sending || !text.trim()}>
            <Ionicons name="send" size={18} color="#0a0410" />
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.muted, { padding: space.lg, paddingBottom: insets.bottom + space.md }]}>
          Inicia sesión en Perfil para escribir.
        </Text>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  muted: { color: theme.muted, fontSize: 13 },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: space.sm },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,0,255,0.18)', borderColor: theme.magenta, borderWidth: 1 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
  author: { color: theme.cyan, fontSize: 11, fontWeight: '800', marginBottom: 2 },
  msgText: { color: theme.text, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm, borderTopColor: theme.border, borderTopWidth: 1 },
  input: { flex: 1, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 8, color: theme.text },
  sendBtn: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: theme.magenta, alignItems: 'center', justifyContent: 'center' },
});
