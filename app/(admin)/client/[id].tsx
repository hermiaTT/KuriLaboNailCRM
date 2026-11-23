import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Modal,
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
  NailCardModal,
} from '../../../components/ui';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../../constants/theme';
import { api, ApiError, mediaUrl } from '../../../lib/api';
import type { AdminAppointment, AdminUser, AdminUserDetail, NailSet, NailSetImage } from '../../../types/api';

type Visit = {
  id: string;
  date: string;
  price: number | null;
  description: string | null;
  images: NailSetImage[];
};

export default function AdminClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<AdminUserDetail | null>(null);
  const [allClients, setAllClients] = useState<AdminUser[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminUserDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetchAll();
    }, [id]),
  );

  async function fetchAll() {
    setLoading(true);
    try {
      const [profile, appointments, nailSets, users] = await Promise.all([
        api<AdminUserDetail>(`/api/v1/admin/users/${id}`),
        api<AdminAppointment[]>('/api/v1/admin/appointments'),
        api<NailSet[]>('/api/v1/inspiration'),
        api<AdminUser[]>('/api/v1/admin/users'),
      ]);
      setClient(profile);
      setAllClients(users.filter((item) => item.role === 'USER'));
      setNotes(profile.adminNotes ?? '');
      const clientAppointments = appointments.filter((item) => item.customerId === id && item.status === 'COMPLETED');
      const clientSets = nailSets.filter((item) => item.clientId === id);
      const setByAppointment = new Map(clientSets.filter((item) => item.appointmentId).map((item) => [item.appointmentId!, item]));
      const appointmentVisits: Visit[] = clientAppointments.map((item) => ({
        id: item.id,
        date: item.startAt,
        price: item.finalPrice,
        description: item.serviceNotes,
        images: setByAppointment.get(item.id)?.images ?? [],
      }));
      const unlinkedVisits: Visit[] = clientSets.filter((item) => !item.appointmentId).map((item) => ({
        id: item.id,
        date: item.createdAt,
        price: null,
        description: item.description,
        images: item.images,
      }));
      setVisits([...appointmentVisits, ...unlinkedVisits].sort((a, b) => b.date.localeCompare(a.date)));
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes() {
    if (!id) return;
    if (!client) return;
    setSavingNotes(true);
    try {
      const updated = await api<AdminUserDetail>(`/api/v1/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: client.name,
          phone: client.phone,
          birthday: client.birthday,
          instagram: client.instagram,
          wechat: client.wechat,
          preferredNailStyle: client.preferredNailStyle,
          allergyNotes: client.allergyNotes,
          adminNotes: notes.trim() || null,
          role: client.role,
          status: client.status,
        }),
      });
      setClient(updated);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (cause) {
      setNotes(cause instanceof ApiError ? cause.message : notes);
    } finally {
      setSavingNotes(false);
    }
  }

  async function mergeGuest() {
    if (!id || !mergeTargetId) {
      setActionMessage('Choose the registered client to merge into.');
      return;
    }
    setActionBusy(true);
    setActionMessage(null);
    try {
      await api<AdminUserDetail>(`/api/v1/admin/users/${id}/merge`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: mergeTargetId }),
      });
      setShowMerge(false);
      router.replace(`/(admin)/client/${mergeTargetId}`);
    } catch (cause) {
      setActionMessage(cause instanceof ApiError ? cause.message : 'Unable to merge this client.');
    } finally {
      setActionBusy(false);
    }
  }

  async function resetPassword() {
    if (!id || newPassword.length < 8) {
      setActionMessage('Temporary password must be at least 8 characters.');
      return;
    }
    setActionBusy(true);
    setActionMessage(null);
    try {
      await api(`/api/v1/admin/users/${id}/password-reset`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      setNewPassword('');
      setShowReset(false);
      setActionMessage('Password reset. Share the temporary password securely with the client.');
    } catch (cause) {
      setActionMessage(cause instanceof ApiError ? cause.message : 'Unable to reset this password.');
    } finally {
      setActionBusy(false);
    }
  }

  function editField<K extends keyof AdminUserDetail>(field: K, value: AdminUserDetail[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveProfile() {
    if (!id || !draft?.name.trim()) return;
    setActionBusy(true); setActionMessage(null);
    try {
      const updated = await api<AdminUserDetail>(`/api/v1/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: draft.name.trim(), phone: draft.phone?.trim() || null, birthday: draft.birthday || null,
          instagram: draft.instagram?.trim() || null, wechat: draft.wechat?.trim() || null,
          preferredNailStyle: draft.preferredNailStyle?.trim() || null, allergyNotes: draft.allergyNotes?.trim() || null,
          adminNotes: draft.adminNotes?.trim() || null, role: draft.role, status: draft.status,
        }),
      });
      setClient(updated); setNotes(updated.adminNotes ?? ''); setDraft(null); setActionMessage('Client profile updated.');
    } catch (cause) { setActionMessage(cause instanceof ApiError ? cause.message : 'Unable to update client profile.'); }
    finally { setActionBusy(false); }
  }

  function formatDate(v: Visit) {
    return new Date(v.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver',
    });
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.pinkInk} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={styles.row}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Icons.ChevL color={colors.ink} />
            <Text style={styles.backText}>back</Text>
          </Pressable>
        </View>

        <EyebrowTitle
          eyebrow="client"
          title={client?.name ?? '—'}
          trailing={<Doodle kind="heart" size={18} color={colors.pink} style={{ transform: [{ rotate: '-12deg' }] }} />}
        />

        {/* Contact info */}
        <View style={styles.row}>
          <HandRect padding={14} radius={radius.lg}>
            <Text style={styles.meta} numberOfLines={1}>
              {client?.email}
              {client?.phone ? `  ·  ${client.phone}` : ''}
            </Text>
            {client?.instagram && <Text style={styles.handle}>{client.instagram}</Text>}
            <View style={styles.profileEditRow}><Text style={styles.accountType}>{client?.accountType?.toLowerCase()} · {client?.status?.toLowerCase()}</Text><HandButton size="sm" color={colors.inkSoft} onPress={() => client && setDraft({ ...client })}>Edit profile</HandButton></View>
          </HandRect>
        </View>

        <View style={styles.row}>
          <View style={styles.accountActions}>
            {client?.accountType === 'GUEST' ? (
              <HandButton color={colors.blueInk} size="sm" onPress={() => { setActionMessage(null); setShowMerge(true); }}>Merge with registered client</HandButton>
            ) : (
              <HandButton color={colors.inkSoft} size="sm" onPress={() => { setActionMessage(null); setShowReset(true); }}>Reset password</HandButton>
            )}
          </View>
          {actionMessage && <Text style={styles.actionMessage}>{actionMessage}</Text>}
        </View>

        {/* Notes */}
        <View style={styles.row}>
          <Text style={styles.sectionLabel}>notes</Text>
          <HandRect padding={14} radius={radius.lg}>
            <Field
              placeholder="Add a note about this client…"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={styles.notesFooter}>
              {notesSaved && <Text style={styles.savedText}>Saved ✓</Text>}
              <HandButton color={colors.pinkInk} size="sm" onPress={saveNotes} disabled={savingNotes}>
                {savingNotes ? 'Saving…' : 'Save note'}
              </HandButton>
            </View>
          </HandRect>
        </View>

        {/* Past visits */}
        <View style={styles.row}>
          <Text style={styles.sectionLabel}>past visits</Text>
          {visits.length === 0 ? (
            <HandRect padding={20} radius={radius.lg} dashed style={{ alignItems: 'center', gap: 6 }}>
              <Doodle kind="swirl" size={24} color={colors.blue} />
              <Text style={styles.emptyTitle}>No visits yet</Text>
            </HandRect>
          ) : (
            <View style={{ gap: 10 }}>
              {visits.map((v) => {
                const cover = v.images[0];
                return (
                  <Pressable key={v.id} onPress={() => setActiveVisit(v)}>
                    <HandRect padding={12} radius={radius.lg}>
                      <View style={styles.visitRow}>
                        <View style={styles.thumb}>
                          {cover ? (
                            <Image source={{ uri: mediaUrl(cover.url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                          ) : (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.creamCard }]} />
                          )}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.visitDate}>{formatDate(v)}</Text>
                          <Text style={styles.visitMeta}>
                            {v.price != null ? `$${v.price}` : 'no price set'}
                            {'  ·  '}
                            {v.images.length} photo{v.images.length !== 1 ? 's' : ''}
                          </Text>
                          {v.description && (
                            <Text style={styles.visitDesc} numberOfLines={1}>{v.description}</Text>
                          )}
                        </View>
                        <Icons.Chev color={colors.inkSoft} />
                      </View>
                    </HandRect>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <NailCardModal
        visible={!!activeVisit}
        onClose={() => setActiveVisit(null)}
        images={(activeVisit?.images ?? []).map((image) => ({ id: image.id, image_url: mediaUrl(image.url) }))}
      />

      <Modal transparent visible={showMerge} animationType="fade" onRequestClose={() => setShowMerge(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowMerge(false)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <HandRect padding={20} radius={radius.xl}>
              <Text style={styles.modalTitle}>Merge guest client</Text>
              <Text style={styles.modalText}>Appointments, photos and notes will move to the selected registered account.</Text>
              <ScrollView style={styles.optionList} nestedScrollEnabled>
                {allClients.filter((item) => item.accountType === 'REGISTERED' && item.id !== id).map((item) => (
                  <Pressable key={item.id} onPress={() => setMergeTargetId(item.id)} style={[styles.option, mergeTargetId === item.id && styles.optionSelected]}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionMeta}>{item.phone || item.email || 'No contact information'}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              {actionMessage && <Text style={styles.modalError}>{actionMessage}</Text>}
              <HandButton full color={colors.pinkInk} disabled={actionBusy || !mergeTargetId} onPress={mergeGuest}>{actionBusy ? 'Merging…' : 'Merge client'}</HandButton>
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={showReset} animationType="fade" onRequestClose={() => setShowReset(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowReset(false)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <HandRect padding={20} radius={radius.xl}>
              <Text style={styles.modalTitle}>Reset client password</Text>
              <Text style={styles.modalText}>Set a temporary password with at least 8 characters.</Text>
              <Field containerStyle={{ marginVertical: 16 }} placeholder="Temporary password" secureTextEntry value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" />
              {actionMessage && <Text style={styles.modalError}>{actionMessage}</Text>}
              <HandButton full color={colors.pinkInk} disabled={actionBusy} onPress={resetPassword}>{actionBusy ? 'Resetting…' : 'Reset password'}</HandButton>
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(draft)} animationType="fade" onRequestClose={() => setDraft(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDraft(null)}><Pressable style={styles.modal} onPress={() => undefined}><HandRect padding={20} radius={radius.xl}><Text style={styles.modalTitle}>Edit client profile</Text><ScrollView style={styles.profileForm} keyboardShouldPersistTaps="handled"><View style={{ gap: 10 }}><Field placeholder="Unique name" value={draft?.name ?? ''} onChangeText={(value) => editField('name', value)} /><Field placeholder={draft?.accountType === 'GUEST' ? 'Phone (optional)' : 'Phone'} keyboardType="phone-pad" value={draft?.phone ?? ''} onChangeText={(value) => editField('phone', value || null)} /><Field placeholder="Birthday · YYYY-MM-DD (optional)" value={draft?.birthday ?? ''} onChangeText={(value) => editField('birthday', value || null)} /><Field placeholder="Instagram (optional)" value={draft?.instagram ?? ''} onChangeText={(value) => editField('instagram', value || null)} /><Field placeholder="WeChat (optional)" value={draft?.wechat ?? ''} onChangeText={(value) => editField('wechat', value || null)} /><Field placeholder="Preferred nail style" multiline value={draft?.preferredNailStyle ?? ''} onChangeText={(value) => editField('preferredNailStyle', value || null)} /><Field placeholder="Allergy or sensitivity notes" multiline value={draft?.allergyNotes ?? ''} onChangeText={(value) => editField('allergyNotes', value || null)} /><Field placeholder="Private admin notes" multiline value={draft?.adminNotes ?? ''} onChangeText={(value) => editField('adminNotes', value || null)} /><Text style={styles.optionMeta}>Account status</Text><View style={styles.statusRow}><HandButton size="sm" color={draft?.status === 'ACTIVE' ? colors.blueInk : colors.inkFaint} onPress={() => editField('status', 'ACTIVE')}>Active</HandButton><HandButton size="sm" color={draft?.status === 'DISABLED' ? colors.pinkInk : colors.inkFaint} onPress={() => editField('status', 'DISABLED')}>Disabled</HandButton></View></View></ScrollView>{actionMessage && <Text style={styles.modalError}>{actionMessage}</Text>}<HandButton full color={colors.pinkInk} disabled={actionBusy} onPress={saveProfile}>{actionBusy ? 'Saving…' : 'Save client profile'}</HandButton></HandRect></Pressable></Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: {
    fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.ink,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  handle: {
    marginTop: 2, fontFamily: fonts.mono, fontSize: 10, color: colors.pinkInk,
    letterSpacing: letterSpacing.meta,
  },
  profileEditRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountType: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, textTransform: 'uppercase' },
  accountActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionMessage: { marginTop: 8, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.blueInk },

  sectionLabel: {
    marginBottom: 8,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  notesFooter: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
  },
  savedText: { fontFamily: fonts.body, fontSize: 12, color: colors.blueInk },

  emptyTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, letterSpacing: letterSpacing.display },

  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.ink, borderStyle: 'dashed',
  },
  visitDate: {
    fontFamily: fonts.display, fontSize: 14, color: colors.ink, letterSpacing: letterSpacing.display,
  },
  visitMeta: {
    marginTop: 2, fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, letterSpacing: 0.4,
  },
  visitDesc: {
    marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,28,15,.55)', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 370, alignSelf: 'center' },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  modalText: { marginTop: 5, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.inkSoft },
  optionList: { maxHeight: 260, marginVertical: 14 },
  option: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.creamHair },
  optionSelected: { backgroundColor: colors.blueSoft, borderRadius: radius.md },
  optionName: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  optionMeta: { marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  modalError: { marginBottom: 10, fontFamily: fonts.body, fontSize: 12, color: '#c0554f' },
  profileForm: { maxHeight: 470, marginVertical: 14 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
});
