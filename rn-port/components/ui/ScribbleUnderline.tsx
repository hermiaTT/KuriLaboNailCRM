import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constants/theme';

interface ScribbleUnderlineProps {
  color?: string;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * ScribbleUnderline — short wavy stroke that sits 2 px below a section
 * title to give it a "highlight-marker" feel. Use sparingly: at most
 * one per scroll viewport.
 *
 *   <Text>Collection</Text>
 *   <ScribbleUnderline width={64}/>
 */
export function ScribbleUnderline({
  color = colors.pinkInk,
  width = 80,
  height = 8,
  style,
}: ScribbleUnderlineProps) {
  return (
    <Svg viewBox="0 0 80 8" width={width} height={height} style={style as any}>
      <Path
        d="M 2,4 C 14,1 28,7 42,3 C 56,1 70,6 78,3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
