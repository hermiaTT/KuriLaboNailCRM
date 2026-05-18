import React, { ReactNode, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, radius, type WobbleIntensity } from '../../constants/theme';

interface HandRectProps {
  children?: ReactNode;
  /** Fill color (background). Default cream card. */
  fill?: string;
  /** Stroke color for the hand-drawn border. */
  stroke?: string;
  /** Stroke width in px. */
  strokeWidth?: number;
  /** Corner radius — pick from the radii scale (sm/md/lg/xl/pill). */
  radius?: number;
  /** Dashed border. */
  dashed?: boolean;
  /** Wobble intensity: 0 = off, 1 = subtle (default), 2 = medium, 3 = heavy. */
  wobble?: WobbleIntensity;
  /** Inner padding. Default 16. */
  padding?: number;
  /** Render as a Pressable. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * HandRect — the card primitive. A perfectly-rounded RN View underneath
 * for the fill, plus an SVG `<Rect>` overlay carrying the wobble filter
 * so the EDGE looks hand-drawn without warping content.
 *
 *   <HandRect>{children}</HandRect>
 *   <HandRect fill={colors.pinkSoft} stroke={colors.pinkInk}>…</HandRect>
 *   <HandRect onPress={…} wobble={2}>…</HandRect>
 */
export function HandRect({
  children,
  fill = colors.creamCard,
  stroke = colors.ink,
  strokeWidth = 1.5,
  radius: r = radius.lg,
  dashed = false,
  wobble = 1,
  padding = 16,
  onPress,
  style,
}: HandRectProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) {
      setSize({ w: width, h: height });
    }
  };

  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      onLayout={onLayout}
      style={[
        styles.base,
        { backgroundColor: fill, borderRadius: r, padding },
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
            rx={Math.max(0, r - strokeWidth / 2)}
            ry={Math.max(0, r - strokeWidth / 2)}
            fill="transparent"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashed ? '4,3' : undefined}
            filter={wobble > 0 ? `url(#wobble-${Math.min(3, wobble)})` : undefined}
          />
        </Svg>
      )}
      <View style={styles.content}>{children}</View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'relative',
    overflow: 'visible',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
