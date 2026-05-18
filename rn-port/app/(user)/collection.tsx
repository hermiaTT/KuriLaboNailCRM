import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ConfettiBg,
  Doodle,
  EyebrowTitle,
  HandChip,
  HandRect,
  Icons,
  NailHand,
  Screen,
  ScreenHeader,
  type NailTone,
} from '../../components/ui';
import { collectionItems } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

const FILTERS = [
  { id: 'all',    label: 'all' },
  { id: '2026',   label: '2026' },
  { id: 'gel',    label: 'gel' },
  { id: 'french', label: 'french' },
  { id: 'chrome', label: 'chrome' },
];

/** Map a collection item to a placeholder tone until photos are wired up. */
function toneFor(tags?: string[]): NailTone {
  if (!tags || !tags.length) return 'pink';
  const t = tags[0];
  if (t === 'glass' || t === 'ribbon' || t === 'pink') return 'pink';
  if (t === 'gold' || t === 'french') return 'yellow';
  if (t === 'chrome' || t === 'sage') return 'green';
  if (t === 'lilac') return 'lilac';
  if (t === 'peach' || t === 'foil') return 'coral';
  if (t === 'mocha' || t === 'nude') return 'mocha';
  return 'pink';
}

export default function CollectionScreen() {
  const [filter, setFilter] = useState('all');
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const items = useMemo(() => collectionItems, []);

  return (
    <Screen>
      <ScreenHeader
        trailing={
          <Text style={styles.headerMeta}>{items.length} designs</Text>
        }
      />
      <EyebrowTitle
        eyebrow="your archive"
        title="Collection"
        underline
        trailing={<Doodle kind="heart" size={20} color={colors.pink} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <HandChip key={f.id} active={filter === f.id} onPress={() => setFilter(f.id)}>
            {f.label}
          </HandChip>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {items.map((it, i) => {
          const isFlipped = !!flipped[it.id];
          const rot = i % 2 === 0 ? '-0.6deg' : '0.6deg';
          return (
            <Pressable
              key={it.id}
              onPress={() => setFlipped((s) => ({ ...s, [it.id]: !s[it.id] }))}
              style={[styles.cell, { transform: [{ rotate: rot }] }]}
            >
              <HandRect padding={0} radius={radius.md} style={{ overflow: 'hidden' }}>
                <View style={styles.image}>
                  {isFlipped ? (
                    <View style={styles.flipBack}>
                      <ConfettiBg intensity={0.18}/>
                      <Doodle kind="star" size={26} color={colors.yellow}
                        style={styles.flipDoodle}/>
                      <Text style={styles.flipEyebrow}>visited on</Text>
                      <Text style={styles.flipDate}>{it.date}</Text>
                      <Text style={styles.flipHint}>tap to flip back</Text>
                    </View>
                  ) : (
                    <NailHand tone={toneFor(it.tags)}/>
                  )}
                </View>
                <View style={styles.cellMeta}>
                  <Text style={styles.cellDate}>{it.date.split(',')[0].toUpperCase()}</Text>
                  <Text style={styles.cellDesc} numberOfLines={2}>{it.description}</Text>
                </View>
              </HandRect>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerMeta: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  cell: {
    width: '47%',
  },
  image: {
    aspectRatio: 1 / 1.15,
    overflow: 'hidden',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  cellMeta: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  cellDate: {
    fontFamily: fonts.mono,
    fontSize: typeScale.metaTiny,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.meta,
  },
  cellDesc: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  flipBack: {
    flex: 1,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  flipDoodle: {
    position: 'absolute',
    top: 10,
    right: 10,
    transform: [{ rotate: '15deg' }],
  },
  flipEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.blueInk,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  flipDate: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
    textAlign: 'center',
  },
  flipHint: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    fontStyle: 'italic',
  },
});
