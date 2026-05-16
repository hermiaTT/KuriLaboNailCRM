import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../../constants/theme';

type KuriCardTone = 'white' | 'pink' | 'blue' | 'gray';

interface KuriCardProps {
  children: ReactNode;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: KuriCardTone;
}

export function KuriCard({
  children,
  elevated = true,
  padded = true,
  style,
  tone = 'white',
}: KuriCardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        toneStyles[tone],
        elevated && shadows.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});

const toneStyles = StyleSheet.create({
  white: {
    backgroundColor: colors.white,
  },
  pink: {
    backgroundColor: colors.softPink,
  },
  blue: {
    backgroundColor: colors.lightBlue,
  },
  gray: {
    backgroundColor: colors.softGray,
  },
});
