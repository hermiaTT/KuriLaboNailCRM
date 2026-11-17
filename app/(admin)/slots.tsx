import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
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
import { DEFAULT_SLOTS, fmtTime } from '../../constants/booking';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  DayAvailability,
  getMonthAvailability,
  getWindowStatus,
} from '../../services/availability';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

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

export default function AdminSlotsScreen() {
  const { profile } = useAuth();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [day, setDay] = useState(today.getDate());

  const [loading, setLoading] = useState(true);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, DayAvailability>>({});
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
  const hasFullDayBlock = dayAvail.blockedTimes.some((b) => b.is_full_day);
  const isPastDay = selectedKey < todayKey;

  function isDayOpen(d: number) {
    const avail = monthAvailability[dateKey(viewYear, viewMonth, d)] ?? EMPTY_DAY;
    return DEFAULT_SLOTS.some((s) => getWindowStatus(s.start, s.end, avail) === 'available');
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewYear(y);
    setViewMonth(m);
    setDay(1);
    setMessage(null);
    setError(null);
  }

  async function handleToggleBlock(i: number) {
    if (isPastDay || hasFullDayBlock || !profile?.id) return;
    const status = blockStatuses[i];
    if (status === 'booked') return;

    setSavingIndex(i);
    setError(null);
    setMessage(null);

    const b = DEFAULT_SLOTS[i];
    let opError: { message: string } | null = null;

    if (status === 'blocked') {
      const covering = dayAvail.blockedTimes.filter(
        (bt) => !bt.is_full_day && bt.start_time?.slice(0, 5) === b.start && bt.end_time?.slice(0, 5) === b.end,
      );
      if (covering.length > 0) {
        const { error: deleteError } = await supabase
          .from('blocked_times')
          .delete()
          .in('id', covering.map((c) => c.id));
        opError = deleteError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('blocked_times')
        .insert({ date: selectedKey, is_full_day: false, start_time: b.start, end_time: b.end, created_by: profile.id });
      opError = insertError;
    }

    setSavingIndex(null);
    if (opError) setError('Could not update that time — please try again.');
    await fetchMonth();
  }

  async function handleBlockDay() {
    if (isPastDay || !profile?.id) return;
    setBulkSaving(true);
    setError(null);
    setMessage(null);
    const { error: insertError } = await supabase
      .from('blocked_times')
      .insert({ date: selectedKey, is_full_day: true, created_by: profile.id });
    setBulkSaving(false);
    if (insertError) setError('Could not block this day — please try again.');
    else setMessage('Day blocked.');
    await fetchMonth();
  }

  async function handleOpenDay() {
    if (isPastDay) return;
    setBulkSaving(true);
    setError(null);
    setMessage(null);
    const { error: deleteError } = await supabase.from('blocked_times').delete().eq('date', selectedKey);
    setBulkSaving(false);
    if (deleteError) setError('Could not open this day — please try again.');
    else setMessage('Day opened.');
    await fetchMonth();
  }

  return (
    <Screen>
      <ScreenHeader/>
      <EyebrowTitle
        eyebrow="availability"
        title={monthLabel}
        trailing={<Doodle kind="star" size={20} color={colors.yellow} style={{ transform: [{ rotate: '-12deg' }] }}/>}
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

          <View style={styles.gridRow}>
            {DOW.map((d, i) => (
              <Text key={i} style={styles.dow}>{d}</Text>
            ))}
          </View>
          {weeks.map((week, ri) => (
            <View key={ri} style={[styles.gridRow, { marginTop: 4 }]}>
              {week.map((d, ci) => {
                if (!d) return <View key={ci} style={styles.dateCell} />;
                const active = d === day;
                const open = isDayOpen(d);
                return (
                  <Pressable
                    key={ci}
                    onPress={() => { setDay(d); setMessage(null); setError(null); }}
                    style={styles.dateCell}
                  >
                    {active && (
                      <Svg width={36} height={36} style={StyleSheet.absoluteFill}>
                        <Circle
                          cx={18} cy={18} r={14}
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

      {/* Selected day */}
      <View style={styles.row}>
        <Text style={styles.dayTitle}>
          {new Date(viewYear, viewMonth, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {selectedKey === todayKey ? ' · today' : ''}
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator color={colors.pinkInk} />
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {DEFAULT_SLOTS.map((b, i) => {
              const st = blockStatuses[i];
              const disabled = st === 'booked' || isPastDay || hasFullDayBlock || savingIndex === i;
              return (
                <Pressable key={i} disabled={disabled} onPress={() => handleToggleBlock(i)}>
                  <HandRect
                    padding={16}
                    radius={radius.lg}
                    fill={st === 'available' ? colors.creamCard : st === 'booked' ? '#EAE0CC' : '#E5D6D6'}
                    stroke={colors.ink}
                    strokeWidth={1.5}
                    style={{ opacity: isPastDay ? 0.6 : 1 }}
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
                      {savingIndex === i ? (
                        <ActivityIndicator color={colors.inkSoft} size="small" />
                      ) : (
                        <StatusBadge status={st} />
                      )}
                    </View>
                  </HandRect>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.hint}>
          {isPastDay
            ? 'Past date — read only.'
            : hasFullDayBlock
              ? 'Whole day is blocked — use "Open day" to lift it.'
              : 'Tap a time to toggle it open or blocked.'}
        </Text>
      </View>

      {/* Block / open the whole day */}
      <View style={styles.row}>
        <HandRect padding={16} radius={radius.lg} fill={colors.creamDeep} dashed>
          <View style={styles.ctaRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ctaTitle}>Whole day</Text>
              <Text style={styles.ctaBody}>Open or close the entire 8 AM–8 PM window at once.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <HandButton
                size="sm"
                color={colors.blueInk}
                onPress={handleOpenDay}
                disabled={bulkSaving || isPastDay}
              >
                Open day
              </HandButton>
              <HandButton
                size="sm"
                color="#8B6A6A"
                onPress={handleBlockDay}
                disabled={bulkSaving || isPastDay}
              >
                Block day
              </HandButton>
            </View>
          </View>
        </HandRect>
      </View>

      {message && (
        <View style={styles.row}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
      {error && (
        <View style={styles.row}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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

  dayTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.section,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
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

  hint: {
    marginTop: 10,
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase', textAlign: 'center',
  },

  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ctaTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, letterSpacing: letterSpacing.display },
  ctaBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },

  messageText: {
    fontFamily: fonts.body, fontSize: 13, color: colors.blueInk, textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.body, fontSize: 13, color: '#c0554f', textAlign: 'center',
  },
});
