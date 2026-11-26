import { t, getLocale, useLanguage } from '../../shared/i18n';
import React, { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  HandRect,
  Icons,
  Screen,
  ScreenHeader,
  StatusBadge,
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
import { api, mediaUrl } from '../../lib/api';
import type { Appointment, CurrentProfile, NailSet } from '../../types/api';
import type { StatusKey } from '../../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBirthday(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(getLocale(), {
    month: 'long',
    day: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Vancouver',
  }).format(new Date(iso));
}

function fmtSlotDate(iso: string) {
  const d = new Date(iso);
  return {
    month: new Intl.DateTimeFormat(getLocale(), { month: 'short', timeZone: 'America/Vancouver' }).format(d).toLowerCase(),
    day: new Intl.DateTimeFormat(getLocale(), { day: 'numeric', timeZone: 'America/Vancouver' }).format(d),
  };
}

function uiStatus(status: Appointment['status']): StatusKey {
  if (status === 'CONFIRMED') return 'confirmed';
  if (status === 'COMPLETED') return 'done';
  if (status === 'NO_SHOW') return 'no_show';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'cancelled';
  return 'pending';
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  useLanguage();
  const router = useRouter();
  const { session, profile: authProfile, signOut } = useAuth();

  const [data, setData] = useState<CurrentProfile | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [designCount, setDesignCount] = useState(0);
  const [nextAppt, setNextAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!authProfile?.id) return;
      fetchAll();
    }, [authProfile?.id]),
  );

  async function fetchAll() {
    try {
      const [profileRes, appointments, mine, inspiration] = await Promise.all([
        api<CurrentProfile>('/api/v1/users/me'),
        api<Appointment[]>('/api/v1/appointments/me'),
        api<NailSet[]>('/api/v1/nail-sets/mine'),
        api<NailSet[]>('/api/v1/inspiration'),
      ]);

      setData(profileRes);
      setVisitCount(appointments.filter((item) => item.status === 'COMPLETED').length);
      setSavedCount(inspiration.filter((item) => item.favorited).length);
      setDesignCount(mine.length);

      const upcoming = appointments
        .filter((item) => new Date(item.endAt).getTime() >= Date.now() && !['CANCELLED', 'REJECTED'].includes(item.status))
        .sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null;
      setNextAppt(upcoming);
    } catch (e) {
      console.error('[ProfileScreen] fetchAll error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function chooseAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const body = new FormData();
    body.append('file', { uri: asset.uri, name: asset.fileName || 'avatar.jpg', type: asset.mimeType || 'image/jpeg' } as any);
    setUploadingAvatar(true);
    try { setData(await api<CurrentProfile>('/api/v1/users/me/avatar', { method: 'POST', body })); }
    finally { setUploadingAvatar(false); }
  }

  if (loading) {
    return (
      <Screen>
        <ScreenHeader trailing={<Pressable style={styles.iconBtn}><Icons.Bell /></Pressable>} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      </Screen>
    );
  }

  const email = session?.user.email ?? '—';
  const name = data?.name ?? authProfile?.name ?? '—';
  const initial = name[0]?.toUpperCase() ?? '?';
  const since = t("online member");

  const prefBody = [
    data?.preferredNailStyle,
    data?.allergyNotes,
  ]
    .filter(Boolean)
    .join(' · ') || t("No preferences set yet");

  const slotDate = nextAppt ? fmtSlotDate(nextAppt.startAt) : null;

  return (
    <Screen>
      <ScreenHeader
        trailing={
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(user)/edit-profile')}>
              <Icons.Edit color={colors.inkSoft} size={18} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(user)/notifications')}>
              <Icons.Bell />
            </Pressable>
          </View>
        }
      />

      {/* Avatar hero */}
      <View style={styles.hero}>
        <Pressable style={styles.avatarRing} onPress={chooseAvatar} disabled={uploadingAvatar}>
          <View style={[styles.avatarRingBorder, StyleSheet.absoluteFill]} />
          <View style={styles.avatarInner}>
            {data?.avatarUrl ? <Image source={{ uri: mediaUrl(data.avatarUrl) }} style={styles.avatarImage} /> : <Text style={styles.avatarInitial}>{initial}</Text>}
          </View>
          <Doodle kind="flower" size={28} color={colors.yellow}
            style={{ position: 'absolute', top: -4, right: -4, transform: [{ rotate: '15deg' }] }} />
          <Doodle kind="sparkle" size={22} color={colors.blue}
            style={{ position: 'absolute', bottom: 4, left: -6, transform: [{ rotate: '-12deg' }] }} />
          {uploadingAvatar && <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.pinkInk} />}
        </Pressable>
        <Text style={styles.avatarHint}>{t("tap photo to change")}</Text>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.metaWide}>{t("member since")}{since}</Text>
        <Pressable onPress={signOut} style={styles.signOutBtn}>
          <Icons.LogOut color={colors.inkSoft} size={13} />
          <Text style={styles.signOutText}>{t("sign out")}</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.row}>
        <View style={styles.statsRow}>
          {[
            { v: visitCount, l: 'visits',  d: 'heart',   c: colors.pink,   nav: () => router.push('/(user)/appointments') },
            { v: savedCount, l: 'saved',   d: 'star',    c: colors.blue,   nav: () => router.push('/(user)/collection') },
            { v: designCount, l: t("designs"), d: 'sparkle', c: colors.yellow, nav: () => router.push('/(user)/inspiration') },
          ].map((s, i) => (
            <Pressable
              key={t(s.l)}
              onPress={s.nav}
              style={[
                styles.statWrap,
                { transform: [{ rotate: i === 1 ? '1deg' : i === 2 ? '-1deg' : '0deg' }] },
              ]}
            >
              <HandRect padding={14} radius={radius.md} style={{ alignItems: 'center' }}>
                <Doodle kind={s.d as any} color={s.c} size={22} style={{ marginBottom: 4 }} />
                <Text style={styles.statValue}>{s.v}</Text>
                <Text style={styles.statLabel}>{t(s.l)}</Text>
              </HandRect>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Info list */}
      <View style={styles.row}>
        <HandRect padding={0} radius={radius.lg}>
          {[
            { k: 'email',     v: email },
            { k: 'phone',     v: data?.phone ?? '—' },
            { k: 'birthday',  v: data?.birthday ? fmtBirthday(data.birthday) : '—' },
            { k: 'WeChat',    v: data?.wechat ?? '—' },
          ].map((r, i, a) => (
            <View key={t(r.k)} style={[styles.infoRow, i < a.length - 1 && styles.infoRowDivider]}>
              <Text style={styles.infoKey}>{t(r.k)}</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{r.v}</Text>
            </View>
          ))}
        </HandRect>
      </View>

      {/* Preferences accent card */}
      <View style={styles.row}>
        <HandRect fill={colors.pinkSoft} stroke={colors.pinkInk} radius={radius.lg} padding={18}>
          <View style={styles.prefHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>{t("Your preferences")}</Text>
              <Text style={styles.prefBody}>{prefBody}</Text>
            </View>
            <Pressable style={styles.editBtn} onPress={() => router.push('/(user)/edit-profile')}>
              <Icons.Edit color={colors.pinkInk} />
              <Text style={styles.editLabel}>{t("edit")}</Text>
            </Pressable>
          </View>
        </HandRect>
      </View>

      {/* Next visit */}
      {nextAppt && slotDate ? (
        <View style={styles.row}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t("Next visit")}</Text>
            <Text style={styles.sectionMeta}>{t("1 upcoming")}</Text>
          </View>
          <Pressable onPress={() => router.push('/(user)/appointments')}>
            <HandRect padding={16} radius={radius.lg}>
              <View style={styles.visitRow}>
                <View style={styles.visitDate}>
                  <Text style={styles.visitDateM}>{slotDate.month}</Text>
                  <Text style={styles.visitDateD}>{slotDate.day}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.visitTime}>
                    {fmtTime(nextAppt.startAt)} — {fmtTime(nextAppt.endAt)}
                  </Text>
                  <Text style={styles.visitDesc}>{t("with Kuri")}</Text>
                </View>
                <StatusBadge status={uiStatus(nextAppt.status)} />
              </View>
            </HandRect>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <HandRect padding={16} radius={radius.lg}>
            <Text style={styles.emptyText}>{t("No upcoming visits yet · Book one? 🌸")}</Text>
          </HandRect>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 6 },
  avatarRing: {
    width: 128, height: 128, borderRadius: 64,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarRingBorder: {
    borderRadius: 64,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.pinkInk,
  },
  avatarInner: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarInitial: {
    fontFamily: fonts.display, fontSize: 48, color: colors.pinkInk,
    letterSpacing: letterSpacing.display,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarHint: { marginTop: 8, fontFamily: fonts.mono, fontSize: 8, color: colors.inkFaint, textTransform: 'uppercase' },
  name: {
    marginTop: 14,
    fontFamily: fonts.display, fontSize: 24, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  metaWide: {
    marginTop: 6,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingVertical: 4, paddingHorizontal: 8,
  },
  signOutText: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statWrap: { flex: 1 },
  statValue: {
    fontFamily: fonts.display, fontSize: typeScale.statBig, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  infoRowDivider: {
    borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: colors.creamHair,
  },
  infoKey: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },
  infoVal: {
    fontFamily: fonts.body, fontSize: 13, color: colors.ink, fontWeight: '500',
    maxWidth: '60%',
  },

  prefHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  prefTitle: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  prefBody: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editLabel: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.pinkInk,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  sectionHead: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  sectionMeta: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  visitDate: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.blueSoft,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.blueInk,
    alignItems: 'center', justifyContent: 'center',
  },
  visitDateM: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.blueInk,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  visitDateD: {
    fontFamily: fonts.display, fontSize: 22, color: colors.ink,
    letterSpacing: letterSpacing.display, lineHeight: 22,
  },
  visitTime: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  visitDesc: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },

  emptyText: {
    fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft,
    textAlign: 'center', paddingVertical: 4,
  },
});
