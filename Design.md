# KuriLabo · Design System

> Visual & component reference for the KuriLabo iOS-first nail salon CRM.
> This file is the single source of truth for all future UI work. If something
> contradicts this doc, fix the doc OR the implementation — do not silently
> diverge.

The system is rooted in the brand logo: warm cream paper, hand-drawn
multi-color confetti dots, a wobbly baby-blue brushstroke, and brown
typewriter text. Every screen should read as if it came from the same
sticker-book studio.

---

## 1. Brand DNA

Three feelings, in this order:

1. **Cream & cozy** — every surface is warm off-white, never pure `#FFF`.
2. **Hand-drawn, not perfect** — borders wobble, cards rotate ±0.6°, text is typewriter-set.
3. **Image-first** — UI elements stay quiet so nail photos breathe.

Avoid: enterprise SaaS gloss, gradient buttons, dark mode, neon, perfect
geometry, dense data tables.

---

## 2. Color

All colors are low-saturation. Treat cream as the primary surface, brown
as the only text color, and pink/blue as accents — not primaries.

### 2.1 Cream (page surface)

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FBF4E5` | App/page background |
| `creamDeep` | `#F3E9D2` | Section dividers, subtle surface tint |
| `creamCard` | `#FFFCF4` | Card fill (the "paper" the UI sits on) |
| `creamHair` | `#E8DCC2` | Hairline borders, dashed dividers |

### 2.2 Ink (text)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#5C3F22` | All primary text. Matches the "KuriLabo" wordmark. |
| `inkSoft` | `#856A4A` | Secondary text, metadata |
| `inkFaint` | `#B0987A` | Tertiary text, disabled, placeholder |

White text is reserved **only** for high-contrast pills (selected day on the calendar, primary CTA fill).

### 2.3 Accents (pink & blue)

| Token | Hex | Use |
|---|---|---|
| `pink` | `#F1B6BC` | Pink fill (heart icons, decorative bubbles) |
| `pinkSoft` | `#FBE2E4` | Pink surface tint (selected time block, preference card) |
| `pinkInk` | `#B36773` | Pink that's readable on cream (CTAs, brand `.` punctuation, selected date) |
| `blue` | `#BDD9E5` | Logo brushstroke color, info accents |
| `blueSoft` | `#E6F1F5` | Blue surface tint (confirmed status, info cards, tab pill) |
| `blueInk` | `#6B98AA` | Blue readable on cream (confirmed badges, info icons) |

### 2.4 Confetti accents (rare — sticker mode only)

Used on stat tile doodles, decorative stickers, status differentiation. **Never** as button fills or large surfaces.

| Token | Hex | Use |
|---|---|---|
| `yellow` | `#F2D67A` | sparkle / star doodles |
| `green` | `#B7CC9C` | sage / "new" badges |
| `coral` | `#EE9C8E` | warning-soft, heart doodles |
| `lilac` | `#C8B4D6` | flower doodles, swatches |
| `teal` | `#82B4B6` | sparingly, for a 5th tone |

### 2.5 Status colors

Status badges are pill-shaped with a dashed border + matching dot.

| Status | bg | text | ring |
|---|---|---|---|
| pending | `pinkSoft` | `pinkInk` | `pinkInk` |
| confirmed | `blueSoft` | `blueInk` | `blueInk` |
| cancelled | `#EEE7D9` | `inkFaint` | `inkFaint` |
| completed | `#DDE9D5` | `#6E8A55` | `#6E8A55` |
| available | `creamCard` | `ink` | `ink` |
| booked | `#EAE0CC` | `inkFaint` | `inkFaint` |
| blocked | `#E5D6D6` | `#8B6A6A` | `#8B6A6A` |

### 2.6 Color rules

- **No pure white surfaces.** Always use a cream variant.
- **No gradients on buttons or cards.** Soft radial gradients on the *outer stage / page background* are allowed.
- **Saturation cap.** Nothing brighter than `#F1B6BC` (the pink). If a new accent is needed, mix with cream until it sits next to existing tokens without shouting.
- **One pink, one blue.** Don't introduce new pink/blue values — adjust the existing tokens if needed.

