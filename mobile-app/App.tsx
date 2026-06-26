// ── Home (móvil) — Fase 16-0 ──────────────────────────────────────────────────
// Pantalla raíz mínima que prueba toda la base de la Fase 0: cliente Supabase
// (misma instancia que la web), tipos compartidos, tema oscuro scenecore y la capa
// de datos de solo-lectura. Muestra el próximo evento y el top de la playlist.
//
// Aún SIN expo-router (eso es la Fase 1, con las pantallas Home/Playlist/Perfil).
// Por eso esto es una sola pantalla; la navegación llega en la siguiente fase.

import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, View, SafeAreaView,
} from 'react-native';
import { isConfigured } from './lib/supabase';
import { getNextEvent, getSongs } from './lib/data';
import { theme, radius, space } from './lib/theme';
import type { EventItem, Song } from './lib/types';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([getNextEvent(), getSongs()]).then(([ev, sg]) => {
      if (!active) return;
      setEvent(ev);
      setSongs(sg.slice(0, 10));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cabecera */}
        <Text style={styles.brand}>
          NIGHTCORE<Text style={styles.brandAccent}>AQP</Text>
        </Text>
        <Text style={styles.subtitle}>El club de nightcore de Arequipa</Text>

        {!isConfigured && (
          <View style={[styles.card, styles.warnCard]}>
            <Text style={styles.warnTitle}>Falta configurar Supabase</Text>
            <Text style={styles.muted}>
              Crea un archivo <Text style={styles.code}>.env</Text> en mobile-app/ con
              {' '}<Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text> y
              {' '}<Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text> (los mismos
              valores que la web).
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
        ) : (
          <>
            {/* Próximo evento */}
            <Text style={styles.sectionTitle}>Próximo evento</Text>
            {event ? (
              <View style={[styles.card, styles.eventCard]}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.tagline ? <Text style={styles.muted}>{event.tagline}</Text> : null}
                {event.location ? (
                  <Text style={styles.eventMeta}>📍 {event.location}</Text>
                ) : null}
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>
                    {event.status === 'confirmed' ? 'Confirmado'
                      : event.status === 'paused' ? 'Pausado' : 'Planeación'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.muted}>
                {isConfigured ? 'No hay eventos en agenda.' : 'Configura Supabase para ver los eventos.'}
              </Text>
            )}

            {/* Playlist */}
            <Text style={styles.sectionTitle}>Playlist más votada</Text>
            {songs.length > 0 ? (
              songs.map((s, i) => (
                <View key={s.id} style={[styles.card, styles.songRow]}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.songTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.muted} numberOfLines={1}>{s.artist}</Text>
                  </View>
                  <Text style={styles.votes}>{s.votes_count}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>
                {isConfigured ? 'Aún no hay canciones.' : '—'}
              </Text>
            )}
          </>
        )}

        <Text style={styles.footer}>
          Organiza Yorch · hecho por Los Simpatizantes de JP
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2 },
  brand: { color: theme.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  brandAccent: { color: theme.magenta },
  subtitle: { color: theme.muted, fontSize: 13, marginTop: 2, marginBottom: space.lg },

  sectionTitle: {
    color: theme.text, fontSize: 16, fontWeight: '800',
    marginTop: space.xl, marginBottom: space.sm,
  },

  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.sm,
  },

  eventCard: { borderColor: 'rgba(0,255,255,0.3)' },
  eventTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  eventMeta: { color: theme.muted2, fontSize: 12, marginTop: space.xs },
  statusPill: {
    alignSelf: 'flex-start', marginTop: space.sm,
    backgroundColor: 'rgba(57,255,20,0.12)',
    borderColor: 'rgba(57,255,20,0.4)', borderWidth: 1,
    borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4,
  },
  statusText: { color: theme.lime, fontSize: 11, fontWeight: '800' },

  songRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rank: { color: theme.muted2, fontWeight: '800', width: 22, textAlign: 'center' },
  songTitle: { color: theme.text, fontWeight: '700', fontSize: 14 },
  votes: { color: theme.cyan, fontWeight: '800', fontSize: 15 },

  warnCard: { borderColor: 'rgba(255,240,31,0.4)', marginTop: space.lg },
  warnTitle: { color: theme.yellow, fontWeight: '800', marginBottom: space.xs },

  muted: { color: theme.muted, fontSize: 13, lineHeight: 19 },
  code: { color: theme.cyan, fontFamily: 'monospace', fontSize: 12 },
  footer: {
    color: theme.muted2, fontSize: 11, textAlign: 'center', marginTop: space.xl * 1.5,
  },
});
