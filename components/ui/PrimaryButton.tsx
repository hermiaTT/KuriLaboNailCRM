import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { KuriButton } from './KuriButton';

interface PrimaryButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  variant?: 'pink' | 'blue' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  children,
  disabled,
  onPress,
  variant = 'pink',
  style,
}: PrimaryButtonProps) {
  const mappedVariant = variant === 'pink' ? 'primary' : variant;

  return (
    <KuriButton
      disabled={disabled}
      onPress={onPress}
      style={style}
      variant={mappedVariant}
    >
      {children}
    </KuriButton>
  );
}
