import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constants/theme';

interface BrushHighlightProps {
  children: ReactNode;
  /** Brush color. Default logo blue. */
  color?: string;
  opacity?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  /** Style applied to the wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Style applied to the inner text. */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * BrushHighlight — irregular brushstroke shape that sits BEHIND inline
 * text. Use for the "KuriLabo" wordmark, the user's name, a celebrated
 * selected-date chip, or a section eyebrow accent.
 *
 *   <BrushHighlight><Text>KuriLabo</Text></BrushHighlight>
 *
 * Keep it to 1–2 words. Don't use it under sentences.
 */
export function BrushHighlight({
  children,
  color = colors.blue,
  opacity = 0.6,
  paddingHorizontal = 12,
  paddingVertical = 4,
  style,
  textStyle,
}: BrushHighlightProps) {
  return (
    <View
      style={[
        styles.wrap,
        { paddingHorizontal, paddingVertical },
        style,
      ]}
    >
      <Svg
        viewBox="0 0 120 30"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Path
          d="M 4,18 C 2,8 14,3 30,4 C 50,2 70,6 92,3 C 110,2 118,8 117,17 C 119,24 108,28 90,26 C 70,29 50,25 28,28 C 12,28 2,26 4,18 Z"
          fill={color}
          opacity={opacity}
        />
      </Svg>
      {typeof children === 'string' ? (
        <Text style={[styles.text, textStyle]}>{children}</Text>
      ) : (
        <View style={styles.text}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  text: {
    position: 'relative',
    zIndex: 1,
  },
});
