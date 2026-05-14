import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <View style={styles.hero}>
        <Text style={styles.logo}>Kuri Labo</Text>
        <Text style={styles.tagline}>Soft nails, easy booking, cozy memories.</Text>
      </View>

      <SoftCard>
        <Text style={styles.cardTitle}>Welcome back</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
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
          Continue as User
        </PrimaryButton>
        <PrimaryButton variant="blue" onPress={() => router.replace('/(admin)/dashboard')}>
          Continue as Admin
        </PrimaryButton>
      </SoftCard>

      <PrimaryButton variant="ghost" onPress={() => router.push('/(auth)/register')}>
        Create a new account
      </PrimaryButton>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  logo: {
    color: colors.ink,
    fontSize: 42,
    fontWeight: '900',
  },
  tagline: {
    maxWidth: 270,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
  },
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
