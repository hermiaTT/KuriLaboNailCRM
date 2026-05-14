import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, spacing, typography } from '../../constants/theme';
import { slots } from '../../data/placeholders';

export default function AdminSlotsScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="Availability" title="Slot management" />
      <PrimaryButton variant="blue">Add placeholder slot</PrimaryButton>
      {slots.map((slot) => (
        <SoftCard key={slot.id}>
          <View style={styles.row}>
            <Text style={styles.date}>{slot.date}</Text>
            <Text style={styles.status}>{slot.status}</Text>
          </View>
          <Text style={styles.time}>
            {slot.startTime} - {slot.endTime}
          </Text>
        </SoftCard>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  date: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  status: {
    color: colors.babyBlue,
    fontSize: typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  time: {
    color: colors.muted,
    fontSize: typography.body,
  },
});
