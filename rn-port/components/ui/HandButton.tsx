import React, { ReactNode, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fonts, letterSpacing, radius, type WobbleIntensity } from '../../constants/theme';

type HandButtonSize = 'sm' | 'md' | 'lg';

interface HandButtonProps {
  children: ReactNode;
  /** Fill color. Default pinkInk. Use inkFaint for disabled. */
  color?: string;
  /** Label color. Default white. */
  ink?: string;
  size?: HandButtonSize;
  /** Full-width — use only in modals or sticky CTA bars. */
  full?: boolean;
  wobble?: WobbleIntensity;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<HandButtonSize, { padY: number; padX: number; font: number }> = {
  sm: { padY: 8,  padX: 16, font: 13 },
  md: { padY: 12, padX: 22, font: 14 },
  lg: { padY: 16, padX: 28, font: 16 },
};

/**
 * HandButton — pill-shaped primary CTA with a hand-drawn outline.
 * Always one-line — wrap your verb concisely (`Request`, `Save`).
 *
 *   <HandButton color={colors.pinkInk} onPress={…}>Request</HandButton>
 *   <HandButton size="sm">Manage</HandButton>
 *   <HandButton full onPress={…}>See you soon!</HandButton>
 */
export function HandButton({
  children,
  color = colors.pinkInk,
  ink = colors.white,
  size = 'md',
  full = false,
  wobble = 2,
  onPress,
  disabled = false,
  style,
}: HandButtonProps) {
  const [bounds, setBounds] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== bounds.w || height !== bounds.h) setBounds({ w: width, h: height });
  };
  const sz = SIZES[size];
  const fill = disabled ? colors.inkFaint : color;
  const strokeWidth = 1;

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      disabled={disabled}
      style={[
        styles.base,
        {
          paddingVertical: sz.padY,
          paddingHorizontal: sz.padX,
          backgroundColor: fill,
          borderRadius: radius.pill,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {bounds.w > 0 && bounds.h > 0 && (
        <Svg
          width={bounds.w}
          height={bounds.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={bounds.w - strokeWidth}
            height={bounds.h - strokeWidth}
            rx={bounds.h / 2}
            ry={bounds.h / 2}
            fill="transparent"
            stroke={colors.ink}
            strokeWidth={strokeWidth}
            filter={wobble > 0 ? `url(#wobble-${Math.min(3, wobble)})` : undefined}
          />
        </Svg>
      )}
      <Text
        style={[
          styles.label,
          { color: ink, fontSize: sz.font },
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  label: {
    fontFamily: fonts.display,
    letterSpacing: letterSpacing.display,
    fontWeight: '400',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
});
