import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, letterSpacing, spacing, typeScale } from '../../constants/theme';
import { BrushHighlight } from './BrushHighlight';

interface ScreenHeaderProps {
  /** Trailing element (icon button, count, etc). */
  trailing?: ReactNode;
}

/**
 * ScreenHeader — the brand wordmark line. Always at the top of a Screen,
 * sits inside the screen padding zone.
 *
 *   <ScreenHeader trailing={<Pressable>{Icons.Bell()}</Pressable>}/>
 *
 * Don't render two on one screen. If you need a nav bar with a back
 * button instead, write that pattern inline — this header is reserved
 * for the brand mark.
 */
export function ScreenHeader({ trailing }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <BrushHighlight color={colors.blue} opacity={0.55} paddingHorizontal={14}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={styles.brand}>KuriLabo</Text>
          <Text style={[styles.brand, { color: colors.pinkInk }]}>.</Text>
        </View>
      </BrushHighlight>
      <View>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: typeScale.brand,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
});
