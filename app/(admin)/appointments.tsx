import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Doodle, EyebrowTitle, Field, HandButton, HandChip, HandRect, Screen, ScreenHeader, StatusBadge } from '../../components/ui';
import { colors, fonts, letterSpacing, radius, spacing, typeScale, type StatusKey } from '../../constants/theme';
import { api, ApiError } from '../../lib/api';
import type { AdminAppointment, AdminUser, Appointment } from '../../types/api';

type Filter = 'ALL' | Appointment['status'];

function uiStatus(status: Appointment['status']): StatusKey {
  if (status === 'CONFIRMED') return 'confirmed';
  if (status === 'COMPLETED') return 'done';
  if (status === 'NO_SHOW') return 'no_show';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'cancelled';
  return 'pending';
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(iso));
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' }).format(new Date(iso));
}

export default function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api<AdminAppointment[]>('/api/v1/admin/appointments'),
      api<AdminUser[]>('/api/v1/admin/users'),
    ])
      .then(([items, users]) => {
        setAppointments(items.sort((a, b) => b.startAt.localeCompare(a.startAt)));
        setClients(users);
      })
      .catch(() => setError('Unable to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);
  const names = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const visible = filter === 'ALL' ? appointments : appointments.filter((item) => item.status === filter);

  async function action(item: AdminAppointment, endpoint: string, reason: string) {
    setBusy(item.id);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/admin/appointments/${item.id}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setAppointments((current) => current.map((row) => row.id === updated.id ? { ...row, ...updated } : row));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to update this appointment.');
    } finally {
      setBusy(null);
    }
  }

  function openDetails(item: AdminAppointment) {
    setSelected(item);
    setPrice(item.finalPrice == null ? '' : String(item.finalPrice));
    setNotes(item.serviceNotes ?? '');
  }

  async function saveDetails() {
    if (!selected) return;
    setBusy(selected.id);
    try {
      const updated = await api<AdminAppointment>(`/api/v1/admin/appointments/${selected.id}/visit-details`, {
        method: 'PUT',
        body: JSON.stringify({ finalPrice: price.trim() ? Number(price) : null, serviceNotes: notes.trim() || null }),
      });
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save visit details.');
    } finally {
      setBusy(null);
    }
  }

  const filters: Filter[] = ['ALL', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLATION_REQUESTED', 'COMPLETED'];

  return (
    <Screen>
      <ScreenHeader trailing={<Text style={styles.headerMeta}>{appointments.length} visits</Text>} />
      <EyebrowTitle eyebrow="booking desk" title="Appointments" trailing={<Doodle kind="sparkle" size={20} color={colors.blue} />} />
      <View style={styles.filters}>
        {filters.map((value) => <HandChip key={value} active={filter === value} onPress={() => setFilter(value)}>{value === 'ALL' ? 'all' : value.toLowerCase().replaceAll('_', ' ')}</HandChip>)}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} /> : (
        <View style={styles.list}>
          {visible.map((item) => (
            <HandRect key={item.id} padding={15} radius={radius.lg}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.client}>{names.get(item.customerId) ?? 'Client'}</Text>
                  <Text style={styles.when}>{dateLabel(item.startAt)} · {timeLabel(item.startAt)}–{timeLabel(item.endAt)}</Text>
                  <Text style={styles.service}>{item.serviceName} · {item.durationMinutes} min</Text>
                </View>
                <StatusBadge status={uiStatus(item.status)} />
              </View>
              {item.note && <Text style={styles.note}>“{item.note}”</Text>}
              <View style={styles.actions}>
                <Pressable onPress={() => openDetails(item)}><Text style={styles.actionText}>visit details</Text></Pressable>
                {item.status === 'PENDING_CONFIRMATION' && <>
                  <HandButton size="sm" color={colors.inkFaint} disabled={busy === item.id} onPress={() => action(item, 'reject', 'Rejected from iOS')}>Reject</HandButton>
                  <HandButton size="sm" color={colors.pinkInk} disabled={busy === item.id} onPress={() => action(item, 'confirm', 'Confirmed from iOS')}>Confirm</HandButton>
                </>}
                {item.status === 'CANCELLATION_REQUESTED' && <>
                  <HandButton size="sm" color={colors.inkFaint} disabled={busy === item.id} onPress={() => action(item, 'cancellation-requests/reject', 'Cancellation declined')}>Keep</HandButton>
                  <HandButton size="sm" color={colors.pinkInk} disabled={busy === item.id} onPress={() => action(item, 'cancellation-requests/approve', 'Cancellation approved')}>Cancel</HandButton>
                </>}
                {item.status === 'CONFIRMED' && new Date(item.startAt).getTime() <= Date.now() && <>
                  <HandButton size="sm" color={colors.inkFaint} disabled={busy === item.id} onPress={() => action(item, 'no-show', 'Marked no-show from iOS')}>No show</HandButton>
                  <HandButton size="sm" color={colors.blueInk} disabled={busy === item.id || new Date(item.endAt).getTime() > Date.now()} onPress={() => action(item, 'complete', 'Completed from iOS')}>Complete</HandButton>
                </>}
              </View>
            </HandRect>
          ))}
          {visible.length === 0 && <Text style={styles.empty}>No appointments in this view.</Text>}
        </View>
      )}

      <Modal transparent visible={Boolean(selected)} animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <HandRect padding={22} radius={radius.xl}>
              <Text style={styles.modalTitle}>Visit details</Text>
              <Text style={styles.modalText}>Private pricing and notes are visible only to admins.</Text>
              <View style={{ gap: 10, marginVertical: 16 }}>
                <Field placeholder="Final price (CAD)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
                <Field placeholder="Internal service notes" multiline value={notes} onChangeText={setNotes} />
              </View>
              <HandButton color={colors.pinkInk} full disabled={busy === selected?.id} onPress={saveDetails}>Save details</HandButton>
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerMeta: { fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.inkSoft, textTransform: 'uppercase' },
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
  head: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  client: { fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink },
  when: { marginTop: 3, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, letterSpacing: letterSpacing.meta },
  service: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  note: { marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  actions: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.creamHair, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  actionText: { fontFamily: fonts.mono, fontSize: 9, color: colors.pinkInk, textTransform: 'uppercase' },
  error: { paddingHorizontal: spacing.lg, textAlign: 'center', fontFamily: fonts.body, color: '#c0554f' },
  empty: { textAlign: 'center', paddingVertical: 30, fontFamily: fonts.body, color: colors.inkSoft },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  modalText: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
