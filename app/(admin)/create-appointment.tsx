import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Doodle, EyebrowTitle, Field, HandButton, HandChip, HandRect, Icons, Screen } from '../../components/ui';
import { colors, fonts, letterSpacing, radius, spacing } from '../../constants/theme';
import { api, ApiError } from '../../lib/api';
import type { AdminAppointment, AdminUser, ServiceDefinition } from '../../types/api';

type Mode = 'UPCOMING' | 'HISTORY';

function localDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(12, 0, 0, 0);
  return date;
}

function dateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function labelTime(value: string) {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function timeDate(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function timeKey(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export default function AdminCreateAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [mode, setMode] = useState<Mode>('UPCOMING');
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [date, setDate] = useState(localDate(1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [note, setNote] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuest, setShowGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api<AdminUser[]>('/api/v1/admin/users'),
      api<ServiceDefinition[]>('/api/v1/admin/services'),
    ]).then(([users, serviceItems]) => {
      const customerItems = users.filter((item) => item.role === 'USER' && item.status === 'ACTIVE');
      setClients(customerItems);
      setServices(serviceItems);
      setClientId((current) => current || customerItems[0]?.id || '');
      setServiceId((current) => current || serviceItems.find((item) => item.active)?.id || '');
    }).catch((cause) => setError(cause instanceof ApiError ? cause.message : 'Unable to load booking details.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);
  useEffect(() => {
    if (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) setDate(new Date(`${params.date}T12:00:00`));
  }, [params.date]);

  function changeMode(next: Mode) {
    setMode(next);
    setDate(next === 'UPCOMING' ? localDate(1) : localDate(-1));
    setError(null);
  }

  async function submit() {
    if (!clientId || (!serviceId && !customServiceName.trim())) {
      setError('Choose a client and service.');
      return;
    }
    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        customerId: clientId,
        serviceId: serviceId || null,
        customServiceName: serviceId ? null : customServiceName.trim(),
        date: dateKey(date),
        startTime,
        endTime,
        ...(mode === 'UPCOMING'
          ? { note: note.trim() || null }
          : { finalPrice: price.trim() ? Number(price) : null, serviceNotes: note.trim() || null }),
      };
      const created = await api<AdminAppointment>(mode === 'UPCOMING' ? '/api/v1/admin/appointments' : '/api/v1/admin/appointments/history', {
        method: 'POST', body: JSON.stringify(body),
      });
      router.replace({ pathname: '/(admin)/upload', params: { appointmentId: created.id, clientId: created.customerId } });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to create this appointment.');
    } finally {
      setSaving(false);
    }
  }

  async function addGuest() {
    if (!guestName.trim()) { setError('Guest name is required.'); return; }
    setSaving(true); setError(null);
    try {
      const created = await api<AdminUser>('/api/v1/admin/users/guests', { method: 'POST', body: JSON.stringify({ name: guestName.trim(), phone: guestPhone.trim() || null }) });
      setClients((current) => [created, ...current]); setClientId(created.id); setGuestName(''); setGuestPhone(''); setShowGuest(false);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to add this guest client.'); }
    finally { setSaving(false); }
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.back}><Icons.ChevL /><Text style={styles.backText}>back</Text></Pressable>
      </View>
      <EyebrowTitle eyebrow="admin booking" title={mode === 'UPCOMING' ? 'Book for client' : 'Record past visit'} trailing={<Doodle kind="flower" size={21} color={colors.pink} />} />
      <View style={styles.row}><View style={styles.modeRow}><HandChip active={mode === 'UPCOMING'} onPress={() => changeMode('UPCOMING')}>upcoming</HandChip><HandChip active={mode === 'HISTORY'} onPress={() => changeMode('HISTORY')}>past visit</HandChip></View></View>

      {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} /> : <>
        <View style={styles.row}><View style={styles.sectionHead}><Text style={styles.label}>1 · Client</Text><Pressable onPress={() => setShowGuest(true)}><Text style={styles.addLink}>+ Add guest</Text></Pressable></View><HandRect padding={14} radius={radius.lg}><View style={styles.chips}>{clients.map((item) => <HandChip key={item.id} active={clientId === item.id} onPress={() => setClientId(item.id)}>{item.name}</HandChip>)}</View></HandRect></View>
        <View style={styles.row}><Text style={styles.label}>2 · Service</Text><HandRect padding={14} radius={radius.lg}><View style={styles.chips}>{services.filter((item) => item.active || mode === 'HISTORY').map((item) => <HandChip key={item.id} active={serviceId === item.id} onPress={() => { setServiceId(item.id); setCustomServiceName(''); }}>{item.name}</HandChip>)}<HandChip active={!serviceId} onPress={() => setServiceId('')}>custom</HandChip></View>{!serviceId && <Field containerStyle={{ marginTop: 10 }} placeholder="Custom or legacy service" value={customServiceName} onChangeText={setCustomServiceName} />}</HandRect></View>
        <View style={styles.row}><Text style={styles.label}>3 · Date</Text><Pressable onPress={() => setShowDatePicker(true)}><HandRect padding={15} radius={radius.lg}><Text style={styles.dateText}>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text></HandRect></Pressable>{(showDatePicker || Platform.OS === 'ios') && <View style={!showDatePicker && Platform.OS === 'ios' ? styles.inlinePicker : undefined}><DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'compact' : 'default'} minimumDate={mode === 'UPCOMING' ? new Date() : undefined} maximumDate={mode === 'HISTORY' ? new Date() : undefined} onChange={(_, value) => { if (Platform.OS !== 'ios') setShowDatePicker(false); if (value) setDate(value); }} /></View>}</View>
        <View style={styles.row}><Text style={styles.label}>4 · Start time · 5 min</Text><HandRect padding={14} radius={radius.lg}><View style={styles.timePickerRow}><Text style={styles.timePickerLabel}>{labelTime(startTime)}</Text><DateTimePicker value={timeDate(startTime)} mode="time" display={Platform.OS === 'ios' ? 'compact' : 'default'} minuteInterval={5} onChange={(_, value) => { if (!value) return; const next = timeKey(value); setStartTime(next); if (endTime <= next) { const end = new Date(value); end.setMinutes(end.getMinutes() + 30); setEndTime(timeKey(end)); } }} /></View></HandRect></View>
        <View style={styles.row}><Text style={styles.label}>5 · End time · 5 min</Text><HandRect padding={14} radius={radius.lg}><View style={styles.timePickerRow}><Text style={styles.timePickerLabel}>{labelTime(endTime)}</Text><DateTimePicker value={timeDate(endTime)} mode="time" display={Platform.OS === 'ios' ? 'compact' : 'default'} minuteInterval={5} onChange={(_, value) => value && setEndTime(timeKey(value))} /></View></HandRect></View>
        <View style={styles.row}><Text style={styles.label}>{mode === 'HISTORY' ? '6 · Private visit details' : '6 · Appointment note'}</Text><Field placeholder={mode === 'HISTORY' ? 'Products, technique or internal notes' : 'Appointment note (optional)'} multiline value={note} onChangeText={setNote} />{mode === 'HISTORY' && <Field containerStyle={{ marginTop: 10 }} placeholder="Final price CAD (optional)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />}</View>
      </>}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && <View style={styles.row}><HandButton full size="lg" color={colors.pinkInk} disabled={saving || !clientId} onPress={submit}>{saving ? 'Saving…' : mode === 'UPCOMING' ? 'Create appointment' : 'Save past visit'}</HandButton><Text style={styles.hint}>After saving, you can attach photos to this appointment.</Text></View>}
      <Modal transparent visible={showGuest} animationType="fade" onRequestClose={() => setShowGuest(false)}><Pressable style={styles.backdrop} onPress={() => setShowGuest(false)}><Pressable style={styles.modal} onPress={() => undefined}><HandRect padding={20} radius={radius.xl}><Text style={styles.modalTitle}>Add and select guest</Text><Text style={styles.modalText}>For clients who have not registered. Phone is optional.</Text><View style={{ gap: 10, marginVertical: 15 }}><Field placeholder="Unique client name" value={guestName} onChangeText={setGuestName} /><Field placeholder="Phone (optional)" keyboardType="phone-pad" value={guestPhone} onChangeText={setGuestPhone} /></View><HandButton full color={colors.pinkInk} disabled={saving} onPress={addGuest}>{saving ? 'Adding…' : 'Add client'}</HandButton></HandRect></Pressable></Pressable></Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { paddingHorizontal: spacing.lg, minHeight: 40, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { fontFamily: fonts.mono, fontSize: 9, color: colors.ink, letterSpacing: letterSpacing.meta, textTransform: 'uppercase' },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  modeRow: { flexDirection: 'row', gap: 8 },
  label: { marginBottom: 8, fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addLink: { marginBottom: 8, fontFamily: fonts.mono, fontSize: 9, color: colors.pinkInk, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dateText: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  inlinePicker: { alignItems: 'flex-start', marginTop: 6 },
  timePickerRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timePickerLabel: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  error: { paddingHorizontal: spacing.lg, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: '#c0554f' },
  hint: { marginTop: 9, textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  modalText: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
});
