import React, { useState } from 'react';
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

const FILTERS = [
  { id: 'today',     label: 'today' },
  { id: 'pending',   label: 'pending' },
  { id: 'upcoming',  label: 'upcoming' },
  { id: 'past',      label: 'past' },
];

export default function AdminAppointmentsScreen() {
  const [filter, setFilter] = useState('today');

  // Mock pending one — clone the first appointment as pending for the UI demo
  const display = appointments;

  return (
    <Screen>
      <ScreenHeader/>
      <EyebrowTitle
        eyebrow="schedule"
        title="Appointments"
        trailing={<Doodle kind="sparkle" size={20} color={colors.blue} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <HandChip key={f.id} active={filter === f.id} onPress={() => setFilter(f.id)}>
            {f.label}
          </HandChip>
        ))}
      </View>

      <View style={styles.list}>
        {display.map((a) => (
          <HandRect key={a.id} padding={16} radius={radius.lg}>
            <View style={styles.row}>
              <View style={styles.dateBox}>
                <Text style={styles.dateMonth}>may</Text>
                <Text style={styles.dateDay}>{a.date.replace('May ', '')}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.client}>{a.clientName}</Text>
                <Text style={styles.time}>{a.startTime} – {a.endTime}</Text>
              </View>
              <StatusBadge status={a.status as any}/>
            </View>
            <View style={styles.divider}/>
            <View style={styles.actions}>
              {a.status === 'pending' ? (
                <>
                  <HandButton size="sm" color={colors.pinkInk}>Confirm</HandButton>
                  <Pressable style={styles.declineBtn}>
                    <Text style={styles.declineText}>decline</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable style={styles.secondaryBtn}>
                    <Icons.Edit color={colors.ink} size={14}/>
                    <Text style={styles.secondaryText}>reschedule</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryBtn}>
                    <Text style={styles.secondaryText}>mark complete</Text>
                    <Icons.Chev color={colors.ink} size={14}/>
                  </Pressable>
                </>
              )}
            </View>
          </HandRect>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1, borderColor: colors.pinkInk, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  dateMonth: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.pinkInk,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  dateDay: {
    fontFamily: fonts.display, fontSize: 20, color: colors.ink,
    letterSpacing: letterSpacing.display, lineHeight: 22,
  },
  client: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  time: {
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  divider: {
    height: 1, marginVertical: 12,
    backgroundColor: colors.creamHair, borderStyle: 'dashed',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  declineBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  declineText: {
    fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  secondaryText: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.ink,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
});
