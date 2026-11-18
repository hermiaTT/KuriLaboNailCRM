import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
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
import { api, mediaUrl } from '../../lib/api';
import type { StatusKey } from '../../constants/theme';
import type { Appointment, NailSet, NailSetImage } from '../../types/api';

type Visit = Appointment & { images: NailSetImage[] };

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver',
  }).format(new Date(iso));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, []),
  );

  async function fetchAll() {
    setLoading(true);
    try {
      const [appointments, nailSets] = await Promise.all([
        api<Appointment[]>('/api/v1/appointments/me'),
        api<NailSet[]>('/api/v1/nail-sets/mine'),
      ]);
      const imagesByAppointment = new Map(
        nailSets.filter((item) => item.appointmentId).map((item) => [item.appointmentId!, item.images]),
      );
      setVisits(
        appointments
          .map((item) => ({ ...item, images: imagesByAppointment.get(item.id) ?? [] }))
          .sort((a, b) => b.startAt.localeCompare(a.startAt)),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        trailing={
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Icons.ChevL color={colors.ink}/>
            <Text style={styles.backText}>back</Text>
          </Pressable>
        }
      />
      <EyebrowTitle
        eyebrow="your visits"
        title="Appointments"
        trailing={<Doodle kind="swirl" size={20} color={colors.coral} style={{ transform: [{ rotate: '-10deg' }] }}/>}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      ) : (
        <View style={styles.list}>
          {visits.map((v) => {
            const hasImages = v.images.length > 0;
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
                  {hasImages && (
                    <Pressable style={styles.detailBtn} onPress={() => setActiveVisit(v)}>
                      <Text style={styles.detailText}>details</Text>
                      <Icons.Chev color={colors.pinkInk} size={14}/>
                    </Pressable>
                  )}
                </View>
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

          {visits.length === 0 && (
            <HandRect padding={28} radius={radius.lg} dashed style={{ alignItems: 'center', gap: 10 }}>
              <Doodle kind="sparkle" size={32} color={colors.blue}/>
              <Text style={styles.emptyTitle}>No visits yet</Text>
              <Text style={styles.emptyBody}>Book your first appointment in the Book tab.</Text>
            </HandRect>
          )}
        </View>
      )}

      <NailCardModal
        visible={!!activeVisit}
        onClose={() => setActiveVisit(null)}
        images={(activeVisit?.images ?? []).map((image) => ({ id: image.id, image_url: mediaUrl(image.url) }))}
      />
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
});
