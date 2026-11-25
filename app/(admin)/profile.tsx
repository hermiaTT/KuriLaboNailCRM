import { t, useLanguage } from '../../shared/i18n';
import { type Language, isLanguageSaved, LANGUAGE_SAVE_ERROR } from '../../shared/i18n/core';
import { LanguagePicker } from '../../components/LanguagePicker';

import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { EyebrowTitle, HandButton, HandRect, Icons, Screen } from '../../components/ui';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { api, mediaUrl } from '../../lib/api';
import type { CurrentProfile } from '../../types/api';

export default function AdminProfileScreen() {
  useLanguage();
  const router = useRouter();
  const { signOut, refreshUser } = useAuth();
  const [language, setDraftLanguage] = useState<Language>('en');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api<CurrentProfile>('/api/v1/users/me').then((data) => { setProfile(data); setDraftLanguage(data.preferredLanguage ?? 'en'); }).finally(() => setLoading(false));
  }, []));

  async function saveLanguage() {
    if (!profile) return;
    setSaving(true); setMessage(null);
    try {
      const updated = await api<CurrentProfile>('/api/v1/users/me', { method: 'PUT', body: JSON.stringify({
        name: profile.name, phone: profile.phone, birthday: profile.birthday,
        instagram: profile.instagram, wechat: profile.wechat,
        preferredNailStyle: profile.preferredNailStyle, allergyNotes: profile.allergyNotes,
        preferredLanguage: language,
      }) });
      if (!isLanguageSaved(updated, language)) {
        setMessage(LANGUAGE_SAVE_ERROR);
        return;
      }
      setProfile(updated);
      setMessage("Saved ✓");
      await refreshUser(updated);
    } catch { setMessage("Unable to save your profile."); }
    finally { setSaving(false); }
  }

  async function chooseAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const body = new FormData();
    body.append('file', { uri: asset.uri, name: asset.fileName || 'avatar.jpg', type: asset.mimeType || 'image/jpeg' } as any);
    setUploading(true);
    try { setProfile(await api<CurrentProfile>('/api/v1/users/me/avatar', { method: 'POST', body })); }
    finally { setUploading(false); }
  }

  return <Screen>
    <View style={styles.top}><Pressable onPress={() => router.back()} style={styles.back}><Icons.ChevL /><Text style={styles.backText}>{t("back")}</Text></Pressable></View>
    <EyebrowTitle eyebrow={t("studio account")} title={t("Admin profile")} />
    {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} /> : <View style={styles.content}>
      <Pressable onPress={chooseAvatar} disabled={uploading} style={styles.avatarOuter}>
        <View style={styles.avatar}>
          {profile?.avatarUrl ? <Image source={{ uri: mediaUrl(profile.avatarUrl) }} style={styles.avatarImage} /> : <Text style={styles.initial}>{profile?.name?.[0]?.toUpperCase() ?? 'K'}</Text>}
        </View>
        {uploading && <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.pinkInk} />}
      </Pressable>
      <Text style={styles.hint}>{t("tap photo to change")}</Text>
      <Text style={styles.name}>{profile?.name}</Text>
      <HandRect padding={18} radius={radius.lg}><View style={styles.info}><Text style={styles.label}>{t("phone")}</Text><Text style={styles.value}>{profile?.phone || '—'}</Text></View><View style={styles.info}><Text style={styles.label}>{t("email")}</Text><Text style={styles.value}>{profile?.email || '—'}</Text></View></HandRect>
      <Text style={styles.label}>{t("PERSONAL DETAILS")}</Text>
      <LanguagePicker value={language} onChange={(next) => { setDraftLanguage(next); setMessage(null); }} disabled={saving} />
      {message && <Text style={styles.value}>{t(message)}</Text>}
      <HandButton full disabled={saving} onPress={saveLanguage}>{saving ? t("Saving…") : t("Save changes")}</HandButton>
      <HandButton full color={colors.inkSoft} onPress={signOut}>{t("Sign out")}</HandButton>
    </View>}
  </Screen>;
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.lg, minHeight: 44, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.mono, fontSize: 9, color: colors.ink, textTransform: 'uppercase' },
  content: { paddingHorizontal: spacing.lg, alignItems: 'center', gap: 14 },
  avatarOuter: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 112, height: 112, borderRadius: 56, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pinkSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.pinkInk },
  avatarImage: { width: '100%', height: '100%' },
  initial: { fontFamily: fonts.display, fontSize: 48, color: colors.pinkInk },
  hint: { fontFamily: fonts.mono, fontSize: 8, color: colors.inkFaint, textTransform: 'uppercase' },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  info: { minWidth: '100%', paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  label: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkFaint, textTransform: 'uppercase' },
  value: { flex: 1, textAlign: 'right', fontFamily: fonts.body, fontSize: 12, color: colors.ink },
});
