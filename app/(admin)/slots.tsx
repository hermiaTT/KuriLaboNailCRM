import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Doodle, EyebrowTitle, Field, HandButton, HandRect, Icons, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, letterSpacing, radius, spacing, typeScale } from '../../constants/theme';
import { api, ApiError } from '../../lib/api';
import type { AdminUser, Appointment, AvailabilityBlock } from '../../types/api';

function pad(value: number) { return String(value).padStart(2, '0'); }
function keyOf(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function addDays(date: string, amount: number) { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate() + amount); return keyOf(next); }
function dateLabel(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function timeLabel(iso: string) { return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' }).format(new Date(iso)); }

export default function AdminSlotsScreen() {
  const router = useRouter();
  const [date, setDate] = useState(keyOf(new Date()));
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [fullDay, setFullDay] = useState(false);
  const [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const from = addDays(date, -31);
    const to = addDays(date, 62);
    Promise.all([api<AvailabilityBlock[]>(`/api/v1/admin/availability-blocks?from=${from}&to=${to}`), api<Appointment[]>('/api/v1/admin/appointments'), api<AdminUser[]>('/api/v1/admin/users')])
      .then(([nextBlocks, nextAppointments, users]) => { setBlocks(nextBlocks); setAppointments(nextAppointments); setNames(new Map(users.map((item) => [item.id, item.name]))); })
      .catch(() => setError('Unable to load blocked times.'))
      .finally(() => setLoading(false));
  }, [date]);
  useFocusEffect(load);

  const salonDate = (value: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(new Date(value));
  const salonMinutes = (value: string) => { const parts = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Vancouver' }).formatToParts(new Date(value)); return Number(parts.find((item) => item.type === 'hour')?.value ?? 0) * 60 + Number(parts.find((item) => item.type === 'minute')?.value ?? 0); };
  const selected = blocks.filter((item) => salonDate(item.startAt) <= date && (salonDate(item.endAt) > date || (salonDate(item.endAt) === date && salonMinutes(item.endAt) > 0)));
  const selectedAppointments = appointments.filter((item) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(new Date(item.startAt)) === date && !['CANCELLED', 'REJECTED'].includes(item.status)).sort((a, b) => a.startAt.localeCompare(b.startAt));

  async function createBlock() {
    setSaving(true); setError(null);
    try {
      const created = await api<AvailabilityBlock>('/api/v1/admin/availability-blocks', {
        method: 'POST',
        body: JSON.stringify({ date, endDate: fullDay ? endDate : date, fullDay, startTime: fullDay ? null : startTime, endTime: fullDay ? null : endTime, reason: reason.trim() || null }),
      });
      setBlocks((current) => [...current, created]);
      setShowCreate(false); setReason(''); setFullDay(false); setEndDate(date);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to block this time.'); }
    finally { setSaving(false); }
  }

  async function removeBlock(id: string) {
    try { await api(`/api/v1/admin/availability-blocks/${id}`, { method: 'DELETE' }); setBlocks((current) => current.filter((item) => item.id !== id)); }
    catch { setError('Unable to remove this block.'); }
  }

  return <Screen>
    <ScreenHeader />
    <EyebrowTitle eyebrow="studio availability" title="Block time" trailing={<Doodle kind="swirl" size={22} color={colors.coral} />} />
    <View style={styles.row}><HandRect padding={14} radius={radius.lg}><View style={styles.dateNav}>
      <Pressable onPress={() => setDate(addDays(date, -1))}><Icons.ChevL color={colors.ink} /></Pressable>
      <View><Text style={styles.date}>{dateLabel(date)}</Text><Text style={styles.dateKey}>{date}</Text></View>
      <Pressable onPress={() => setDate(addDays(date, 1))}><Icons.Chev color={colors.ink} /></Pressable>
    </View><View style={styles.picker}><DateTimePicker value={new Date(`${date}T12:00:00`)} mode="date" display="compact" onChange={(_, value) => value && setDate(keyOf(value))} /></View></HandRect></View>
    <View style={styles.row}><View style={styles.actionRow}><HandButton color={colors.inkSoft} onPress={() => { setEndDate(date); setShowCreate(true); }}>Block time</HandButton><HandButton color={colors.pinkInk} onPress={() => router.push({ pathname: '/(admin)/create-appointment', params: { date } })}>+ Book client</HandButton></View></View>
    {error && <Text style={styles.error}>{error}</Text>}
    {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 30 }} /> : <View style={styles.list}>
      {selected.map((block) => { const range = salonMinutes(block.startAt) === 0 && salonMinutes(block.endAt) === 0; return <HandRect key={block.id} padding={14} radius={radius.lg} fill={colors.pinkSoft}><View style={styles.blockRow}><View style={{ flex: 1 }}><Text style={styles.blockTime}>{range ? `${salonDate(block.startAt)} through ${addDays(salonDate(block.endAt), -1)}` : `${timeLabel(block.startAt)} – ${timeLabel(block.endAt)}`}</Text><Text style={styles.blockReason}>{block.reason || 'Studio unavailable'}</Text></View><Pressable onPress={() => removeBlock(block.id)}><Icons.Trash color={colors.pinkInk} /></Pressable></View></HandRect>; })}
      {selected.length === 0 && <Text style={styles.empty}>No blocked time on this date.</Text>}
      <Text style={styles.sectionLabel}>{selectedAppointments.length} appointment{selectedAppointments.length === 1 ? '' : 's'}</Text>
      {selectedAppointments.map((item) => <HandRect key={item.id} padding={14} radius={radius.lg} fill={colors.blueSoft}><View style={styles.blockRow}><View style={{ flex: 1 }}><Text style={styles.blockTime}>{timeLabel(item.startAt)} – {timeLabel(item.endAt)}</Text><Text style={styles.blockReason}>{names.get(item.customerId) ?? 'Client'} · {item.serviceName}</Text></View><Text style={styles.status}>{item.status.toLowerCase().replaceAll('_', ' ')}</Text></View></HandRect>)}
      {selectedAppointments.length === 0 && <Text style={styles.empty}>No appointments on this date.</Text>}
    </View>}
    <Modal transparent visible={showCreate} animationType="fade" onRequestClose={() => setShowCreate(false)}><Pressable style={styles.backdrop} onPress={() => setShowCreate(false)}><Pressable style={styles.modal} onPress={() => undefined}><HandRect padding={22} radius={radius.xl}>
      <Text style={styles.modalTitle}>Block studio time</Text><View style={styles.switchRow}><Text style={styles.switchText}>Block full day(s)</Text><Switch value={fullDay} onValueChange={(value) => { setFullDay(value); setEndDate(date); }} trackColor={{ true: colors.pinkInk }} /></View>
      {fullDay ? <View style={styles.rangeBox}><Text style={styles.rangeLabel}>From {date}</Text><Text style={styles.rangeLabel}>Through (included)</Text><DateTimePicker value={new Date(`${endDate}T12:00:00`)} mode="date" display={Platform.OS === 'ios' ? 'compact' : 'default'} minimumDate={new Date(`${date}T12:00:00`)} onChange={(_, value) => value && setEndDate(keyOf(value))} /></View> : <View style={styles.timeRow}><Field containerStyle={{ flex: 1 }} placeholder="Start" value={startTime} onChangeText={setStartTime} /><Field containerStyle={{ flex: 1 }} placeholder="End" value={endTime} onChangeText={setEndTime} /></View>}
      <Field placeholder="Reason (optional)" value={reason} onChangeText={setReason} multiline /><View style={{ marginTop: 14 }}><HandButton full color={colors.pinkInk} disabled={saving} onPress={createBlock}>{saving ? 'Saving…' : 'Block time'}</HandButton></View>
    </HandRect></Pressable></Pressable></Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }, dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, picker: { marginTop: 8, alignItems: 'center' }, actionRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }, date: { fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink, textAlign: 'center' }, dateKey: { marginTop: 3, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, textAlign: 'center', letterSpacing: letterSpacing.meta }, list: { paddingHorizontal: spacing.lg, gap: 10 }, sectionLabel: { marginTop: 14, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, textTransform: 'uppercase' }, blockRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, blockTime: { fontFamily: fonts.display, fontSize: 14, color: colors.ink }, blockReason: { marginTop: 3, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }, status: { maxWidth: 90, fontFamily: fonts.mono, fontSize: 8, color: colors.blueInk, textTransform: 'uppercase', textAlign: 'right' }, error: { textAlign: 'center', color: '#c0554f', fontFamily: fonts.body }, empty: { textAlign: 'center', paddingVertical: 18, color: colors.inkSoft, fontFamily: fonts.body }, backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 }, modal: { width: '100%', maxWidth: 360, alignSelf: 'center' }, modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink }, switchRow: { marginVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, switchText: { fontFamily: fonts.body, color: colors.ink }, timeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 }, rangeBox: { marginBottom: 12, padding: 12, borderRadius: radius.lg, backgroundColor: colors.pinkSoft, gap: 6 }, rangeLabel: { fontFamily: fonts.body, color: colors.ink },
});
