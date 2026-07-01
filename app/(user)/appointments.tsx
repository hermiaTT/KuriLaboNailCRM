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
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type VisitImage = { id: string; image_url: string; display_order: number };

type Visit = {
  id: string;
  status: string;
  price: number | null;
  note: string | null;
  slot: { date: string; start_time: string; end_time: string } | null;
  images: VisitImage[];
};

function fmtTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function timeTag(dateStr: string, todayStr: string) {
  if (dateStr === todayStr) return 'today';
  return dateStr > todayStr ? 'upcoming' : 'past';
}

/**
 * User's own appointment history. Not in the tab bar — reached from
 * Profile (the "Visits" stat tile links here).
 */
export default function AppointmentsScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user.id) return;
      fetchAll(session.user.id);
    }, [session?.user.id]),
  );

  async function fetchAll(userId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, status, price, note, slot:available_slots!appointments_slot_id_fkey(date, start_time, end_time)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) console.error('[UserAppointments] fetchAll error:', error);

    const rows = (data ?? []).map((a: any) => ({
      ...a,
      slot: Array.isArray(a.slot) ? a.slot[0] ?? null : a.slot,
      images: [] as VisitImage[],
    })) as Visit[];

    const doneIds = rows.filter((v) => v.status === 'done').map((v) => v.id);
    if (doneIds.length > 0) {
      const { data: imgs } = await supabase
        .from('appointment_images')
        .select('id, appointment_id, image_url, display_order')
        .in('appointment_id', doneIds)
        .order('display_order', { ascending: true });

      const byAppt: Record<string, VisitImage[]> = {};
      for (const img of imgs ?? []) {
        byAppt[img.appointment_id] = byAppt[img.appointment_id] || [];
        byAppt[img.appointment_id].push(img);
      }
      for (const v of rows) v.images = byAppt[v.id] ?? [];
    }

    setVisits(rows);
    setLoading(false);
  }

  const todayStr = new Date().toISOString().split('T')[0];

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
                    <Text style={styles.date}>{v.slot ? fmtDate(v.slot.date) : '—'}</Text>
                    <Text style={styles.time}>
                      {v.slot ? `${fmtTime(v.slot.start_time)} – ${fmtTime(v.slot.end_time)}` : ''}
                    </Text>
                  </View>
                  <StatusBadge status={v.status as any}/>
                </View>
                <View style={styles.divider}/>
                <View style={styles.foot}>
                  <Text style={styles.tag}>{v.slot ? timeTag(v.slot.date, todayStr) : ''}</Text>
                  {hasImages && (
                    <Pressable style={styles.detailBtn} onPress={() => setActiveVisit(v)}>
                      <Text style={styles.detailText}>details</Text>
                      <Icons.Chev color={colors.pinkInk} size={14}/>
                    </Pressable>
                  )}
                </View>
                {v.status === 'done' && (
                  <View style={styles.doneInfo}>
                    {v.price != null && <Text style={styles.priceText}>${v.price}</Text>}
                    {v.note && <Text style={styles.noteText}>{v.note}</Text>}
                    {hasImages && (
                      <Pressable style={styles.thumbRow} onPress={() => setActiveVisit(v)}>
                        {v.images.slice(0, 4).map((img) => (
                          <Image key={img.id} source={{ uri: img.image_url }} style={styles.thumb} />
                        ))}
                      </Pressable>
                    )}
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
        images={activeVisit?.images ?? []}
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
