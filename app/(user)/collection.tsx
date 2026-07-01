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
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type NailImage = { id: string; image_url: string; display_order: number };
type Collection = {
  id: string;
  title: string | null;
  date: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  nail_images: NailImage[];
};

const CARD_HEIGHTS = [220, 180, 240, 200, 240, 180, 220, 240];

export default function CollectionScreen() {
  const { session } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCol, setActiveCol] = useState<Collection | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user.id) return;
      setLoading(true);
      supabase
        .from('collections')
        .select('id, title, date, description, tags, created_at, nail_images(id, image_url, display_order)')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setCollections(
            (data ?? []).map((c: any) => ({
              ...c,
              nail_images: [...(c.nail_images ?? [])].sort(
                (a: NailImage, b: NailImage) => a.display_order - b.display_order,
              ),
            })),
          );
          setLoading(false);
        });
    }, [session?.user.id]),
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
                const cover = c.nail_images[0];
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
                            source={{ uri: cover.image_url }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.creamCard }]} />
                        )}
                        {c.nail_images.length > 1 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countText}>1 / {c.nail_images.length}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardDate}>
                          {formatDate(c.date ?? c.created_at)}
                        </Text>
                        {c.description ? (
                          <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
                        ) : null}
                        {c.tags?.[0] ? (
                          <Text style={styles.cardTag}>#{c.tags[0]}</Text>
                        ) : null}
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
        images={activeCol?.nail_images ?? []}
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
