import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandRect,
  NailCardModal,
  Screen,
  ScreenHeader,
} from '../../components/ui';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';
import { api, mediaUrl } from '../../lib/api';
import type { NailSet } from '../../types/api';

const CARD_HEIGHTS = [220, 180, 240, 200, 240, 180, 220, 240];

export default function CollectionScreen() {
  const [collections, setCollections] = useState<NailSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCol, setActiveCol] = useState<NailSet | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api<NailSet[]>('/api/v1/nail-sets/mine')
        .then(setCollections)
        .finally(() => setLoading(false));
    }, []),
  );

  const leftCol = collections.filter((_, i) => i % 2 === 0);
  const rightCol = collections.filter((_, i) => i % 2 === 1);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).toUpperCase();
  }

  return (
    <Screen>
      <ScreenHeader trailing={<Text style={styles.headerMeta}>{collections.length} designs</Text>} />
      <EyebrowTitle
        eyebrow="your archive"
        title="Collection"
        underline
        trailing={
          <Doodle kind="heart" size={20} color={colors.pink} style={{ transform: [{ rotate: '-12deg' }] }} />
        }
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.pinkInk} /></View>
      ) : collections.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No photos yet 🌸</Text>
          <Text style={styles.emptyMeta}>Your nail looks will appear here after your visit</Text>
        </View>
      ) : (
        <View style={styles.masonry}>
          {[leftCol, rightCol].map((col, ci) => (
            <View key={ci} style={[styles.col, ci === 1 && { marginTop: 24 }]}>
              {col.map((c, i) => {
                const cover = c.images[0];
                const h = CARD_HEIGHTS[(ci * 10 + i) % CARD_HEIGHTS.length];
                const rot = (ci + i) % 3 === 0 ? '-0.8deg' : (ci + i) % 3 === 1 ? '0.7deg' : '0deg';
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setActiveCol(c)}
                    style={{ transform: [{ rotate: rot }] }}
                  >
                    <HandRect padding={0} radius={radius.md} style={{ overflow: 'hidden' }}>
                      <View style={[styles.imgBox, { height: h }]}>
                        {cover ? (
                          <Image
                            source={{ uri: mediaUrl(cover.url) }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.creamCard }]} />
                        )}
                        {c.images.length > 1 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countText}>1 / {c.images.length}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardDate}>
                          {formatDate(c.createdAt)}
                        </Text>
                        {c.description ? (
                          <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
                        ) : null}
                        <Text style={styles.cardTag}>{c.title}</Text>
                      </View>
                    </HandRect>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <NailCardModal
        visible={!!activeCol}
        onClose={() => setActiveCol(null)}
        images={(activeCol?.images ?? []).map((image) => ({ id: image.id, image_url: mediaUrl(image.url) }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerMeta: {
    fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: {
    fontFamily: fonts.display, fontSize: 16, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  emptyMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },

  masonry: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.lg },
  col: { flex: 1, gap: 12 },
  imgBox: { overflow: 'hidden', position: 'relative' },

  countBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  countText: { fontFamily: fonts.mono, fontSize: 9, color: colors.white, letterSpacing: 0.4 },

  cardMeta: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  cardDate: {
    fontFamily: fonts.mono, fontSize: typeScale.metaTiny ?? 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  cardDesc: {
    marginTop: 2, fontFamily: fonts.display, fontSize: 13, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  cardTag: {
    marginTop: 2, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
});
