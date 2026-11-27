import { weekDayLabels, statusLabel, t, getLocale, useLanguage } from '../../shared/i18n';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Doodle, EyebrowTitle, Field, HandButton, HandChip, HandRect, Icons, NailCardModal, Screen, ScreenHeader, StatusBadge } from '../../components/ui';
import { colors, fonts, letterSpacing, radius, spacing, typeScale, type StatusKey } from '../../constants/theme';
import { api, ApiError, mediaUrl } from '../../lib/api';
import type { AdminAppointment, AdminUser, Appointment, ServiceDefinition } from '../../types/api';

type Filter = 'ALL' | Appointment['status'];
type ViewMode = 'LIST' | 'CALENDAR';

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function salonDateKey(iso = new Date().toISOString()) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Vancouver' }).format(new Date(iso));
}

function monthCells(dateKey: string) {
  const focus = new Date(`${dateKey}T12:00:00`);
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1, 12);
  first.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return { key: localDateKey(date), day: date.getDate(), inMonth: date.getMonth() === focus.getMonth() };
  });
}

function uiStatus(status: Appointment['status']): StatusKey {
  if (status === 'CONFIRMED') return 'confirmed';
  if (status === 'COMPLETED') return 'done';
  if (status === 'NO_SHOW') return 'no_show';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'cancelled';
  return 'pending';
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(iso));
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' }).format(new Date(iso));
}

function dateParts(iso: string) {
  const date = new Date(iso);
  return {
    day: new Intl.DateTimeFormat(getLocale(), { day: 'numeric', timeZone: 'America/Vancouver' }).format(date),
    month: new Intl.DateTimeFormat(getLocale(), { month: 'short', timeZone: 'America/Vancouver' }).format(date).toUpperCase(),
  };
}

