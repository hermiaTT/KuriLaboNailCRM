import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Doodle,
  EyebrowTitle,
  Field,
  HandButton,
  HandRect,
  Icons,
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

function formatDisplay(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDb(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: authProfile } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('');
  const [allergyNotes, setAllergyNotes] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authProfile?.id) return;
    supabase
      .from('profiles')
      .select('name, phone, birthday, instagram, preferred_nail_style, allergy_notes')
      .eq('id', authProfile.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? '');
          setPhone(data.phone ?? '');
          setInstagram(data.instagram ?? '');
          setPreferredStyle(data.preferred_nail_style ?? '');
          setAllergyNotes(data.allergy_notes ?? '');
          if (data.birthday) setBirthday(new Date(data.birthday + 'T00:00:00'));
        }
        setFetching(false);
      });
  }, [authProfile?.id]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);
    setSaving(true);

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        instagram: instagram.trim() || null,
        preferred_nail_style: preferredStyle.trim() || null,
        allergy_notes: allergyNotes.trim() || null,
        birthday: birthday ? formatDb(birthday) : null,
      })
      .eq('id', authProfile!.id);

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      router.back();
    }
  }

  if (fetching) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.pinkInk} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <View style={styles.row}>
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Icons.ChevL color={colors.ink} />
              <Text style={styles.backText}>back</Text>
            </Pressable>
          </View>

          <EyebrowTitle
            eyebrow="your profile"
            title="Edit details"
            trailing={
              <Doodle
                kind="sparkle"
                size={20}
                color={colors.blue}
                style={{ transform: [{ rotate: '10deg' }] }}
              />
            }
          />

          {/* Form */}
          <View style={styles.row}>
            <HandRect padding={20} radius={radius.lg}>
              <View style={{ gap: 12 }}>
                <Field placeholder="Name" value={name} onChangeText={setName} />
                <Field
                  placeholder="Phone (optional)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Field
                  placeholder="Instagram (optional)"
                  autoCapitalize="none"
                  value={instagram}
                  onChangeText={setInstagram}
                />

                {/* Birthday picker */}
                <Pressable onPress={() => setShowPicker(v => !v)}>
                  <HandRect padding={0} radius={radius.md} fill={colors.creamCard}>
                    <View style={styles.birthdayRow}>
                      <Text style={[styles.birthdayText, !birthday && { color: colors.inkFaint }]}>
                        {birthday ? formatDisplay(birthday) : 'Birthday (optional)'}
                      </Text>
                      <Doodle kind="heart" size={14} color={colors.pinkInk} style={{ opacity: 0.5 }} />
                    </View>
                  </HandRect>
                </Pressable>

                {showPicker && (
                  <View style={styles.pickerWrap}>
                    <DateTimePicker
                      value={birthday ?? new Date(2000, 0, 1)}
                      mode="date"
                      display="spinner"
                      onChange={(_, date) => { if (date) setBirthday(date); }}
                      maximumDate={new Date()}
                      minimumDate={new Date(1950, 0, 1)}
                      textColor={colors.ink}
                    />
                    <Pressable onPress={() => setShowPicker(false)} style={styles.doneBtn}>
                      <Text style={styles.doneBtnText}>Done</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </HandRect>
          </View>

          {/* Preferences */}
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Preferences</Text>
            <HandRect padding={20} radius={radius.lg}>
              <View style={{ gap: 12 }}>
                <Field
                  placeholder="Preferred nail style (optional)"
                  value={preferredStyle}
                  onChangeText={setPreferredStyle}
                />
                <Field
                  placeholder="Allergy notes (optional)"
                  value={allergyNotes}
                  onChangeText={setAllergyNotes}
                  multiline
                />
              </View>
            </HandRect>
          </View>

          {error && (
            <View style={styles.row}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={[styles.row, { marginTop: 4 }]}>
            <HandButton
              color={colors.pinkInk}
              full
              size="lg"
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes →'}
            </HandButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: {
    fontFamily: fonts.mono,
    fontSize: typeScale.meta,
    color: colors.ink,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },

  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  birthdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  birthdayText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
  },

  pickerWrap: {
    backgroundColor: colors.creamCard,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  doneBtn: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.inkFaint,
  },
  doneBtnText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.pinkInk,
    fontWeight: '600',
  },

  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#e05c5c',
    textAlign: 'center',
  },
});