---

## 3. Typography

Three font pairings live in the system. **Typewriter is the default** and the
one we ship; the other two are user-controllable Tweaks for exploration.

### 3.1 Font pairings

| Set | Display (titles, dates, numbers) | Body (UI copy) | Mono (metadata, labels) |
|---|---|---|---|
| **Typewriter · default** | Special Elite | Quicksand | DM Mono |
| Hand-drawn | Patrick Hand | Quicksand | DM Mono |
| Editorial serif | Fraunces | Nunito | DM Mono |

Load all six families up front (Google Fonts is fine on web; on React
Native use `expo-google-fonts/special-elite`, `/quicksand`, `/dm-mono`,
`/patrick-hand`, `/nunito`, `/fraunces`). Display fonts can stay at weight
400 — bold weights make Special Elite look like a stencil.

### 3.2 Type scale

| Role | Size | Family | Notes |
|---|---|---|---|
| H0 / brand wordmark | 22 | display | Always wrapped in `BrushHighlight` |
| H1 / screen title | 26–30 | display | Lower bound when nowrap risks wrap |
| H2 / section title | 16–18 | display | Pair with a small mono eyebrow |
| H3 / row title | 14–15 | display | E.g. client name in a list row |
| Stat numeral | 26–32 | display | Big numbers in tile cards |
| Body | 13–14 | body | Default reading text |
| Meta / eyebrow | 9–10 | mono | UPPERCASE, letter-spacing 1.2–2 |
| Tag chip | 12 | body | weight 600 |

### 3.3 Type rules

- **Display fonts always carry letter-spacing `0.02em`** (set per font set in `--kl-display-letter`). Special Elite hates being tightly tracked.
- **Mono metadata is always UPPERCASE** with `letter-spacing: 1.2–2`. Use it for status labels, eyebrows, dates-shorthand, "see all" links — never for sentences.
- **Body copy is sentence case.** Never SHOUTING. Never `Title Case` for body.
- **One display + one body + one mono per screen.** Don't mix Special Elite and Patrick Hand on the same screen.
- **No bold for display fonts** — the typewriter and hand fonts only ship at one weight; weight 600 just produces synthetic bold and looks wrong.

### 3.4 Typewriter is wide

Special Elite measures ~6.8 px/char at 14px (1.5× system-ui). When writing
new copy:

- Reserve `whiteSpace: 'nowrap'` for any display heading that would wrap badly.
- Phone numbers, dates, and times — always `nowrap`; hyphens otherwise break.
- Keep section titles ≤ 16 chars at size 16 to stay on one line on a 390 px phone.

---

## 4. Spacing, radii, layout

### 4.1 Spacing scale

```
xs  6
sm  10
md  16
lg  22
xl  32
xxl 44
```

Default screen edge padding is **22 px**. Default vertical rhythm between
sections is **18–22 px**. Card internal padding is **14–18 px**.

### 4.2 Radii

```
sm   12  small chips, tiny tiles
md   18  small cards
lg   22  default card
xl   28  big hero cards, modals
pill 999 chips, buttons, tab pill, status badges
```

Always use a number from this list. Half-px increments are forbidden.

### 4.3 Phone & artboard

The reference device is iPhone 14 (390 × 844 logical points). When
designing new screens, lay them out on a 390-wide artboard with a 22 px
left/right safe-area gutter (368 px content width).

Reserve 70–86 px at the bottom for the tab bar (it's translucent over the
home indicator). Reserve 54 px at the top for the iOS status bar.

---

## 5. Hand-drawn ingredients

Five primitives carry the entire aesthetic. Re-use them — do not invent
new "hand-drawn" effects.

### 5.1 Wobble filter (the most important one)

A reusable SVG filter that displaces the edges of any element by a few
pixels using fractal noise.

