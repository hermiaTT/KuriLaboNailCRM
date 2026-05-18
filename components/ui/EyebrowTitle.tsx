import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, letterSpacing, spacing, typeScale } from '../../constants/theme';
import { ScribbleUnderline } from './ScribbleUnderline';

interface EyebrowTitleProps {
  eyebrow: string;
  title: string;
  /** Inline decoration after the title (e.g. a Doodle). */
  trailing?: ReactNode;
  /** Add a scribble underline below the title. Default false. */
  underline?: boolean;
  /** Size of the title font. Default 28. */
  size?: number;
}

/**
 * EyebrowTitle — the standard screen title block:
 *
 *   YOUR ARCHIVE
 *   Collection ♡
 *   〰〰〰〰
 *
 * Always lives inside a Screen, in a {paddingHorizontal: lg} container.
 *
 *   <EyebrowTitle eyebrow="your archive" title="Collection" underline/>
 */
export function EyebrowTitle({ eyebrow, title, trailing, underline = false, size = typeScale.title }: EyebrowTitleProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { fontSize: size }]} numberOfLines={1}>{title}</Text>
        {trailing}
      </View>
      {underline && <ScribbleUnderline width={64} height={6} style={{ marginTop: 2 }}/>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  titleRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'nowrap',
  },
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
});
