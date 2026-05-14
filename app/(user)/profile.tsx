import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { Pill } from '../../components/ui/Pill';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, spacing, typography } from '../../constants/theme';
import { profile } from '../../data/placeholders';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <SectionHeader eyebrow="My space" title={`Hi, ${profile.name.split(' ')[0]}`} />

      <SoftCard blue>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>KL</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.muted}>{profile.email}</Text>
        <View style={styles.pills}>
          <Pill label="soft gel" />
          <Pill label="minimal" tone="blue" />
          <Pill label="pearl accents" />
        </View>
      </SoftCard>

      <SoftCard>
        <Text style={styles.cardTitle}>Client details</Text>
        <InfoRow label="Phone" value={profile.phone ?? 'Add later'} />
        <InfoRow label="Instagram" value={profile.instagram ?? 'Add later'} />
        <InfoRow label="Birthday" value="Optional" />
        <InfoRow label="Allergy notes" value="None added yet" />
      </SoftCard>

      <PrimaryButton onPress={() => router.push('/(user)/appointments')}>
        View appointments
      </PrimaryButton>
    </AppScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: colors.white,
  },
  avatarText: {
    color: colors.pastelPink,
    fontSize: 22,
    fontWeight: '900',
  },
  name: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
    fontSize: typography.body,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    color: colors.muted,
    fontSize: typography.body,
  },
  value: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'right',
  },
});
