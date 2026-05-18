import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  Field,
  HandButton,
  HandChip,
  HandRect,
  Icons,
  NailHand,
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

type Mode = 'client' | 'inspiration';

const TAG_OPTIONS = ['glass','french','chrome','gel','soft','minimal','peach','sage'];

export default function AdminUploadScreen() {
  const [mode, setMode] = useState<Mode>('client');
  const [user, setUser] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [shareToInspo, setShareToInspo] = useState(false);

  const toggleTag = (t: string) =>
    setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <Screen>
      <ScreenHeader/>
      <EyebrowTitle
        eyebrow="upload"
        title="Add a photo"
        trailing={<Doodle kind="sparkle" size={20} color={colors.coral} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <Pressable style={[styles.modePill, mode === 'client'      && styles.modePillActive]}
          onPress={() => setMode('client')}>
          <Text style={[styles.modeText, mode === 'client' && styles.modeTextActive]}>
            Client photo
          </Text>
        </Pressable>
        <Pressable style={[styles.modePill, mode === 'inspiration' && styles.modePillActive]}
          onPress={() => setMode('inspiration')}>
          <Text style={[styles.modeText, mode === 'inspiration' && styles.modeTextActive]}>
            Inspiration
          </Text>
        </Pressable>
      </View>

      {/* Photo dropzone */}
      <View style={styles.row}>
        <HandRect padding={0} radius={radius.lg} dashed>
          <View style={styles.dropzone}>
            <View style={styles.previewWrap}>
              <NailHand tone="pink"/>
            </View>
            <Text style={styles.dropTitle}>Tap to choose photo</Text>
            <Text style={styles.dropMeta}>jpg or png · square works best</Text>
            <HandButton size="sm" color={colors.pinkInk} style={{ marginTop: 12 }}>
              + Pick from library
            </HandButton>
          </View>
        </HandRect>
      </View>

      {/* Form */}
      <View style={styles.row}>
        {mode === 'client' && (
          <Field placeholder="Select client…" value={user} onChangeText={setUser}/>
        )}
      </View>
      <View style={styles.row}>
        <Field placeholder={mode === 'client' ? 'Date of visit (May 20, 2026)' : 'Title (optional)'}
               value={date} onChangeText={setDate}/>
      </View>
      <View style={styles.row}>
        <Field
          placeholder="Description or note"
          value={desc}
          onChangeText={setDesc}
          multiline
        />
      </View>

      {/* Tag picker */}
      <View style={styles.row}>
        <Text style={styles.label}>tags</Text>
        <View style={styles.chipRow}>
          {TAG_OPTIONS.map((t) => (
            <HandChip key={t} active={tags.includes(t)} onPress={() => toggleTag(t)}>
              {t}
            </HandChip>
          ))}
        </View>
      </View>

      {/* Share to inspiration toggle */}
      {mode === 'client' && (
        <View style={styles.row}>
          <Pressable onPress={() => setShareToInspo((v) => !v)}>
            <HandRect padding={14} radius={radius.md}
              fill={shareToInspo ? colors.blueSoft : colors.creamCard}
              stroke={shareToInspo ? colors.blueInk : colors.ink}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.toggleTitle}>Share to inspiration</Text>
                  <Text style={styles.toggleBody}>Show this look (anonymously) in the public gallery.</Text>
                </View>
                <View style={[styles.checkbox, shareToInspo && styles.checkboxOn]}>
                  {shareToInspo && <Text style={styles.check}>✓</Text>}
                </View>
              </View>
            </HandRect>
          </Pressable>
        </View>
      )}

      {/* Submit */}
      <View style={styles.row}>
        <HandButton color={colors.pinkInk} full size="lg">
          Save photo
        </HandButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 8,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.creamHair,
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: colors.creamCard,
    borderColor: colors.ink,
  },
  modeText: {
    fontFamily: fonts.display, fontSize: 13, color: colors.inkSoft,
    letterSpacing: letterSpacing.display,
  },
  modeTextActive: { color: colors.ink },

  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },

  dropzone: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 24,
    gap: 6,
  },
  previewWrap: {
    width: 140,
    height: 140,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 14,
    opacity: 0.7,
  },
  dropTitle: {
    fontFamily: fonts.display, fontSize: 15, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  dropMeta: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  label: {
    marginBottom: 8,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: {
    fontFamily: fonts.display, fontSize: 14, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  toggleBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.ink, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.creamCard,
  },
  checkboxOn: {
    backgroundColor: colors.blueInk,
    borderColor: colors.blueInk,
    borderStyle: 'solid',
  },
  check: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
