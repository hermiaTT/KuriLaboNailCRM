import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Doodle, EyebrowTitle, Field, HandButton, HandChip, HandRect, Icons, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { api, ApiError } from '../../lib/api';
import type { AdminUser, Appointment, NailSet } from '../../types/api';

export default function AdminUploadScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientId, setClientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(() => { Promise.all([api<AdminUser[]>('/api/v1/admin/users'), api<Appointment[]>('/api/v1/admin/appointments')]).then(([users, visits]) => { setClients(users.filter((user) => user.role === 'USER')); setAppointments(visits); }).catch(() => setError('Unable to load clients and appointments.')); }, []);
  useFocusEffect(load);
  const names = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const visibleAppointments = appointments.filter((item) => !clientId || item.customerId === clientId).slice(0, 20);

  async function pickImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Photo library access is required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, orderedSelection: true, quality: 0.85, selectionLimit: 12 });
    if (!result.canceled) setAssets(result.assets.slice(0, 12));
  }

  async function upload() {
    if (!assets.length) { setError('Choose at least one photo.'); return; }
    const body = new FormData();
    assets.forEach((asset, index) => body.append('files', { uri: asset.uri, name: asset.fileName || `nail-${index + 1}.jpg`, type: asset.mimeType || 'image/jpeg' } as any));
    if (title.trim()) body.append('title', title.trim());
    if (description.trim()) body.append('description', description.trim());
    if (appointmentId) body.append('appointmentId', appointmentId);
    else if (clientId) body.append('clientId', clientId);
    setUploading(true); setError(null);
    try {
      await api<NailSet>('/api/v1/admin/nail-sets', { method: 'POST', body });
      setAssets([]); setTitle(''); setDescription(''); setClientId(''); setAppointmentId(''); setSuccess(true);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Upload failed.'); }
    finally { setUploading(false); }
  }

  return <Screen><ScreenHeader /><EyebrowTitle eyebrow="upload" title="Add photos" trailing={<Doodle kind="sparkle" size={20} color={colors.coral} />} />
    <View style={styles.row}><Pressable onPress={pickImages}><HandRect padding={20} radius={radius.lg} dashed><View style={styles.picker}><Text style={styles.plus}>＋</Text><Text style={styles.pickerTitle}>Choose up to 12 photos</Text><Text style={styles.meta}>JPEG, PNG, WebP or GIF</Text></View></HandRect></Pressable></View>
    {assets.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previews}>{assets.map((asset) => <View key={asset.uri}><Image source={{ uri: asset.uri }} style={styles.preview} /><Pressable style={styles.remove} onPress={() => setAssets((current) => current.filter((item) => item.uri !== asset.uri))}><Text style={{ color: colors.white }}>×</Text></Pressable></View>)}</ScrollView>}
    <View style={styles.row}><HandRect padding={16} radius={radius.lg}><View style={{ gap: 10 }}><Field placeholder="Set title (optional)" value={title} onChangeText={setTitle} /><Field placeholder="Description (optional)" multiline value={description} onChangeText={setDescription} /></View></HandRect></View>
    <View style={styles.row}><Text style={styles.label}>Client · optional</Text><View style={styles.chips}><HandChip active={!clientId} onPress={() => { setClientId(''); setAppointmentId(''); }}>No client</HandChip>{clients.slice(0, 12).map((client) => <HandChip key={client.id} active={clientId === client.id} onPress={() => { setClientId(client.id); setAppointmentId(''); }}>{client.name}</HandChip>)}</View></View>
    <View style={styles.row}><Text style={styles.label}>Appointment · optional</Text><View style={styles.chips}><HandChip active={!appointmentId} onPress={() => setAppointmentId('')}>No appointment</HandChip>{visibleAppointments.map((item) => <HandChip key={item.id} active={appointmentId === item.id} onPress={() => { setAppointmentId(item.id); setClientId(item.customerId); }}>{names.get(item.customerId) || 'Client'} · {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(item.startAt))}</HandChip>)}</View></View>
    {error && <Text style={styles.error}>{error}</Text>}{success && <Text style={styles.success}>Nail set uploaded ✓</Text>}
    <View style={styles.row}><HandButton full size="lg" color={colors.pinkInk} disabled={uploading || !assets.length} onPress={upload}>{uploading ? 'Uploading…' : `Publish ${assets.length || ''} photo${assets.length === 1 ? '' : 's'}`}</HandButton><Pressable onPress={() => router.push('/(admin)/inspiration')} style={styles.library}><Icons.ChevL color={colors.inkSoft} /><Text style={styles.meta}>Back to library</Text></Pressable></View>
  </Screen>;
}

const styles = StyleSheet.create({ row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }, picker: { alignItems: 'center', gap: 5 }, plus: { fontSize: 30, color: colors.pinkInk }, pickerTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink }, meta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft }, previews: { paddingHorizontal: spacing.lg, gap: 8 }, preview: { width: 92, height: 112, borderRadius: radius.md }, remove: { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' }, label: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, error: { textAlign: 'center', color: '#c0554f', fontFamily: fonts.body }, success: { textAlign: 'center', color: colors.blueInk, fontFamily: fonts.body }, library: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' } });
