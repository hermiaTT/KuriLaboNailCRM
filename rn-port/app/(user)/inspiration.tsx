import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
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
import { inspirations } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

const CATEGORIES = [
  { id: 'all',    label: 'all',     count: inspirations.length },
  { id: 'simple', label: 'simple',  count: 4 },
  { id: 'french', label: 'french',  count: 3 },
  { id: 'chrome', label: 'chrome',  count: 2 },
  { id: 'gel',    label: 'gel',     count: 6 },
  { id: 'cute',   label: 'cute',    count: 5 },
];

const TONES: NailTone[] = ['pink','yellow','green','lilac','coral','mocha','blue','teal'];
const HEIGHTS = [220, 180, 240, 200, 240, 180, 220, 240];

export default function InspirationScreen() {
  const [cat, setCat] = useState('all');
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  // Mock varied heights / tones over real placeholders so the masonry feels real
  const items = inspirations.map((it, i) => ({
    ...it,
    tone: TONES[i % TONES.length],
    h: HEIGHTS[i % HEIGHTS.length],
  }));
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  return (
    <Screen confettiIntensity={0.3}>
      <ScreenHeader trailing={<Pressable style={styles.headerBtn}><Icons.Bell/></Pressable>}/>

      <EyebrowTitle
        eyebrow="for your next visit"
        title="Inspiration"
        trailing={<Doodle kind="sparkle" size={22} color={colors.blue} style={{ transform: [{ rotate: '15deg' }] }}/>}
      />
      <View style={styles.sub}>
        <Text style={styles.subText}>Save designs to show Kuri at your appointment</Text>
      </View>

      {/* Search */}
      <View style={styles.row}>
        <HandRect padding={0} radius={radius.md}>
          <View style={styles.searchRow}>
            <Icons.Search color={colors.inkSoft}/>
            <Text style={styles.searchPh}>Search designs…</Text>
          </View>
        </HandRect>
      </View>

      {/* Category chips */}
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <HandChip key={c.id} active={cat === c.id} onPress={() => setCat(c.id)}>
            {`${c.label}  ${c.count}`}
          </HandChip>
        ))}
      </View>

      {/* Masonry */}
      <View style={styles.masonry}>
        {[left, right].map((col, ci) => (
          <View key={ci} style={[styles.col, ci === 1 && { marginTop: 24 }]}>
            {col.map((it, i) => {
              const rot = (ci + i) % 3 === 0 ? '-0.8deg' : (ci + i) % 3 === 1 ? '0.7deg' : '0deg';
              return (
                <Pressable
                  key={it.id}
                  onPress={() => setLiked((s) => ({ ...s, [it.id]: !s[it.id] }))}
                  style={{ transform: [{ rotate: rot }] }}
                >
                  <HandRect padding={0} radius={radius.md} style={{ overflow: 'hidden' }}>
                    <View style={[styles.imgBox, { height: it.h }]}>
                      <NailHand tone={it.tone}/>
                      <View style={styles.heartBtn}>
                        <Icons.Heart
                          color={liked[it.id] ? colors.pinkInk : colors.ink}
                          fill={liked[it.id] ? colors.pinkInk : 'none'}
                          size={16}
                        />
                      </View>
                    </View>
                    <View style={styles.meta}>
                      <Text style={styles.metaTitle}>{it.title}</Text>
                      <Text style={styles.metaTag}>#{(it.tags && it.tags[0]) || 'design'}</Text>
                    </View>
                  </HandRect>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 6 },
  sub: { paddingHorizontal: spacing.lg, marginTop: -4, marginBottom: spacing.sm },
  subText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  row: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPh: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkFaint,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  masonry: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
  col: {
    flex: 1,
    gap: 12,
  },
  imgBox: {
    overflow: 'hidden',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  metaTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  metaTag: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },
});