```jsx
<svg width="0" height="0" style={{ position: 'absolute' }}>
  <defs>
    {[1, 2, 3].map(n => (
      <filter id={`wobble-${n}`} key={n} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={n}/>
        <feDisplacementMap in="SourceGraphic" scale={n * 0.9}/>
      </filter>
    ))}
  </defs>
</svg>
```

Apply via CSS: `filter: url(#wobble-1)` (or `-2` for medium, `-3` for heavy).

**Rule:** apply the filter to the *border layer only*, never to the fill or to
text. Pattern is always:

1. A real div with `borderRadius` and a solid `background` (perfectly round).
2. An absolutely-positioned overlay div with `border` + `filter: url(#wobble-N)`.
3. Content above on `z-index: 1`.

This keeps corners crisp while the edge looks hand-drawn.

**React Native equivalent**: RN doesn't natively render SVG filters
across both platforms reliably. Use `react-native-svg` + `<Defs><Filter>`
where possible, but if it stutters, the acceptable fallback is:

- A 1.2–1.6 px solid border with a dashed pattern on alternating elements
- A ±0.5° rotation on the card
- A `react-native-svg-uri`-rendered pre-baked wobbly-rect SVG sitting as a border overlay

Don't try to make the wobble dynamic on RN — bake it.

### 5.2 Confetti dots

The logo's signature. A fixed set of 30 muted dots in 7 colors, irregular
sizes, slight rotation. Always rendered into an SVG with
`preserveAspectRatio="xMidYMid slice"` so it tiles the surface.

Use at:
- **Page background**: opacity 0.35–0.5, behind everything
- **Empty space inside hero cards**: opacity 0.15–0.25
- **Inside the nail-placeholder bg**: opacity 0.15

Never use as foreground or as the dominant texture on a screen with photos.

### 5.3 Brush highlight

The blue brushstroke shape behind the "KuriLabo" wordmark. An irregular
blob `<path>` filled with `pink/blue` at 0.55–0.70 opacity, sitting
behind a span of text. Don't use it for sentences — only 1–2 words at a
time, and only for the brand mark, the user's name, or a "selected day"
chip headline.

### 5.4 Scribble underline

A short wavy `<path>` (60–80 px wide, 6–8 px tall) drawn in `pinkInk` at
1.5–2 px stroke. Sits 2 px below a section title to give it a
"highlight-marker" feel. Use sparingly — at most one per scroll viewport.

### 5.5 Doodle stickers

Hand-drawn flower, star, heart, swirl, sparkle shapes. Always have a
**1.2 px brown stroke** matching `ink` so they read as drawings, not
filled glyphs. Always tilt them: `transform: rotate(±10–15deg)`.

Use cases:
- Next to a screen title (size 20–24)
- Floating over an avatar (size 22–28)
- Inside stat tiles (size 22)

**Limit: 1–3 doodles per screen.** More and the screen becomes a sticker
sheet.

---

## 6. Components

All components live in `components/ui/`. The current web reference is in
`ui.jsx`; the React Native versions should match the same API.

### 6.1 `HandRect` — the card

```jsx
<HandRect
  fill={palette.creamCard}
  stroke={palette.ink}
  strokeWidth={1.5}
  radius={22}
  dashed={false}
  wobble={1}
  padding={16}
>
  {children}
</HandRect>
```

- **fill** — usually `creamCard`. For accent cards use `pinkSoft` or `blueSoft`.
- **stroke** — `ink` for neutral cards; tinted versions only when the entire card is tinted (e.g. preferences card uses `pinkInk` stroke on `pinkSoft` fill).
- **dashed** — `true` for empty states or "tap to add" CTAs, `false` for content.
- **wobble** — `0` (off), `1` (subtle, default), `2`, `3`.

Cards may be rotated `±0.6deg` for handmade feel — rotate alternately by index so a grid feels scrapbook-y.

### 6.2 `HandChip` — filter / tag pill

Used for filter strips and tag labels. Two states: idle (transparent fill,
ink stroke) and active (filled with `pinkInk`, white text).

