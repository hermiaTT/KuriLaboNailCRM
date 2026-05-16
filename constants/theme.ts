import { Platform, StyleSheet } from 'react-native';

export const colors = {
  pastelPink: '#ffc0cb',
  babyBlue: '#89CFF0',
  white: '#ffffff',
  softPink: '#FFFDFA',
  lightBlue: '#f0f9ff',
  softGray: '#f5f5f5',
  ink: '#2f2a2c',
  muted: '#7f7479',
  line: '#f3dfe5',
  success: '#8fcfb4',
  warning: '#f2c879',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  md: 14,
  lg: 20,
  xl: 26,
};

export const typography = {
  title: 30,
  heading: 22,
  body: 16,
  small: 13,
};

export const fonts = {
  title: 'Fredoka_600SemiBold',
  titleBold: 'Fredoka_700Bold',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyItalic: 'Nunito_400Regular_Italic',
};

export const shadows = StyleSheet.create({
  soft: {
    shadowColor: '#ec9fb2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
});
