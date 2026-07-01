import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandButton,
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
} from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type NailImage = { id: string; image_url: string; display_order: number };
type ColRow = {
  id: string;
  title: string | null;
  tags: string[] | null;
  source_type: 'admin' | 'customer';
  created_at: string;
  nail_images: NailImage[];
};

const FILTERS = [
  { id: 'all',      label: 'all' },
  { id: 'admin',    label: 'curated' },
  { id: 'customer', label: 'client' },
];

function storagePathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/images\/(.+)$/);
  return match?.[1] ?? null;
}

export default function AdminGalleryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ColRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchCollections();
    }, []),
  );

  async function fetchCollections() {
    setLoading(true);
    const { data } = await supabase
      .from('collections')
      .select('id, title, tags, source_type, created_at, nail_images(id, image_url, display_order)')
      .order('created_at', { ascending: false });

    setItems(
      (data ?? []).map((c: any) => ({
        ...c,
        nail_images: [...(c.nail_images ?? [])].sort(
          (a: NailImage, b: NailImage) => a.display_order - b.display_order,
        ),
      })),
    );
    setLoading(false);
  }

  async function handleDelete(col: ColRow) {
    Alert.alert(
      'Delete collection',
      `Remove "${col.title ?? 'this collection'}" and all its photos?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(col.id);

            // Clean up storage files
            const paths = col.nail_images
              .map(img => storagePathFromUrl(img.image_url))
              .filter((p): p is string => p !== null);
            if (paths.length > 0) {
              await supabase.storage.from('images').remove(paths);
            }

            await supabase.from('collections').delete().eq('id', col.id);
            setItems(prev => prev.filter(c => c.id !== col.id));
            setDeleting(null);
          },
        },
      ],
    );
  }

  const filtered =
    filter === 'all' ? items : items.filter(c => c.source_type === filter);

  const leftCol = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 === 1);

  const CARD_H = [200, 170, 220, 190, 210, 175];

  return (
    <Screen>
      <ScreenHeader />
      <EyebrowTitle
        eyebrow="admin · gallery"
        title="Uploads"
        trailing={
          <Doodle
            kind="flower"
            size={22}
            color={colors.lilac}
            style={{ transform: [{ rotate: '-12deg' }] }}
          />
        }
      />

      {/* CTA */}
      <View style={styles.row}>
        <HandRect padding={14} radius={radius.lg} fill={colors.blueSoft} stroke={colors.blueInk}>
          <View style={styles.ctaRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ctaTitle}>Add to gallery</Text>
              <Text style={styles.ctaBody}>
                {items.length} collection{items.length !== 1 ? 's' : ''} uploaded so far
              </Text>
            </View>
            <HandButton size="sm" color={colors.blueInk} onPress={() => router.push('/(admin)/upload')}>
              + Upload
            </HandButton>
          </View>
        </HandRect>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map(f => (
          <HandChip key={f.id} active={filter === f.id} onPress={() => setFilter(f.id)}>
            {f.label}
          </HandChip>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Doodle kind="sparkle" size={32} color={colors.blue} />
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyBody}>Upload your first design to start the gallery.</Text>
        </View>
      ) : (
        <View style={styles.masonry}>
          {[leftCol, rightCol].map((col, ci) => (
            <View key={ci} style={[styles.col, ci === 1 && { marginTop: 20 }]}>
              {col.map((item, i) => {
                const cover = item.nail_images[0];
                const h = CARD_H[(ci * 8 + i) % CARD_H.length];
                const rot =
                  (ci + i) % 3 === 0 ? '-0.7deg' : (ci + i) % 3 === 1 ? '0.6deg' : '0deg';
                const isDel = deleting === item.id;

                return (
                  <View key={item.id} style={{ transform: [{ rotate: rot }] }}>
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

                        {/* Count badge */}
                        {item.nail_images.length > 1 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countText}>{item.nail_images.length} photos</Text>
                          </View>
                        )}

                        {/* Source badge */}
                        <View style={styles.sourceBadge}>
                          <Text style={styles.sourceText}>
                            {item.source_type === 'admin' ? 'curated' : 'client'}
                          </Text>
                        </View>

                        {/* Delete button */}
                        <Pressable
                          style={styles.deleteBtn}
                          hitSlop={6}
                          onPress={() => handleDelete(item)}
                          disabled={isDel}
                        >
                          {isDel ? (
                            <ActivityIndicator color={colors.white} size="small" />
                          ) : (
                            <Icons.Trash color={colors.white} size={14} />
                          )}
                        </Pressable>
                      </View>

                      <View style={styles.cardMeta}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title ?? 'Untitled'}
                        </Text>
                        {item.tags?.[0] ? (
                          <Text style={styles.cardTag}>#{item.tags[0]}</Text>
                        ) : null}
                      </View>
                    </HandRect>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },

  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ctaTitle: {
    fontFamily: fonts.display, fontSize: 14, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  ctaBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },

  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: {
    fontFamily: fonts.display, fontSize: 16, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  emptyBody: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, textAlign: 'center' },

  masonry: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.lg },
  col: { flex: 1, gap: 12 },
  imgBox: { overflow: 'hidden', position: 'relative' },

  countBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  countText: { fontFamily: fonts.mono, fontSize: 9, color: colors.white, letterSpacing: 0.4 },

  sourceBadge: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderWidth: 1, borderColor: colors.ink,
  },
  sourceText: {
    fontFamily: fonts.mono, fontSize: 8, color: colors.ink,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.50)',
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
