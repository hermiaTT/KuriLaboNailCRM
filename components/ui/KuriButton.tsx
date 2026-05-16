import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, shadows, spacing } from '../../constants/theme';

type KuriButtonVariant = 'primary' | 'blue' | 'ghost' | 'soft';

interface KuriButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: KuriButtonVariant;
}

export function KuriButton({
  children,
  disabled = false,
  onPress,
  style,
  variant = 'primary',
}: KuriButtonProps) {
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        !isGhost && !disabled && shadows.soft,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, isGhost && styles.ghostLabel, disabled && styles.disabledLabel]}>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  ghostLabel: {
    color: colors.muted,
  },
  disabled: {
    opacity: 0.56,
  },
  disabledLabel: {
    color: colors.muted,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.pastelPink,
  },
  blue: {
    backgroundColor: colors.babyBlue,
  },
  ghost: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  soft: {
    backgroundColor: colors.lightBlue,
  },
});
