import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <SectionHeader eyebrow="New client" title="Create your cozy nail profile" />
      <SoftCard>
        <Text style={styles.cardTitle}>Basic details</Text>
        <TextInput placeholder="Name" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <TextInput
          keyboardType="phone-pad"
          placeholder="Phone"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
        />
        <PrimaryButton onPress={() => router.replace('/(user)/profile')}>
          Preview User App
        </PrimaryButton>
      </SoftCard>
      <PrimaryButton variant="ghost" onPress={() => router.back()}>
        Back to login
      </PrimaryButton>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.softGray,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
});
