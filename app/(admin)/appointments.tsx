import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Doodle,
  EyebrowTitle,
  Field,
  HandButton,
  HandChip,
  HandRect,
  Icons,
  NailCardModal,
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
import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabase';

const FILTERS = [
  { id: 'today',    label: 'today' },
  { id: 'pending',  label: 'pending' },
  { id: 'upcoming', label: 'upcoming' },
  { id: 'past',     label: 'past' },
] as const;

type FilterId = typeof FILTERS[number]['id'];
type ApptImage = { id: string; image_url: string; display_order: number };
type Appt = {
  id: string;
  status: 'pending' | 'confirmed' | 'no_show' | 'done';
  price: number | null;
  note: string | null;
  clientName: string;
  slot: { date: string; start_time: string; end_time: string } | null;
  images: ApptImage[];
};

const STORAGE_BUCKET = 'images';

function fmtTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m}${hour >= 12 ? 'PM' : 'AM'}`;
}

function timeTag(dateStr: string, todayStr: string) {
  if (dateStr === todayStr) return 'today';
  return dateStr > todayStr ? 'upcoming' : 'past';
}

export default function AdminAppointmentsScreen() {
  const [filter, setFilter] = useState<FilterId>('today');
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [activeImages, setActiveImages] = useState<ApptImage[] | null>(null);

  // Mark-done modal state
  const [markDoneTarget, setMarkDoneTarget] = useState<Appt | null>(null);
  const [mdPrice, setMdPrice] = useState('');
  const [mdNote, setMdNote] = useState('');
  const [mdImages, setMdImages] = useState<{ uri: string }[]>([]);
  const [mdSaving, setMdSaving] = useState(false);
  const [mdProgress, setMdProgress] = useState<{ done: number; total: number } | null>(null);
  const [mdError, setMdError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, []),
  );

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, status, price, note, profiles(name), slot:available_slots!appointments_slot_id_fkey(date, start_time, end_time)')
      .order('created_at', { ascending: false });
    if (error) console.error('[AdminAppointments] fetchAll error:', error);

    const rows: Appt[] = (data ?? []).map((a: any) => ({
      id: a.id,
      status: a.status,
      price: a.price,
      note: a.note,
      clientName: Array.isArray(a.profiles) ? (a.profiles[0]?.name ?? '—') : (a.profiles?.name ?? '—'),
      slot: Array.isArray(a.slot) ? a.slot[0] ?? null : a.slot,
      images: [],
    }));

    const doneIds = rows.filter((r) => r.status === 'done').map((r) => r.id);
    if (doneIds.length > 0) {
      const { data: imgs } = await supabase
        .from('appointment_images')
        .select('id, appointment_id, image_url, display_order')
        .in('appointment_id', doneIds)
        .order('display_order', { ascending: true });

      const byAppt: Record<string, ApptImage[]> = {};
      for (const img of (imgs ?? []) as any[]) {
        byAppt[img.appointment_id] = byAppt[img.appointment_id] || [];
        byAppt[img.appointment_id].push(img);
      }
      for (const r of rows) r.images = byAppt[r.id] ?? [];
    }

    setAppts(rows);
    setLoading(false);
  }

  const display = appts.filter((a) => {
    if (filter === 'pending') return a.status === 'pending';
    if (!a.slot) return false;
    if (filter === 'today') return a.slot.date === todayStr;
    if (filter === 'upcoming') return a.slot.date > todayStr;
    return a.slot.date < todayStr;
  });

  async function handleConfirm(id: string) {
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id);
    fetchAll();
  }

  async function handleNoShow(id: string) {
    await supabase.from('appointments').update({ status: 'no_show' }).eq('id', id);
    fetchAll();
  }

  function openMarkDone(appt: Appt) {
    setMarkDoneTarget(appt);
    setMdPrice(appt.price != null ? String(appt.price) : '');
    setMdNote(appt.note ?? '');
    setMdImages([]);
    setMdError(null);
  }

  function closeMarkDone() {
    if (mdSaving) return;
    setMarkDoneTarget(null);
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setMdError('Photo library access is required to pick images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      orderedSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setMdImages((prev) => {
        const incoming = result.assets.map((a) => ({ uri: a.uri }));
        const all = [...prev, ...incoming];
        return all.filter((img, i) => all.findIndex((x) => x.uri === img.uri) === i);
      });
      setMdError(null);
    }
  }

  function removeImage(uri: string) {
    setMdImages((prev) => prev.filter((img) => img.uri !== uri));
  }

  async function uploadOne(image: { uri: string }, index: number): Promise<string> {
    const ext = image.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
    const storagePath = `appointments/${Date.now()}_${index}.${ext}`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? supabaseAnonKey;

    const uploadResult = await FileSystem.uploadAsync(
      `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`,
      image.uri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
          'Content-Type': mimeType,
        },
      },
    );

    if (uploadResult.status !== 200) {
      throw new Error(`Storage [${index + 1}]: ${uploadResult.body}`);
    }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return urlData.publicUrl;
  }

  async function submitMarkDone() {
    if (!markDoneTarget) return;
    setMdError(null);

    const priceValue = mdPrice.trim() ? Number(mdPrice.trim()) : null;
    if (priceValue != null && Number.isNaN(priceValue)) {
      setMdError('Price must be a number.');
      return;
    }

    setMdSaving(true);
    try {
      if (mdImages.length > 0) {
        setMdProgress({ done: 0, total: mdImages.length });
        for (let i = 0; i < mdImages.length; i++) {
          const publicUrl = await uploadOne(mdImages[i], i);
          const { error: imgErr } = await supabase
            .from('appointment_images')
            .insert({ appointment_id: markDoneTarget.id, image_url: publicUrl, display_order: i });
          if (imgErr) throw new Error(`Photo [${i + 1}]: ${imgErr.message}`);
          setMdProgress({ done: i + 1, total: mdImages.length });
        }
      }

      const { error: updateErr } = await supabase
        .from('appointments')
        .update({ status: 'done', price: priceValue, note: mdNote.trim() || null })
        .eq('id', markDoneTarget.id);
      if (updateErr) throw new Error(updateErr.message);

      setMarkDoneTarget(null);
      fetchAll();
    } catch (e: any) {
      setMdError(e.message ?? 'Something went wrong.');
    } finally {
      setMdSaving(false);
      setMdProgress(null);
    }
  }

  return (
    <Screen>
      <ScreenHeader/>
      <EyebrowTitle
        eyebrow="schedule"
        title="Appointments"
        trailing={<Doodle kind="sparkle" size={20} color={colors.blue} style={{ transform: [{ rotate: '-12deg' }] }}/>}
      />

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <HandChip key={f.id} active={filter === f.id} onPress={() => setFilter(f.id)}>
            {f.label}
          </HandChip>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.pinkInk} />
        </View>
      ) : (
        <View style={styles.list}>
          {display.map((a) => {
            const cover = a.images[0];
            return (
              <HandRect key={a.id} padding={16} radius={radius.lg}>
                <View style={styles.row}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>
                      {a.slot ? new Date(a.slot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toLowerCase() : '—'}
                    </Text>
                    <Text style={styles.dateDay}>{a.slot ? new Date(a.slot.date + 'T00:00:00').getDate() : '—'}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.client}>{a.clientName}</Text>
                    <Text style={styles.time}>
                      {a.slot ? `${fmtTime(a.slot.start_time)} – ${fmtTime(a.slot.end_time)}` : '—'}
                      {a.slot ? `  ·  ${timeTag(a.slot.date, todayStr)}` : ''}
                    </Text>
                  </View>
                  <StatusBadge status={a.status as any}/>
                </View>
                <View style={styles.divider}/>

                {(a.status === 'done' || a.status === 'no_show') && (
                  <View style={styles.summaryRow}>
                    {cover ? (
                      <Pressable onPress={() => setActiveImages(a.images)}>
                        <Image source={{ uri: cover.image_url }} style={styles.thumb} />
                      </Pressable>
                    ) : null}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      {a.price != null && <Text style={styles.priceText}>${a.price}</Text>}
                      {a.note ? <Text style={styles.noteText} numberOfLines={2}>{a.note}</Text> : null}
                      {a.images.length > 0 && (
                        <Text style={styles.photoCount}>{a.images.length} photo{a.images.length !== 1 ? 's' : ''}</Text>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.actions}>
                  {a.status === 'pending' && (
                    <HandButton size="sm" color={colors.pinkInk} onPress={() => handleConfirm(a.id)}>Confirm</HandButton>
                  )}
                  {a.status === 'confirmed' && (
                    <>
                      <HandButton size="sm" color={colors.blueInk} onPress={() => openMarkDone(a)}>Mark done</HandButton>
                      <Pressable style={styles.noShowBtn} onPress={() => handleNoShow(a.id)}>
                        <Text style={styles.noShowText}>no show</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </HandRect>
            );
          })}

          {display.length === 0 && (
            <HandRect padding={24} radius={radius.lg} dashed style={{ alignItems: 'center' }}>
              <Text style={styles.emptyText}>No visits here yet</Text>
            </HandRect>
          )}
        </View>
      )}

      <NailCardModal
        visible={!!activeImages}
        onClose={() => setActiveImages(null)}
        images={activeImages ?? []}
      />

      {/* Mark done modal */}
      <Modal transparent visible={!!markDoneTarget} animationType="fade" onRequestClose={closeMarkDone}>
        <Pressable style={styles.modalBg} onPress={closeMarkDone}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 360 }}>
            <HandRect padding={20} radius={radius.xl}>
              <Text style={styles.modalTitle}>Mark visit done</Text>
              <Text style={styles.modalSub}>{markDoneTarget?.clientName}</Text>

              <View style={{ marginTop: 14, gap: 10 }}>
                <Field
                  placeholder="Price (e.g. 85)"
                  value={mdPrice}
                  onChangeText={setMdPrice}
                  keyboardType="decimal-pad"
                />
                <Field
                  placeholder="Note (optional)"
                  value={mdNote}
                  onChangeText={setMdNote}
                  multiline
                />

                {mdImages.length > 0 ? (
                  <View style={styles.thumbGrid}>
                    {mdImages.map(({ uri }) => (
                      <View key={uri} style={styles.thumbWrap}>
                        <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                        <Pressable style={styles.removeBtn} onPress={() => removeImage(uri)} hitSlop={4}>
                          <Text style={styles.removeBtnText}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                    <Pressable style={styles.addMoreTile} onPress={pickImages}>
                      <Icons.Plus color={colors.inkSoft} size={20} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={pickImages}>
                    <HandRect padding={0} radius={radius.md} dashed>
                      <View style={styles.dropPlaceholder}>
                        <Icons.Plus color={colors.inkSoft} size={24} />
                        <Text style={styles.dropText}>Add photos (optional)</Text>
                      </View>
                    </HandRect>
                  </Pressable>
                )}

                {mdProgress && (
                  <Text style={styles.progressText}>Uploading {mdProgress.done} / {mdProgress.total}…</Text>
                )}
                {mdError && <Text style={styles.errorText}>{mdError}</Text>}
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelBtn} onPress={closeMarkDone} disabled={mdSaving}>
                  <Text style={styles.cancelText}>cancel</Text>
                </Pressable>
                <HandButton color={colors.blueInk} onPress={submitMarkDone} disabled={mdSaving}>
                  {mdSaving ? 'Saving…' : 'Save & mark done'}
                </HandButton>
              </View>
            </HandRect>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1, borderColor: colors.pinkInk, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  dateMonth: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.pinkInk,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  dateDay: {
    fontFamily: fonts.display, fontSize: 20, color: colors.ink,
    letterSpacing: letterSpacing.display, lineHeight: 22,
  },
  client: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  time: {
    marginTop: 2,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  divider: {
    height: 1, marginVertical: 12,
    backgroundColor: colors.creamHair, borderStyle: 'dashed',
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  thumb: {
    width: 48, height: 48, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.ink, borderStyle: 'dashed',
  },
  priceText: {
    fontFamily: fonts.display, fontSize: 15, color: colors.ink, letterSpacing: letterSpacing.display,
  },
  noteText: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  photoCount: {
    marginTop: 2, fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noShowBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  noShowText: {
    fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },

  modalBg: {
    flex: 1, backgroundColor: 'rgba(40,28,15,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalTitle: {
    fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: letterSpacing.display,
  },
  modalSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  modalActions: {
    marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14,
  },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 10 },
  cancelText: {
    fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  dropPlaceholder: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  dropText: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: 64, height: 64, borderRadius: radius.md, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 3, right: 3,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: colors.white, fontSize: 10, fontWeight: '600' },
  addMoreTile: {
    width: 64, height: 64, borderRadius: radius.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.creamHair,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamCard,
  },
  progressText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: '#c0554f' },
});
