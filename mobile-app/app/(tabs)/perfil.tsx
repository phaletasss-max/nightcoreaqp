// ── ProfileScreen — sesión + perfil ───────────────────────────────────────────
// Sin sesión: formulario de login/registro (Supabase Auth). Con sesión: muestra el
// perfil (username, rango, puntos, racha) y botón de cerrar sesión. Todo vía useAuth.

import { useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { isConfigured } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { theme, radius, space } from '../../lib/theme';

function rankFor(points: number) {
  if (points >= 200) return 'Hypebeast de Oro';
  if (points >= 100) return 'Otaku de Plata';
  return 'Fan de Bronce';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, session, loading, signIn, signUp, signOut } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    const res = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, username.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else if (mode === 'signup') setError('Revisa tu correo para confirmar la cuenta.');
  };

  if (loading) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={theme.cyan} />
      </View>
    );
  }

  if (!isConfigured) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top + space.lg }]}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.muted}>Configura Supabase para iniciar sesión.</Text>
      </View>
    );
  }

  // ── Con sesión: vista de perfil ──
  if (session?.user) {
    return (
      <ScrollView style={styles.safe} contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.lg }}>
        <Text style={styles.title}>Mi perfil</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.username ?? session.user.email ?? '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{profile?.username ?? 'Sin nombre'}</Text>
          <Text style={styles.muted}>{session.user.email}</Text>

          <View style={styles.badges}>
            <Text style={styles.badge}>{rankFor(profile?.points ?? 0)}</Text>
            <Text style={styles.badge}>💰 {profile?.points ?? 0} pts</Text>
            <Text style={styles.badge}>🔥 {profile?.streak_count ?? 0}d</Text>
            {(profile?.role === 'admin' || profile?.role === 'dj') && (
              <Text style={[styles.badge, styles.badgeStaff]}>{profile?.role?.toUpperCase()}</Text>
            )}
          </View>

          {profile?.bio ? <Text style={[styles.muted, { marginTop: space.md }]}>{profile.bio}</Text> : null}
        </View>

        {(profile?.role === 'admin' || profile?.role === 'dj') && (
          <Link href="/dj" asChild>
            <Pressable style={[styles.btn, styles.btnPrimary, { marginBottom: space.sm }]}>
              <Text style={styles.btnPrimaryText}>Ir al Panel DJ</Text>
            </Pressable>
          </Link>
        )}

        <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => signOut()}>
          <Text style={styles.btnGhostText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Sin sesión: login / registro ──
  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.lg }}>
      <Text style={styles.title}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
      <Text style={styles.subtitle}>Tu cuenta es la misma que en la web.</Text>

      <View style={styles.card}>
        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            placeholderTextColor={theme.muted2}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor={theme.muted2}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={theme.muted2}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.btn, styles.btnPrimary]} disabled={busy} onPress={submit}>
          <Text style={styles.btnPrimaryText}>
            {busy ? '...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </Text>
        </Pressable>

        <Pressable onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
          <Text style={styles.switchText}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.text, fontSize: 24, fontWeight: '800', marginBottom: 2 },
  subtitle: { color: theme.muted, fontSize: 13, marginBottom: space.lg },
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, alignItems: 'center', marginBottom: space.lg },
  avatar: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: 'rgba(255,0,255,0.15)', borderColor: theme.magenta, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.magenta, fontSize: 30, fontWeight: '800' },
  username: { color: theme.text, fontSize: 20, fontWeight: '800', marginTop: space.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', marginTop: space.md },
  badge: { color: theme.cyan, fontSize: 12, fontWeight: '700', borderWidth: 1, borderColor: theme.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  badgeStaff: { color: theme.magenta, borderColor: theme.magenta },
  input: { width: '100%', backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10, color: theme.text, marginBottom: space.sm },
  error: { color: theme.pink, fontSize: 12, marginBottom: space.sm, textAlign: 'center' },
  btn: { width: '100%', paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  btnPrimary: { backgroundColor: theme.magenta },
  btnPrimaryText: { color: '#0a0410', fontWeight: '800' },
  btnGhost: { borderWidth: 1, borderColor: theme.border },
  btnGhostText: { color: theme.muted, fontWeight: '700' },
  switchText: { color: theme.cyan, fontSize: 13, marginTop: space.md, textAlign: 'center' },
  muted: { color: theme.muted, fontSize: 13 },
});
