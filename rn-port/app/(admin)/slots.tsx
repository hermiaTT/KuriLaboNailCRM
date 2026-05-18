import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandButton,
  HandChip,
  HandRect,
  Icons,
  Screen,
  ScreenHeader,
  ScribbleUnderline,
  StatusBadge,
} from '../../components/ui';
import { slots } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

/**
 * Group placeholder slots by date so the screen reads as a daily schedule.
 */
function groupByDate() {
  const out: Record<string, typeof slots> = {};
  for (const s of slots) {
    out[s.date] = out[s.date] || [];
    out[s.date].push(s);
  }
  return Object.entries(out);
}

export default function AdminSlotsScreen() {
  const [filter, setFilter] = useState<'all' | 'available' | 'booked' | 'blocked'>('all');
  const days = useMemo(() => groupByDate(), []);

  return (
    <Screen>
      <ScreenHeader/>
      <EyebrowTitle
        eyebrow="availability"
        title="Slots"
        trailing={<Doodle kind="star" size={20} color={colors.yellow} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* CTA — block out a day */}
      <View style={styles.row}>
        <HandRect padding={16} radius={radius.lg} fill={colors.creamDeep} dashed>
          <View style={styles.ctaRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ctaTitle}>Block a day</Text>
              <Text style={styles.ctaBody}>Pick a date to close all 3 slots — useful for holidays or training days.</Text>
            </View>
            <HandButton size="sm" color={colors.pinkInk}>+ Block</HandButton>
          </View>
        </HandRect>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {(['all','available','booked','blocked'] as const).map((f) => (
          <HandChip key={f} active={filter === f} onPress={() => setFilter(f)}>
            {f}
          </HandChip>
        ))}
      </View>

      {/* Days */}
      <View style={styles.list}>
        {days.map(([date, daySlots]) => {
          const visible = filter === 'all' ? daySlots : daySlots.filter((s) => s.status === filter);
          if (!visible.length) return null;
          return (
            <View key={date} style={styles.dayGroup}>
              <View style={styles.dayHead}>
                <Text style={styles.dayTitle}>{date}</Text>
                <ScribbleUnderline color={colors.pinkInk} width={32} height={4}/>
              </View>
              <HandRect padding={0} radius={radius.lg}>
                {visible.map((s, i, arr) => (
                  <View
                    key={s.id}
                    style={[
                      styles.slotRow,
                      i < arr.length - 1 && styles.slotDivider,
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.slotTime}>{s.startTime} – {s.endTime}</Text>
                      <Text style={styles.slotMeta}>3 hr session</Text>
                    </View>
                    <StatusBadge status={s.status as any}/>
                    <Pressable style={styles.iconBtn}>
                      <Icons.Edit color={colors.inkSoft} size={16}/>
                    </Pressable>
                  </View>
                ))}
              </HandRect>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ctaTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, letterSpacing: letterSpacing.display },
  ctaBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  list: { paddingHorizontal: spacing.lg, gap: 14 },
  dayGroup: { gap: 8 },
  dayHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  dayTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.section,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },

  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  slotDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.creamHair,
    borderStyle: 'dashed',
  },
  slotTime: {
    fontFamily: fonts.display,
    fontSize: typeScale.row,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  slotMeta: {
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  iconBtn: { padding: 6 },
});
