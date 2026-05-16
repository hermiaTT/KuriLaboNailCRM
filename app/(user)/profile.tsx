import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo, KuriCard, ScreenContainer } from '../../components/ui';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';
import { profile } from '../../data/placeholders';

const profileRows = [
  { icon: '✉', label: 'Email', value: profile.email },
  { icon: '☎', label: 'Phone', value: profile.phone ?? '+1 (555) 123-4567' },
  { icon: '♕', label: 'Birthday', value: 'March 15, 1995' },
];

const stats = [
  { label: 'Visits', value: '24' },
  { label: 'Favorites', value: '15' },
  { label: 'Designs', value: '8' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.pageLabel}>Profile</Text>
        <BrandLogo style={styles.brand} width={136} />
        <Pressable
          accessibilityLabel="View appointments"
          onPress={() => router.push('/(user)/appointments')}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <View style={styles.face}>
            <View style={styles.eyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.smile} />
          </View>
        </View>
        <Text style={styles.name}>Emma Johnson</Text>
        <Text style={styles.subtitle}>Nail Art Lover ✨</Text>
      </View>

      <View style={styles.infoList}>
        {profileRows.map((row) => (
          <ProfileInfoRow
            icon={row.icon}
            key={row.label}
            label={row.label}
            value={row.value}
          />
        ))}
      </View>

      <View style={styles.statsGrid}>
        {stats.map((item) => (
          <KuriCard key={item.label} style={styles.statCard}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </KuriCard>
        ))}
      </View>
    </ScreenContainer>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <KuriCard style={styles.infoRow}>
      <View style={styles.iconBubble}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </KuriCard>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  pageLabel: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.bodyItalic,
    fontSize: typography.body,
  },
  brand: {
    flex: 1,
  },
  settingsButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingsIcon: {
    color: '#ff5f7e',
    fontFamily: fonts.titleBold,
    fontSize: 22,
  },
  pressed: {
    opacity: 0.64,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 118,
    height: 118,
    borderWidth: 3,
    borderRadius: 59,
    borderColor: '#ff5f7e',
    borderStyle: 'dotted',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffb1a5',
    gap: 6,
  },
  eyes: {
    flexDirection: 'row',
    gap: 8,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  smile: {
    width: 16,
    height: 8,
    borderBottomWidth: 2,
    borderColor: '#ff5f7e',
    borderRadius: 10,
  },
  name: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontFamily: fonts.title,
    fontSize: 21,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
  },
  infoList: {
    gap: spacing.md,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 80,
    borderRadius: radius.xl,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff1ef',
  },
  infoIcon: {
    color: '#ff6a83',
    fontFamily: fonts.titleBold,
    fontSize: 20,
  },
  infoCopy: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  infoValue: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    gap: spacing.xs,
  },
  statValue: {
    color: '#ff5f7e',
    fontFamily: fonts.titleBold,
    fontSize: 24,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
});
