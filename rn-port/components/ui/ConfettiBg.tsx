import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { confettiDots } from '../../constants/theme';

interface ConfettiBgProps {
  /** 0–1, multiplies the dots' opacity. Default 0.4. */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * ConfettiBg — the logo's signature dot scatter. Render as the very
 * first child of any cream surface; sits behind everything. Don't use
 * over a photo-heavy section.
 *
 *   <ConfettiBg intensity={0.35}/>
 */
export function ConfettiBg({ intensity = 0.4, style }: ConfettiBgProps) {
  if (intensity <= 0) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: intensity }, style]}>
      <Svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
      >
        {confettiDots.map((d, i) => (
          <Ellipse
            key={i}
            cx={d.x}
            cy={d.y}
            rx={d.r * 0.32}
            ry={d.r * 0.34}
            fill={d.c}
            rotation={(i * 17) % 90 - 45}
            origin={`${d.x}, ${d.y}`}
          />
        ))}
      </Svg>
    </View>
  );
}
