import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { Pill } from '../../components/ui/Pill';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import { inspirations } from '../../data/placeholders';
import type { InspirationImage } from '../../types/models';

const filters = ['All', 'Cute', 'French', 'Chrome', 'Gel', 'Wedding'];
const cardHeights = [218, 276, 194, 246, 286, 206, 258, 224];

const columns = inspirations.reduce<InspirationImage[][]>(
  (result, item, index) => {
    result[index % 2].push(item);
    return result;
  },
  [[], []],
);

export default function InspirationScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="Browse" title="Inspiration" action={`${inspirations.length} ideas`} />
      <View style={styles.featured}>
        <View style={styles.featuredCopy}>
          <Text style={styles.featuredTitle}>Fresh soft sets</Text>
          <Text style={styles.featuredText}>Pastel designs saved for your next appointment.</Text>
        </View>
        <View style={styles.bubbles}>
          <View style={styles.pinkBubble} />
          <View style={styles.blueBubble} />
        </View>
      </View>
      <View style={styles.filters}>
        {filters.map((filter, index) => (
          <Pill key={filter} label={filter} tone={index === 0 ? 'pink' : 'blue'} />
        ))}
      </View>
      <View style={styles.masonry}>
        {columns.map((column, columnIndex) => (
          <View key={columnIndex} style={styles.column}>
            {column.map((item, itemIndex) => {
              const originalIndex = columnIndex + itemIndex * 2;

              return (
                <InspirationPin
                  index={originalIndex}
                  item={item}
                  key={item.id}
                />
              );
            })}
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

function InspirationPin({ item, index }: { item: InspirationImage; index: number }) {
  const sourceLabel = item.sourceType === 'admin' ? 'Kuri Labo' : 'Customer set';

  return (
    <Pressable style={({ pressed }) => [styles.pin, pressed && styles.pinPressed]}>
      <View style={[styles.imageWrap, shadows.soft]}>
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.image, { height: cardHeights[index % cardHeights.length] }]}
        />
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{sourceLabel}</Text>
        </View>
      </View>
      <View style={styles.pinCopy}>
        <Text numberOfLines={1} style={styles.pinTitle}>
          {item.title ?? 'Nail idea'}
        </Text>
        <View style={styles.tags}>
          {item.tags?.slice(0, 2).map((tag) => (
            <Text key={tag} style={styles.tagText}>
              #{tag}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  featured: {
    minHeight: 132,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  featuredCopy: {
    maxWidth: 220,
    gap: spacing.xs,
  },
  featuredTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  featuredText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  bubbles: {
    position: 'absolute',
    right: 16,
    top: 18,
    width: 96,
    height: 96,
  },
  pinkBubble: {
    position: 'absolute',
    right: 12,
    top: 2,
    width: 68,
    height: 68,
    borderRadius: 28,
    backgroundColor: colors.pastelPink,
    opacity: 0.72,
  },
  blueBubble: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 58,
    height: 58,
    borderRadius: 24,
    backgroundColor: colors.babyBlue,
    opacity: 0.52,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  masonry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    gap: spacing.lg,
  },
  pin: {
    gap: spacing.sm,
  },
  pinPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  imageWrap: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  image: {
    width: '100%',
    backgroundColor: colors.softGray,
  },
  sourceBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  sourceText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  pinCopy: {
    gap: 4,
    paddingHorizontal: 4,
  },
  pinTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
