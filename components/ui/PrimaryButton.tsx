import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../../constants/theme';

interface PrimaryButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'pink' | 'blue' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({
  children,
  onPress,
  variant = 'pink',
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'blue' && styles.blue,
        variant === 'ghost' && styles.ghost,
        variant !== 'ghost' && shadows.soft,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.pastelPink,
    paddingHorizontal: spacing.lg,
  },
  blue: {
    backgroundColor: colors.babyBlue,
  },
  ghost: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  ghostLabel: {
    color: colors.muted,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
