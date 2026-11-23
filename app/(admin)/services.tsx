import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Doodle, EyebrowTitle, Field, HandButton, HandChip, HandRect, Icons, Screen, StatusBadge } from '../../components/ui';
import { colors, fonts, letterSpacing, radius, spacing } from '../../constants/theme';
import { api, ApiError } from '../../lib/api';
import type { ServiceDefinition } from '../../types/api';

const DURATIONS = Array.from({ length: 10 }, (_, index) => (index + 1) * 30);

export default function AdminServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceDefinition | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(120);
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api<ServiceDefinition[]>('/api/v1/admin/services').then(setServices).catch(() => setError('Unable to load services.')).finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);

  function openCreate() {
    setEditing(null); setName(''); setDescription(''); setDuration(120); setPrice(''); setActive(true); setError(null); setShowForm(true);
  }

  function openEdit(item: ServiceDefinition) {
    setEditing(item); setName(item.name); setDescription(item.description ?? ''); setDuration(item.durationMinutes); setPrice(String(item.price)); setActive(item.active); setError(null); setShowForm(true);
  }

  async function save() {
    if (!name.trim()) { setError('Service name is required.'); return; }
    const numericPrice = Number(price);
    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) { setError('Enter a valid price.'); return; }
    setSaving(true); setError(null);
    const body = JSON.stringify({ name: name.trim(), description: description.trim() || null, durationMinutes: duration, price: numericPrice, displayOrder: editing?.displayOrder ?? services.length + 1, active });
    try {
      const item = await api<ServiceDefinition>(editing ? `/api/v1/admin/services/${editing.id}` : '/api/v1/admin/services', { method: editing ? 'PUT' : 'POST', body });
      setServices((current) => editing ? current.map((row) => row.id === item.id ? item : row) : [...current, item]);
      setShowForm(false);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to save this service.'); }
    finally { setSaving(false); }
  }

  return <Screen>
    <View style={styles.top}><Pressable onPress={() => router.back()} style={styles.back}><Icons.ChevL /><Text style={styles.backText}>back</Text></Pressable><HandButton size="sm" color={colors.pinkInk} onPress={openCreate}>+ Add</HandButton></View>
    <EyebrowTitle eyebrow="service menu" title="Treatments" trailing={<Doodle kind="sparkle" size={20} color={colors.blue} />} />
    {error && !showForm && <Text style={styles.error}>{error}</Text>}
    {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} /> : <View style={styles.list}>{services.map((item, index) => <Pressable key={item.id} onPress={() => openEdit(item)}><HandRect padding={16} radius={radius.lg}><View style={styles.head}><Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text><StatusBadge status={item.active ? 'available' : 'cancelled'} /></View><Text style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.description || 'A Kuri Labo studio service.'}</Text><View style={styles.metaRow}><Text style={styles.duration}>{item.durationMinutes} min</Text><Text style={styles.price}>${Number(item.price).toFixed(2)}</Text></View></HandRect></Pressable>)}{services.length === 0 && <Text style={styles.empty}>No services yet.</Text>}</View>}
    <Modal transparent visible={showForm} animationType="fade" onRequestClose={() => setShowForm(false)}><Pressable style={styles.backdrop} onPress={() => setShowForm(false)}><Pressable style={styles.modal} onPress={() => undefined}><HandRect padding={20} radius={radius.xl}><Text style={styles.modalTitle}>{editing ? 'Edit service' : 'Add service'}</Text><View style={styles.form}><Field placeholder="Service name" value={name} onChangeText={setName} /><Field placeholder="Price (CAD)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} /><Field placeholder="Description (optional)" multiline value={description} onChangeText={setDescription} /><Text style={styles.label}>Duration · 30 min to 5 hr</Text><View style={styles.chips}>{DURATIONS.map((value) => <HandChip key={value} active={duration === value} onPress={() => setDuration(value)}>{value < 60 ? `${value} min` : `${value / 60} hr`}</HandChip>)}</View>{editing && <><Text style={styles.label}>Availability</Text><View style={styles.chips}><HandChip active={active} onPress={() => setActive(true)}>active</HandChip><HandChip active={!active} onPress={() => setActive(false)}>disabled</HandChip></View></>}{error && <Text style={styles.modalError}>{error}</Text>}<HandButton full color={colors.pinkInk} disabled={saving} onPress={save}>{saving ? 'Saving…' : 'Save service'}</HandButton></View></HandRect></Pressable></Pressable></Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.lg, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  backText: { fontFamily: fonts.mono, fontSize: 9, color: colors.ink, letterSpacing: letterSpacing.meta, textTransform: 'uppercase' },
  list: { paddingHorizontal: spacing.lg, gap: 11 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { fontFamily: fonts.mono, fontSize: 11, color: colors.pinkInk },
  name: { marginTop: 8, fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  description: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.inkSoft },
  metaRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  duration: { fontFamily: fonts.display, fontSize: 13, color: colors.ink },
  price: { fontFamily: fonts.display, fontSize: 13, color: colors.pinkInk },
  empty: { textAlign: 'center', paddingVertical: 30, fontFamily: fonts.body, color: colors.inkSoft },
  error: { paddingHorizontal: spacing.lg, textAlign: 'center', fontFamily: fonts.body, color: '#c0554f' },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 380, alignSelf: 'center' },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  form: { marginTop: 14, gap: 10 },
  label: { marginTop: 3, fontFamily: fonts.mono, fontSize: 9, textTransform: 'uppercase', color: colors.inkSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  modalError: { fontFamily: fonts.body, fontSize: 12, color: '#c0554f' },
});
