import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
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

  return (
    <AppScreen>
      <SectionHeader eyebrow="Booking" title="Pick your nail day" action="10 AM - 7 PM" />

      <SoftCard blue>
        <Text style={styles.summaryTitle}>MVP schedule</Text>
        <Text style={styles.summaryText}>
          Each day has 3 cozy booking blocks. Available times are tappable.
        </Text>
      </SoftCard>

      <View style={styles.weekControls}>
        <Pressable
          disabled={weekOffset === 0}
          onPress={() => {
            const previousOffset = Math.max(0, weekOffset - 1);
            const previousWeek = getVisibleDays(previousOffset);

            setWeekOffset(previousOffset);
            setSelectedDateKey(previousWeek[0].key);
            setSelectedSlotId(null);
          }}
          style={({ pressed }) => [
            styles.weekButton,
            weekOffset === 0 && styles.weekButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.weekButtonText, weekOffset === 0 && styles.disabledText]}>
            Prev
          </Text>
        </Pressable>
        <View style={styles.weekLabelWrap}>
          <Text style={styles.weekLabel}>Future calendar</Text>
          <Text style={styles.weekRange}>{weekLabel}</Text>
        </View>
        <Pressable
          onPress={() => {
            const nextOffset = weekOffset + 1;
            const nextWeek = getVisibleDays(nextOffset);

            setWeekOffset(nextOffset);
            setSelectedDateKey(nextWeek[0].key);
            setSelectedSlotId(null);
          }}
          style={({ pressed }) => [styles.weekButton, styles.nextWeekButton, pressed && styles.pressed]}
        >
          <Text style={styles.weekButtonText}>Next</Text>
        </Pressable>
      </View>

      <View style={styles.calendarStrip}>
        {visibleDays.map((day) => (
          <Pressable
            key={day.key}
            onPress={() => {
              setSelectedDateKey(day.key);
              setSelectedSlotId(null);
            }}
            style={({ pressed }) => [
              styles.dayCard,
              day.key === selectedDay.key && styles.selectedDayCard,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.dayName, day.key === selectedDay.key && styles.selectedDayText]}>
              {day.weekday}
            </Text>
            <Text style={[styles.dayDate, day.key === selectedDay.key && styles.selectedDayText]}>
              {day.dayOfMonth}
            </Text>
            <Text style={[styles.dayMonth, day.key === selectedDay.key && styles.selectedDayText]}>
              {day.month}
            </Text>
          </Pressable>
        ))}
      </View>

      <SoftCard>
        <View style={styles.scheduleHeader}>
          <View>
            <Text style={styles.scheduleTitle}>{selectedDay.displayDate}</Text>
            <Text style={styles.scheduleMeta}>Business hours 10:00 AM - 7:00 PM</Text>
          </View>
          <StatusDot status="available" label="Open" />
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
      </SoftCard>

      <SoftCard blue>
        <Text style={styles.previewLabel}>Selected block</Text>
        <Text style={styles.previewText}>
          {selectedSlot
            ? `${selectedSlot.date}, ${selectedSlot.startTime} - ${selectedSlot.endTime}`
            : 'Tap an available block to preview your appointment time.'}
        </Text>
        <PrimaryButton
          variant={selectedSlot ? 'pink' : 'ghost'}
          style={styles.button}
        >
          {selectedSlot ? 'Request appointment' : 'Choose a block first'}
        </PrimaryButton>
      </SoftCard>
    </AppScreen>
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

function formatDisplayDate(date: Date) {
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
        statusStyles[slot.status],
        selected && styles.selectedBlock,
        disabled && styles.disabledBlock,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.timeColumn}>
        <Text style={[styles.blockTime, disabled && styles.disabledText]}>
          {slot.startTime}
        </Text>
        <Text style={[styles.blockEnd, disabled && styles.disabledText]}>
          {slot.endTime}
        </Text>
      </View>
      <View style={styles.blockCopy}>
        <Text style={[styles.blockTitle, disabled && styles.disabledText]}>
          {getStatusTitle(slot.status)}
        </Text>
        <Text style={[styles.blockHint, disabled && styles.disabledText]}>
          {getStatusHint(slot.status)}
        </Text>
      </View>
      <StatusDot status={slot.status} label={slot.status} />
    </Pressable>
  );
}

function StatusDot({ status, label }: { status: SlotStatus; label: string }) {
  return (
    <View style={styles.statusPill}>
      <View style={[styles.dot, dotStyles[status]]} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
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

const statusStyles = StyleSheet.create({
  available: {
    backgroundColor: colors.lightBlue,
    borderColor: '#cbeefd',
  },
  booked: {
    backgroundColor: colors.softGray,
    borderColor: colors.softGray,
  },
  blocked: {
    backgroundColor: '#f8edf1',
    borderColor: colors.line,
  },
});

const dotStyles = StyleSheet.create({
  available: {
    backgroundColor: colors.babyBlue,
  },
  booked: {
    backgroundColor: '#b9b3b6',
  },
  blocked: {
    backgroundColor: colors.pastelPink,
  },
});

const styles = StyleSheet.create({
  summaryTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  summaryText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  calendarStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 82,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
  },
  selectedDayCard: {
    backgroundColor: colors.pastelPink,
    ...shadows.soft,
  },
  dayName: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  dayDate: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  dayMonth: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  selectedDayText: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  scheduleTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  scheduleMeta: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 4,
  },
  timeline: {
    gap: spacing.md,
  },
  block: {
    minHeight: 108,
    borderWidth: 1,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  selectedBlock: {
    borderColor: colors.pastelPink,
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  disabledBlock: {
    opacity: 0.72,
  },
  timeColumn: {
    width: 74,
    gap: 2,
  },
  blockTime: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  blockEnd: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  blockCopy: {
    flex: 1,
    gap: 4,
  },
  blockTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  blockHint: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  disabledText: {
    color: '#8d878a',
  },
  statusPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  weekControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weekButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  nextWeekButton: {
    backgroundColor: colors.pastelPink,
    ...shadows.soft,
  },
  weekButtonDisabled: {
    backgroundColor: colors.softGray,
  },
  weekButtonText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '900',
  },
  weekLabelWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  weekRange: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  button: {
    marginTop: spacing.xs,
  },
});
