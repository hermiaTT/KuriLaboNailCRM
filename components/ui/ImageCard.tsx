import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, shadows, spacing, typography } from '../../constants/theme';
import { NailPhotoPlaceholder } from './NailPhotoPlaceholder';
import { Pill } from './Pill';
import { StatusBadge } from './StatusBadge';

interface ImageCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  badgeLabel?: string;
  imageStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
}

export function ImageCard({
  badgeLabel,
  imageUrl,
  imageStyle,
  title,
  subtitle,
  tags = [],
  style,
}: ImageCardProps) {
  return (
    <View style={[styles.card, shadows.soft, style]}>
      <View>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={[styles.image, imageStyle]} />
        ) : (
          <View style={[styles.image, imageStyle]}>
            <NailPhotoPlaceholder />
          </View>
        )}
        {badgeLabel ? (
          <View style={styles.badge}>
            <StatusBadge label={badgeLabel} />
          </View>
        ) : null}
      </View>
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
    fontFamily: fonts.titleBold,
    fontSize: typography.body,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: typography.small,
    lineHeight: 18,
  },
  badge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
});
