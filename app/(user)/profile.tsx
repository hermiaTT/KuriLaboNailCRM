import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandRect,
  Icons,
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

// ─── Types ───────────────────────────────────────────────────────────────────

type FullProfile = {
  name: string;
  phone: string | null;
  birthday: string | null;
  instagram: string | null;
  preferred_nail_style: string | null;
  allergy_notes: string | null;
  created_at: string;
};

type NextAppt = {
  id: string;
  status: string;
  slot: { date: string; start_time: string; end_time: string } | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function memberSince(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toLowerCase();
}

function fmtBirthday(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function fmtTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function fmtSlotDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase(),
    day: String(d.getDate()),
  };
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { session, profile: authProfile, signOut } = useAuth();

  const [data, setData] = useState<FullProfile | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [nextAppt, setNextAppt] = useState<NextAppt | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!authProfile?.id) return;
      fetchAll(authProfile.id);
    }, [authProfile?.id]),
  );

  async function fetchAll(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [profileRes, visitsRes, savedRes, apptRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, phone, birthday, instagram, preferred_nail_style, allergy_notes, created_at')
          .eq('id', userId)
          .single(),

        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['confirmed', 'done']),

        supabase
          .from('nail_collection_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),

        supabase
          .from('appointments')
          .select('id, status, slot:available_slots!appointments_slot_id_fkey(date, start_time, end_time)')
          .eq('user_id', userId)
          .in('status', ['pending', 'confirmed'])
          .order('created_at', { ascending: true })
          .limit(10),
      ]);

      if (apptRes.error) console.error('[ProfileScreen] nextAppt fetch error:', apptRes.error);

      setData(profileRes.data ?? null);
      setVisitCount(visitsRes.count ?? 0);
      setSavedCount(savedRes.count ?? 0);

      // Supabase returns slot as an array; normalise to single object
      const upcoming = (apptRes.data ?? [])
        .map((a) => ({ ...a, slot: Array.isArray(a.slot) ? a.slot[0] ?? null : a.slot }))
        .filter((a) => a.slot && a.slot.date >= today)
        .sort((a, b) => (a.slot!.date > b.slot!.date ? 1 : -1))[0] ?? null;
      setNextAppt(upcoming as NextAppt | null);
    } catch (e) {
      console.error('[ProfileScreen] fetchAll error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ScreenHeader trailing={<Pressable style={styles.iconBtn}><Icons.Bell /></Pressable>} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      </Screen>
    );
  }

  const email = session?.user.email ?? '—';
  const name = data?.name ?? authProfile?.name ?? '—';
  const initial = name[0]?.toUpperCase() ?? '?';
  const since = data?.created_at ? memberSince(data.created_at) : '—';

  const prefBody = [
    data?.preferred_nail_style,
    data?.allergy_notes ? `${data.allergy_notes}` : null,
  ]
    .filter(Boolean)
    .join(' · ') || 'No preferences set yet';

  const slotDate = nextAppt?.slot ? fmtSlotDate(nextAppt.slot.date) : null;

  return (
    <Screen>
      <ScreenHeader
        trailing={
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(user)/edit-profile')}>
              <Icons.Edit color={colors.inkSoft} size={18} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Icons.Bell />
            </Pressable>
          </View>
        }
      />

      {/* Avatar hero */}
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <View style={[styles.avatarRingBorder, StyleSheet.absoluteFillObject]} />
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Doodle kind="flower" size={28} color={colors.yellow}
            style={{ position: 'absolute', top: -4, right: -4, transform: [{ rotate: '15deg' }] }} />
          <Doodle kind="sparkle" size={22} color={colors.blue}
            style={{ position: 'absolute', bottom: 4, left: -6, transform: [{ rotate: '-12deg' }] }} />
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.metaWide}>member since {since}</Text>
        <Pressable onPress={signOut} style={styles.signOutBtn}>
          <Icons.LogOut color={colors.inkSoft} size={13} />
          <Text style={styles.signOutText}>sign out</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.row}>
        <View style={styles.statsRow}>
          {[
            { v: visitCount, l: 'visits',  d: 'heart',   c: colors.pink,   nav: () => router.push('/(user)/appointments') },
            { v: savedCount, l: 'saved',   d: 'star',    c: colors.blue,   nav: () => router.push('/(user)/collection') },
            { v: 0,          l: 'designs', d: 'sparkle', c: colors.yellow, nav: () => router.push('/(user)/inspiration') },
          ].map((s, i) => (
            <Pressable
              key={s.l}
              onPress={s.nav}
              style={[
                styles.statWrap,
                { transform: [{ rotate: i === 1 ? '1deg' : i === 2 ? '-1deg' : '0deg' }] },
              ]}
            >
              <HandRect padding={14} radius={radius.md} style={{ alignItems: 'center' }}>
                <Doodle kind={s.d as any} color={s.c} size={22} style={{ marginBottom: 4 }} />
                <Text style={styles.statValue}>{s.v}</Text>
                <Text style={styles.statLabel}>{s.l}</Text>
              </HandRect>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Info list */}
      <View style={styles.row}>
        <HandRect padding={0} radius={radius.lg}>
          {[
            { k: 'email',     v: email },
            { k: 'phone',     v: data?.phone ?? '—' },
            { k: 'birthday',  v: data?.birthday ? fmtBirthday(data.birthday) : '—' },
            { k: 'instagram', v: data?.instagram ?? '—' },
          ].map((r, i, a) => (
            <View key={r.k} style={[styles.infoRow, i < a.length - 1 && styles.infoRowDivider]}>
              <Text style={styles.infoKey}>{r.k}</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{r.v}</Text>
            </View>
          ))}
        </HandRect>
      </View>

      {/* Preferences accent card */}
      <View style={styles.row}>
        <HandRect fill={colors.pinkSoft} stroke={colors.pinkInk} radius={radius.lg} padding={18}>
          <View style={styles.prefHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>Your preferences</Text>
              <Text style={styles.prefBody}>{prefBody}</Text>
            </View>
            <Pressable style={styles.editBtn} onPress={() => router.push('/(user)/edit-profile')}>
              <Icons.Edit color={colors.pinkInk} />
              <Text style={styles.editLabel}>edit</Text>
            </Pressable>
          </View>
        </HandRect>
      </View>

      {/* Next visit */}
      {nextAppt && slotDate ? (
        <View style={styles.row}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Next visit</Text>
            <Text style={styles.sectionMeta}>1 upcoming</Text>
          </View>
          <Pressable onPress={() => router.push('/(user)/appointments')}>
            <HandRect padding={16} radius={radius.lg}>
              <View style={styles.visitRow}>
                <View style={styles.visitDate}>
                  <Text style={styles.visitDateM}>{slotDate.month}</Text>
                  <Text style={styles.visitDateD}>{slotDate.day}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.visitTime}>
                    {fmtTime(nextAppt.slot!.start_time)} — {fmtTime(nextAppt.slot!.end_time)}
                  </Text>
                  <Text style={styles.visitDesc}>with Kuri</Text>
                </View>
                <StatusBadge status={nextAppt.status as any} />
              </View>
            </HandRect>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <HandRect padding={16} radius={radius.lg}>
            <Text style={styles.emptyText}>No upcoming visits yet · Book one? 🌸</Text>
          </HandRect>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 6 },
  avatarRing: {
    width: 128, height: 128, borderRadius: 64,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarRingBorder: {
    borderRadius: 64,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.pinkInk,
  },
  avatarInner: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.display, fontSize: 48, color: colors.pinkInk,
    letterSpacing: letterSpacing.display,
  },
  name: {
    marginTop: 14,
    fontFamily: fonts.display, fontSize: 24, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  metaWide: {
    marginTop: 6,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingVertical: 4, paddingHorizontal: 8,
  },
  signOutText: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statWrap: { flex: 1 },
  statValue: {
    fontFamily: fonts.display, fontSize: typeScale.statBig, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  infoRowDivider: {
    borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: colors.creamHair,
  },
  infoKey: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },
  infoVal: {
    fontFamily: fonts.body, fontSize: 13, color: colors.ink, fontWeight: '500',
    maxWidth: '60%',
  },

  prefHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  prefTitle: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  prefBody: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editLabel: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.pinkInk,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  sectionHead: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  sectionMeta: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  visitDate: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.blueSoft,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.blueInk,
    alignItems: 'center', justifyContent: 'center',
  },
  visitDateM: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.blueInk,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  visitDateD: {
    fontFamily: fonts.display, fontSize: 22, color: colors.ink,
    letterSpacing: letterSpacing.display, lineHeight: 22,
  },
  visitTime: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  visitDesc: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },

  emptyText: {
    fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft,
    textAlign: 'center', paddingVertical: 4,
  },
});
