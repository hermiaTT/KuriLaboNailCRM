import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo, KuriCard, NailPhotoPlaceholder, ScreenContainer } from '../../components/ui';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';
import { inspirations } from '../../data/placeholders';
import type { InspirationImage } from '../../types/models';

const inspirationSections = [
  {
    id: 'summer',
    title: 'Summer Vibes',
    count: 12,
    icon: '♡',
    accent: '#ff5f7e',
    background: '#ffe0e3',
  },
  {
    id: 'elegant',
    title: 'Elegant Nails',
    count: 8,
    icon: '☆',
    accent: '#ff5f7e',
    background: '#e8f3ff',
  },
  {
    id: 'bold',
    title: 'Bold & Bright',
    count: 15,
    icon: '◌',
    accent: '#ff5f7e',
    background: '#fff2df',
  },
  {
    id: 'minimal',
    title: 'Minimalist',
    count: 6,
    icon: '✧',
    accent: '#ff5f7e',
    background: '#efffe7',
  },
  {
    id: 'glitter',
    title: 'Glitter Magic',
    count: 10,
    icon: '☆',
    accent: '#ff5f7e',
    background: '#ffe7fb',
  },
  {
    id: 'french',
    title: 'French Tips',
    count: 7,
    icon: '♡',
    accent: '#ff5f7e',
    background: '#e0fffb',
  },
];

const borderAccents = ['#ff4f70', '#8b6bff', '#74c9f2', '#ffb36b'];

type InspirationSection = (typeof inspirationSections)[number];

export default function InspirationScreen() {
  const [selectedSection, setSelectedSection] = useState<InspirationSection | null>(null);
  const visibleDesigns = useMemo(
    () => buildSectionDesigns(selectedSection),
    [selectedSection],
  );

  if (selectedSection) {
    return (
      <SectionGallery
        designs={visibleDesigns}
        onBack={() => setSelectedSection(null)}
        section={selectedSection}
      />
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <BrandHeader />
      <View style={styles.sectionList}>
        {inspirationSections.map((section) => (
          <SectionRow
            key={section.id}
            onPress={() => setSelectedSection(section)}
            section={section}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

function BrandHeader() {
  return (
    <View style={styles.brandHeader}>
      <BrandLogo width={150} />
    </View>
  );
}

function SectionRow({
  onPress,
  section,
}: {
  onPress: () => void;
  section: InspirationSection;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <KuriCard style={styles.sectionRow}>
        <View style={[styles.sectionIconBox, { backgroundColor: section.background }]}>
          <Text style={[styles.sectionIcon, { color: section.accent }]}>{section.icon}</Text>
        </View>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionMeta}>{section.count} designs</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </KuriCard>
    </Pressable>
  );
}

function SectionGallery({
  designs,
  onBack,
  section,
}: {
  designs: InspirationImage[];
  onBack: () => void;
  section: InspirationSection;
}) {
  return (
    <ScreenContainer contentStyle={styles.galleryScreen}>
      <BrandHeader />
      <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.galleryHeader}>
        <Text style={styles.galleryTitle}>{section.title}</Text>
        <Text style={styles.galleryCount}>{section.count} designs</Text>
      </View>

      <View style={styles.designGrid}>
        {designs.map((item, index) => (
          <SquareNailCard
            accent={borderAccents[index % borderAccents.length]}
            item={item}
            key={`${section.id}-${item.id}-${index}`}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

function SquareNailCard({
  accent,
  item,
}: {
  accent: string;
  item: InspirationImage;
}) {
  return (
    <View style={styles.squareCardWrap}>
      <View style={[styles.offsetBorder, { borderColor: accent }]} />
      <View style={styles.squareCard}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.squareImage} />
        ) : (
          <NailPhotoPlaceholder label={item.title} tone={getPlaceholderTone(item)} />
        )}
      </View>
    </View>
  );
}

function getPlaceholderTone(item: InspirationImage) {
  if (item.tags?.includes('pink')) return 'pink';
  if (item.tags?.includes('black')) return 'dark';
  if (item.tags?.includes('gold')) return 'cream';
  return 'silver';
}

function buildSectionDesigns(section: InspirationSection | null) {
  if (!section) return [];

  const repeats = Math.ceil(section.count / inspirations.length);
  const repeated = Array.from({ length: repeats }, () => inspirations).flat();

  return repeated.slice(0, section.count);
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  brandHeader: {
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  sectionList: {
    gap: spacing.lg,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 112,
    borderRadius: 24,
  },
  sectionIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderWidth: 2,
    borderColor: '#e7dfdc',
    borderRadius: 18,
  },
  sectionIcon: {
    fontFamily: fonts.title,
    fontSize: 38,
  },
  sectionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.title,
    fontSize: 22,
  },
  sectionMeta: {
    color: colors.muted,
    fontFamily: fonts.bodyItalic,
    fontSize: typography.small,
  },
  chevron: {
    color: '#8b8788',
    fontFamily: fonts.body,
    fontSize: 36,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  galleryScreen: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backText: {
    color: '#ff5f7e',
    fontFamily: fonts.bodyItalic,
    fontSize: typography.body,
  },
  galleryHeader: {
    gap: spacing.sm,
  },
  galleryTitle: {
    color: colors.ink,
    fontFamily: fonts.titleBold,
    fontSize: 22,
  },
  galleryCount: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: typography.small,
  },
  designGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  squareCardWrap: {
    position: 'relative',
    width: '47.8%',
    aspectRatio: 1,
    marginBottom: spacing.md,
  },
  offsetBorder: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    borderWidth: 2,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  squareCard: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  squareImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.softGray,
  },
});