```jsx
<HandChip active={current === id} onClick={...}>label</HandChip>
```

Always inside a horizontal scrolling row with the `chip-strip` class
(hides the scrollbar). Padding 22 px from screen edges.

### 6.3 `HandButton` — primary CTA

```jsx
<HandButton color={palette.pinkInk} size="md" full={false}>Request</HandButton>
```

- **color** — `pinkInk` for primary, `inkFaint` for disabled, `blueInk` for secondary actions.
- **size** — `sm` (8/16), `md` (12/22 default), `lg` (16/28).
- **full** — `true` only inside modals or sticky CTA bars at the bottom of a screen.
- Always pill-shape (`borderRadius: 999`).
- Label is **display font, weight 400**, plain text — no all-caps unless it's a 1-word verb.

### 6.4 `StatusBadge`

Dashed-outlined pill with a colored dot + lowercase mono label.
Always render in metadata position (right side of a row), never as a button.

### 6.5 `TabBar`

5 items max, 4 in current shipping. Each tab is a column of:
- 22 px line icon (1.6 px stroke)
- mono label, 10 px, weight 400

Active tab has a **wobble pill background** in `blueSoft` with a 1 px
`ink` border. Idle tabs use `inkFaint` color.

The tab bar lives on a translucent cream background with a top dashed
border. It always sits inside the phone frame, never floating over the
home indicator.

### 6.6 `NailHand` — the image placeholder

Until real photos exist, every nail image slot renders a stylized
hand-with-painted-nails SVG. Five fingers, each with a colored ellipse
nail tip, on a pastel tint background.

Eight tones available: `pink, yellow, green, lilac, coral, mocha, blue, teal`.

When real photos are introduced, the same component accepts a `src` prop
and renders the photo with `objectFit: cover` — the placeholder is the
*only* visual the user ever sees in the absence of a photo. Don't
substitute monochrome blocks, generic icons, or initials.

---

## 7. Iconography

- Line style only. **Stroke width 1.6 px**, `strokeLinecap: 'round'`, `strokeLinejoin: 'round'`.
- Default size **22 px**; small (chevrons, dots) **18 px**; tiny inline **16 px**.
- Color follows text: pass `ink` for primary, `inkFaint` for tertiary, `pinkInk` for action accents.
- Never filled shapes — even the heart starts as outline and only fills when toggled `liked`.
- The icon set lives in `ui.jsx` `Icons`. Don't import any other icon library — match the existing stroke feel.

---

## 8. Imagery

- **Photos** of nails are the hero. They sit inside `HandRect` cards
  with a 1 px ink border and a slight rotation. No drop shadows.
- **Placeholders** are always `NailHand`. Pick the closest tone by
  glance.
- **Inspiration grid** uses a 2-column Pinterest masonry with varied
  card heights (180–260 px). The right column starts 24 px lower than
  the left for the staggered look.
- **No stock photography.** Either real customer nails or `NailHand`.

---

## 9. Copy voice

- Lowercase metadata: `your archive · 6 designs · joined 2d ago`
- Sentence-case display: `Today's schedule`, `Pick a time`, `Request sent`
- Soft warmth: `See you soon!`, `Save designs to show Kuri at your next visit`
- One micro-emoji max per phrase: `Hi, Kuri ✨` is fine; `Hi, Kuri ✨🌸💕` is not.
- Currency / numbers: no abbreviation (`24 visits`, not `24×`).
- Buttons read as verbs: `Request`, `Manage`, `Edit`, `+ Add`.

---

## 10. Motion

Keep movement quiet. The hand-drawn look is the personality — animation
is just a finishing touch.

| Animation | Use | Duration |
|---|---|---|
| `fadeUp` (8 px) | Screen transitions | 280 ms ease-out |
| `pulse` (1 → 1.04) | Heart-toggle on save | 240 ms ease-out |
| Card flip | Collection card front/back | spring tension 72, friction 8 |
| Modal in | Booking confirmation | 200 ms fade + slight scale |

