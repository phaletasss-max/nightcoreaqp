// ── CostumesScreen — galería de cosplay + voto + subir foto ────────────────────
// Ruta de stack (no tab). Lista los disfraces por votos; con sesión permite dar/
// quitar "me gusta" (voto binario → costume_votes) y subir un cosplay nuevo
// seleccionando una foto de la galería (vía expo-image-picker y Supabase Storage).

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase, isConfigured } from '../lib/supabase';
import { getCostumes, setCostumeVote, addCostume } from '../lib/data';
import { useAuth } from '../lib/auth';
import { theme, radius, space } from '../lib/theme';
import type { Costume } from '../lib/types';

export default function CostumesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, refresh } = useAuth();
  const userId = session?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [charName, setCharName] = useState('');
  const [anime, setAnime] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setCostumes(await getCostumes(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleVote = async (c: Costume) => {
    if (!userId) {
      Alert.alert('Acceso Requerido', 'Inicia sesión en la pestaña Perfil para poder votar.');
      return;
    }
    const next = !c.voted;
    setCostumes((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, voted: next, votes_count: x.votes_count + (next ? 1 : -1) } : x
      )
    );
    await setCostumeVote(c.id, next, userId);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso Requerido', 'Necesitamos acceso a tu galería para subir la foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!charName.trim() || !anime.trim()) {
      Alert.alert('Campos Incompletos', 'Por favor ingresa el personaje y el anime.');
      return;
    }
    if (!selectedImage) {
      Alert.alert('Falta Imagen', 'Por favor selecciona una foto de tu cosplay.');
      return;
    }
    if (!userId) return;

    setUploading(true);
    try {
      // 1. Convertir URI a Blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // 2. Subir a Supabase Storage (bucket "media")
      const ext = selectedImage.split('.').pop() ?? 'jpg';
      const filePath = `uploads/mobile_${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });

      if (uploadError) throw uploadError;

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);

      // 4. Crear registro en base de datos
      const newCostume = await addCostume(charName.trim(), anime.trim(), publicUrl, userId);

      if (newCostume) {
        Alert.alert('¡Éxito!', 'Tu cosplay ha sido subido correctamente.');
        setShowUploadModal(false);
        setCharName('');
        setAnime('');
        setSelectedImage(null);
        // Recargar lista
        load();
        await refresh(); // refrescar puntos
      } else {
        throw new Error('Error al registrar en BD');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'No se pudo subir el cosplay. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
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
      >
        <Ionicons name={item.voted ? 'heart' : 'heart-outline'} size={16} color={item.voted ? '#0a0410' : theme.pink} />
        <Text style={[styles.voteCount, item.voted && styles.voteCountOn]}>{item.votes_count}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Galería de Cosplays</Text>
        {userId ? (
          <Pressable onPress={() => setShowUploadModal(true)} hitSlop={12}>
            <Ionicons name="add" size={26} color={theme.cyan} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {!userId && isConfigured && (
        <Text style={[styles.muted, styles.hint]}>Inicia sesión para subir y votar disfraces.</Text>
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

      {/* Modal de Subida */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subir Cosplay (+5 pts)</Text>
              <Pressable onPress={() => setShowUploadModal(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: space.md }}>
              <Text style={styles.label}>Personaje</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Lucy, Miku, etc."
                placeholderTextColor={theme.muted2}
                value={charName}
                onChangeText={setCharName}
              />

              <Text style={styles.label}>Anime / Origen</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Cyberpunk, Vocaloid"
                placeholderTextColor={theme.muted2}
                value={anime}
                onChangeText={setAnime}
              />

              <Text style={styles.label}>Foto</Text>
              <Pressable style={styles.imageSelector} onPress={pickImage}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={32} color={theme.muted2} />
                    <Text style={styles.imagePlaceholderText}>Seleccionar Foto</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={[styles.uploadBtn, uploading && styles.btnDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#0a0410" size="small" />
                ) : (
                  <Text style={styles.uploadBtnText}>Subir Cosplay</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  hint: { paddingHorizontal: space.lg, marginBottom: space.sm, color: theme.muted },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: radius.lg, padding: space.sm },
  photo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: '#000' },
  info: { flex: 1 },
  charName: { color: theme.text, fontWeight: '800', fontSize: 15 },
  muted: { color: theme.muted, fontSize: 13 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6, minWidth: 56, justifyContent: 'center' },
  voteBtnOn: { backgroundColor: theme.pink, borderColor: theme.pink },
  voteCount: { color: theme.pink, fontWeight: '800', fontSize: 13 },
  voteCountOn: { color: '#0a0410' },

  // Modal styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 4, 16, 0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.xl, borderColor: theme.border, borderTopWidth: 1, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  label: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: space.xs, marginTop: space.sm },
  input: { backgroundColor: theme.surface2, borderColor: theme.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10, color: theme.text, fontSize: 14, marginBottom: space.sm },
  imageSelector: { width: '100%', height: 160, borderRadius: radius.md, borderColor: theme.border, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden', marginVertical: space.sm },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface2, gap: 4 },
  imagePlaceholderText: { color: theme.muted2, fontSize: 12, fontWeight: '700' },
  uploadBtn: { backgroundColor: theme.cyan, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: space.lg },
  uploadBtnText: { color: '#0a0410', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
});
