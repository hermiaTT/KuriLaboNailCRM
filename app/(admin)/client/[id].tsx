import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
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
import { supabase } from '../../../lib/supabase';

type ClientProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  notes: string | null;
};

type NailImage = { id: string; image_url: string; display_order: number };
type Visit = {
  id: string;
  date: string | null;
  price: number | null;
  description: string | null;
  created_at: string;
  images: NailImage[];
};

export default function AdminClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetchAll();
    }, [id]),
  );

  async function fetchAll() {
    setLoading(true);
    const [clientRes, collectionsRes, doneApptsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, email, phone, instagram, notes')
        .eq('id', id)
        .single(),
      supabase
        .from('collections')
        .select('id, date, price, description, created_at, nail_images(id, image_url, display_order)')
        .eq('client_id', id)
        .order('date', { ascending: false, nullsFirst: false }),
      // Any appointment marked "done" is a real visit too, regardless of how far in
      // the past its slot date is — status is the source of truth here, not date.
      supabase
        .from('appointments')
        .select('id, price, note, created_at, slot:available_slots!appointments_slot_id_fkey(date)')
        .eq('user_id', id)
        .eq('status', 'done'),
    ]);

    if (clientRes.data) {
      setClient(clientRes.data as ClientProfile);
      setNotes(clientRes.data.notes ?? '');
    }

    const fromCollections: Visit[] = (collectionsRes.data ?? []).map((v: any) => ({
      id: v.id,
      date: v.date,
      price: v.price,
      description: v.description,
      created_at: v.created_at,
      images: [...(v.nail_images ?? [])].sort(
        (a: NailImage, b: NailImage) => a.display_order - b.display_order,
      ),
    }));

    const doneAppts = (doneApptsRes.data ?? []).map((a: any) => ({
      id: a.id,
      price: a.price,
      note: a.note,
      created_at: a.created_at,
      date: (Array.isArray(a.slot) ? a.slot[0] : a.slot)?.date ?? null,
    }));

    let fromAppointments: Visit[] = [];
    const apptIds = doneAppts.map((a) => a.id);
    if (apptIds.length > 0) {
      const { data: imgs } = await supabase
        .from('appointment_images')
        .select('id, appointment_id, image_url, display_order')
        .in('appointment_id', apptIds)
        .order('display_order', { ascending: true });

      const byAppt: Record<string, NailImage[]> = {};
      for (const img of (imgs ?? []) as any[]) {
        byAppt[img.appointment_id] = byAppt[img.appointment_id] || [];
        byAppt[img.appointment_id].push(img);
      }

      fromAppointments = doneAppts.map((a) => ({
        id: a.id,
        date: a.date,
        price: a.price,
        description: a.note,
        created_at: a.created_at,
        images: byAppt[a.id] ?? [],
      }));
    }

    setVisits(
      [...fromCollections, ...fromAppointments].sort((a, b) => {
        const ad = a.date ?? a.created_at;
        const bd = b.date ?? b.created_at;
        return ad < bd ? 1 : ad > bd ? -1 : 0;
      }),
    );
    setLoading(false);
  }

  async function saveNotes() {
    if (!id) return;
    setSavingNotes(true);
    const { error } = await supabase.from('profiles').update({ notes: notes.trim() || null }).eq('id', id);
    setSavingNotes(false);
    if (!error) {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  }

  function formatDate(v: Visit) {
    const raw = v.date ?? v.created_at;
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
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
          </HandRect>
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
                            <Image source={{ uri: cover.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
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
        images={activeVisit?.images ?? []}
      />
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
});
