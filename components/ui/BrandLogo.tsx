import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

const logoSource = require('../../assets/name.png');

interface BrandLogoProps {
  height?: number;
  style?: StyleProp<ImageStyle>;
  width?: number;
}

export function BrandLogo({ height = 34, style, width = 150 }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="KuriLabo"
      resizeMode="cover"
      source={logoSource}
      style={[styles.logo, { height, width }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    overflow: 'hidden',
  },
});
