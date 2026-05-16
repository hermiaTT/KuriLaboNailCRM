import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../../constants/theme';

type StatusBadgeTone = 'available' | 'booked' | 'blocked' | 'pending' | 'confirmed' | 'soft';

interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
}

export function StatusBadge({ label, tone = 'soft' }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <View style={[styles.dot, dotStyles[tone]]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});

const toneStyles = StyleSheet.create({
  available: {
    backgroundColor: colors.lightBlue,
  },
  booked: {
    backgroundColor: colors.softGray,
  },
  blocked: {
    backgroundColor: '#f8edf1',
  },
  pending: {
    backgroundColor: '#fff3d7',
  },
  confirmed: {
    backgroundColor: '#e9f8f1',
  },
  soft: {
    backgroundColor: colors.white,
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
  pending: {
    backgroundColor: colors.warning,
  },
  confirmed: {
    backgroundColor: colors.success,
  },
  soft: {
    backgroundColor: colors.pastelPink,
  },
});
