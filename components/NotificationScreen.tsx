import { notificationMessage, t, getLocale, useLanguage } from '../shared/i18n';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, letterSpacing, radius, spacing, typeScale } from '../constants/theme';
import { api, ApiError } from '../lib/api';
import type { NotificationItem } from '../types/api';
import { Doodle, EyebrowTitle, HandButton, HandRect, Icons, Screen } from './ui';

function when(value: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Vancouver',
  }).format(new Date(value));
}

export function NotificationScreen() {
  useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api<NotificationItem[]>('/api/v1/notifications')
      .then(setItems)
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : "Unable to load notifications."))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  async function markRead(item: NotificationItem) {
    if (item.read) return;
    try {
      const updated = await api<NotificationItem>(`/api/v1/notifications/${item.id}/read`, { method: 'PUT' });
      setItems((current) => current.map((row) => row.id === updated.id ? updated : row));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to update notification.");
    }
  }

  async function openNotification(item: NotificationItem) {
    await markRead(item);
    if (item.clientId) {
      router.push({ pathname: '/(admin)/client/[id]', params: { id: item.clientId } });
    }
  }

  async function markAllRead() {
    setBusy(true);
    setError(null);
    try {
      await api('/api/v1/notifications/read-all', { method: 'PUT' });
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to update notifications.");
    } finally {
      setBusy(false);
    }
  }

  const unread = items.filter((item) => !item.read).length;

  return (
    <Screen confettiIntensity={0.25}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Icons.ChevL color={colors.ink} />
          <Text style={styles.backText}>{t("back")}</Text>
        </Pressable>
        {unread > 0 && <HandButton size="sm" color={colors.inkSoft} disabled={busy} onPress={markAllRead}>{t("Mark all read")}</HandButton>}
      </View>
      <EyebrowTitle eyebrow={t("{count} unread", { count: unread })} title={t("Notifications")} trailing={<Doodle kind="sparkle" size={20} color={colors.blue} />} />
      {error && <Text style={styles.error}>{t(error)}</Text>}
      {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} /> : (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => void openNotification(item)}>
              <HandRect padding={15} radius={radius.lg} style={!item.read ? styles.unreadCard : undefined}>
                <View style={styles.itemHead}>
                  <View style={[styles.dot, item.read && styles.readDot]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{t(item.title)}</Text>
                    <Text style={styles.date}>{when(item.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.message}>{notificationMessage(item.message)}</Text>
              </HandRect>
            </Pressable>
          ))}
          {items.length === 0 && (
            <HandRect padding={24} radius={radius.lg} dashed style={styles.empty}>
              <Icons.Bell color={colors.inkSoft} size={28} />
              <Text style={styles.emptyTitle}>{t("All quiet for now")}</Text>
              <Text style={styles.emptyText}>{t("Booking updates will appear here.")}</Text>
            </HandRect>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { paddingHorizontal: spacing.lg, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  backText: { fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.ink, letterSpacing: letterSpacing.meta, textTransform: 'uppercase' },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
  unreadCard: { backgroundColor: '#fff5f7' },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pinkInk },
  readDot: { backgroundColor: colors.creamHair },
  title: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  date: { marginTop: 2, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase' },
  message: { marginTop: 9, marginLeft: 18, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  error: { paddingHorizontal: spacing.lg, paddingBottom: 10, textAlign: 'center', fontFamily: fonts.body, color: '#c0554f' },
  empty: { alignItems: 'center', gap: 7 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  emptyText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
