// ── Layout raíz (Expo Router) ─────────────────────────────────────────────────
// Envuelve toda la app con SafeAreaProvider y el AuthProvider (sesión Supabase).
// El Stack raíz solo monta el grupo de pestañas (tabs); el header se oculta porque
// cada pantalla dibuja su propia cabecera.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { theme } from '../lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
