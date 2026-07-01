import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fonts, radius } from '../../constants/theme';
import { HandRect } from './HandRect';
import { Icons } from './Icons';
import { NailHand, type NailTone } from './NailHand';

export type CardImage = { id?: string; image_url?: string | null };

interface NailCardModalProps {
  /** Whether the modal is open. */
  visible: boolean;
  /** Close handler (backdrop tap, close button, hardware back). */
  onClose: () => void;
  /** Ordered images to swipe through. */
  images: CardImage[];
  /** Placeholder tone used when an image has no url. */
  tone?: NailTone;
  /** Card tilt in degrees (scrapbook feel). Default -0.6. */
  tilt?: number;
  /** Wobble intensity forwarded to HandRect. Default 1. */
  wobble?: 0 | 1 | 2 | 3;
}

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.min(SCREEN_W - 52, 340);
const MEDIA_H = Math.round(CARD_W * 1.3);

/**
 * NailCardModal — the enlarged image card. A dimmed brown backdrop with a
 * centered wobbly cream card that shows ONLY the image series: swipe left/
 * right, arrows, dots, and a frame counter. Real photos drop into each
 * slide; a NailHand placeholder fills any slide without a url.
 *
 *   <NailCardModal
 *     visible={!!activeCol}
 *     onClose={() => setActiveCol(null)}
 *     images={activeCol?.nail_images ?? []}
 *   />
 */
export function NailCardModal({
  visible,
  onClose,
  images,
  tone = 'pink',
  tilt = -0.6,
  wobble = 1,
}: NailCardModalProps) {
  const [idx, setIdx] = useState(0);
  const [pageW, setPageW] = useState(CARD_W);
  const scroller = useRef<ScrollView>(null);
  const n = images.length;

  // Reset to first frame whenever the modal (re)opens.
  useEffect(() => {
    if (visible) {
      setIdx(0);
      requestAnimationFrame(() => scroller.current?.scrollTo({ x: 0, animated: false }));
    }
  }, [visible]);

  const onLayout = (e: LayoutChangeEvent) => setPageW(e.nativeEvent.layout.width);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageW);
    if (i !== idx) setIdx(i);
  };

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(n - 1, i));
    setIdx(clamped);
    scroller.current?.scrollTo({ x: clamped * pageW, animated: true });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* stop taps on the card from closing the modal */}
        <Pressable style={[styles.cardWrap, { transform: [{ rotate: `${tilt}deg` }] }]} onPress={() => {}}>
          <HandRect padding={0} radius={radius.xl} wobble={wobble} style={styles.card}>
            <View style={styles.media} onLayout={onLayout}>
              <ScrollView
                ref={scroller}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumEnd}
                scrollEnabled={n > 1}
              >
                {images.map((img, i) => (
                  <View key={img.id ?? i} style={{ width: pageW, height: MEDIA_H }}>
                    {img.image_url ? (
                      <Image
                        source={{ uri: img.image_url }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <NailHand tone={tone} style={StyleSheet.absoluteFill} />
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* frame counter */}
              {n > 1 && (
                <View style={styles.counter}>
                  <View style={styles.counterInner}>
                    <Text style={styles.counterText}>{idx + 1} / {n}</Text>
                  </View>
                </View>
              )}

              {/* arrows */}
              {n > 1 && (
                <>
                  <Pressable
                    style={[styles.arrow, styles.arrowLeft, idx === 0 && styles.arrowHidden]}
                    disabled={idx === 0}
                    hitSlop={6}
                    onPress={() => goTo(idx - 1)}
                  >
                    <Icons.ChevL color={colors.ink} size={18} />
                  </Pressable>
                  <Pressable
                    style={[styles.arrow, styles.arrowRight, idx === n - 1 && styles.arrowHidden]}
                    disabled={idx === n - 1}
                    hitSlop={6}
                    onPress={() => goTo(idx + 1)}
                  >
                    <Icons.Chev color={colors.ink} size={18} />
                  </Pressable>
                </>
              )}

              {/* dots */}
              {n > 1 && (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <Pressable key={i} hitSlop={6} onPress={() => goTo(i)}>
                      <View style={[styles.dot, i === idx && styles.dotActive]} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </HandRect>

          {/* close button, overlapping the top-right corner */}
          <Pressable style={styles.closeBtn} hitSlop={8} onPress={onClose}>
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(40,28,15,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  cardWrap: { width: CARD_W, position: 'relative' },
  card: { overflow: 'visible' },
  media: {
    height: MEDIA_H,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.creamCard,
  },

  counter: {
    position: 'absolute', top: 12, left: 12,
  },
  counterInner: {
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderWidth: 1, borderColor: colors.ink,
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
  },
  counterText: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.ink, letterSpacing: 1,
  },

  arrow: {
    position: 'absolute', top: '50%', marginTop: -17,
    width: 34, height: 34, borderRadius: 999,
    backgroundColor: 'rgba(255,253,247,0.94)',
    borderWidth: 1.3, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  arrowHidden: { opacity: 0 },

  dots: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: {
    width: 7, height: 7, borderRadius: 999,
    backgroundColor: 'rgba(255,253,247,0.95)',
    borderWidth: 1, borderColor: colors.ink,
  },
  dotActive: {
    width: 18, backgroundColor: colors.pinkInk, borderColor: colors.pinkInk,
  },

  closeBtn: {
    position: 'absolute', top: -12, right: -12,
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: colors.creamCard,
    borderWidth: 1.5, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 10,
  },
  closeGlyph: { color: colors.ink, fontSize: 17, lineHeight: 20 },
});
