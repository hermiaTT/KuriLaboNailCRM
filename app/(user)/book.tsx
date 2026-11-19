import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandButton,
  HandRect,
  Icons,
  Screen,
  ScreenHeader,
} from '../../components/ui';
import { colors, fonts, letterSpacing, radius, spacing, typeScale } from '../../constants/theme';
import { api, ApiError } from '../../lib/api';
import type { Appointment, Availability, ServiceDefinition } from '../../types/api';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function todayKey() {
  const now = new Date();
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function buildMonthWeeks(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDow).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function displayTime(value: string) {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function durationLabel(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hr` : `${minutes} min`;
}

export default function BookScreen() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [day, setDay] = useState(now.getDate());
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [referenceAssets, setReferenceAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = dateKey(viewYear, viewMonth, day);
  const weeks = useMemo(() => buildMonthWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = useMemo(
    () => new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [viewYear, viewMonth],
  );

  const loadServices = useCallback(() => {
    setLoadingServices(true);
    api<ServiceDefinition[]>('/api/v1/services')
      .then((items) => {
        const active = items.filter((item) => item.active);
        setServices(active);
        setServiceId((current) => current || active[0]?.id || '');
      })
      .catch(() => setError('Unable to load services.'))
      .finally(() => setLoadingServices(false));
  }, []);

  useFocusEffect(loadServices);

  useEffect(() => {
    if (!serviceId || selectedDate < todayKey()) return;
    setLoadingSlots(true);
    setSelectedTime('');
    setError(null);
    api<Availability>(`/api/v1/availability?date=${selectedDate}&serviceId=${serviceId}`)
      .then(setAvailability)
      .catch((cause) => {
        setAvailability(null);
        setError(cause instanceof ApiError ? cause.message : 'Unable to load available times.');
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, serviceId]);

  function changeMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (next < currentMonth) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setDay(next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth() ? now.getDate() : 1);
    setCreated(null);
  }

  async function pickReferences() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Photo library access is required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      orderedSelection: true,
      quality: 0.85,
      selectionLimit: 6,
    });
    if (!result.canceled) setReferenceAssets(result.assets.slice(0, 6));
  }

  async function submit() {
    if (!serviceId || !selectedTime) {
      setError('Choose a service and an available time.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await api<Appointment>('/api/v1/appointments', {
        method: 'POST',
        body: JSON.stringify({
          serviceId,
          date: selectedDate,
          startTime: selectedTime,
          note: note.trim() || null,
        }),
      });
      let completed = appointment;
      if (referenceAssets.length) {
        const body = new FormData();
        referenceAssets.forEach((asset, index) => body.append('files', {
          uri: asset.uri,
          name: asset.fileName || `reference-${index + 1}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        } as any));
        completed = await api<Appointment>(`/api/v1/appointments/${appointment.id}/references`, { method: 'POST', body });
      }
      setCreated(completed);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to request this appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedService = services.find((item) => item.id === serviceId);
  const selectedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  return (
    <Screen>
      <ScreenHeader />
      <EyebrowTitle
        eyebrow="book a visit"
        title="Pick your time"
        trailing={<Doodle kind="flower" size={22} color={colors.coral} />}
      />

      <View style={styles.row}>
        <Text style={styles.sectionLabel}>1 · Choose a service</Text>
        {loadingServices ? (
          <ActivityIndicator color={colors.pinkInk} />
        ) : (
          <View style={styles.serviceGrid}>
            {services.map((service) => {
              const active = service.id === serviceId;
              return (
                <Pressable key={service.id} style={styles.serviceCell} onPress={() => setServiceId(service.id)}>
                  <HandRect
                    padding={14}
                    radius={radius.lg}
                    fill={active ? colors.pinkSoft : colors.creamCard}
                    stroke={active ? colors.pinkInk : colors.ink}
                    strokeWidth={active ? 2 : 1}
                  >
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>{durationLabel(service.durationMinutes)} · ${Number(service.price).toFixed(2)}</Text>
                  </HandRect>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Text style={styles.sectionLabel}>2 · Pick a date</Text>
        <HandRect padding={14} radius={radius.lg}>
          <View style={styles.monthNav}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.navButton}>
              <Icons.ChevL color={colors.inkSoft} size={16} />
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.navButton}>
              <Icons.Chev color={colors.inkSoft} size={16} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {DOW.map((label, index) => <Text key={`${label}-${index}`} style={styles.dow}>{label}</Text>)}
          </View>
          {weeks.map((week, rowIndex) => (
            <View key={rowIndex} style={styles.weekRow}>
              {week.map((value, columnIndex) => {
                if (!value) return <View key={columnIndex} style={styles.dayCell} />;
                const key = dateKey(viewYear, viewMonth, value);
                const disabled = key < todayKey();
                const active = value === day;
                return (
                  <Pressable
                    key={columnIndex}
                    disabled={disabled}
                    onPress={() => { setDay(value); setCreated(null); }}
                    style={[styles.dayCell, active && styles.dayCellActive]}
                  >
                    <Text style={[styles.dayText, disabled && styles.dayTextDisabled, active && styles.dayTextActive]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </HandRect>
      </View>

      <View style={styles.row}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>3 · Select a start time</Text>
          <Text style={styles.selectedDate}>{selectedDateLabel}</Text>
        </View>
        <HandRect padding={16} radius={radius.lg}>
          {loadingSlots ? (
            <ActivityIndicator color={colors.pinkInk} />
          ) : (
            <View style={styles.slotGrid}>
              {(availability?.slots ?? []).map((slot) => {
                const active = slot.startTime === selectedTime;
                return (
                  <Pressable
                    key={slot.startTime}
                    disabled={!slot.available}
                    onPress={() => setSelectedTime(slot.startTime)}
                    style={[styles.slot, !slot.available && styles.slotDisabled, active && styles.slotActive]}
                  >
                    <Text style={[styles.slotText, !slot.available && styles.slotTextDisabled, active && styles.slotTextActive]}>
                      {displayTime(slot.startTime)}
                    </Text>
                  </Pressable>
                );
              })}
              {!loadingSlots && (availability?.slots.length ?? 0) === 0 && (
                <Text style={styles.emptyText}>No times available for this date.</Text>
              )}
            </View>
          )}
        </HandRect>
      </View>

      <View style={styles.row}>
        <Text style={styles.sectionLabel}>4 · Anything Kuri should know?</Text>
        <HandRect padding={14} radius={radius.lg}>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={1000}
            placeholder="Colors, shapes, inspiration or special requests…"
            placeholderTextColor={colors.inkFaint}
            style={styles.note}
          />
        </HandRect>
      </View>

      <View style={styles.row}>
        <Text style={styles.sectionLabel}>5 · Reference photos · optional</Text>
        <Pressable onPress={pickReferences}>
          <HandRect padding={15} radius={radius.lg} dashed>
            <Text style={styles.referencePicker}>{referenceAssets.length ? `${referenceAssets.length} selected · tap to change` : '＋ Choose up to 6 inspiration photos'}</Text>
          </HandRect>
        </Pressable>
        {referenceAssets.length > 0 && <View style={styles.referenceGrid}>{referenceAssets.map((asset) => <View key={asset.uri}><Image source={{ uri: asset.uri }} style={styles.referenceImage} /><Pressable style={styles.removeReference} onPress={() => setReferenceAssets((current) => current.filter((item) => item.uri !== asset.uri))}><Text style={styles.removeReferenceText}>×</Text></Pressable></View>)}</View>}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.row}>
        <HandButton color={selectedTime ? colors.pinkInk : colors.inkFaint} full size="lg" disabled={!selectedTime || submitting} onPress={submit}>
          {submitting ? 'Sending request…' : 'Request appointment →'}
        </HandButton>
        <Text style={styles.finePrint}>Pending requests hold the selected time until Kuri confirms.</Text>
      </View>

      <Modal transparent visible={Boolean(created)} animationType="fade" onRequestClose={() => setCreated(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCreated(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <HandRect padding={24} radius={radius.xl}>
              <View style={styles.modalContent}>
                <Doodle kind="heart" size={42} color={colors.pink} />
                <Text style={styles.modalTitle}>Your time is being held</Text>
                <Text style={styles.modalBody}>
                  {selectedService?.name}{'\n'}{selectedDateLabel} · {displayTime(selectedTime)}
                </Text>
                <HandButton color={colors.pinkInk} full onPress={() => { setCreated(null); setSelectedTime(''); setNote(''); setReferenceAssets([]); }}>
                  Done
                </HandButton>
              </View>
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase', marginBottom: 8 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCell: { width: '48%' },
  serviceName: { fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink },
  serviceDuration: { marginTop: 4, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, textTransform: 'uppercase' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  navButton: { padding: 8 },
  monthLabel: { fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink },
  weekRow: { flexDirection: 'row', marginTop: 4 },
  dow: { flex: 1, textAlign: 'center', fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },
  dayCell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  dayCellActive: { backgroundColor: colors.pinkInk },
  dayText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  dayTextActive: { color: colors.white, fontWeight: '700' },
  dayTextDisabled: { color: colors.inkFaint, opacity: 0.4 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedDate: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '31%', minHeight: 42, borderWidth: 1, borderColor: colors.ink, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamCard },
  slotActive: { backgroundColor: colors.pinkInk, borderColor: colors.pinkInk },
  slotDisabled: { backgroundColor: colors.creamHair, borderColor: colors.inkFaint, opacity: 0.45 },
  slotText: { fontFamily: fonts.body, fontSize: 12, color: colors.ink },
  slotTextActive: { color: colors.white, fontWeight: '700' },
  slotTextDisabled: { color: colors.inkFaint },
  emptyText: { width: '100%', textAlign: 'center', fontFamily: fonts.body, color: colors.inkSoft, paddingVertical: 16 },
  note: { minHeight: 90, fontFamily: fonts.body, color: colors.ink, fontSize: 14, textAlignVertical: 'top' },
  error: { paddingHorizontal: spacing.lg, textAlign: 'center', fontFamily: fonts.body, color: '#c0554f' },
  finePrint: { marginTop: 10, textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  referencePicker: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.pinkInk },
  referenceGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  referenceImage: { width: 72, height: 72, borderRadius: radius.md },
  removeReference: { position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  removeReferenceText: { color: colors.white, fontSize: 15, lineHeight: 18 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340 },
  modalContent: { alignItems: 'center', gap: 12 },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: 'center' },
  modalBody: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: colors.inkSoft, textAlign: 'center' },
});
