import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Doodle, EyebrowTitle, HandButton, HandRect, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { api, mediaUrl } from '../../lib/api';
import type { NailSet } from '../../types/api';

export default function AdminGalleryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NailSet[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); api<NailSet[]>('/api/v1/inspiration').then(setItems).finally(() => setLoading(false)); }, []);
  useFocusEffect(load);
  const left = items.filter((_, index) => index % 2 === 0);
  const right = items.filter((_, index) => index % 2 === 1);
  return <Screen><ScreenHeader /><EyebrowTitle eyebrow="admin · gallery" title="Uploads" trailing={<Doodle kind="flower" size={22} color={colors.lilac} />} />
    <View style={styles.row}><HandRect padding={14} radius={radius.lg} fill={colors.blueSoft} stroke={colors.blueInk}><View style={styles.cta}><View><Text style={styles.ctaTitle}>Inspiration library</Text><Text style={styles.meta}>{items.length} nail sets</Text></View><HandButton size="sm" color={colors.blueInk} onPress={() => router.push('/(admin)/upload')}>+ Upload</HandButton></View></HandRect></View>
    {loading ? <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} /> : <View style={styles.masonry}>{[left, right].map((column, ci) => <View key={ci} style={[styles.column, ci === 1 && { marginTop: 20 }]}>{column.map((item) => <Pressable key={item.id} onPress={() => router.push('/(admin)/upload')}><HandRect padding={0} radius={radius.md} style={{ overflow: 'hidden' }}>{item.images[0] ? <Image source={{ uri: mediaUrl(item.images[0].url) }} style={styles.image} /> : <View style={styles.image} />}<View style={styles.cardMeta}><Text style={styles.title} numberOfLines={1}>{item.title}</Text><Text style={styles.meta}>{item.images.length} photo{item.images.length === 1 ? '' : 's'}{item.clientId ? ' · client' : ' · gallery'}</Text></View></HandRect></Pressable>)}</View>)}</View>}
  </Screen>;
}
const styles = StyleSheet.create({ row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }, cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, ctaTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink }, meta: { marginTop: 3, fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft }, masonry: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.lg }, column: { flex: 1, gap: 12 }, image: { width: '100%', height: 190, backgroundColor: colors.creamHair }, cardMeta: { padding: 12 }, title: { fontFamily: fonts.display, fontSize: 13, color: colors.ink } });
