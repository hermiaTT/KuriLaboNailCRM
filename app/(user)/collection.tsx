import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NailPhotoPlaceholder, ScreenContainer, SectionTitle } from '../../components/ui';
import { colors, fonts, radius, shadows, spacing, typography } from '../../constants/theme';
import { collectionItems } from '../../data/placeholders';
import type { NailCollectionItem } from '../../types/models';

export default function CollectionScreen() {
  return (
    <ScreenContainer contentStyle={styles.screen}>
      <SectionTitle
        eyebrow="Your archive"
        subtitle="Tap a design to see the appointment date."
        title="Collection"
      />

      <View style={styles.grid}>
        {collectionItems.map((item) => (
          <FlipNailCard item={item} key={item.id} />
        ))}
      </View>
    </ScreenContainer>
  );
}

function FlipNailCard({ item }: { item: NailCollectionItem }) {
  const [flipped, setFlipped] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const frontRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  function toggleFlip() {
    Animated.spring(animation, {
      friction: 8,
      tension: 72,
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
    }).start();
    setFlipped((current) => !current);
  }

  return (
    <Pressable onPress={toggleFlip} style={styles.cardShell}>
      <Animated.View
        style={[
          styles.flipFace,
          shadows.soft,
          { transform: [{ perspective: 900 }, { rotateY: frontRotation }] },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <NailPhotoPlaceholder label={item.description} />
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.flipFace,
          styles.backFace,
          { transform: [{ perspective: 900 }, { rotateY: backRotation }] },
        ]}
      >
        <Text style={styles.backEyebrow}>Appointment Date</Text>
        <Text style={styles.backDate}>{item.date}</Text>
        <Text style={styles.backHint}>Tap to view design</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  cardShell: {
    width: '47.8%',
    aspectRatio: 1,
  },
  flipFace: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    backfaceVisibility: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.softGray,
  },
  backFace: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.lightBlue,
    padding: spacing.md,
  },
  backEyebrow: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  backDate: {
    color: colors.ink,
    fontFamily: fonts.titleBold,
    fontSize: typography.heading,
    textAlign: 'center',
  },
  backHint: {
    color: colors.muted,
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    textAlign: 'center',
  },
});
