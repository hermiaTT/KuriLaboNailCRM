import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  action?: string;
}

export function SectionHeader({ title, eyebrow, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? <Text style={styles.action}>{action}</Text> : null}
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
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
  },
  action: {
    color: colors.babyBlue,
    fontSize: typography.small,
    fontWeight: '800',
  },
});
