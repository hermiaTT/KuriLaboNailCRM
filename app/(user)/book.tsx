import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo, KuriButton, ScreenContainer } from '../../components/ui';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';
import { slots } from '../../data/placeholders';
import type { AvailableSlot, SlotStatus } from '../../types/models';

const baseScheduleDate = new Date(2026, 4, 18);
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const defaultBlocks = [
  { startTime: '10:00 AM', endTime: '1:00 PM' },
  { startTime: '1:00 PM', endTime: '4:00 PM' },
  { startTime: '4:00 PM', endTime: '7:00 PM' },
];

export default function BookScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const visibleDays = useMemo(() => getVisibleDays(weekOffset), [weekOffset]);
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(baseScheduleDate));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const selectedDay = visibleDays.find((day) => day.key === selectedDateKey) ?? visibleDays[0];
  const selectedSlots = useMemo(() => getSlotsForDay(selectedDay), [selectedDay]);
  const selectedSlot = selectedSlots.find((slot) => slot.id === selectedSlotId);
  const weekLabel = `${visibleDays[0].displayDate} - ${visibleDays[visibleDays.length - 1].displayDate}`;

  function goToPreviousWeek() {
    const previousOffset = Math.max(0, weekOffset - 1);
    const previousWeek = getVisibleDays(previousOffset);

    setWeekOffset(previousOffset);
    setSelectedDateKey(previousWeek[0].key);
    setSelectedSlotId(null);
  }

  function goToNextWeek() {
    const nextOffset = weekOffset + 1;
    const nextWeek = getVisibleDays(nextOffset);

    setWeekOffset(nextOffset);
    setSelectedDateKey(nextWeek[0].key);
    setSelectedSlotId(null);
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <BrandLogo style={styles.brandLogo} width={150} />

      <View style={styles.weekNav}>
        <Pressable
          disabled={weekOffset === 0}
          onPress={goToPreviousWeek}
          style={({ pressed }) => [styles.arrowHit, pressed && styles.pressed]}
        >
          <Text style={[styles.arrow, weekOffset === 0 && styles.arrowDisabled]}>‹</Text>
        </Pressable>

        <View style={styles.weekCenter}>
          <Text style={styles.weekLabel}>Future calendar</Text>
          <Text style={styles.weekRange}>{weekLabel}</Text>
        </View>

        <Pressable onPress={goToNextWeek} style={({ pressed }) => [styles.arrowHit, pressed && styles.pressed]}>
          <Text style={styles.arrowPink}>›</Text>
        </Pressable>
      </View>

      <View style={styles.calendarStrip}>
        {visibleDays.map((day) => (
          <DateCard
            day={day}
            key={day.key}
            onPress={() => {
              setSelectedDateKey(day.key);
              setSelectedSlotId(null);
            }}
            selected={day.key === selectedDay.key}
          />
        ))}
      </View>

      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleTitle}>{selectedDay.displayDate}</Text>
        <Text style={styles.scheduleMeta}>Business hours 10:00 AM - 7:00 PM</Text>
      </View>

      <View style={styles.timeline}>
        {selectedSlots.map((slot) => (
          <TimeBlock
            key={slot.id}
            onSelect={() => setSelectedSlotId(slot.id)}
            selected={slot.id === selectedSlotId}
            slot={slot}
          />
        ))}
      </View>

      <View style={styles.selectedArea}>
        <Text style={styles.previewLabel}>Selected block</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>
            {selectedSlot
              ? `${selectedSlot.date}, ${selectedSlot.startTime} - ${selectedSlot.endTime}`
              : 'Tap an available block to preview your appointment time.'}
          </Text>
          <KuriButton
            disabled={!selectedSlot}
            variant={selectedSlot ? 'primary' : 'ghost'}
          >
            {selectedSlot ? 'Request appointment' : 'Choose a block first'}
          </KuriButton>
        </View>
      </View>
    </ScreenContainer>
  );
}

interface ScheduleDay {
  date: Date;
  dayOfMonth: string;
  displayDate: string;
  key: string;
  month: string;
  weekday: string;
}

function DateCard({
  day,
  onPress,
  selected,
}: {
  day: ScheduleDay;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayCard,
        selected && styles.selectedDayCard,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.dayName, selected && styles.selectedDayText]}>{day.weekday}</Text>
      <Text style={[styles.dayDate, selected && styles.selectedDayText]}>{day.dayOfMonth}</Text>
      <Text style={[styles.dayMonth, selected && styles.selectedDayText]}>{day.month}</Text>
    </Pressable>
  );
}

function TimeBlock({
  onSelect,
  selected,
  slot,
}: {
  onSelect: () => void;
  selected: boolean;
  slot: AvailableSlot;
}) {
  const disabled = slot.status !== 'available';

  return (
    <Pressable
      disabled={disabled}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.block,
        selected && styles.selectedBlock,
        disabled && styles.disabledBlock,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.blockCopy}>
        <Text style={[styles.blockTitle, disabled && styles.disabledText]}>
          <Text style={styles.blockStart}>{slot.startTime}</Text> {getStatusTitle(slot.status)}
        </Text>
        <Text style={[styles.blockHint, disabled && styles.disabledText]}>
          {getStatusHint(slot.status)}
        </Text>
        <Text style={[styles.blockEnd, disabled && styles.disabledText]}>{slot.endTime}</Text>
      </View>
      <StatusPill status={slot.status} />
    </Pressable>
  );
}

