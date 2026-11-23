import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Doodle, EyebrowTitle, Field, HandButton, HandChip, HandRect, Icons, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, letterSpacing, radius, spacing, typeScale } from '../../constants/theme';
import { api, ApiError } from '../../lib/api';
import type { AdminUser } from '../../types/api';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'REGISTERED' | 'GUEST'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(() => {
    setLoading(true);
    api<AdminUser[]>('/api/v1/admin/users')
      .then((users) => setClients(users.filter((user) => user.role === 'USER')))
      .catch(() => setError('Unable to load clients.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadClients);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return clients.filter((client) => {
      if (filter !== 'ALL' && client.accountType !== filter) return false;
      return !needle || `${client.name} ${client.phone ?? ''} ${client.email ?? ''}`.toLowerCase().includes(needle);
    });
  }, [clients, filter, query]);

  async function addGuest() {
    if (!name.trim()) {
      setError('Client name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api<AdminUser>('/api/v1/admin/users/guests', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      setClients((current) => [created, ...current]);
      setName('');
      setPhone('');
      setShowCreate(false);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to add this client.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader trailing={<Text style={styles.headerMeta}>{clients.length} clients</Text>} />
      <EyebrowTitle eyebrow="client book" title="Your clients" trailing={<Doodle kind="heart" size={20} color={colors.pink} />} />

      <View style={styles.row}>
        <HandRect padding={0} radius={radius.md}>
          <View style={styles.searchRow}>
            <Icons.Search color={colors.inkSoft} />
            <Field placeholder="Search name, phone or email" value={query} onChangeText={setQuery} style={styles.searchField} />
          </View>
        </HandRect>
      </View>

      <View style={styles.filters}>
        {(['ALL', 'REGISTERED', 'GUEST'] as const).map((value) => (
          <HandChip key={value} active={filter === value} onPress={() => setFilter(value)}>{value.toLowerCase()}</HandChip>
        ))}
        <View style={{ flex: 1 }} />
        <HandButton color={colors.pinkInk} size="sm" onPress={() => setShowCreate(true)}>+ Add</HandButton>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={colors.pinkInk} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.list}>
          {filtered.map((client) => (
            <Pressable key={client.id} onPress={() => router.push(`/(admin)/client/${client.id}`)}>
              <HandRect padding={14} radius={radius.lg}>
                <View style={styles.clientRow}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{client.name[0]?.toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{client.name}</Text>
                      {client.accountType === 'GUEST' && <Text style={styles.guest}>guest</Text>}
                    </View>
                    <Text style={styles.meta}>{client.phone || client.email || 'No contact information'}</Text>
                  </View>
                  <Icons.Chev color={colors.inkSoft} />
                </View>
              </HandRect>
            </Pressable>
          ))}
          {filtered.length === 0 && <Text style={styles.empty}>No matching clients.</Text>}
        </View>
      )}

      <Modal transparent visible={showCreate} animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowCreate(false)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <HandRect padding={22} radius={radius.xl}>
              <Text style={styles.modalTitle}>Add guest client</Text>
              <Text style={styles.modalText}>For clients who have not registered. Phone is optional.</Text>
              <View style={{ gap: 10, marginVertical: 16 }}>
                <Field placeholder="Unique client name" value={name} onChangeText={setName} />
                <Field placeholder="Phone (optional)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              </View>
              <HandButton color={colors.pinkInk} full disabled={saving} onPress={addGuest}>{saving ? 'Adding…' : 'Add client'}</HandButton>
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerMeta: { fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.inkSoft, letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase' },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  searchField: { flex: 1, borderWidth: 0 },
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blueSoft, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.display, fontSize: typeScale.row, color: colors.ink },
  guest: { fontFamily: fonts.mono, fontSize: 8, color: colors.pinkInk, textTransform: 'uppercase' },
  meta: { marginTop: 3, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  error: { paddingHorizontal: spacing.lg, textAlign: 'center', fontFamily: fonts.body, color: '#c0554f' },
  empty: { paddingVertical: 30, textAlign: 'center', fontFamily: fonts.body, color: colors.inkSoft },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  modalText: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
});
