import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, spacing, typography } from '../../constants/theme';
import { customers } from '../../data/placeholders';

export default function AdminUsersScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="Clients" title="User management" action="Search later" />
      {customers.map((customer) => (
        <SoftCard key={customer.id}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{customer.name}</Text>
              <Text style={styles.muted}>{customer.email}</Text>
            </View>
            <Text style={styles.badge}>{customer.phone ? 'Profile' : 'New'}</Text>
          </View>
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
  name: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 4,
  },
  badge: {
    color: colors.babyBlue,
    fontSize: typography.small,
    fontWeight: '900',
  },
});