No bouncing buttons, no infinite spinners (use a confetti-dot skeleton
for loading), no parallax.

---

## 11. Layout patterns

### 11.1 Standard screen skeleton

```
┌──────────────────────────────────┐
│ Status bar (54px)                │
├──────────────────────────────────┤
│ Brand header (KuriLabo + action) │ ← 6 + 22 px pad
├──────────────────────────────────┤
│ Eyebrow (mono UPPERCASE)         │
│ Screen title (display, 26–30)    │ ← w/ optional doodle
│ + scribble underline             │
├──────────────────────────────────┤
│ Content (cards, lists, grids)    │ ← 22 px side padding, 14–22 px gap
├──────────────────────────────────┤
│ Sticky CTA (only if needed)      │ ← in a HandRect with cream tint
├──────────────────────────────────┤
│ Tab bar (70–86 px)               │
└──────────────────────────────────┘
```

### 11.2 List rows

Avatar/icon + flex-1 column (title + meta line) + trailing element
(badge / chevron / button). Always `display: flex, gap: 12, padding:
12–14`. Dashed bottom border between rows. **Never** double-border (no
border on the row itself plus a list container border).

### 11.3 Calendar

Day cells are 36 px tall, in a 7-column grid. The selected date is a
wobble-filled circle in `pinkInk` with white numeral. Days with open
slots show a 4 px pink dot below the numeral.

### 11.4 Time blocks

Stack vertically with 10 px gap. Each block is a `HandRect` with:
- Mono eyebrow (LABEL · 3 HR)
- Display time range (16–20 px)
- Trailing `StatusBadge` or checkmark for selected

Selected block: stroke `pinkInk`, fill `pinkSoft`, stroke-width 2.

---

## 12. Tweaks (user-controllable)

These are baked into a Tweaks panel for designers / power users. Defaults
are what production ships.

| Tweak | Default | Options |
|---|---|---|
| `fontSet` | `typewriter` | `typewriter` \| `hand` \| `editorial` |
| `wobble` | `1` | `0` \| `1` \| `2` \| `3` |
| `showConfettiBg` | `true` | bool |

Don't expose color tweaks. The palette is intentional.

---

## 13. Accessibility

- Maintain 4.5:1 contrast for body text. `ink` on `cream` ≈ 9:1, fine.
  `inkSoft` on `cream` ≈ 4.7:1, also fine. Don't drop below `inkSoft`
  for any meaningful content.
- All interactive elements ≥ 44 × 44 px hit target (iOS guideline).
- Status conveyed by color is also reinforced by the lowercase label
  inside the badge — color is never the only signal.
- Wobble filter is purely cosmetic; it never animates, so it's safe for
  prefers-reduced-motion users.

---

## 14. Do / Don't quick list

**Do**
- Cream backgrounds everywhere
- Brown text on every screen
- One brushstroke per screen (the brand mark) — extras only on celebratory moments
- Slight card rotation (±0.6°), alternating
- Mono metadata in UPPERCASE with letter-spacing
- Dashed dividers between rows
- 22 px screen gutter, 14–18 px card padding
- Real photos when you have them, `NailHand` when you don't

**Don't**
- Pure white surfaces
- Drop shadows on cards (the wobbly border + slight rotation is the depth cue)
- Multi-color buttons or gradients
- Filled glyph icons
- Stock photography or AI-generated nail images
- Emoji in body text (one in a greeting is the cap)
- Display fonts at sizes < 13 (Special Elite gets unreadable)
- More than 3 doodles per screen
- New colors outside the palette

---

## 15. When to update this doc

Update Design.md whenever you:

1. Add a new color, font, or font weight
2. Add or rename a component primitive
3. Change a default spacing / radius value
4. Introduce a new screen pattern (e.g. a settings list, a tag-edit modal)
5. Change motion timings

Every PR that touches `components/ui/` should also touch this file.

---

_Last updated: May 2026 — initial system based on the cream + hand-drawn aesthetic established in the UI prototype._
