import React from 'react';
import { Platform, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { colors, fonts, radius, typeScale } from '../../constants/theme';
import { HandRect } from './HandRect';

interface FieldProps extends TextInputProps {
  /** Wrapper style. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Multi-line text area. */
  multiline?: boolean;
}

/**
 * Field — text input wrapped in a HandRect. Use for all auth/form inputs.
 *
 *   <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address"/>
 *   <Field placeholder="Notes" multiline/>
 */
export function Field({ containerStyle, multiline, style, ...rest }: FieldProps) {
  return (
    <View style={containerStyle}>
      <HandRect padding={0} radius={radius.md} fill={colors.creamCard}>
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={colors.inkFaint}
          style={[
            styles.input,
            multiline && styles.multiline,
            style,
          ]}
        />
      </HandRect>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    minHeight: 48,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
});
