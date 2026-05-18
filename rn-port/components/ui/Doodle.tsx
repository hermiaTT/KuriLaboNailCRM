import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../../constants/theme';

export type DoodleKind = 'flower' | 'star' | 'heart' | 'swirl' | 'sparkle';

interface DoodleProps {
  kind?: DoodleKind;
  size?: number;
  /** Fill color. Always rendered with a 1.2px ink stroke. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Doodle — hand-drawn stickers used as decorative accents. Always tilt
 * them when placing (`transform: [{ rotate: '-12deg' }]`).
 *
 *   <Doodle kind="flower" size={24} color={colors.yellow}/>
 *   <Doodle kind="heart" size={32} color={colors.pink}/>
 *
 * Limit: 1–3 doodles per screen.
 */
export function Doodle({
  kind = 'flower',
  size = 28,
  color = colors.coral,
  style,
}: DoodleProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      {kind === 'flower' && (
        <Svg viewBox="0 0 32 32" width={size} height={size}>
          <G stroke={colors.ink} strokeWidth={1.2} fill={color}>
            <Ellipse cx="16" cy="8" rx="4" ry="6"/>
            <Ellipse cx="16" cy="8" rx="4" ry="6" transform="rotate(72 16 16)"/>
            <Ellipse cx="16" cy="8" rx="4" ry="6" transform="rotate(144 16 16)"/>
            <Ellipse cx="16" cy="8" rx="4" ry="6" transform="rotate(216 16 16)"/>
            <Ellipse cx="16" cy="8" rx="4" ry="6" transform="rotate(288 16 16)"/>
          </G>
          <Circle cx="16" cy="16" r="3" fill={colors.yellow} stroke={colors.ink} strokeWidth={1.2}/>
        </Svg>
      )}
      {kind === 'star' && (
        <Svg viewBox="0 0 32 32" width={size} height={size}>
          <Path
            d="M16 3 l4 9 9 1 -7 6 2 9 -8 -4 -8 4 2 -9 -7 -6 9 -1 z"
            fill={color}
            stroke={colors.ink}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </Svg>
      )}
      {kind === 'heart' && (
        <Svg viewBox="0 0 32 32" width={size} height={size}>
          <Path
            d="M16 28 C 6 21 2 14 6 9 C 9 5 13 6 16 10 C 19 6 23 5 26 9 C 30 14 26 21 16 28 Z"
            fill={color}
            stroke={colors.ink}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </Svg>
      )}
      {kind === 'swirl' && (
        <Svg viewBox="0 0 32 32" width={size} height={size}>
          <Path
            d="M 4 16 C 4 8 12 4 18 8 C 24 12 24 22 16 22 C 10 22 10 14 16 14 C 20 14 20 18 16 18"
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      )}
      {kind === 'sparkle' && (
        <Svg viewBox="0 0 32 32" width={size} height={size}>
          <Path
            d="M16 4 L 18 13 L 28 16 L 18 19 L 16 28 L 14 19 L 4 16 L 14 13 Z"
            fill={color}
            stroke={colors.ink}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}