export default function AdminAppointmentsScreen() {
  useLanguage();
  const router = useRouter();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [calendarDate, setCalendarDate] = useState(salonDateKey());
  const [selectedDate, setSelectedDate] = useState(salonDateKey());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceAppointment, setReferenceAppointment] = useState<AdminAppointment | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api<AdminAppointment[]>('/api/v1/admin/appointments'),
      api<AdminUser[]>('/api/v1/admin/users'),
      api<ServiceDefinition[]>('/api/v1/admin/services'),
    ])
      .then(([items, users, serviceItems]) => {
        setAppointments(items.sort((a, b) => b.startAt.localeCompare(a.startAt)));
        setClients(users);
        setServices(serviceItems);
      })
      .catch(() => setError("Unable to load appointments."))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);
  const names = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const visible = filter === 'ALL' ? appointments : appointments.filter((item) => item.status === filter);
  const calendarItems = useMemo(() => {
    const grouped = new Map<string, AdminAppointment[]>();
    visible.forEach((item) => {
      const key = salonDateKey(item.startAt);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    grouped.forEach((items) => items.sort((a, b) => a.startAt.localeCompare(b.startAt)));
    return grouped;
  }, [visible]);
  const days = useMemo(() => monthCells(calendarDate), [calendarDate]);
  const selectedDayItems = calendarItems.get(selectedDate) ?? [];

  function moveMonth(amount: number) {
    const next = new Date(`${calendarDate}T12:00:00`);
    next.setMonth(next.getMonth() + amount, 1);
    const key = localDateKey(next);
    setCalendarDate(key);
    setSelectedDate(key);
  }

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
      setError(cause instanceof ApiError ? cause.message : "Unable to update this appointment.");
    } finally {
      setBusy(null);
    }
  }

  function openDetails(item: AdminAppointment) {
    setSelected(item);
    const servicePrice = services.find((service) => service.id === item.serviceId)?.price;
    const appointmentPrice = item.status === 'COMPLETED' ? item.finalPrice : item.estimatedPrice;
    setPrice(appointmentPrice == null ? servicePrice == null ? '' : Number(servicePrice).toFixed(2) : Number(appointmentPrice).toFixed(2));
    setNotes(item.serviceNotes ?? '');
  }

  async function saveDetails() {
    if (!selected) return;
    setBusy(selected.id);
    try {
      const updated = await api<AdminAppointment>(`/api/v1/admin/appointments/${selected.id}/visit-details`, {
        method: 'PUT',
        body: JSON.stringify({
          estimatedPrice: selected.status === 'COMPLETED' ? selected.estimatedPrice : price.trim() ? Number(price) : null,
          finalPrice: selected.status === 'COMPLETED' && price.trim() ? Number(price) : null,
          serviceNotes: notes.trim() || null,
        }),
      });
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to save visit details.");
    } finally {
      setBusy(null);
    }
  }

  const filters: Filter[] = ['ALL', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLATION_REQUESTED', 'COMPLETED'];

  function appointmentCard(item: AdminAppointment, showDate = true) {
    return <HandRect key={item.id} padding={15} radius={radius.lg}>
      <View style={styles.cardContent}>
        <View style={styles.cardCopy}>
          <View style={styles.head}>
            {showDate && <View style={styles.dateBlock}><Text style={styles.dateDay}>{dateParts(item.startAt).day}</Text><Text style={styles.dateMonth}>{dateParts(item.startAt).month}</Text></View>}
            <View style={styles.timeBlock}><Text style={styles.timeText}>{timeLabel(item.startAt)}</Text><Text style={styles.durationText}>{item.durationMinutes} {t("min")}</Text></View>
            <View style={styles.main}>
              <Text style={styles.client}>{item.customerName ?? names.get(item.customerId) ?? t("Client")}</Text>
              <StatusBadge status={uiStatus(item.status)} />
              <Text style={styles.when}>{dateLabel(item.startAt)} {t("· ends")}{timeLabel(item.endAt)}</Text>
              <Text style={styles.service}>{item.serviceName}</Text>
            </View>
          </View>
          {item.note && <Text style={styles.note}>{t("Client note ·")}{item.note}</Text>}
          {item.serviceNotes && <Text style={styles.adminNote}>{t("Admin note ·")}{item.serviceNotes}</Text>}
        </View>
        {item.referenceImages.length > 0 && <Pressable style={styles.referenceColumn} onPress={() => setReferenceAppointment(item)}>{item.referenceImages.map((image) => <Image key={image.id} source={{ uri: mediaUrl(image.url) }} style={styles.referenceImage} />)}</Pressable>}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => openDetails(item)}><Text style={styles.actionText}>{t("visit details")}</Text></Pressable>
        {item.status === 'PENDING_CONFIRMATION' && <><HandButton size="sm" color={colors.inkFaint} disabled={busy === item.id} onPress={() => action(item, 'reject', 'Rejected from iOS')}>{t("Reject")}</HandButton><HandButton size="sm" color={colors.pinkInk} disabled={busy === item.id} onPress={() => action(item, 'confirm', 'Confirmed from iOS')}>{t("Confirm")}</HandButton></>}
        {item.status === 'CANCELLATION_REQUESTED' && <><HandButton size="sm" color={colors.inkFaint} disabled={busy === item.id} onPress={() => action(item, 'cancellation-requests/reject', 'Cancellation declined')}>{t("Keep")}</HandButton><HandButton size="sm" color={colors.pinkInk} disabled={busy === item.id} onPress={() => action(item, 'cancellation-requests/approve', 'Cancellation approved')}>{t("Cancel")}</HandButton></>}
        {item.status === 'CONFIRMED' && new Date(item.startAt).getTime() <= Date.now() && <><HandButton size="sm" color={colors.inkFaint} disabled={busy === item.id} onPress={() => action(item, 'no-show', 'Marked no-show from iOS')}>{t("No show")}</HandButton><HandButton size="sm" color={colors.blueInk} disabled={busy === item.id || new Date(item.endAt).getTime() > Date.now()} onPress={() => action(item, 'complete', 'Completed from iOS')}>{t("Complete")}</HandButton></>}
      </View>
    </HandRect>;
  }

  return (
    <Screen>
      <ScreenHeader />
      <EyebrowTitle eyebrow={t("booking desk")} title={t("Appointments")} trailing={<Doodle kind="sparkle" size={20} color={colors.blue} />} />
      <View style={styles.viewSwitch}><HandButton size="sm" color={viewMode === 'CALENDAR' ? colors.blueInk : colors.pinkInk} onPress={() => setViewMode((current) => current === 'LIST' ? 'CALENDAR' : 'LIST')}>{viewMode === 'LIST' ? t("Switch to calendar view") : t("Switch to list view")}</HandButton></View>
      <View style={styles.filters}>
        {filters.map((value) => <HandChip key={value} active={filter === value} onPress={() => setFilter(value)}>{statusLabel(value)}</HandChip>)}
      </View>
      {error && <Text style={styles.error}>{t(error)}</Text>}
      {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} /> : viewMode === 'LIST' ? <View style={styles.list}>{visible.map((item) => appointmentCard(item))}{visible.length === 0 && <Text style={styles.empty}>{t("No appointments in this view.")}</Text>}</View> : <View style={styles.calendarSection}>
        <HandRect padding={0} radius={radius.xl}>
          <View style={styles.calendarHead}><Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Icons.ChevL color={colors.ink} /></Pressable><View><Text style={styles.monthTitle}>{new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(new Date(`${calendarDate}T12:00:00`))}</Text><Text style={styles.monthMeta}>{t("tap a day to view its schedule")}</Text></View><Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Icons.Chev color={colors.ink} /></Pressable></View>
          <View style={styles.weekdays}>{weekDayLabels().map((day, index) => <Text style={styles.weekday} key={`${day}-${index}`}>{day}</Text>)}</View>
          <View style={styles.calendarGrid}>{days.map((day) => { const items = calendarItems.get(day.key) ?? []; const isSelected = day.key === selectedDate; const isToday = day.key === salonDateKey(); return <Pressable key={day.key} onPress={() => setSelectedDate(day.key)} style={styles.calendarCell}><View style={[styles.calendarNumber, isSelected && styles.calendarNumberSelected, isToday && !isSelected && styles.calendarNumberToday]}><Text style={[styles.calendarNumberText, !day.inMonth && styles.calendarNumberOutside, isSelected && styles.calendarNumberTextSelected]}>{day.day}</Text></View><View style={styles.eventDots}>{items.slice(0, 3).map((item) => <View key={item.id} style={[styles.eventDot, item.status === 'PENDING_CONFIRMATION' && styles.eventPending, item.status === 'COMPLETED' && styles.eventCompleted, item.status === 'CANCELLATION_REQUESTED' && styles.eventCancel]} />)}</View></Pressable>; })}</View>
        </HandRect>
        <View style={styles.agendaHead}><View><Text style={styles.agendaEyebrow}>{t("DAY SCHEDULE")}</Text><Text style={styles.agendaTitle}>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(getLocale(), { weekday: 'long', month: 'long', day: 'numeric' })}</Text></View><Text style={styles.agendaCount}>{selectedDayItems.length} {t("APPT")}</Text></View>
        <View style={styles.agendaList}>{selectedDayItems.map((item) => appointmentCard(item, false))}{selectedDayItems.length === 0 && <Text style={styles.empty}>{t("A clear day — no appointments.")}</Text>}</View>
      </View>}

      <Modal transparent visible={Boolean(selected)} animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <HandRect padding={22} radius={radius.xl}>
              <Text style={styles.modalTitle}>{t("Visit details")}</Text>
              <Text style={styles.modalText}>{t("Private pricing and notes are visible only to admins.")}</Text>
              <View style={{ gap: 10, marginVertical: 16 }}>
                <Field placeholder={selected?.status === 'COMPLETED' ? t("Final price (CAD)") : t("Estimated price (CAD)")} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
                <Field placeholder={t("Internal service notes")} multiline value={notes} onChangeText={setNotes} />
              </View>
              <HandButton color={colors.pinkInk} full disabled={busy === selected?.id} onPress={saveDetails}>{t("Save details")}</HandButton>
              {(selected?.status === 'PENDING_CONFIRMATION' || selected?.status === 'CONFIRMED') && <HandButton color={colors.blueInk} full onPress={() => router.push({ pathname: '/(admin)/upload', params: { appointmentId: selected.id, clientId: selected.customerId, mode: 'reference' } })}>{t("Upload reference photos")}</HandButton>}
              {selected?.status === 'COMPLETED' && <HandButton color={colors.blueInk} full onPress={() => router.push({ pathname: '/(admin)/upload', params: { appointmentId: selected.id, clientId: selected.customerId, mode: 'nail-set' } })}>{t("Upload nail work")}</HandButton>}
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>
      <NailCardModal visible={Boolean(referenceAppointment)} onClose={() => setReferenceAppointment(null)} images={(referenceAppointment?.referenceImages ?? []).map((image) => ({ id: image.id, image_url: mediaUrl(image.url) }))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerMeta: { fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.inkSoft, textTransform: 'uppercase' },
  viewSwitch: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, alignItems: 'flex-end' },
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardCopy: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  main: { flex: 1, minWidth: 0 },
  dateBlock: { width: 46, height: 56, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.blueInk, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontFamily: fonts.display, fontSize: 21, lineHeight: 23, color: colors.ink },
  dateMonth: { marginTop: 3, fontFamily: fonts.mono, fontSize: 7, color: colors.inkSoft },
  timeBlock: { width: 67, height: 56, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.pinkInk, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  timeText: { fontFamily: fonts.display, fontSize: 11, color: colors.ink, textAlign: 'center' },
  durationText: { marginTop: 4, fontFamily: fonts.mono, fontSize: 7, color: colors.pinkInk, textTransform: 'uppercase' },
  client: { fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink },
  when: { marginTop: 3, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, letterSpacing: letterSpacing.meta },
  service: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  note: { marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  adminNote: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, color: colors.blueInk },
  referenceColumn: { width: 77, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  referenceImage: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.creamHair },
  actions: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.creamHair, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  actionText: { fontFamily: fonts.mono, fontSize: 9, color: colors.pinkInk, textTransform: 'uppercase' },
  error: { paddingHorizontal: spacing.lg, textAlign: 'center', fontFamily: fonts.body, color: '#c0554f' },
  empty: { textAlign: 'center', paddingVertical: 30, fontFamily: fonts.body, color: colors.inkSoft },
  calendarSection: { paddingHorizontal: spacing.lg, gap: 18 },
  agendaList: { gap: 10 },
  calendarHead: { minHeight: 72, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.creamHair },
  monthButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.pinkSoft },
  monthTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, textAlign: 'center' },
  monthMeta: { marginTop: 3, fontFamily: fonts.mono, fontSize: 7, color: colors.inkFaint, letterSpacing: letterSpacing.meta, textTransform: 'uppercase', textAlign: 'center' },
  weekdays: { flexDirection: 'row', paddingTop: 11 },
  weekday: { width: '14.2857%', fontFamily: fonts.mono, fontSize: 8, color: colors.inkFaint, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8 },
  calendarCell: { width: '14.2857%', height: 49, alignItems: 'center' },
  calendarNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  calendarNumberSelected: { backgroundColor: colors.pinkInk },
  calendarNumberToday: { borderWidth: 1.5, borderColor: colors.pinkInk },
  calendarNumberText: { fontFamily: fonts.body, fontSize: 12, color: colors.ink },
  calendarNumberOutside: { color: colors.inkFaint, opacity: 0.45 },
  calendarNumberTextSelected: { color: colors.white, fontWeight: '700' },
  eventDots: { minHeight: 7, marginTop: 3, flexDirection: 'row', gap: 2 },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.blueInk },
  eventPending: { backgroundColor: '#c59835' },
  eventCompleted: { backgroundColor: '#73a07b' },
  eventCancel: { backgroundColor: colors.pinkInk },
  agendaHead: { paddingHorizontal: 3, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  agendaEyebrow: { fontFamily: fonts.mono, fontSize: 8, color: colors.inkSoft, letterSpacing: letterSpacing.metaWide },
  agendaTitle: { marginTop: 4, fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  agendaCount: { fontFamily: fonts.mono, fontSize: 8, color: colors.pinkInk, letterSpacing: letterSpacing.meta },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  modalText: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
