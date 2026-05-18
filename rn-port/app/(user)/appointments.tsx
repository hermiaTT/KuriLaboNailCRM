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
import { appointments } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

/**
 * User's own appointment history. Not in the tab bar — reached from
 * Profile (the "Visits" stat tile links here).
 */
export default function AppointmentsScreen() {
  const router = useRouter();

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

      <View style={styles.list}>
        {appointments.map((a) => (
          <HandRect key={a.id} padding={16} radius={radius.lg}>
            <View style={styles.head}>
              <View>
                <Text style={styles.date}>{a.date}</Text>
                <Text style={styles.time}>{a.startTime} – {a.endTime}</Text>
              </View>
              <StatusBadge status={a.status as any}/>
            </View>
            <View style={styles.divider}/>
            <View style={styles.foot}>
              <Text style={styles.client}>{a.clientName}</Text>
              <Pressable style={styles.detailBtn}>
                <Text style={styles.detailText}>details</Text>
                <Icons.Chev color={colors.pinkInk} size={14}/>
              </Pressable>
            </View>
          </HandRect>
        ))}

        {appointments.length === 0 && (
          <HandRect padding={28} radius={radius.lg} dashed style={{ alignItems: 'center', gap: 10 }}>
            <Doodle kind="sparkle" size={32} color={colors.blue}/>
            <Text style={styles.emptyTitle}>No visits yet</Text>
            <Text style={styles.emptyBody}>Book your first appointment in the Book tab.</Text>
          </HandRect>
        )}
      </View>
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
  client: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.inkSoft,
  },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.pinkInk,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },
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
