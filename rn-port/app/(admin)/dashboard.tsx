import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BrushHighlight,
  Doodle,
  HandButton,
  HandRect,
  Icons,
  NailHand,
  Screen,
  StatusBadge,
} from '../../components/ui';
import { appointments, customers, profile } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

const STATS = [
  { v: 3,  l: 'today',     sub: '1 pending',   c: colors.pink,   d: 'flower'  as const },
  { v: 12, l: 'this week', sub: '82% booked',  c: colors.blue,   d: 'sparkle' as const },
  { v: 5,  l: 'new users', sub: 'this month',  c: colors.green,  d: 'star'    as const },
  { v: 28, l: 'uploads',   sub: 'last 30 d',   c: colors.yellow, d: 'heart'   as const },
];

/**
 * Pretty greeting based on current local time.
 */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboardScreen() {
  const router = useRouter();

  return (
    <Screen confettiIntensity={0.4}>
      {/* Greeting header */}
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>Tue · May 18</Text>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>{greeting()},&nbsp;</Text>
            <BrushHighlight color={colors.blue} opacity={0.55} paddingHorizontal={9} paddingVertical={2}>
              <Text style={styles.greeting}>Kuri</Text>
            </BrushHighlight>
            <Text style={[styles.greeting, { color: colors.coral }]}> ✨</Text>
          </View>
          <Text style={styles.sub}>3 visits today, 1 to confirm</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>K</Text>
          <View style={styles.badge}><Text style={styles.badgeNum}>2</Text></View>
        </View>
      </View>

      {/* Stat tiles */}
      <View style={styles.row}>
        <View style={styles.statGrid}>
          {STATS.map((s, i) => (
            <View
              key={s.l}
              style={[
                styles.statCell,
                { transform: [{ rotate: i % 2 === 0 ? '-0.5deg' : '0.6deg' }] },
              ]}
            >
              <HandRect padding={14} radius={radius.md}>
                <View style={styles.statTop}>
                  <Text style={styles.statValue}>{s.v}</Text>
                  <Doodle kind={s.d} color={s.c} size={22}/>
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
            <Text style={styles.sectionTitle}>Today’s schedule</Text>
            <Doodle kind="sparkle" size={14} color={colors.pinkInk} style={{ transform: [{ rotate: '-15deg' }] }}/>
          </View>
          <Text style={styles.seeAll}>see all</Text>
        </View>
        <HandRect padding={0} radius={radius.lg}>
          {appointments.slice(0, 3).map((a, i, arr) => (
            <View
              key={a.id}
              style={[
                styles.scheduleRow,
                i < arr.length - 1 && styles.scheduleDivider,
              ]}
            >
              <View style={styles.scheduleAvatar}>
                <Text style={styles.scheduleAvatarText}>{a.clientName[0]}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.scheduleName} numberOfLines={1}>{a.clientName}</Text>
                <Text style={styles.scheduleMeta} numberOfLines={1}>
                  {a.startTime} – {a.endTime}
                </Text>
              </View>
              <StatusBadge status={a.status as any}/>
            </View>
          ))}
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
          {customers.slice(0, 3).map((u, i, arr) => (
            <View
              key={u.id}
              style={[
                styles.scheduleRow,
                i < arr.length - 1 && styles.scheduleDivider,
              ]}
            >
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>{u.name[0]}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.scheduleName} numberOfLines={1}>{u.name}</Text>
                <Text style={styles.scheduleMeta} numberOfLines={1}>{u.email}</Text>
              </View>
              <Icons.Chev color={colors.inkSoft}/>
            </View>
          ))}
        </HandRect>
      </View>

      {/* Recent uploads — 3-up image grid */}
      <View style={styles.row}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent uploads</Text>
          <Pressable onPress={() => router.push('/(admin)/upload')}>
            <Text style={styles.seeAll}>+ add</Text>
          </Pressable>
        </View>
        <View style={styles.uploadGrid}>
          {(['pink','yellow','green','lilac','coral','blue'] as const).map((t, i) => (
            <View key={t} style={[styles.uploadCell, { transform: [{ rotate: i % 2 === 0 ? '-1deg' : '1deg' }] }]}>
              <HandRect padding={0} radius={radius.sm} style={{ overflow: 'hidden' }}>
                <View style={{ aspectRatio: 1 }}>
                  <NailHand tone={t}/>
                </View>
              </HandRect>
            </View>
          ))}
        </View>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
    lineHeight: 32,
  },
  statLabel: {
    marginTop: 8,
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  statSub: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.section,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  seeAll: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.pinkInk,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scheduleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.creamHair,
    borderStyle: 'dashed',
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
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: 0.6,
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

  uploadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  uploadCell: { width: '31%' },

  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ctaTitle: {
    fontFamily: fonts.display, fontSize: 15, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  ctaBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
