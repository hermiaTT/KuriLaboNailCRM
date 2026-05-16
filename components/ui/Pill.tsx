import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../../constants/theme';

interface PillProps {
  label: string;
  tone?: 'pink' | 'blue' | 'gray';
}

export function Pill({ label, tone = 'pink' }: PillProps) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'blue' && styles.blue,
        tone === 'gray' && styles.gray,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    backgroundColor: colors.softPink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  blue: {
    backgroundColor: colors.lightBlue,
  },
  gray: {
    backgroundColor: colors.softGray,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});
