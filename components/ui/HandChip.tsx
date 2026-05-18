import React, { ReactNode, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fonts, letterSpacing, radius, typeScale, type WobbleIntensity } from '../../constants/theme';

interface HandChipProps {
  children: ReactNode;
  active?: boolean;
  /** Pill color when active. Default pinkInk. */
  color?: string;
  /** Text color when idle. Default ink. */
  ink?: string;
  /** Wobble intensity for the border. */
  wobble?: WobbleIntensity;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * HandChip — filter / tag pill. Two states: idle (transparent fill,
 * ink stroke) and active (filled with `pinkInk`, white text).
 *
 *   <HandChip active={cat === id} onPress={…}>simple</HandChip>
 */
export function HandChip({
  children,
  active = false,
  color = colors.pinkInk,
  ink = colors.ink,
  wobble = 1,
  onPress,
  style,
}: HandChipProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  const stroke = active ? color : ink;
  const strokeWidth = 1.2;

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={[
        styles.base,
        {
          backgroundColor: active ? color : 'transparent',
          borderRadius: radius.pill,
        },
        style,
      ]}
    >
      {size.w > 0 && size.h > 0 && (
        <Svg
          width={size.w}
          height={size.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={size.w - strokeWidth}
            height={size.h - strokeWidth}
            rx={size.h / 2}
            ry={size.h / 2}
            fill="transparent"
            stroke={stroke}
            strokeOpacity={active ? 1 : 0.75}
            strokeWidth={strokeWidth}
            filter={wobble > 0 ? `url(#wobble-${Math.min(3, wobble)})` : undefined}
          />
        </Svg>
      )}
      <Text
        style={[
          styles.label,
          { color: active ? colors.white : ink },
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 32,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.body,
    fontSize: typeScale.chip,
    fontWeight: '600',
    letterSpacing: 0.2,
    position: 'relative',
    zIndex: 1,
  },
});