function StatusPill({ status }: { status: SlotStatus }) {
  return (
    <View style={[styles.statusPill, status === 'booked' && styles.bookedPill]}>
      <Text style={[styles.statusText, status === 'booked' && styles.bookedStatusText]}>
        {status}
      </Text>
    </View>
  );
}

function getVisibleDays(weekOffset: number): ScheduleDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseScheduleDate);
    date.setDate(baseScheduleDate.getDate() + weekOffset * 7 + index);

    return {
      date,
      dayOfMonth: String(date.getDate()),
      displayDate: formatDisplayDate(date),
      key: formatDateKey(date),
      month: monthNames[date.getMonth()],
      weekday: dayNames[date.getDay()],
    };
  });
}

function getSlotsForDay(day: ScheduleDay): AvailableSlot[] {
  return defaultBlocks.map((block, index) => {
    const matchingSlot = slots.find(
      (slot) =>
        slot.date === day.displayDate &&
        slot.startTime === block.startTime &&
        slot.endTime === block.endTime,
    );

    return {
      id: matchingSlot?.id ?? `${day.key}-${index}`,
      date: day.displayDate,
      startTime: block.startTime,
      endTime: block.endTime,
      status: matchingSlot?.status ?? getMockStatus(day.date, index),
    };
  });
}

function getMockStatus(date: Date, blockIndex: number): SlotStatus {
  const seed = date.getDate() + date.getMonth() + blockIndex;

  if (seed % 7 === 0) return 'blocked';
  if (seed % 5 === 0) return 'booked';
  return 'available';
}

function getStatusTitle(status: SlotStatus) {
  if (status === 'available') return 'Available';
  if (status === 'booked') return 'Booked';
  return 'Blocked';
}

function getStatusHint(status: SlotStatus) {
  if (status === 'available') return 'Tap to reserve this time';
  if (status === 'booked') return 'Already reserved';
  return 'Not open for booking';
}

function formatDisplayDate(date: Date) {
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  brandLogo: {
    alignSelf: 'center',
  },
  weekNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  arrowHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
    minHeight: 42,
  },
  arrow: {
    color: '#8f8c8a',
    fontFamily: fonts.bodyBold,
    fontSize: 42,
  },
  arrowPink: {
    color: '#e95775',
    fontFamily: fonts.bodyBold,
    fontSize: 42,
  },
  arrowDisabled: {
    opacity: 0.35,
  },
  weekCenter: {
    alignItems: 'center',
    gap: 4,
  },
  weekLabel: {
    color: '#8f8c8a',
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  weekRange: {
    color: colors.ink,
    fontFamily: fonts.bodyItalic,
    fontSize: typography.body,
  },
  calendarStrip: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 5,
    width: '100%',
  },
  dayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    minHeight: 74,
    borderWidth: 1.5,
    borderColor: '#e8e0dc',
    borderRadius: 14,
    backgroundColor: colors.softPink,
    paddingVertical: spacing.sm,
  },
  selectedDayCard: {
    borderColor: '#e95775',
    backgroundColor: '#e95775',
  },
  dayName: {
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  dayDate: {
    color: colors.ink,
    fontFamily: fonts.bodyItalic,
    fontSize: 18,
    marginTop: 3,
  },
  dayMonth: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    marginTop: 0,
  },
  selectedDayText: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  scheduleHeader: {
    gap: spacing.xs,
  },
  scheduleTitle: {
    color: colors.ink,
    fontFamily: fonts.title,
    fontSize: typography.heading,
  },
  scheduleMeta: {
    color: '#8f8c8a',
    fontFamily: fonts.body,
    fontSize: typography.body,
  },
  timeline: {
    gap: spacing.md,
  },
  block: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 142,
    borderWidth: 2,
    borderColor: '#e8e0dc',
    borderRadius: 20,
    backgroundColor: colors.softPink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  selectedBlock: {
    borderColor: '#e95775',
  },
  disabledBlock: {
    opacity: 0.48,
  },
  blockCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  blockTitle: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: typography.body,
  },
  blockStart: {
    fontFamily: fonts.bodyItalic,
    fontSize: 20,
  },
  blockHint: {
    color: '#8f8c8a',
    fontFamily: fonts.body,
    fontSize: typography.body,
  },
  blockEnd: {
    color: '#8f8c8a',
    fontFamily: fonts.body,
    fontSize: typography.body,
  },
  disabledText: {
    color: '#8f8c8a',
  },
  statusPill: {
    borderRadius: 18,
    backgroundColor: '#ffe9ef',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bookedPill: {
    backgroundColor: '#f7f4f1',
  },
  statusText: {
    color: '#e95775',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  bookedStatusText: {
    color: '#b7b2af',
  },
  selectedArea: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  previewLabel: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: typography.body,
    textTransform: 'uppercase',
  },
  previewBox: {
    gap: spacing.md,
    borderWidth: 2,
    borderColor: '#e8e0dc',
    borderRadius: 20,
    backgroundColor: colors.softPink,
    padding: spacing.lg,
  },
  previewText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: typography.body,
    lineHeight: 23,
  },
});
