import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, spacing, typography } from '../../constants/theme';

const stats = [
  { label: 'Today', value: '3' },
  { label: 'Pending', value: '2' },
  { label: 'New users', value: '5' },
  { label: 'Uploads', value: '12' },
];

export default function AdminDashboardScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="Admin" title="Kuri desk" />
      <View style={styles.grid}>
        {stats.map((stat) => (
          <SoftCard key={stat.label} style={styles.statCard}>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </SoftCard>
        ))}
      </View>
      <SoftCard blue>
        <Text style={styles.cardTitle}>Today at a glance</Text>
        <Text style={styles.copy}>Placeholder space for bookings, recent uploads, and client notes.</Text>
      </SoftCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
  },
  value: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  label: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
});
