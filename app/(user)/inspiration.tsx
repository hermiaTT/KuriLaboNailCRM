import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Doodle,
  EyebrowTitle,
  HandChip,
  HandRect,
  Icons,
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
  tags: string[] | null;
  created_at: string;
  nail_images: NailImage[];
};

const SCREEN_W = Dimensions.get('window').width;
const CARD_HEIGHTS = [220, 180, 240, 200, 240, 180, 220, 240];

export default function InspirationScreen() {
  const { session } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [activeCol, setActiveCol] = useState<Collection | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

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

  const totalImgs = activeCol?.nail_images.length ?? 0;
  const activeImg = activeCol?.nail_images[activeIdx] ?? null;

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
                    onPress={() => { setActiveCol(c); setActiveIdx(0); }}
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

      {/* Lightbox */}
      <Modal
        visible={!!activeCol}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveCol(null)}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={() => setActiveCol(null)}>
          <SafeAreaView style={styles.overlayTop}>
            <Pressable onPress={() => setActiveCol(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            {totalImgs > 1 && (
              <Text style={styles.pageCounter}>{activeIdx + 1} / {totalImgs}</Text>
            )}
          </SafeAreaView>

          <Pressable style={styles.lightboxBody} onPress={() => {}}>
            <Pressable
              style={[styles.arrowBtn, activeIdx === 0 && styles.arrowDisabled]}
              onPress={() => setActiveIdx(n => Math.max(0, n - 1))}
              disabled={activeIdx === 0}
            >
              <Icons.ChevL color={colors.white} size={28} />
            </Pressable>

            {activeImg && (
              <Image
                source={{ uri: activeImg.image_url }}
                style={styles.lightboxImg}
                resizeMode="contain"
              />
            )}

            <Pressable
              style={[styles.arrowBtn, activeIdx === totalImgs - 1 && styles.arrowDisabled]}
              onPress={() => setActiveIdx(n => Math.min(totalImgs - 1, n + 1))}
              disabled={activeIdx === totalImgs - 1}
            >
              <Icons.Chev color={colors.white} size={28} />
            </Pressable>
          </Pressable>

          {totalImgs > 1 && (
            <View style={styles.dots}>
              {activeCol!.nail_images.map((_, i) => (
                <Pressable key={i} onPress={() => setActiveIdx(i)}>
                  <View style={[styles.dot, i === activeIdx && styles.dotActive]} />
                </Pressable>
              ))}
            </View>
          )}

          {(activeCol?.title || activeCol?.tags?.[0]) && (
            <View style={styles.caption}>
              {activeCol.title && (
                <Text style={styles.captionTitle}>{activeCol.title}</Text>
              )}
              {activeCol.tags?.[0] && (
                <Text style={styles.captionTag}>#{activeCol.tags[0]}</Text>
              )}
            </View>
          )}
        </Pressable>
      </Modal>
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

  // Lightbox
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', justifyContent: 'center' },
  overlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: colors.white, fontSize: 18, fontWeight: '300' },
  pageCounter: {
    fontFamily: fonts.mono, fontSize: 11,
    color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8,
  },
  lightboxBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  lightboxImg: { flex: 1, height: SCREEN_W },
  arrowBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: colors.white, width: 18, borderRadius: 3 },
  caption: { paddingHorizontal: 24, paddingTop: 16, alignItems: 'center', gap: 4 },
  captionTitle: {
    fontFamily: fonts.display, fontSize: 16, color: colors.white,
    letterSpacing: letterSpacing.display,
  },
  captionTag: {
    fontFamily: fonts.mono, fontSize: 10,
    color: 'rgba(255,255,255,0.5)', letterSpacing: 0.6, textTransform: 'uppercase',
  },
});
