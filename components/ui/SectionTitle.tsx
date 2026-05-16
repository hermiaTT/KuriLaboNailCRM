import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, typography } from '../../constants/theme';

interface SectionTitleProps {
  action?: ReactNode;
  align?: 'left' | 'center';
  eyebrow?: string;
  subtitle?: string;
  title: string;
}

export function SectionTitle({
  action,
  align = 'left',
  eyebrow,
  subtitle,
  title,
}: SectionTitleProps) {
  return (
    <View style={[styles.row, align === 'center' && styles.centered]}>
      <View style={[styles.copy, align === 'center' && styles.centeredCopy]}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={[styles.title, align === 'center' && styles.centerText]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, align === 'center' && styles.centerText]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  centeredCopy: {
    alignItems: 'center',
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: typography.small,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.titleBold,
    fontSize: typography.title,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: typography.body,
    lineHeight: 23,
  },
  centerText: {
    textAlign: 'center',
  },
  action: {
    alignItems: 'flex-end',
  },
});
