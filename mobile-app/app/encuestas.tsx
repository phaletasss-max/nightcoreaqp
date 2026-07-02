// ── EncuestasScreen — retos y encuestas diarias ──────────────────────────────
// Permite hacer el check-in diario (racha) y votar en la encuesta activa.
// Además muestra el historial de encuestas pasadas con sus ganadores.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isConfigured } from '../lib/supabase';
import { getActiveSurvey, voteSurvey, dailyCheckIn, getPastSurveys } from '../lib/data';
import { useAuth } from '../lib/auth';
import { theme, radius, space } from '../lib/theme';
import type { Survey, SurveyOption } from '../lib/types';

export default function EncuestasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, refresh } = useAuth();
  const userId = session?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<(Survey & { votedOptionId?: string }) | null>(null);
  const [pastSurveys, setPastSurveys] = useState<Survey[]>([]);
  const [busyCheckIn, setBusyCheckIn] = useState(false);
  const [busyVote, setBusyVote] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [act, past] = await Promise.all([
      getActiveSurvey(userId),
      getPastSurveys(),
    ]);
    setSurvey(act);
    setPastSurveys(past);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Verificar si ya hizo check-in hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const checkedIn = profile?.last_check_in === todayStr;
  const streak = profile?.streak_count ?? 0;

  const handleCheckIn = async () => {
    if (!userId) {
      Alert.alert('Acceso Requerido', 'Inicia sesión en la pestaña Perfil para registrar tu racha.');
      return;
    }
    if (checkedIn) return;
    setBusyCheckIn(true);
    const res = await dailyCheckIn();
    if (res.ok) {
      Alert.alert('¡Check-in registrado!', 'Has recibido +5 puntos y tu racha ha aumentado. 🔥');
      await refresh();
    } else {
      Alert.alert('Error', 'No se pudo registrar tu check-in. Inténtalo de nuevo.');
    }
    setBusyCheckIn(false);
  };

  const handleVote = async (optionId: string) => {
    if (!userId) {
      Alert.alert('Acceso Requerido', 'Inicia sesión en la pestaña Perfil para votar.');
      return;
    }
    if (!survey || survey.votedOptionId) return;

    setBusyVote(true);
    // Optimista
    setSurvey({
      ...survey,
      votedOptionId: optionId,
      options: survey.options.map((o) =>
        o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o
      ),
    });

    await voteSurvey(survey.id, optionId, userId);
    await refresh(); // refrescar puntos del perfil
    setBusyVote(false);
  };

  const totalVotes = survey?.options.reduce((sum, o) => sum + o.votes_count, 0) ?? 0;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Retos y Encuestas</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.cyan} style={{ marginTop: space.xl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl * 2 }}>
          {/* Racha Diaria */}
          <Text style={styles.sectionTitle}>Racha diaria</Text>
          <View style={[styles.card, styles.streakCard]}>
            <View style={styles.streakInfoRow}>
              <View style={[styles.streakIconContainer, checkedIn && styles.streakIconActive]}>
                <Ionicons
                  name="flame"
                  size={28}
                  color={checkedIn ? theme.pink : theme.muted2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Racha actual</Text>
                <Text style={styles.streakSub}>¡Mantén tu racha activa todos los días!</Text>
              </View>
              <View style={styles.streakCounterContainer}>
                <Text style={[styles.streakCountText, checkedIn && styles.streakCountActive]}>{streak}</Text>
                <Text style={styles.streakCountLabel}>días</Text>
              </View>
            </View>

            <Pressable
              style={[styles.btn, checkedIn ? styles.btnDisabled : styles.btnPrimary]}
              onPress={handleCheckIn}
              disabled={checkedIn || busyCheckIn}
            >
              {busyCheckIn ? (
                <ActivityIndicator color="#0a0410" size="small" />
              ) : (
                <Text style={[styles.btnText, checkedIn && styles.btnTextDisabled]}>
                  {checkedIn ? '✓ Check-in hecho por hoy' : 'Registrar racha (+5 PTS)'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Encuesta del día */}
          <Text style={styles.sectionTitle}>Encuesta del día</Text>
          {!survey ? (
            <Text style={styles.muted}>No hay encuesta activa en este momento.</Text>
          ) : (
            <View style={[styles.card, styles.surveyCard]}>
              <Text style={styles.surveyQuestion}>{survey.question}</Text>
              <Text style={styles.surveySub}>Vota para ganar +3 puntos de comunidad.</Text>

              <View style={styles.optionsContainer}>
                {survey.votedOptionId ? (
                  // Votado: mostrar resultados con porcentajes
                  survey.options.map((o) => {
                    const pct = totalVotes ? Math.round((o.votes_count / totalVotes) * 100) : 0;
                    const isMine = survey.votedOptionId === o.id;
                    return (
                      <View key={o.id} style={styles.resultRow}>
                        <View style={styles.resultLabelRow}>
                          <Text style={[styles.resultText, isMine && styles.resultMineText]}>
                            {o.text} {isMine && '✓'}
                          </Text>
                          <Text style={styles.resultPct}>{pct}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${pct}%` },
                              isMine && styles.progressBarMineFill,
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })
                ) : (
                  // No votado: botones interactivos
                  survey.options.map((o) => (
                    <Pressable
                      key={o.id}
                      style={styles.optionBtn}
                      onPress={() => handleVote(o.id)}
                      disabled={busyVote}
                    >
                      <Text style={styles.optionBtnText}>{o.text}</Text>
                    </Pressable>
                  ))
                )}
              </View>

              {survey.votedOptionId && (
                <Text style={styles.surveyFooter}>Total: {totalVotes} votos</Text>
              )}
            </View>
          )}

          {/* Historial de encuestas */}
          <Text style={[styles.sectionTitle, { marginTop: space.xl }]}>Historial de encuestas</Text>
          {pastSurveys.length === 0 ? (
            <Text style={styles.muted}>No hay encuestas anteriores en el historial.</Text>
          ) : (
            pastSurveys.map((past) => {
              // Encontrar ganador
              const sorted = [...past.options].sort((a, b) => b.votes_count - a.votes_count);
              const winner = sorted[0];
              const totalPastVotes = past.options.reduce((sum, o) => sum + o.votes_count, 0);
              const pct = totalPastVotes && winner ? Math.round((winner.votes_count / totalPastVotes) * 100) : 0;

              return (
                <View key={past.id} style={styles.pastCard}>
                  <Text style={styles.pastQuestion}>{past.question}</Text>
                  {winner ? (
                    <Text style={styles.pastWinner}>
                      Popular: <Text style={styles.pastWinnerHighlight}>{winner.text}</Text> ({pct}%)
                    </Text>
                  ) : (
                    <Text style={styles.pastWinner}>Sin votos registrados</Text>
                  )}
                </View>
              );
            })
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
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '800', marginTop: space.lg, marginBottom: space.sm },
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, marginBottom: space.sm },
  streakCard: { borderColor: 'rgba(255, 45, 143, 0.3)' },
  streakInfoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  streakIconContainer: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', borderColor: theme.border, borderWidth: 1 },
  streakIconActive: { backgroundColor: 'rgba(255, 45, 143, 0.1)', borderColor: theme.pink },
  cardTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
  streakSub: { color: theme.muted, fontSize: 12, marginTop: 2 },
  streakCounterContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
  streakCountText: { color: theme.muted2, fontSize: 28, fontWeight: '900' },
  streakCountActive: { color: theme.pink },
  streakCountLabel: { color: theme.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  btn: { width: '100%', paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: theme.pink },
  btnDisabled: { backgroundColor: 'rgba(255, 45, 143, 0.15)', borderColor: theme.pink, borderWidth: 1 },
  btnText: { color: '#0a0410', fontWeight: '800', fontSize: 14 },
  btnTextDisabled: { color: theme.pink },
  surveyCard: { borderColor: 'rgba(0, 255, 255, 0.3)' },
  surveyQuestion: { color: theme.text, fontSize: 16, fontWeight: '800' },
  surveySub: { color: theme.muted, fontSize: 12, marginTop: 4, marginBottom: space.md },
  optionsContainer: { gap: space.sm, marginTop: space.sm },
  optionBtn: { width: '100%', padding: space.md, borderRadius: radius.md, borderColor: theme.border, borderWidth: 1, backgroundColor: theme.surface2 },
  optionBtnText: { color: theme.muted, fontWeight: '700', fontSize: 14 },
  resultRow: { marginVertical: space.xs },
  resultLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  resultText: { color: theme.muted, fontSize: 13, fontWeight: '600' },
  resultMineText: { color: theme.cyan, fontWeight: '700' },
  resultPct: { color: theme.cyan, fontSize: 13, fontWeight: '800' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.pill, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radius.pill },
  progressBarMineFill: { backgroundColor: theme.cyan },
  surveyFooter: { color: theme.muted2, fontSize: 11, marginTop: space.md, borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, paddingTop: space.sm },
  pastCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  pastQuestion: { color: theme.text, fontSize: 14, fontWeight: '700' },
  pastWinner: { color: theme.muted2, fontSize: 12, marginTop: 4 },
  pastWinnerHighlight: { color: theme.purple, fontWeight: '800' },
  muted: { color: theme.muted, fontSize: 13 },
});
