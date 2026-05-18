import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandButton,
  HandChip,
  HandRect,
  Icons,
  NailHand,
  Screen,
  ScreenHeader,
  type NailTone,
} from '../../components/ui';
import { inspirations } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

const SOURCE_FILTERS = [
  { id: 'all',      label: 'all' },
  { id: 'customer', label: 'from customers' },
  { id: 'admin',    label: 'curated' },
];

const TONES: NailTone[] = ['pink','yellow','green','lilac','coral','blue','mocha','teal'];

/**
 * Admin inspiration management — hidden tab. Reached from dashboard "see all"
 * or from the upload screen after toggling "share to inspiration".
 */
export default function AdminInspirationScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const items = filter === 'all'
    ? inspirations
    : inspirations.filter((i) => i.sourceType === filter);

  return (
    <Screen confettiIntensity={0.3}>
      <ScreenHeader
        trailing={
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Icons.ChevL color={colors.ink}/>
            <Text style={styles.backText}>back</Text>
          </Pressable>
        }
      />
      <EyebrowTitle
        eyebrow="gallery"
        title="Inspiration"
        trailing={<Doodle kind="flower" size={20} color={colors.lilac} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* CTA */}
      <View style={styles.row}>
        <HandRect padding={16} radius={radius.lg} fill={colors.blueSoft} stroke={colors.blueInk}>
          <View style={styles.ctaRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ctaTitle}>Upload to gallery</Text>
              <Text style={styles.ctaBody}>Curated images appear under “Inspiration” in the user app.</Text>
            </View>
            <HandButton size="sm" color={colors.blueInk} onPress={() => router.push('/(admin)/upload')}>
              + Add
            </HandButton>
          </View>
        </HandRect>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {SOURCE_FILTERS.map((f) => (
          <HandChip key={f.id} active={filter === f.id} onPress={() => setFilter(f.id)}>
            {f.label}
          </HandChip>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {items.map((it, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <View key={it.id} style={[styles.cell, { transform: [{ rotate: i % 2 === 0 ? '-0.6deg' : '0.6deg' }] }]}>
              <HandRect padding={0} radius={radius.md} style={{ overflow: 'hidden' }}>
                <View style={styles.image}>
                  <NailHand tone={tone}/>
                  <View style={styles.sourceTag}>
                    <Text style={styles.sourceText}>
                      {it.sourceType === 'admin' ? 'curated' : 'customer'}
                    </Text>
                  </View>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.title}>{it.title || 'Untitled'}</Text>
                  <View style={styles.metaRow}>
                    {(it.tags ?? []).slice(0, 2).map((t) => (
                      <Text key={t} style={styles.tag}>#{t}</Text>
                    ))}
                  </View>
                </View>
              </HandRect>
            </View>
          );
        })}

        {items.length === 0 && (
          <HandRect padding={28} radius={radius.lg} dashed style={[styles.empty, { width: '100%' }]}>
            <Doodle kind="sparkle" size={32} color={colors.blue}/>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Upload your first design to start the gallery.</Text>
          </HandRect>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 8 },
  backText: {
    fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.ink,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ctaTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, letterSpacing: letterSpacing.display },
  ctaBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },

  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  cell: { width: '47%' },
  image: {
    aspectRatio: 1,
    overflow: 'hidden',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    position: 'relative',
  },
  sourceTag: {
    position: 'absolute',
    top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderWidth: 1, borderColor: colors.ink,
  },
  sourceText: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.ink,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  meta: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  title: {
    fontFamily: fonts.display, fontSize: 13, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  tag: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  empty: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, letterSpacing: letterSpacing.display },
  emptyBody:  { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, textAlign: 'center' },
});
