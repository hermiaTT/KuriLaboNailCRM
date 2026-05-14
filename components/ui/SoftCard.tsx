import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../../constants/theme';

interface SoftCardProps {
  children: ReactNode;
  style?: ViewStyle;
  blue?: boolean;
}

export function SoftCard({ children, style, blue = false }: SoftCardProps) {
  return (
    <View style={[styles.card, blue && styles.blueCard, shadows.soft, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  blueCard: {
    backgroundColor: colors.lightBlue,
  },
});
