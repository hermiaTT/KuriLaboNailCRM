import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { CUSTOM_TIME_RANGE, DEFAULT_SLOTS, addMinutes, fmtTime, pad } from '../../constants/booking';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  DayAvailability,
  getDayAvailability,
  getMonthAvailability,
  getWindowStatus,
} from '../../services/availability';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const OTHER_TICKS = (() => {
  const out: { key: string; label: string; endLabel: string }[] = [];
  const [eh, em] = CUSTOM_TIME_RANGE.earliest.split(':').map(Number);
  const [lh, lm] = CUSTOM_TIME_RANGE.latest.split(':').map(Number);
  for (let mins = eh * 60 + em; mins <= lh * 60 + lm; mins += 30) {
    const key = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
    out.push({ key, label: fmtTime(key), endLabel: fmtTime(addMinutes(key, CUSTOM_TIME_RANGE.durationMin)) });
  }
  return out;
})();

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function buildMonthWeeks(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday
  const out: (number | null)[][] = [];
  let row: (number | null)[] = new Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d);
    if (row.length === 7) {
      out.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    out.push(row);
  }
  return out;
}

const EMPTY_DAY: DayAvailability = { blockedTimes: [], appointments: [] };

export default function BookScreen() {
  const { session } = useAuth();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [day, setDay] = useState(today.getDate());
  const [block, setBlock] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [showOtherPicker, setShowOtherPicker] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, DayAvailability>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const weeks = useMemo(() => buildMonthWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = useMemo(
    () => new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [viewYear, viewMonth],
  );

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    const monthStart = dateKey(viewYear, viewMonth, 1);
    const monthEnd = dateKey(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate());
    setMonthAvailability(await getMonthAvailability(monthStart, monthEnd));
    setLoading(false);
  }, [viewYear, viewMonth]);

  useFocusEffect(
    useCallback(() => {
      fetchMonth();
    }, [fetchMonth]),
  );

  const selectedKey = dateKey(viewYear, viewMonth, day);
  const dayAvail = monthAvailability[selectedKey] ?? EMPTY_DAY;
  const blockStatuses = DEFAULT_SLOTS.map((s) => getWindowStatus(s.start, s.end, dayAvail));

  function isDayOpen(d: number) {
    const avail = monthAvailability[dateKey(viewYear, viewMonth, d)] ?? EMPTY_DAY;
    return DEFAULT_SLOTS.some((s) => getWindowStatus(s.start, s.end, avail) === 'available');
  }

  function isTickBlocked(tickKey: string) {
    const end = addMinutes(tickKey, CUSTOM_TIME_RANGE.durationMin);
    return getWindowStatus(tickKey, end, dayAvail) !== 'available';
  }

  /** If every possible custom tick is blocked, there's nothing to pick — disable the whole row. */
  const allOtherTimesBlocked = OTHER_TICKS.every((t) => isTickBlocked(t.key));

  function selectBlock(i: number) {
    setBlock(i);
    setCustomStart(null);
    setShowOtherPicker(false);
  }

  function selectCustomTick(tickKey: string) {
    setCustomStart(tickKey);
    setBlock(null);
    setShowOtherPicker(false);
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewYear(y);
    setViewMonth(m);
    setDay(1);
    setBlock(null);
    setCustomStart(null);
    setShowOtherPicker(false);
  }

  const selectedDateLabel = new Date(viewYear, viewMonth, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const selectedTick = customStart ? OTHER_TICKS.find((t) => t.key === customStart) ?? null : null;
  const selectionStartLabel = block != null ? fmtTime(DEFAULT_SLOTS[block].start) : selectedTick?.label ?? null;
  const selectionLabel = block != null
    ? `${fmtTime(DEFAULT_SLOTS[block].start)} – ${fmtTime(DEFAULT_SLOTS[block].end)}`
    : selectedTick
      ? `${selectedTick.label} – ${selectedTick.endLabel}`
      : null;

  async function handleRequest() {
    if (!session?.user.id) return;

    let start: string;
    let end: string;
    let isCustom: boolean;
    if (block != null) {
      start = DEFAULT_SLOTS[block].start;
      end = DEFAULT_SLOTS[block].end;
      isCustom = false;
    } else if (customStart) {
      start = customStart;
      end = addMinutes(customStart, CUSTOM_TIME_RANGE.durationMin);
      isCustom = true;
    } else {
      return;
    }

    setSubmitting(true);
    setError(null);

    // Last-second recheck against fresh data before writing.
    const freshDay = await getDayAvailability(selectedKey);
    if (getWindowStatus(start, end, freshDay) !== 'available') {
      setSubmitting(false);
      setError('That time was just booked by someone else — pick another.');
      await fetchMonth();
      return;
    }

    const { error: insertError } = await supabase.from('appointments').insert({
      user_id: session.user.id,
      date: selectedKey,
      start_time: start,
      end_time: end,
      is_custom_time: isCustom,
    });

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong — please try again.');
      await fetchMonth();
      return;
    }
    await fetchMonth();
    setConfirm(true);
  }

  return (
    <Screen>
      <ScreenHeader />
      <EyebrowTitle
        eyebrow="book a visit"
        title={monthLabel}
        trailing={<Doodle kind="flower" size={22} color={colors.coral} style={{ transform: [{ rotate: '-12deg' }] }} />}
      />

      {/* Calendar */}
      <View style={styles.row}>
        <HandRect padding={14} radius={radius.lg}>
          <View style={styles.monthNav}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn} hitSlop={8}>
              <Icons.ChevL color={colors.inkSoft} size={16} />
            </Pressable>
            <Text style={styles.monthNavLabel}>{monthLabel.toLowerCase()}</Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.navBtn} hitSlop={8}>
              <Icons.Chev color={colors.inkSoft} size={16} />
            </Pressable>
          </View>

          {/* DOW header */}
          <View style={styles.gridRow}>
            {DOW.map((d, i) => (
              <Text key={i} style={styles.dow}>{d}</Text>
            ))}
          </View>
          {/* Weeks */}
          {weeks.map((week, ri) => (
            <View key={ri} style={[styles.gridRow, { marginTop: 4 }]}>
              {week.map((d, ci) => {
                if (!d) return <View key={ci} style={styles.dateCell} />;
                const active = d === day;
                const open = isDayOpen(d);
                return (
                  <Pressable
                    key={ci}
                    onPress={() => { setDay(d); setBlock(null); setCustomStart(null); setShowOtherPicker(false); }}
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
                    {!active && open && <View style={styles.openDot} />}
                  </Pressable>
                );
              })}
            </View>
          ))}

          <ScribbleUnderline color={colors.creamHair} width={120} height={6}
            style={{ alignSelf: 'center', marginTop: 10 }} />

          <View style={styles.legend}>
            {[
              { c: colors.pinkInk, l: 'selected' },
              { c: colors.pink, l: 'open' },
              { c: colors.inkFaint, l: 'booked' },
            ].map((lg, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: lg.c }]} />
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
            <Text style={styles.dayTitle}>
              {new Date(viewYear, viewMonth, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {selectedKey === todayKey ? ' · today' : ''}
            </Text>
          </BrushHighlight>
          <Text style={styles.hours}>8 AM – 8 PM</Text>
        </View>

        {/* Time blocks */}
        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator color={colors.pinkInk} />
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 4 }}>
            {DEFAULT_SLOTS.map((b, i) => {
              const st = blockStatuses[i];
              const selected = block === i && st === 'available';
              const disabled = st !== 'available';
              return (
                <Pressable
                  key={i}
                  disabled={disabled}
                  onPress={() => !disabled && selectBlock(i)}
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
                          {fmtTime(b.start)} – {fmtTime(b.end)}
                        </Text>
                      </View>
                      {selected ? (
                        <View style={styles.check}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      ) : (
                        <StatusBadge status={st} />
                      )}
                    </View>
                  </HandRect>
                </Pressable>
              );
            })}

            {/* Other time — custom 3-hour pick between 8 AM and 5 PM start */}
            <Pressable
              disabled={allOtherTimesBlocked}
              onPress={() => setShowOtherPicker((v) => !v)}
            >
              <HandRect
                padding={16}
                radius={radius.lg}
                dashed={!customStart}
                fill={customStart ? colors.pinkSoft : allOtherTimesBlocked ? '#EAE0CC' : colors.creamCard}
                stroke={customStart ? colors.pinkInk : colors.ink}
                strokeWidth={customStart ? 2 : 1.5}
                style={{ opacity: allOtherTimesBlocked ? 0.6 : 1 }}
              >
                <View style={styles.blockRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.metaLabel}>other time</Text>
                    <Text style={styles.blockTime} numberOfLines={1}>
                      {selectedTick
                        ? `${selectedTick.label} – ${selectedTick.endLabel}`
                        : allOtherTimesBlocked
                          ? 'Not available'
                          : 'Pick an exact time'}
                    </Text>
                  </View>
                  {customStart ? (
                    <View style={styles.check}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  ) : allOtherTimesBlocked ? (
                    <StatusBadge status="blocked" />
                  ) : (
                    <View style={{ transform: [{ rotate: showOtherPicker ? '90deg' : '0deg' }] }}>
                      <Icons.Chev color={colors.inkSoft} size={16} />
                    </View>
                  )}
                </View>
              </HandRect>
            </Pressable>

            {showOtherPicker && !allOtherTimesBlocked && (
              <HandRect padding={0} radius={radius.lg} style={{ marginTop: -2 }}>
                <ScrollView style={styles.tickList} showsVerticalScrollIndicator={false}>
                  {OTHER_TICKS.map((tick, i) => {
                    const blocked = isTickBlocked(tick.key);
                    const selected = customStart === tick.key;
                    return (
                      <Pressable
                        key={tick.key}
                        disabled={blocked}
                        onPress={() => selectCustomTick(tick.key)}
                        style={[
                          styles.tickRow,
                          i < OTHER_TICKS.length - 1 && styles.tickDivider,
                          selected && styles.tickSelected,
                        ]}
                      >
                        <Text style={[styles.tickText, blocked && styles.tickTextBlocked]}>
                          {tick.label} – {tick.endLabel}
                        </Text>
                        {blocked ? (
                          <Text style={styles.tickBlockedLabel}>unavailable</Text>
                        ) : selected ? (
                          <Text style={styles.tickCheck}>✓</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </HandRect>
            )}
          </View>
        )}
      </View>

      {error && (
        <View style={styles.row}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Sticky CTA */}
      <View style={styles.row}>
        <HandRect padding={16} radius={radius.lg} fill={colors.creamDeep}>
          <View style={styles.ctaRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ctaEyebrow}>your selection</Text>
              <Text style={styles.ctaTitle} numberOfLines={1}>
                {selectionStartLabel ? `${selectedDateLabel} · ${selectionStartLabel}` : 'Pick a time'}
              </Text>
            </View>
            <HandButton
              color={selectionLabel ? colors.pinkInk : colors.inkFaint}
              onPress={handleRequest}
              disabled={!selectionLabel || submitting}
            >
              {submitting ? 'Sending…' : 'Request →'}
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
                <Doodle kind="heart" size={42} color={colors.pink} style={{ marginBottom: 8 }} />
                <Text style={styles.modalTitle}>Request sent</Text>
                <Text style={styles.modalBody}>
                  {selectedDateLabel}
                  {' · '}
                  {selectionLabel}
                  {'\n'}Kuri will confirm within a day ♡
                </Text>
                <View style={{ marginTop: 18, width: '100%' }}>
                  <HandButton
                    color={colors.pinkInk}
                    full
                    onPress={() => { setConfirm(false); setBlock(null); setCustomStart(null); }}
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
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8,
  },
  navBtn: { padding: 4 },
  monthNavLabel: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase', minWidth: 90, textAlign: 'center',
  },
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

  tickList: { maxHeight: 240 },
  tickRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  tickDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.creamHair,
  },
  tickSelected: { backgroundColor: colors.pinkSoft },
  tickText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  tickTextBlocked: { color: colors.inkFaint },
  tickBlockedLabel: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkFaint,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  tickCheck: { color: colors.pinkInk, fontWeight: '700', fontSize: 14 },

  errorText: {
    fontFamily: fonts.body, fontSize: 13, color: '#c0554f', textAlign: 'center',
  },

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
