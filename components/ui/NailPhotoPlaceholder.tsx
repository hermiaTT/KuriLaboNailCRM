import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '../../constants/theme';

interface NailPhotoPlaceholderProps {
  label?: string;
  tone?: 'silver' | 'cream' | 'pink' | 'dark';
}

export function NailPhotoPlaceholder({
  label = 'KuriLabo photo',
  tone = 'silver',
}: NailPhotoPlaceholderProps) {
  return (
    <View style={[styles.wrap, toneStyles[tone]]}>
      <Text style={styles.brand}>KuriLabo.</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: spacing.xs,
    borderRadius: radius.lg,
  },
  brand: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: typography.heading,
    opacity: 0.9,
  },
  label: {
    color: colors.white,
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    opacity: 0.72,
  },
});

const toneStyles = StyleSheet.create({
  silver: {
    backgroundColor: '#9ca5a0',
  },
  cream: {
    backgroundColor: '#d9cfc1',
  },
  pink: {
    backgroundColor: '#d94f8b',
  },
  dark: {
    backgroundColor: '#111111',
  },
});
