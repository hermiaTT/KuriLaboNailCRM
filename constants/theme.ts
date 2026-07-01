import { Platform, StyleSheet } from 'react-native';

/**
 * KuriLabo theme tokens — see `Design.md` for the full system.
 *
 * Cream-first, low-saturation palette. Brown ink for all text. Pink and
 * blue are accents, NOT primaries. Never introduce new colors outside
 * this palette without updating Design.md.
 */

export const colors = {
  // Cream surfaces
  cream: '#FBF4E5',          // app/page background
  creamDeep: '#F3E9D2',      // section tint
  creamCard: '#FFFCF4',      // card fill
  creamHair: '#E8DCC2',      // hairline borders, dashed dividers

  // Ink — brown, matching the logo wordmark
  ink: '#5C3F22',
  inkSoft: '#856A4A',
  inkFaint: '#B0987A',

  // Pink accent (muted)
  pink: '#F1B6BC',
  pinkSoft: '#FBE2E4',
  pinkInk: '#B36773',        // pink readable on cream — for CTAs / selected states

  // Blue accent (logo brushstroke color)
  blue: '#BDD9E5',
  blueSoft: '#E6F1F5',
  blueInk: '#6B98AA',

  // Confetti — use sparingly (doodles, stat icons, only)
  yellow: '#F2D67A',
  green: '#B7CC9C',
  coral: '#EE9C8E',
  lilac: '#C8B4D6',
  teal: '#82B4B6',

  white: '#FFFFFF',          // contrast text on dark/photo surfaces only
  black: '#2A1E10',
};

/** Status colors (badge bg / text / ring). */
export const statusColors = {
  pending:   { bg: colors.pinkSoft, fg: colors.pinkInk, ring: colors.pinkInk },
  confirmed: { bg: colors.blueSoft, fg: colors.blueInk, ring: colors.blueInk },
  no_show:   { bg: '#EEE7D9',       fg: colors.inkFaint, ring: colors.inkFaint },
  done:      { bg: '#DDE9D5',       fg: '#6E8A55',       ring: '#6E8A55' },
  available: { bg: colors.creamCard, fg: colors.ink,     ring: colors.ink },
  booked:    { bg: '#EAE0CC',       fg: colors.inkFaint, ring: colors.inkFaint },
  blocked:   { bg: '#E5D6D6',       fg: '#8B6A6A',       ring: '#8B6A6A' },
};

export const spacing = {
  xs: 6, sm: 10, md: 16, lg: 22, xl: 32, xxl: 44,
};

export const radius = {
  sm: 12, md: 18, lg: 22, xl: 28, pill: 999,
};

export const typeScale = {
  // Type scale — see Design.md §3.2
  brand:      22,
  title:      28,
  section:    16,
  row:        14,
  statBig:    28,
  body:       14,
  bodySmall:  13,
  meta:       10,
  metaTiny:   9,
  chip:       12,
};

/**
 * Font families. Default is "typewriter":
 *   display: Special Elite (titles, dates, numbers)
 *   body:    Quicksand     (UI copy)
 *   mono:    DM Mono       (metadata, eyebrows)
 *
 * Special Elite only ships at 400 — never request synthetic bold.
 */
export const fonts = {
  display: 'SpecialElite_400Regular',
  body: 'Quicksand_500Medium',
  bodyBold: 'Quicksand_700Bold',
  mono: 'DMMono_500Medium',

  // Available swaps — not used by default but registered so the screen
  // can pull alternates in design exploration.
  hand: 'PatrickHand_400Regular',
  serifDisplay: 'Fraunces_400Regular',
  bodyAlt: 'Nunito_400Regular',
};

/**
 * Letter-spacing for display titles. Special Elite hates being tightly
 * tracked — keep this at 0.4–0.6 px on common sizes.
 */
export const letterSpacing = {
  display: 0.5,
  meta: 1.4,
  metaWide: 2,
};

/**
 * Soft drop shadow — used SPARINGLY. The hand-drawn wobble border and
 * slight rotation are the primary depth cues. Don't add a shadow to
 * every card.
 */
export const shadows = StyleSheet.create({
  soft: {
    shadowColor: '#3C2A1F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
});

/**
 * Confetti dots — same fixed positions used in the prototype so the
 * background remains stable across screens.
 */
export const confettiDots = [
  { x:  6, y:  8, r: 11, c: colors.teal   },
  { x: 22, y:  4, r:  7, c: colors.yellow },
  { x: 40, y:  9, r:  6, c: colors.coral  },
  { x: 58, y:  5, r:  9, c: colors.lilac  },
  { x: 76, y: 10, r:  7, c: colors.green  },
  { x: 92, y:  6, r: 10, c: colors.coral  },
  { x: 12, y: 22, r:  8, c: colors.pink   },
  { x: 32, y: 24, r:  6, c: colors.green  },
  { x: 52, y: 20, r:  7, c: colors.teal   },
  { x: 72, y: 24, r:  5, c: colors.yellow },
  { x: 88, y: 22, r:  8, c: colors.blue   },
  { x:  4, y: 38, r:  6, c: colors.teal   },
  { x: 26, y: 40, r:  7, c: colors.pink   },
  { x: 48, y: 38, r:  5, c: colors.coral  },
  { x: 68, y: 40, r:  7, c: colors.lilac  },
  { x: 86, y: 38, r:  6, c: colors.green  },
  { x: 14, y: 56, r:  7, c: colors.blue   },
  { x: 36, y: 58, r:  5, c: colors.yellow },
  { x: 56, y: 56, r:  8, c: colors.coral  },
  { x: 78, y: 58, r:  6, c: colors.teal   },
  { x: 94, y: 54, r:  7, c: colors.pink   },
  { x:  6, y: 74, r:  9, c: colors.lilac  },
  { x: 28, y: 76, r:  6, c: colors.green  },
  { x: 50, y: 74, r:  7, c: colors.yellow },
  { x: 70, y: 76, r:  5, c: colors.blue   },
  { x: 90, y: 74, r:  8, c: colors.teal   },
  { x: 16, y: 90, r:  7, c: colors.coral  },
  { x: 40, y: 92, r:  6, c: colors.pink   },
  { x: 62, y: 90, r:  7, c: colors.green  },
  { x: 82, y: 92, r:  5, c: colors.lilac  },
];

export type WobbleIntensity = 0 | 1 | 2 | 3;
export type StatusKey = keyof typeof statusColors;
