import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
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
  HandChip,
  HandRect,
  Icons,
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
import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabase';

type Client = { id: string; name: string; email: string | null };
type PickedImage = { uri: string };
type PastVisit = {
  id: string;
  date: string | null;
  price: number | null;
  nail_images: { image_url: string }[];
};

const TAG_OPTIONS = ['glass', 'french', 'chrome', 'gel', 'soft', 'minimal', 'peach', 'sage'];
const STORAGE_BUCKET = 'images';

export default function AdminUploadScreen() {
  const insets = useSafeAreaInsets();

  // Images — multiple, each carries base64 for reliable binary upload
  const [images, setImages] = useState<PickedImage[]>([]);

  // Client picker
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientList, setShowClientList] = useState(false);

  // Visit picker (which past visit these photos belong to, once a client is selected)
  const [pastVisits, setPastVisits] = useState<PastVisit[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [price, setPrice] = useState('');

  // Form fields
  const [titleOrDate, setTitleOrDate] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Status
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'user')
      .order('name')
      .then(({ data }) => setAllClients((data ?? []) as Client[]));
  }, []);

  useEffect(() => {
    if (success) setSuccess(false);
  }, [images, titleOrDate, desc, tags, selectedClient, selectedVisitId, price]);

  useEffect(() => {
    setSelectedVisitId(null);
    setPrice('');
    if (!selectedClient) {
      setPastVisits([]);
      return;
    }
    supabase
      .from('collections')
      .select('id, date, price, nail_images(image_url)')
      .eq('client_id', selectedClient.id)
      .order('date', { ascending: false, nullsFirst: false })
      .then(({ data }) => setPastVisits((data ?? []) as PastVisit[]));
  }, [selectedClient]);

  function selectVisit(v: PastVisit | null) {
    setSelectedVisitId(v?.id ?? null);
    setPrice(v?.price != null ? String(v.price) : '');
  }

  const toggleTag = (t: string) =>
    setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const filteredClients = allClients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q);
  });

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo library access is required to pick images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      orderedSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImages((prev) => {
        const incoming = result.assets.map((a) => ({ uri: a.uri }));
        const all = [...prev, ...incoming];
        return all.filter((img, i) => all.findIndex((x) => x.uri === img.uri) === i);
      });
      setError(null);
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  }

  function resetForm() {
    setImages([]);
    setSelectedClient(null);
    setClientSearch('');
    setPastVisits([]);
    setSelectedVisitId(null);
    setPrice('');
    setTitleOrDate('');
    setDesc('');
    setTags([]);
    setUploadProgress(null);
  }

  async function uploadOne(image: PickedImage, index: number): Promise<string> {
    const ext = image.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
    const storagePath = `${selectedClient ? 'collection' : 'inspiration'}/${Date.now()}_${index}.${ext}`;

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

  async function handleSave() {
    if (images.length === 0) { setError('Please pick at least one photo.'); return; }

    setError(null);
    setUploading(true);
    setUploadProgress({ done: 0, total: images.length });

    try {
      const today = new Date().toISOString().split('T')[0];
      const priceValue = price.trim() ? Number(price.trim()) : null;
      if (priceValue != null && Number.isNaN(priceValue)) {
        throw new Error('Price must be a number.');
      }

      const existingVisit = selectedVisitId
        ? pastVisits.find((v) => v.id === selectedVisitId)
        : null;

      let collectionId: string;
      let startOrder = 0;

      if (existingVisit) {
        // Adding photos to a visit that already exists — reuse its collection row.
        collectionId = existingVisit.id;
        startOrder = existingVisit.nail_images.length;

        if (priceValue !== existingVisit.price) {
          const { error: priceErr } = await supabase
            .from('collections')
            .update({ price: priceValue })
            .eq('id', collectionId);
          if (priceErr) throw new Error(`Collection: ${priceErr.message}`);
        }
      } else {
        // Step 1: Create one collection for this upload batch
        const { data: col, error: colErr } = await supabase
          .from('collections')
          .insert({
            client_id: selectedClient?.id ?? null,
            title: !selectedClient ? (titleOrDate.trim() || null) : null,
            date: selectedClient ? (titleOrDate.trim() || today) : null,
            description: desc.trim() || null,
            tags: tags.length > 0 ? tags : null,
            price: selectedClient ? priceValue : null,
            source_type: selectedClient ? 'customer' : 'admin',
          })
          .select('id')
          .single();

        if (colErr) throw new Error(`Collection: ${colErr.message}`);
        collectionId = col.id;
      }

      // Step 2: Upload each image and link it to the collection
      for (let i = 0; i < images.length; i++) {
        const publicUrl = await uploadOne(images[i], i);

        const { error: imgErr } = await supabase
          .from('nail_images')
          .insert({
            collection_id: collectionId,
            image_url: publicUrl,
            display_order: startOrder + i,
          });

        if (imgErr) throw new Error(`DB [${i + 1}]: ${imgErr.message}`);
        setUploadProgress({ done: i + 1, total: images.length });
      }

      setSuccess(true);
      resetForm();
    } catch (e: any) {
      setError(e.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  const hasImages = images.length > 0;

  return (
    <Screen>
      <ScreenHeader />
      <EyebrowTitle
        eyebrow="upload"
        title="Add photos"
        trailing={
          <Doodle
            kind="sparkle"
            size={20}
            color={colors.coral}
            style={{ transform: [{ rotate: '-12deg' }] }}
          />
        }
      />

      {/* Photo picker area */}
      <View style={styles.row}>
        {hasImages ? (
          <View>
            <View style={styles.thumbGrid}>
              {images.map(({ uri }) => (
                <View key={uri} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                  <Pressable style={styles.removeBtn} onPress={() => removeImage(uri)} hitSlop={4}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addMoreTile} onPress={pickImages}>
                <Icons.Plus color={colors.inkSoft} size={24} />
                <Text style={styles.addMoreText}>Add{'\n'}more</Text>
              </Pressable>
            </View>
            <Text style={styles.thumbCount}>
              {images.length} photo{images.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        ) : (
          <Pressable onPress={pickImages}>
            <HandRect padding={0} radius={radius.lg} dashed>
              <View style={styles.dropPlaceholder}>
                <Icons.Plus color={colors.inkSoft} size={32} />
                <Text style={styles.dropTitle}>Tap to choose photos</Text>
                <Text style={styles.dropMeta}>select multiple · jpg or png</Text>
              </View>
            </HandRect>
          </Pressable>
        )}
      </View>

      {/* Client selector (optional) */}
      <View style={styles.row}>
        <Pressable onPress={() => setShowClientList((v) => !v)}>
          <HandRect padding={0} radius={radius.md} fill={colors.creamCard}>
            <View style={styles.clientRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.clientText, !selectedClient && { color: colors.inkFaint }]}>
                  {selectedClient ? selectedClient.name : 'Select client (optional)…'}
                </Text>
                {selectedClient?.email ? (
                  <Text style={styles.clientEmail}>{selectedClient.email}</Text>
                ) : null}
              </View>
              <Icons.Chev color={colors.inkSoft} size={16} />
            </View>
          </HandRect>
        </Pressable>

        {showClientList && (
          <HandRect padding={0} radius={radius.md} style={{ marginTop: 6 }}>
            <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
              <Field
                placeholder="Search clients…"
                value={clientSearch}
                onChangeText={setClientSearch}
              />
            </View>
            <View style={styles.clientListWrap}>
              {filteredClients.length === 0 ? (
                <Text style={styles.clientEmpty}>No clients found</Text>
              ) : (
                filteredClients.map((c, i) => (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.clientItem,
                      i < filteredClients.length - 1 && styles.clientItemDivider,
                      selectedClient?.id === c.id && styles.clientItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedClient(c);
                      setClientSearch('');
                      setShowClientList(false);
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.clientItemText}>{c.name}</Text>
                      {c.email ? <Text style={styles.clientEmail}>{c.email}</Text> : null}
                    </View>
                    {selectedClient?.id === c.id && (
                      <Text style={styles.clientCheck}>✓</Text>
                    )}
                  </Pressable>
                ))
              )}
            </View>
          </HandRect>
        )}
      </View>

      {/* Visit picker — which past visit these photos belong to */}
      {selectedClient && (
        <View style={styles.row}>
          <Text style={styles.label}>visit</Text>
          <View style={styles.chipRow}>
            <HandChip active={!selectedVisitId} onPress={() => selectVisit(null)}>
              + new visit
            </HandChip>
            {pastVisits.map((v) => (
              <HandChip
                key={v.id}
                active={selectedVisitId === v.id}
                onPress={() => selectVisit(v)}
              >
                {(v.date ?? 'undated')}{v.price != null ? ` · $${v.price}` : ''}
              </HandChip>
            ))}
          </View>
        </View>
      )}

      {/* Title / Date (only when starting a new visit / gallery upload) */}
      {!selectedVisitId && (
        <View style={styles.row}>
          <Field
            placeholder={selectedClient ? 'Date of visit (YYYY-MM-DD)' : 'Title (optional)'}
            value={titleOrDate}
            onChangeText={setTitleOrDate}
          />
        </View>
      )}

      {/* Price (per visit) */}
      {selectedClient && (
        <View style={styles.row}>
          <Field
            placeholder="Price (e.g. 85)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>
      )}

      {/* Description */}
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

      {/* Upload progress */}
      {uploading && uploadProgress && (
        <View style={styles.row}>
          <HandRect padding={14} radius={radius.md} fill={colors.creamCard}>
            <View style={styles.progressRow}>
              <ActivityIndicator color={colors.pinkInk} size="small" />
              <Text style={styles.progressText}>
                Uploading {uploadProgress.done} / {uploadProgress.total}…
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(uploadProgress.done / uploadProgress.total) * 100}%` as any },
                ]}
              />
            </View>
          </HandRect>
        </View>
      )}

      {/* Error / Success */}
      {error && (
        <View style={styles.row}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.row}>
          <HandRect padding={14} radius={radius.md} fill={colors.blueSoft} stroke={colors.blueInk}>
            <Text style={styles.successText}>Photos saved successfully 🌸</Text>
          </HandRect>
        </View>
      )}

      {/* Submit */}
      <View style={[styles.row, { paddingBottom: insets.bottom + spacing.lg }]}>
        <HandButton
          color={colors.pinkInk}
          full
          size="lg"
          onPress={handleSave}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : images.length > 1 ? (
            `Save ${images.length} photos →`
          ) : (
            'Save photo →'
          )}
        </HandButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },

  dropPlaceholder: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 6,
  },
  dropTitle: {
    fontFamily: fonts.display, fontSize: 15, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  dropMeta: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  addMoreTile: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.creamHair,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.creamCard,
  },
  addMoreText: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
    textAlign: 'center',
  },
  thumbCount: {
    marginTop: 8,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },

  clientRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 48,
  },
  clientText: { fontFamily: fonts.body, fontSize: typeScale.body, color: colors.ink },
  clientEmail: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, letterSpacing: 0.3, marginTop: 1 },
  clientListWrap: { maxHeight: 200 },
  clientItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  clientItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.creamHair,
  },
  clientItemSelected: { backgroundColor: colors.pinkSoft },
  clientItemText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  clientCheck: { color: colors.pinkInk, fontWeight: '700', fontSize: 14 },
  clientEmpty: {
    fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft,
    textAlign: 'center', padding: 16,
  },

  label: {
    marginBottom: 8,
    fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft,
    letterSpacing: letterSpacing.metaWide, textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  progressBarBg: {
    height: 4, borderRadius: 2, backgroundColor: colors.creamHair, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 2, backgroundColor: colors.pinkInk,
  },

  errorText: {
    fontFamily: fonts.body, fontSize: 13, color: '#e05c5c', textAlign: 'center',
  },
  successText: {
    fontFamily: fonts.display, fontSize: 14, color: colors.blueInk,
    letterSpacing: letterSpacing.display, textAlign: 'center',
  },
});
