import { t, getLocale, useLanguage } from '../../shared/i18n';
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  Field,
  HandButton,
  HandRect,
  Icons,
  NailCardModal,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '../../components/ui';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';
import { api, ApiError, mediaUrl } from '../../lib/api';
import type { StatusKey } from '../../constants/theme';
import type { Appointment, NailSet, NailSetImage, SalonContact } from '../../types/api';

type Visit = Appointment & { images: NailSetImage[] };

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver',
  }).format(new Date(iso));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(getLocale(), {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver',
  });
}

function timeTag(iso: string) {
  const start = new Date(iso).getTime();
  if (Math.abs(start - Date.now()) < 24 * 60 * 60 * 1000) return 'today';
  return start > Date.now() ? 'upcoming' : 'past';
}

function uiStatus(status: Appointment['status']): StatusKey {
  if (status === 'CONFIRMED') return 'confirmed';
  if (status === 'COMPLETED') return 'done';
  if (status === 'NO_SHOW') return 'no_show';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'cancelled';
  return 'pending';
}

/**
 * User's own appointment history. Not in the tab bar — reached from
 * Profile (the "Visits" stat tile links here).
 */
export default function AppointmentsScreen() {
  useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [unlinkedSets, setUnlinkedSets] = useState<NailSet[]>([]);
  const [activeSet, setActiveSet] = useState<NailSet | null>(null);
  const [contact, setContact] = useState<SalonContact | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Visit | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, []),
  );

  async function fetchAll() {
    setLoading(true);
    try {
      const [appointments, nailSets, salonContact] = await Promise.all([
        api<Appointment[]>('/api/v1/appointments/me'),
        api<NailSet[]>('/api/v1/nail-sets/mine'),
        api<SalonContact>('/api/v1/salon/contact'),
      ]);
      setContact(salonContact);
      setUnlinkedSets(nailSets.filter((item) => !item.appointmentId));
      const imagesByAppointment = new Map(
        nailSets.filter((item) => item.appointmentId).map((item) => [item.appointmentId!, item.images]),
      );
      setVisits(
        appointments
          .map((item) => ({ ...item, images: imagesByAppointment.get(item.id) ?? [] }))
          .sort((a, b) => b.startAt.localeCompare(a.startAt)),
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to load your appointments.");
    } finally {
      setLoading(false);
    }
  }

  async function requestCancellation() {
    if (!cancelTarget) return;
    setBusy(true); setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/appointments/${cancelTarget.id}/cancellation-requests`, { method: 'POST', body: JSON.stringify({ reason: cancelReason.trim() || null }) });
      setVisits((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setCancelTarget(null); setCancelReason('');
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Unable to send cancellation request."); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <ScreenHeader
        trailing={
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Icons.ChevL color={colors.ink}/>
            <Text style={styles.backText}>{t("back")}</Text>
          </Pressable>
        }
      />
      <EyebrowTitle
        eyebrow={t("your visits")}
        title={t("Appointments")}
        trailing={<Doodle kind="swirl" size={20} color={colors.coral} style={{ transform: [{ rotate: '-10deg' }] }}/>}
      />

      {error && <Text style={styles.error}>{t(error)}</Text>}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      ) : (
        <View style={styles.list}>
          {visits.map((v) => {
            const hasImages = v.images.length > 0;
            const canCancel = v.status === 'CONFIRMED' && new Date(v.startAt).getTime() > Date.now() + 24 * 60 * 60 * 1000;
            const contactOnly = v.status === 'CONFIRMED' && new Date(v.startAt).getTime() > Date.now() && !canCancel;
            return (
              <HandRect key={v.id} padding={16} radius={radius.lg}>
                <View style={styles.head}>
                  <View>
                    <Text style={styles.date}>{fmtDate(v.startAt)}</Text>
                    <Text style={styles.time}>
                      {fmtTime(v.startAt)} – {fmtTime(v.endAt)}
                    </Text>
                  </View>
                  <StatusBadge status={uiStatus(v.status)}/>
                </View>
                <View style={styles.divider}/>
                <View style={styles.foot}>
                  <Text style={styles.tag}>{timeTag(v.startAt)}</Text>
                  {canCancel ? <Pressable style={styles.detailBtn} onPress={() => setCancelTarget(v)}><Text style={styles.cancelText}>{t("request cancellation")}</Text></Pressable> : hasImages && (
                    <Pressable style={styles.detailBtn} onPress={() => setActiveVisit(v)}>
                      <Text style={styles.detailText}>{t("details")}</Text>
                      <Icons.Chev color={colors.pinkInk} size={14}/>
                    </Pressable>
                  )}
                </View>
                {v.status === 'CANCELLATION_REQUESTED' && <Text style={styles.hint}>{t("Cancellation requested — this time remains reserved until Kuri reviews it.")}</Text>}
                {contactOnly && <Text style={styles.hint}>{t("Within 24 hours — contact Kuri directly if you need help.")}</Text>}
                {v.status === 'COMPLETED' && hasImages && (
                  <View style={styles.doneInfo}>
                    <Pressable style={styles.thumbRow} onPress={() => setActiveVisit(v)}>
                      {v.images.slice(0, 4).map((img) => (
                        <Image key={img.id} source={{ uri: mediaUrl(img.url) }} style={styles.thumb} />
                      ))}
                    </Pressable>
                  </View>
                )}
              </HandRect>
            );
          })}

          {unlinkedSets.map((set) => (
            <Pressable key={set.id} onPress={() => setActiveSet(set)}>
              <HandRect padding={16} radius={radius.lg}>
                <View style={styles.head}>
                  <View>
                    <Text style={styles.date}>{set.title}</Text>
                    <Text style={styles.time}>{t("nail history · no appointment date")}</Text>
                  </View>
                  <Icons.Photos color={colors.pinkInk} />
                </View>
                {set.description && <Text style={styles.hint}>{set.description}</Text>}
                <Text style={styles.setLink}>{t("View")}{set.images.length} {t("photo")}{getLocale() === 'en-US' && set.images.length !== 1 ? 's' : ''} →</Text>
              </HandRect>
            </Pressable>
          ))}

          {visits.length === 0 && unlinkedSets.length === 0 && (
            <HandRect padding={28} radius={radius.lg} dashed style={{ alignItems: 'center', gap: 10 }}>
              <Doodle kind="sparkle" size={32} color={colors.blue}/>
              <Text style={styles.emptyTitle}>{t("No visits yet")}</Text>
              <Text style={styles.emptyBody}>{t("Book your first appointment in the Book tab.")}</Text>
            </HandRect>
          )}
        </View>
      )}

      <View style={styles.contactWrap}><HandRect padding={18} radius={radius.lg} fill={colors.blueSoft} stroke={colors.blueInk}><Text style={styles.contactEyebrow}>{t("need help?")}</Text><Text style={styles.contactTitle}>{t("Contact the nail artist")}</Text><Text style={styles.contactBody}>{contact?.contactMessage || t("For special requests or help within 24 hours, contact Kuri directly.")}</Text>{contact?.wechatId && <Text selectable style={styles.wechat}>{t("WeChat ·")}{contact.wechatId}</Text>}</HandRect></View>

      <NailCardModal
        visible={!!activeVisit || !!activeSet}
        onClose={() => { setActiveVisit(null); setActiveSet(null); }}
        images={(activeVisit?.images ?? activeSet?.images ?? []).map((image) => ({ id: image.id, image_url: mediaUrl(image.url) }))}
      />

      <Modal transparent visible={Boolean(cancelTarget)} animationType="fade" onRequestClose={() => setCancelTarget(null)}><Pressable style={styles.backdrop} onPress={() => setCancelTarget(null)}><Pressable style={styles.modal} onPress={() => undefined}><HandRect padding={20} radius={radius.xl}><Text style={styles.modalTitle}>{t("Request cancellation")}</Text><Text style={styles.modalBody}>{t("Kuri will review the request. Your appointment remains reserved until it is approved.")}</Text><Field containerStyle={{ marginVertical: 14 }} placeholder={t("Reason (optional)")} multiline value={cancelReason} onChangeText={setCancelReason} /><HandButton full color={colors.pinkInk} disabled={busy} onPress={requestCancellation}>{busy ? t("Sending…") : t("Send request")}</HandButton></HandRect></Pressable></Pressable></Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 8 },
  backText: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.ink,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  list: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  date: {
    fontFamily: fonts.display,
    fontSize: typeScale.section,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  time: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.creamHair,
    marginVertical: 12,
    borderStyle: 'dashed',
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.pinkInk,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },
  doneInfo: { marginTop: 10, gap: 6 },
  priceText: {
    fontFamily: fonts.display, fontSize: 15, color: colors.ink, letterSpacing: letterSpacing.display,
  },
  noteText: {
    fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17,
  },
  thumbRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  error: { paddingHorizontal: spacing.lg, paddingBottom: 8, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: '#c0554f' },
  cancelText: { fontFamily: fonts.mono, fontSize: 8, color: colors.pinkInk, textTransform: 'uppercase' },
  hint: { marginTop: 10, fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.inkSoft },
  setLink: { marginTop: 10, fontFamily: fonts.mono, fontSize: 9, color: colors.pinkInk, textTransform: 'uppercase' },
  contactWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  contactEyebrow: { fontFamily: fonts.mono, fontSize: 9, color: colors.blueInk, textTransform: 'uppercase' },
  contactTitle: { marginTop: 5, fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  contactBody: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  wechat: { marginTop: 10, fontFamily: fonts.mono, fontSize: 11, color: colors.blueInk },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  modalBody: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
});
