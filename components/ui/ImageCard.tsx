import { Image, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../../constants/theme';
import { Pill } from './Pill';

interface ImageCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export function ImageCard({
  imageUrl,
  title,
  subtitle,
  tags = [],
  style,
  imageStyle,
}: ImageCardProps) {
  return (
    <View style={[styles.card, shadows.soft, style]}>
      <Image source={{ uri: imageUrl }} style={[styles.image, imageStyle]} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <Pill key={tag} label={tag} tone="blue" />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  image: {
    height: 190,
    width: '100%',
    backgroundColor: colors.softGray,
  },
  copy: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
});
