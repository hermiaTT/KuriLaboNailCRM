import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  BrushHighlight,
  Doodle,
  EyebrowTitle,
  HandButton,
  HandRect,
  Icons,
  Screen,
  ScreenHeader,
  ScribbleUnderline,
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

const DOW = ['M','T','W','T','F','S','S'];

/**
 * May 2026 calendar matrix. May 1 is a Friday → 5 empty cells before "1".
 */
const WEEKS = (() => {
  const startDow = 5;
  const days = 31;
  const out: (number | null)[][] = [];
  let row: (number | null)[] = new Array(startDow).fill(null);
  for (let d = 1; d <= days; d++) {
    row.push(d);
    if (row.length === 7) { out.push(row); row = []; }
  }
  if (row.length) { while (row.length < 7) row.push(null); out.push(row); }
  return out;
})();

type SlotStatus = 'available' | 'booked' | 'blocked';

/** Per-day status (3 blocks each). */
const STATUS_BY_DAY: Record<number, SlotStatus[]> = {
  4:  ['booked','available','available'],
  5:  ['available','blocked','available'],
  11: ['available','available','booked'],
  12: ['booked','booked','available'],
  18: ['available','booked','available'],
  19: ['blocked','available','booked'],
  20: ['available','available','available'],
  21: ['booked','available','blocked'],
  22: ['available','blocked','available'],
  25: ['available','available','booked'],
  26: ['booked','available','available'],
  27: ['available','available','blocked'],
  28: ['blocked','booked','available'],
};

const BLOCKS = [
  { start: '10:00 AM', end: '1:00 PM', label: 'Morning'   },
  { start: '1:00 PM',  end: '4:00 PM', label: 'Afternoon' },
  { start: '4:00 PM',  end: '7:00 PM', label: 'Evening'   },
];

