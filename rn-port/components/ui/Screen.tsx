import React, { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../constants/theme';
import { ConfettiBg } from './ConfettiBg';

interface ScreenProps {
  children: ReactNode;
  /** Show the cream-paper confetti backdrop. Default true. */
  confetti?: boolean;
  confettiIntensity?: number;
  /** Disable scrolling (e.g. for forms with keyboard). */
  scroll?: boolean;
  /** Bottom padding beyond safe area — extra room for tab bar / sticky CTA. */
  paddingBottom?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Screen — the page shell. Cream background + optional confetti backdrop
 * + scrollable inner content area with top safe-area inset baked in.
 *
 *   <Screen>{…}</Screen>
 *   <Screen confetti={false}>{…}</Screen>
 *   <Screen scroll={false} paddingBottom={120}>{…}</Screen>
 */
export function Screen({
  children,
  confetti = true,
  confettiIntensity = 0.4,
  scroll = true,
  paddingBottom = 96,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const Wrap: any = scroll ? ScrollView : View;
  const wrapProps = scroll
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [
          { paddingTop: insets.top + spacing.sm, paddingBottom },
          contentStyle,
        ],
      }
    : {
        style: [
          { flex: 1, paddingTop: insets.top + spacing.sm, paddingBottom },
          contentStyle,
        ],
      };
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {confetti && <ConfettiBg intensity={confettiIntensity}/>}
      <Wrap {...wrapProps}>{children}</Wrap>
    </View>
  );
}

export const screenStyles = StyleSheet.create({
  /** Default side padding for a row inside <Screen>. */
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
