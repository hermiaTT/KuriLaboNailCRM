import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  Field,
  HandChip,
  HandRect,
  Icons,
  Screen,
  ScreenHeader,
  type NailTone,
} from '../../components/ui';
import { customers } from '../../data/placeholders';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

const FILTERS = [
  { id: 'all', label: 'all' },
  { id: 'recent', label: 'recent' },
  { id: 'regulars', label: 'regulars' },
  { id: 'no-show', label: 'no-show' },
];

const TONES: NailTone[] = ['pink','yellow','green','lilac','coral','blue','teal','mocha'];

export default function AdminUsersScreen() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <Screen>
      <ScreenHeader trailing={
        <Text style={styles.headerMeta}>{customers.length} total</Text>
      }/>
      <EyebrowTitle
        eyebrow="manage"
        title="Clients"
        trailing={<Doodle kind="heart" size={18} color={colors.pink} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* Search */}
      <View style={styles.row}>
        <Field
          placeholder="Search by name…"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <HandChip key={f.id} active={filter === f.id} onPress={() => setFilter(f.id)}>
            {f.label}
          </HandChip>
        ))}
      </View>

      {/* Client list */}
      <View style={styles.list}>
        {filtered.map((c, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <Pressable key={c.id}>
              <HandRect padding={14} radius={radius.lg}>
                <View style={styles.userRow}>
                  <View style={[styles.avatar, { backgroundColor: getToneBg(tone) }]}>
                    <Text style={styles.avatarText}>{c.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name}>{c.name}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {c.email}
                      {c.phone ? `  ·  ${c.phone}` : ''}
                    </Text>
                    {c.instagram && (
                      <Text style={styles.handle}>{c.instagram}</Text>
                    )}
                  </View>
                  <Icons.Chev color={colors.inkSoft}/>
                </View>
              </HandRect>
            </Pressable>
          );
        })}

        {filtered.length === 0 && (
          <HandRect padding={28} radius={radius.lg} dashed style={{ alignItems: 'center', gap: 8 }}>
            <Doodle kind="swirl" size={28} color={colors.blue}/>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyBody}>Try a different name.</Text>
          </HandRect>
        )}
      </View>
    </Screen>
  );
}

function getToneBg(tone: NailTone) {
  // Cream-tinted bg picks for avatars
  const map: Record<NailTone, string> = {
    pink:   colors.pinkSoft,
    yellow: '#F7EDC9',
    green:  '#DBE6C6',
    lilac:  '#E5D6EE',
    coral:  '#F6CFC4',
    mocha:  '#E8D7BD',
    blue:   colors.blueSoft,
    teal:   '#BFD4D6',
  };
  return map[tone];
}

const styles = StyleSheet.create({
  headerMeta: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
  },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, gap: 10 },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: colors.ink, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display, fontSize: 18, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  name: {
    fontFamily: fonts.display, fontSize: typeScale.row, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft,
  },
  handle: {
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 10, color: colors.pinkInk,
    letterSpacing: letterSpacing.meta,
  },

  emptyTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, letterSpacing: letterSpacing.display },
  emptyBody:  { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
