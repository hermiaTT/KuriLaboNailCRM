import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Ellipse, G, Rect } from 'react-native-svg';
import { colors } from '../../constants/theme';
import { ConfettiBg } from './ConfettiBg';

export type NailTone = 'pink' | 'yellow' | 'green' | 'lilac' | 'coral' | 'mocha' | 'blue' | 'teal';

interface NailHandProps {
  /** When provided, displays the real photo instead of the stylized SVG. */
  source?: ImageSourcePropType;
  /** Tone of the placeholder when no `source` is given. */
  tone?: NailTone;
  style?: StyleProp<ViewStyle>;
}

const PALETTES: Record<NailTone, { tips: string[]; bg: string }> = {
  pink:   { tips: ['#F4C9CD','#EFB5BC','#E9A6AE','#E298A1','#EFB5BC'], bg: '#F8DEDC' },
  yellow: { tips: ['#F4E2A8','#EDD68C','#E6C972','#DEBD5B','#EDD68C'], bg: '#F7EDC9' },
  green:  { tips: ['#C9D9B6','#B7CC9C','#A4BD83','#94B070','#B7CC9C'], bg: '#DBE6C6' },
  lilac:  { tips: ['#DCC8E5','#C8B4D6','#B5A0C6','#9F89B5','#C8B4D6'], bg: '#E5D6EE' },
  coral:  { tips: ['#F2B6A7','#EE9C8E','#E58575','#D86F5E','#EE9C8E'], bg: '#F6CFC4' },
  mocha:  { tips: ['#DCC9B0','#C8B294','#B49C7C','#9F8866','#C8B294'], bg: '#E8D7BD' },
  blue:   { tips: ['#D2E4ED','#BDD9E5','#A6CADB','#8FBBD0','#BDD9E5'], bg: '#DFEBF1' },
  teal:   { tips: ['#A8C5C6','#82B4B6','#6CA2A4','#578E92','#82B4B6'], bg: '#BFD4D6' },
};

/**
 * NailHand — image slot for a nail photo. Renders a stylized 5-finger
 * SVG drawing in the absence of a real `source`. The placeholder is the
 * ONLY visual the user ever sees when no photo is present.
 *
 *   <NailHand tone="pink" style={{ aspectRatio: 1 }}/>
 *   <NailHand source={{ uri: photo.url }} style={{ aspectRatio: 1 }}/>
 */
export function NailHand({ source, tone = 'pink', style }: NailHandProps) {
  if (source) {
    return (
      <View style={[styles.container, style]}>
        <Image source={source} style={styles.image} resizeMode="cover"/>
      </View>
    );
  }
  const p = PALETTES[tone];
  // Five fingers — same layout as the prototype.
  const fingers = [
    { x: 18,  y: 75, w: 24, h: 60, rot: -10 },
    { x: 45,  y: 50, w: 24, h: 70, rot: -4  },
    { x: 74,  y: 38, w: 26, h: 80, rot: 0   },
    { x: 104, y: 50, w: 24, h: 70, rot: 4   },
    { x: 132, y: 75, w: 24, h: 60, rot: 10  },
  ];
  return (
    <View style={[styles.container, { backgroundColor: p.bg }, style]}>
      <ConfettiBg intensity={0.15}/>
      <Svg viewBox="0 0 180 180" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Ellipse cx="90" cy="160" rx="64" ry="22" fill="#F4DBC9" opacity={0.7}/>
        {fingers.map((f, i) => {
          const cx = f.x + f.w / 2;
          return (
            <G key={i} transform={`rotate(${f.rot} ${cx} ${f.y + f.h / 2})`}>
              <Rect x={f.x} y={f.y} width={f.w} height={f.h + 30} rx={f.w / 2} ry={f.w / 2} fill="#F4DBC9"/>
              <Ellipse cx={cx} cy={f.y + 11} rx={f.w / 2 - 3} ry={15} fill={p.tips[i]}/>
              <Ellipse cx={cx - 3} cy={f.y + 8} rx={2.5} ry={5} fill="rgba(255,255,255,0.55)"/>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    backgroundColor: colors.creamCard,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
