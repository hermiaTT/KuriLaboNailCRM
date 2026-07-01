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
  HandChip,
  HandRect,
  Icons,
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
} from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type NailImage = { id: string; image_url: string; display_order: number };
type Collection = {
  id: string;
  title: string | null;
  tags: string[] | null;
  created_at: string;
  nail_images: NailImage[];
};

const CARD_HEIGHTS = [220, 180, 240, 200, 240, 180, 220, 240];

export default function InspirationScreen() {
  const { session } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [activeCol, setActiveCol] = useState<Collection | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user.id) return;
      setLoading(true);
      supabase
        .from('collections')
        .select('id, title, tags, created_at, nail_images(id, image_url, display_order)')
        .or(`client_id.is.null,client_id.neq.${session.user.id}`)
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

  const allTags = Array.from(new Set(collections.flatMap(c => c.tags ?? [])));
  const CATEGORIES = [
    { id: 'all', label: 'all', count: collections.length },
    ...allTags.map(t => ({
      id: t,
      label: t,
      count: collections.filter(c => c.tags?.includes(t)).length,
    })),
  ];

  const filtered = cat === 'all' ? collections : collections.filter(c => c.tags?.includes(cat));
  const leftCol = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 === 1);

  return (
    <Screen confettiIntensity={0.3}>
      <ScreenHeader trailing={<Pressable style={styles.headerBtn}><Icons.Bell /></Pressable>} />

      <EyebrowTitle
        eyebrow="for your next visit"
        title="Inspiration"
        trailing={
          <Doodle
            kind="sparkle"
            size={22}
            color={colors.blue}
            style={{ transform: [{ rotate: '15deg' }] }}
          />
        }
      />
      <View style={styles.sub}>
        <Text style={styles.subText}>Save designs to show Kuri at your appointment</Text>
      </View>

      {/* Search bar */}
      <View style={styles.row}>
        <HandRect padding={0} radius={radius.md}>
          <View style={styles.searchRow}>
            <Icons.Search color={colors.inkSoft} />
            <Text style={styles.searchPh}>Search designs…</Text>
          </View>
        </HandRect>
      </View>

      {/* Category chips */}
      {CATEGORIES.length > 1 && (
        <View style={styles.chipRow}>
          {CATEGORIES.map(c => (
            <HandChip key={c.id} active={cat === c.id} onPress={() => setCat(c.id)}>
              {`${c.label}  ${c.count}`}
            </HandChip>
          ))}
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No inspiration yet 🌸</Text>
          <Text style={styles.emptyMeta}>Admin can upload photos from the Upload tab</Text>
        </View>
      ) : (
        <View style={styles.masonry}>
          {[leftCol, rightCol].map((col, ci) => (
            <View key={ci} style={[styles.col, ci === 1 && { marginTop: 24 }]}>
              {col.map((c, i) => {
                const rot =
                  (ci + i) % 3 === 0 ? '-0.8deg' : (ci + i) % 3 === 1 ? '0.7deg' : '0deg';
                const cover = c.nail_images[0];
                const h = CARD_HEIGHTS[(ci * 10 + i) % CARD_HEIGHTS.length];

                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setActiveCol(c)}
                    style={{ transform: [{ rotate: rot }] }}
                  >
                    <HandRect padding={0} radius={radius.md} style={{ overflow: 'hidden' }}>
                      <View style={[styles.imgBox, { height: h }]}>
                        <Image
                          source={{ uri: cover?.image_url }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />

                        {c.nail_images.length > 1 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countText}>1 / {c.nail_images.length}</Text>
                          </View>
                        )}

                        <Pressable
                          style={styles.heartBtn}
                          hitSlop={8}
                          onPress={() =>
                            setLiked(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                          }
                        >
                          <Icons.Heart
                            color={liked[c.id] ? colors.pinkInk : colors.ink}
                            fill={liked[c.id] ? colors.pinkInk : 'none'}
                            size={16}
                          />
                        </Pressable>
                      </View>

                      <View style={styles.cardMeta}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {c.title ?? 'Design'}
                        </Text>
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
  headerBtn: { padding: 6 },
  sub: { paddingHorizontal: spacing.lg, marginTop: -4, marginBottom: spacing.sm },
  subText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },

  row: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  searchPh: { fontFamily: fonts.body, fontSize: 14, color: colors.inkFaint, flex: 1 },

  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
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

  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderWidth: 1, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },

  cardMeta: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  cardTitle: {
    fontFamily: fonts.display, fontSize: 13, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  cardTag: {
    marginTop: 2, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
});
