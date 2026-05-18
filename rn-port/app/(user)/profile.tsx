import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandRect,
  Icons,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '../../components/ui';
import { profile } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

/**
 * Profile screen — reference port. Use this file as the template when
 * migrating Collection / Inspiration / Book / Admin Dashboard.
 *
 * Patterns demonstrated:
 *   - Screen + ScreenHeader + EyebrowTitle scaffold
 *   - Hand-drawn dashed avatar ring with doodle stickers
 *   - Stat tiles with slight rotation + doodle accents
 *   - Info list with dashed dividers (border on inner View)
 *   - Accent card (preferences) with tinted fill + matching ink stroke
 *   - Status row with StatusBadge
 */
export default function ProfileScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader trailing={<Pressable style={styles.iconBtn}><Icons.Bell/></Pressable>}/>

      {/* Avatar hero */}
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <View style={[styles.avatarRingBorder, StyleSheet.absoluteFillObject]}/>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitial}>{profile.name[0]}</Text>
          </View>
          <Doodle kind="flower" size={28} color={colors.yellow}
            style={{ position: 'absolute', top: -4, right: -4, transform: [{ rotate: '15deg' }] }}/>
          <Doodle kind="sparkle" size={22} color={colors.blue}
            style={{ position: 'absolute', bottom: 4, left: -6, transform: [{ rotate: '-12deg' }] }}/>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.metaWide}>member since march 2024</Text>
      </View>

      {/* Stats */}
      <View style={styles.row}>
        <View style={styles.statsRow}>
          {[
            { v: 24, l: 'visits',  d: 'heart',   c: colors.pink,   nav: () => router.push('/(user)/appointments') },
            { v: 15, l: 'saved',   d: 'star',    c: colors.blue,   nav: () => router.push('/(user)/collection') },
            { v: 8,  l: 'designs', d: 'sparkle', c: colors.yellow, nav: () => router.push('/(user)/inspiration') },
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
                <Doodle kind={s.d as any} color={s.c} size={22} style={{ marginBottom: 4 }}/>
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
            { k: 'email',     v: profile.email },
            { k: 'phone',     v: profile.phone ?? '(604) 555-0188' },
            { k: 'birthday',  v: 'March 15' },
            { k: 'instagram', v: profile.instagram ?? '@mina.nails' },
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
              <Text style={styles.prefBody}>Gel · Soft pinks · No allergies noted</Text>
            </View>
            <View style={styles.editBtn}>
              <Icons.Edit color={colors.pinkInk}/>
              <Text style={styles.editLabel}>edit</Text>
            </View>
          </View>
          <View style={styles.prefTags}>
            {['gel', 'soft pink', 'french', 'no chrome'].map((t) => (
              <View key={t} style={styles.prefTag}>
                <Text style={styles.prefTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </HandRect>
      </View>

      {/* Next visit */}
      <View style={styles.row}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Next visit</Text>
          <Text style={styles.sectionMeta}>1 upcoming</Text>
        </View>
        <Pressable onPress={() => router.push('/(user)/appointments')}>
          <HandRect padding={16} radius={radius.lg}>
            <View style={styles.visitRow}>
              <View style={styles.visitDate}>
                <Text style={styles.visitDateM}>may</Text>
                <Text style={styles.visitDateD}>20</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.visitTime}>4:00 — 7:00 PM</Text>
                <Text style={styles.visitDesc}>New gel set · with Kuri</Text>
              </View>
              <StatusBadge status="confirmed"/>
            </View>
          </HandRect>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
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
  prefTags: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  prefTag: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.creamCard,
    borderWidth: 1, borderColor: colors.pinkInk,
  },
  prefTagText: { fontFamily: fonts.mono, fontSize: 10, color: colors.pinkInk, letterSpacing: 0.4 },

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
  visitDesc: {
    marginTop: 2,
    fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft,
  },
});
