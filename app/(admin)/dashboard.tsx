import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BrushHighlight,
  Doodle,
  HandButton,
  HandRect,
  Icons,
  Screen,
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
import { api, mediaUrl } from '../../lib/api';
import type { AdminUser, Appointment, NailSet } from '../../types/api';
import type { StatusKey } from '../../constants/theme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' }).format(new Date(iso));
}

function dayKey(iso: string | Date) {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(date);
}

function uiStatus(status: Appointment['status']): StatusKey {
  if (status === 'CONFIRMED') return 'confirmed';
  if (status === 'COMPLETED') return 'done';
  if (status === 'NO_SHOW') return 'no_show';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'cancelled';
  return 'pending';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TodayAppt = {
  id: string;
  status: string;
  clientName: string;
  startTime: string;
  endTime: string;
};

type RecentClient = { id: string; name: string; phone: string | null };
type RecentUpload = { id: string; image_url: string };

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [uploadsCount, setUploadsCount] = useState(0);
  const [todayAppts, setTodayAppts] = useState<TodayAppt[]>([]);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, []),
  );

  async function fetchAll() {
    setLoading(true);
    try {
      const [appointments, allUsers, nailSets] = await Promise.all([
        api<Appointment[]>('/api/v1/admin/appointments'),
        api<AdminUser[]>('/api/v1/admin/users'),
        api<NailSet[]>('/api/v1/inspiration'),
      ]);
      const clients = allUsers.filter((user) => user.role === 'USER');
      const names = new Map(clients.map((client) => [client.id, client.name]));
      const today = dayKey(new Date());
      const merged = appointments
        .filter((item) => dayKey(item.startAt) === today && !['CANCELLED', 'REJECTED'].includes(item.status))
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .map((item) => ({ id: item.id, status: uiStatus(item.status), clientName: names.get(item.customerId) ?? 'Client', startTime: item.startAt, endTime: item.endAt }));
      const weekEnd = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const images = nailSets.flatMap((set) => set.images).slice(0, 6).map((image) => ({ id: image.id, image_url: mediaUrl(image.url) }));
      setTodayAppts(merged);
      setTodayCount(merged.length);
      setPendingCount(appointments.filter((item) => item.status === 'PENDING_CONFIRMATION').length);
      setWeekCount(appointments.filter((item) => { const start = new Date(item.startAt).getTime(); return start >= Date.now() && start <= weekEnd; }).length);
      setNewUsersCount(clients.filter((client) => new Date(client.createdAt).getTime() >= monthStart).length);
      setUploadsCount(nailSets.reduce((total, set) => total + set.images.length, 0));
      setRecentClients(clients.slice(0, 3));
      setRecentUploads(images);
    } finally {
      setLoading(false);
    }
  }

  const adminInitial = profile?.name?.[0]?.toUpperCase() ?? 'K';

  const STAT_TILES = [
    { v: todayCount,    l: 'today',     sub: `${pendingCount} pending`, c: colors.pink,   d: 'flower'  as const },
    { v: weekCount,     l: 'this week', sub: 'appointments',              c: colors.blue,   d: 'sparkle' as const },
    { v: newUsersCount, l: 'new users', sub: 'this month',              c: colors.green,  d: 'star'    as const },
    { v: uploadsCount,  l: 'uploads',   sub: 'last 30 d',               c: colors.yellow, d: 'heart'   as const },
  ];

  return (
    <Screen confettiIntensity={0.4}>
      {/* Greeting header */}
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>{todayLabel()}</Text>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>{greeting()},&nbsp;</Text>
            <BrushHighlight color={colors.blue} opacity={0.55} paddingHorizontal={9} paddingVertical={2}>
              <Text style={styles.greeting}>{profile?.name?.split(' ')[0] ?? 'Kuri'}</Text>
            </BrushHighlight>
            <Text style={[styles.greeting, { color: colors.coral }]}> ✨</Text>
          </View>
          <Text style={styles.sub}>
            {loading
              ? '...'
              : `${todayCount} visit${todayCount !== 1 ? 's' : ''} today${pendingCount > 0 ? `, ${pendingCount} to confirm` : ''}`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/(admin)/notifications')} style={styles.logoutBtn}>
            <Icons.Bell color={colors.inkSoft} size={17} />
          </Pressable>
          <Pressable onPress={signOut} style={styles.logoutBtn}>
            <Icons.LogOut color={colors.inkSoft} size={16} />
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{adminInitial}</Text>
            {!loading && pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeNum}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      ) : (
        <>
          {/* Stat tiles */}
          <View style={styles.row}>
            <View style={styles.statGrid}>
              {STAT_TILES.map((s, i) => (
                <View
                  key={s.l}
                  style={[styles.statCell, { transform: [{ rotate: i % 2 === 0 ? '-0.5deg' : '0.6deg' }] }]}
                >
                  <HandRect padding={14} radius={radius.md}>
                    <View style={styles.statTop}>
                      <Text style={styles.statValue}>{s.v}</Text>
                      <Doodle kind={s.d} color={s.c} size={22} />
                    </View>
                    <Text style={styles.statLabel}>{s.l}</Text>
                    <Text style={styles.statSub}>{s.sub}</Text>
                  </HandRect>
                </View>
              ))}
            </View>
          </View>

          {/* Today's schedule */}
          <View style={styles.row}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Today's schedule</Text>
                <Doodle kind="sparkle" size={14} color={colors.pinkInk} style={{ transform: [{ rotate: '-15deg' }] }} />
              </View>
              <Pressable onPress={() => router.push('/(admin)/appointments')}>
                <Text style={styles.seeAll}>see all</Text>
              </Pressable>
            </View>
            <HandRect padding={0} radius={radius.lg}>
              {todayAppts.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No appointments today 🌸</Text>
                </View>
              ) : (
                todayAppts.slice(0, 3).map((a, i, arr) => (
                  <View key={a.id} style={[styles.scheduleRow, i < arr.length - 1 && styles.scheduleDivider]}>
                    <View style={styles.scheduleAvatar}>
                      <Text style={styles.scheduleAvatarText}>{a.clientName[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.scheduleName} numberOfLines={1}>{a.clientName}</Text>
                      <Text style={styles.scheduleMeta} numberOfLines={1}>
                        {fmtTime(a.startTime)} – {fmtTime(a.endTime)}
                      </Text>
                    </View>
                    <StatusBadge status={a.status as StatusKey} />
                  </View>
                ))
              )}
            </HandRect>
          </View>

          {/* New clients */}
          <View style={styles.row}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>New clients</Text>
              <Pressable onPress={() => router.push('/(admin)/users')}>
                <Text style={styles.seeAll}>view all</Text>
              </Pressable>
            </View>
            <HandRect padding={0} radius={radius.lg}>
              {recentClients.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No clients yet</Text>
                </View>
              ) : (
                recentClients.map((u, i, arr) => (
                  <View key={u.id} style={[styles.scheduleRow, i < arr.length - 1 && styles.scheduleDivider]}>
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarText}>{u.name[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.scheduleName} numberOfLines={1}>{u.name}</Text>
                      <Text style={styles.scheduleMeta} numberOfLines={1}>{u.phone ?? '—'}</Text>
                    </View>
                    <Icons.Chev color={colors.inkSoft} />
                  </View>
                ))
              )}
            </HandRect>
          </View>

          {/* Recent uploads */}
          <View style={styles.row}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Recent uploads</Text>
              <Pressable onPress={() => router.push('/(admin)/upload')}>
                <Text style={styles.seeAll}>+ add</Text>
              </Pressable>
            </View>
            {recentUploads.length === 0 ? (
              <HandRect padding={16} radius={radius.lg}>
                <Text style={[styles.emptyText, { textAlign: 'center' }]}>No uploads yet</Text>
              </HandRect>
            ) : (
              <View style={styles.uploadGrid}>
                {recentUploads.map((img, i) => (
                  <View
                    key={img.id}
                    style={[styles.uploadCell, { transform: [{ rotate: i % 2 === 0 ? '-1deg' : '1deg' }] }]}
                  >
                    <HandRect padding={0} radius={radius.sm} style={{ overflow: 'hidden' }}>
                      <Image source={{ uri: img.image_url }} style={styles.uploadImg} resizeMode="cover" />
                    </HandRect>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Block out time CTA */}
          <View style={styles.row}>
            <HandRect padding={16} radius={radius.lg} fill={colors.pinkSoft} stroke={colors.pinkInk}>
              <View style={styles.ctaRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.ctaTitle}>Block out time?</Text>
                  <Text style={styles.ctaBody}>Close slots for breaks or holidays.</Text>
                </View>
                <HandButton color={colors.pinkInk} size="sm" onPress={() => router.push('/(admin)/slots')}>
                  Manage
                </HandButton>
              </View>
            </HandRect>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
    gap: 12,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  greetingRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6, flexWrap: 'nowrap' },
  greeting: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  sub: { marginTop: 6, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.pinkInk,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontFamily: fonts.display, fontSize: 18, color: colors.pinkInk,
    letterSpacing: letterSpacing.display,
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 9, backgroundColor: colors.pinkInk,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeNum: { color: colors.white, fontFamily: fonts.mono, fontSize: 9, fontWeight: '700' },

  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: { width: '47.5%' },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statValue: {
    fontFamily: fonts.display, fontSize: 30, color: colors.ink,
    letterSpacing: letterSpacing.display, lineHeight: 32,
  },
  statLabel: {
    marginTop: 8,
    fontFamily: fonts.display, fontSize: 13, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  statSub: {
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sectionTitle: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  seeAll: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.pinkInk,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  scheduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  scheduleDivider: {
    borderBottomWidth: 1, borderBottomColor: colors.creamHair, borderStyle: 'dashed',
  },
  scheduleAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1, borderColor: colors.ink, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  scheduleAvatarText: {
    fontFamily: fonts.display, fontSize: 14, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  scheduleName: {
    fontFamily: fonts.display, fontSize: 13, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  scheduleMeta: {
    marginTop: 2, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, letterSpacing: 0.6,
  },

  smallAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.blueSoft,
    borderWidth: 1, borderColor: colors.ink, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  smallAvatarText: {
    fontFamily: fonts.display, fontSize: 13, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },

  emptyRow: { paddingHorizontal: 14, paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },

  uploadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  uploadCell: { width: '31%' },
  uploadImg: { width: '100%', aspectRatio: 1 },

  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ctaTitle: {
    fontFamily: fonts.display, fontSize: 15, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  ctaBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
