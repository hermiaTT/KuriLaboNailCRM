import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '../../constants/theme';

interface KuriInputProps extends TextInputProps {
  label?: string;
  helperText?: string;
}

export function KuriInput({ helperText, label, style, ...inputProps }: KuriInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...inputProps}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: typography.small,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.softGray,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
  },
  helper: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
});
