// ── DescargasScreen — descarga MP3/MP4 al celular ────────────────────────────
// Pega un enlace (YouTube/TikTok/Instagram/Facebook), elige formato y el
// media-service (Render) procesa y devuelve el archivo; se guarda en la
// galería/música del celular con expo-media-library.
// Nota: el server gratuito de Render "duerme" → la primera descarga puede
// tardar ~40 s en arrancar (se avisa en la UI).

import { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { File, Directory, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { theme, radius, space } from '../lib/theme';

const MEDIA_URL = 'https://nightcore-media.onrender.com';
const VALID_LINK = /(youtu\.?be|youtube\.com|tiktok\.com|instagram\.com|facebook\.com|fb\.watch)/i;

export default function DescargasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const handleDownload = async () => {
    const link = url.trim();
    setDone(null);
    if (!/^https?:\/\//i.test(link) || !VALID_LINK.test(link)) {
      Alert.alert('Enlace inválido', 'Pega un enlace de YouTube, TikTok, Instagram o Facebook (debe empezar con http).');
      return;
    }

    // Permiso de galería ANTES de gastar la descarga.
    const { status: perm } = await requestPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permiso necesario', 'Sin acceso a tu galería no puedo guardar la descarga.');
      return;
    }

    setBusy(true);
    setStatus('Conectando con el servidor… si estaba dormido puede tardar ~40 s. No cierres la app.');
    try {
      const q = `${MEDIA_URL}/api/download?url=${encodeURIComponent(link)}&format=${format}&quality=${format === 'mp4' ? '720' : 'best'}`;
      const dir = new Directory(Paths.cache, 'descargas');
      try { dir.create(); } catch { /* ya existe */ }
      const name = `nightcore_${Date.now()}.${format}`;

      setStatus('Descargando… (los videos largos tardan más)');
      const file = await File.downloadFileAsync(q, new File(dir, name));

      setStatus('Guardando en tu galería…');
      await Asset.create(file.uri);
      try { file.delete(); } catch { /* liberar caché, best-effort */ }

      setDone(format === 'mp3' ? '¡Listo! Tu canción está en Música/Galería. 🎧' : '¡Listo! Tu video está en la Galería. 📼');
      setUrl('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(
        'No se pudo descargar',
        `${msg}\n\nPuede ser que el servidor esté despertando (reintenta en 1 min) o que la plataforma haya bloqueado temporalmente la descarga.`,
      );
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.sm, paddingBottom: space.xl }}
    >
      {/* Cabecera */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>Descargas</Text>
      </View>
      <Text style={styles.subtitle}>
        Pega un enlace de YouTube, TikTok, Instagram o Facebook y guárdalo directo en tu celular.
      </Text>

      {/* Enlace */}
      <Text style={styles.label}>PEGA TU ENLACE</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://www.youtube.com/watch?v=…"
        placeholderTextColor={theme.muted2}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />

      {/* Formato */}
      <Text style={styles.label}>FORMATO</Text>
      <View style={styles.segment}>
        {(['mp3', 'mp4'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => !busy && setFormat(f)}
            style={[styles.segmentBtn, format === f && styles.segmentBtnActive]}
          >
            <Ionicons
              name={f === 'mp3' ? 'musical-notes' : 'videocam'}
              size={16}
              color={format === f ? theme.bg : theme.muted}
            />
            <Text style={[styles.segmentText, format === f && styles.segmentTextActive]}>
              {f === 'mp3' ? 'MP3 (audio)' : 'MP4 (video 720p)'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Acción */}
      <Pressable style={[styles.downloadBtn, busy && { opacity: 0.6 }]} onPress={handleDownload} disabled={busy}>
        {busy ? <ActivityIndicator color={theme.bg} /> : <Ionicons name="cloud-download" size={18} color={theme.bg} />}
        <Text style={styles.downloadText}>{busy ? 'Descargando…' : 'Descargar al celular'}</Text>
      </Pressable>

      {status && <Text style={styles.status}>{status}</Text>}
      {done && <Text style={styles.done}>{done}</Text>}

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Cómo funciona</Text>
        <Text style={styles.infoLine}>• La descarga la procesa nuestro servidor y llega directo a tu galería.</Text>
        <Text style={styles.infoLine}>• La primera vez puede tardar ~40 s (el servidor gratuito "despierta").</Text>
        <Text style={styles.infoLine}>• Respeta los derechos de autor — solo para disfrute personal.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  title: { color: theme.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: theme.muted, fontSize: 13, marginBottom: space.xl },
  label: { color: theme.muted2, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: space.sm },
  input: {
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md,
    color: theme.text, paddingHorizontal: space.md, paddingVertical: space.md, fontSize: 14, marginBottom: space.lg,
  },
  segment: { flexDirection: 'row', gap: space.sm, marginBottom: space.xl },
  segmentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center',
    paddingVertical: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  segmentBtnActive: { backgroundColor: theme.cyan, borderColor: theme.cyan },
  segmentText: { color: theme.muted, fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: theme.bg },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm,
    backgroundColor: theme.lime, borderRadius: radius.md, paddingVertical: 14,
  },
  downloadText: { color: theme.bg, fontSize: 15, fontWeight: '800' },
  status: { color: theme.yellow, fontSize: 12, marginTop: space.md, textAlign: 'center' },
  done: { color: theme.lime, fontSize: 13, fontWeight: '700', marginTop: space.md, textAlign: 'center' },
  infoCard: {
    marginTop: space.xl, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: radius.lg, padding: space.lg, gap: space.sm,
  },
  infoTitle: { color: theme.text, fontSize: 13, fontWeight: '800' },
  infoLine: { color: theme.muted, fontSize: 12, lineHeight: 18 },
});
