import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, spacing, typography } from '../../constants/theme';
import { appointments } from '../../data/placeholders';

export default function AppointmentsScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="My booking" title="Appointments" />
      {appointments.map((appointment) => (
        <SoftCard key={appointment.id}>
          <View style={styles.row}>
            <Text style={styles.date}>{appointment.date}</Text>
            <Text style={styles.status}>{appointment.status}</Text>
          </View>
          <Text style={styles.time}>
            {appointment.startTime} - {appointment.endTime}
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