export default function BookScreen() {
  const [date, setDate] = useState(20);
  const [block, setBlock] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);

  const statuses = useMemo<SlotStatus[]>(
    () => STATUS_BY_DAY[date] || ['available','available','available'],
    [date],
  );

  return (
    <Screen>
      <ScreenHeader/>
      <EyebrowTitle
        eyebrow="book a visit"
        title="May 2026"
        trailing={<Doodle kind="flower" size={22} color={colors.coral} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* Calendar */}
      <View style={styles.row}>
        <HandRect padding={14} radius={radius.lg}>
          {/* DOW header */}
          <View style={styles.gridRow}>
            {DOW.map((d, i) => (
              <Text key={i} style={styles.dow}>{d}</Text>
            ))}
          </View>
          {/* Weeks */}
          {WEEKS.map((week, ri) => (
            <View key={ri} style={[styles.gridRow, { marginTop: 4 }]}>
              {week.map((d, ci) => {
                if (!d) return <View key={ci} style={styles.dateCell}/>;
                const active = d === date;
                const open = (STATUS_BY_DAY[d] || []).some((s) => s === 'available');
                return (
                  <Pressable
                    key={ci}
                    onPress={() => { setDate(d); setBlock(null); }}
                    style={styles.dateCell}
                  >
                    {active && (
                      <Svg width={36} height={36} style={StyleSheet.absoluteFill}>
                        <Circle
                          cx={18}
                          cy={18}
                          r={14}
                          fill={colors.pinkInk}
                          stroke={colors.ink}
                          strokeWidth={1}
                          filter="url(#wobble-1)"
                        />
                      </Svg>
                    )}
                    <Text style={[
                      styles.dateNum,
                      { color: active ? colors.white : colors.ink },
                    ]}>{d}</Text>
                    {!active && open && <View style={styles.openDot}/>}
                  </Pressable>
                );
              })}
            </View>
          ))}

          <ScribbleUnderline color={colors.creamHair} width={120} height={6}
            style={{ alignSelf: 'center', marginTop: 10 }}/>

          <View style={styles.legend}>
            {[
              { c: colors.pinkInk, l: 'selected' },
              { c: colors.pink,    l: 'open' },
              { c: colors.inkFaint,l: 'booked' },
            ].map((lg, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: lg.c }]}/>
                <Text style={styles.legendLabel}>{lg.l}</Text>
              </View>
            ))}
          </View>
        </HandRect>
      </View>

      {/* Day header */}
      <View style={styles.row}>
        <View style={styles.dayHead}>
          <BrushHighlight color={colors.pinkSoft} opacity={0.7} paddingHorizontal={10} paddingVertical={2}>
            <Text style={styles.dayTitle}>May {date}</Text>
          </BrushHighlight>
          <Text style={styles.hours}>10 AM – 7 PM</Text>
        </View>

        {/* Time blocks */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {BLOCKS.map((b, i) => {
            const st = statuses[i];
            const selected = block === i && st === 'available';
            const disabled = st !== 'available';
            return (
              <Pressable
                key={i}
                disabled={disabled}
                onPress={() => !disabled && setBlock(i)}
              >
                <HandRect
                  padding={16}
                  radius={radius.lg}
                  fill={selected ? colors.pinkSoft : st === 'available' ? colors.creamCard : '#EAE0CC'}
                  stroke={selected ? colors.pinkInk : colors.ink}
                  strokeWidth={selected ? 2 : 1.5}
                  style={{ opacity: disabled ? 0.6 : 1 }}
                >
                  <View style={styles.blockRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.blockMeta}>
                        <Text style={styles.metaLabel}>{b.label.toLowerCase()}</Text>
                        <Text style={styles.metaSep}>·</Text>
                        <Text style={styles.metaLabel}>3 hr</Text>
                      </View>
                      <Text style={styles.blockTime} numberOfLines={1}>
                        {b.start} – {b.end}
                      </Text>
                    </View>
                    {selected ? (
                      <View style={styles.check}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    ) : (
                      <StatusBadge status={st}/>
                    )}
                  </View>
                </HandRect>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sticky CTA */}
      <View style={styles.row}>
        <HandRect padding={16} radius={radius.lg} fill={colors.creamDeep}>
          <View style={styles.ctaRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ctaEyebrow}>your selection</Text>
              <Text style={styles.ctaTitle} numberOfLines={1}>
                {block != null ? `May ${date} · ${BLOCKS[block].start}` : 'Pick a time'}
              </Text>
            </View>
            <HandButton
              color={block != null ? colors.pinkInk : colors.inkFaint}
              onPress={() => block != null && setConfirm(true)}
              disabled={block == null}
            >
              Request →
            </HandButton>
          </View>
        </HandRect>
      </View>

      {/* Confirm modal */}
      <Modal transparent visible={confirm} animationType="fade" onRequestClose={() => setConfirm(false)}>
        <Pressable style={styles.modalBg} onPress={() => setConfirm(false)}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 320 }}>
            <HandRect padding={24} radius={radius.xl}>
              <View style={{ alignItems: 'center' }}>
                <Doodle kind="heart" size={42} color={colors.pink} style={{ marginBottom: 8 }}/>
                <Text style={styles.modalTitle}>Request sent</Text>
                <Text style={styles.modalBody}>
                  May {date} · {block != null && BLOCKS[block].start} – {block != null && BLOCKS[block].end}
                  {'\n'}Kuri will confirm within a day ♡
                </Text>
                <View style={{ marginTop: 18, width: '100%' }}>
                  <HandButton
                    color={colors.pinkInk}
                    full
                    onPress={() => { setConfirm(false); setBlock(null); }}
                  >
                    See you soon!
                  </HandButton>
                </View>
              </View>
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  gridRow: { flexDirection: 'row' },
  dow: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },
  dateCell: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dateNum: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  openDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pinkInk,
    opacity: 0.6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },

  dayHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.section,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  hours: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },

  blockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  blockMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  metaSep: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },
  blockTime: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.pinkInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.white, fontSize: 16, fontWeight: '600' },

  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ctaEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  ctaTitle: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(40,28,15,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  modalBody: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 19,
  },
});
