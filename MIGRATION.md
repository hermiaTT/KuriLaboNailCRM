# Migrating the cream / hand-drawn design into KuriLaboCRM

This folder mirrors your RN project structure. **All 14 screens are
already ported.** Drop everything in, install fonts, run.

> **Source of truth for the visual system: `Design.md` at the project root.**

---

## Step 1 — Install fonts

```bash
cd KuriLaboCRM
npx expo install \
  @expo-google-fonts/special-elite \
  @expo-google-fonts/quicksand \
  @expo-google-fonts/dm-mono \
  @expo-google-fonts/patrick-hand \
  @expo-google-fonts/fraunces
```

`react-native-svg@15` is already installed — required for wobble filter
and all decorative SVGs.

`@expo-google-fonts/fredoka` and `@expo-google-fonts/nunito` can stay or
be removed — they're no longer the active set but won't break anything.

---

## Step 2 — Extract `rn-port/` over the project

Files that get overwritten:

```
constants/theme.ts                ← new tokens
app/_layout.tsx                   ← font loading + <Wobble/>
app/(auth)/_layout.tsx
app/(auth)/login.tsx
app/(auth)/register.tsx
app/(user)/_layout.tsx
app/(user)/profile.tsx
app/(user)/collection.tsx
app/(user)/inspiration.tsx
app/(user)/book.tsx
app/(user)/appointments.tsx
app/(admin)/_layout.tsx
app/(admin)/dashboard.tsx
app/(admin)/users.tsx
app/(admin)/appointments.tsx
app/(admin)/slots.tsx
app/(admin)/upload.tsx
app/(admin)/inspiration.tsx
components/ui/index.ts
components/ui/StatusBadge.tsx
```

New files added under `components/ui/`:

```
Wobble.tsx, HandRect.tsx, HandChip.tsx, HandButton.tsx,
BrushHighlight.tsx, ScribbleUnderline.tsx, ConfettiBg.tsx,
Doodle.tsx, NailHand.tsx, Icons.tsx, TabBarIcon.tsx,
Screen.tsx, ScreenHeader.tsx, EyebrowTitle.tsx, Field.tsx
```

---

## Step 3 — Delete obsolete files

After confirming everything compiles, delete:

```
components/ui/AppScreen.tsx
components/ui/KuriCard.tsx
components/ui/KuriButton.tsx
components/ui/PrimaryButton.tsx
components/ui/SoftCard.tsx
components/ui/Pill.tsx
components/ui/NailPhotoPlaceholder.tsx
components/ui/NavTabIcon.tsx
components/ui/TabBarBackground.tsx
components/ui/SectionHeader.tsx
components/ui/SectionTitle.tsx
components/ui/icons/    ← whole folder (icons replaced by Icons.tsx)
```

Keep (or delete + restyle later):
- `components/ui/BrandLogo.tsx` — replaced inline by typewriter wordmark
- `components/ui/ImageCard.tsx` — wrap in `<HandRect>` if you reuse
- `components/ui/EmptyState.tsx` — restyle with new tokens later
- `components/ui/KuriInput.tsx` — superseded by `<Field>`; delete after migration
- `components/ui/ScreenContainer.tsx` — superseded by `<Screen>`; delete after migration
- `assets/background.png` — no longer used (background is cream `View` now)
- `assets/name.png` — no longer used (brand wordmark is typewriter text)

---

## Step 4 — Run it

```bash
npm run typecheck
npx expo start --ios
```

Expected first-run sequence:
1. Loads to **Login** — cream background, brushstroke-highlighted brand mark, typewriter card with email/password and two role buttons
2. Tap **Continue as User** → 4-tab user app (Home / Collection / Inspo / Book)
3. Or tap **Continue as Admin** → 5-tab admin app (Home / Clients / Visits / Slots / Upload)

---

## Component cheat sheet

| What you want | Component |
|---|---|
| Page shell (cream bg, confetti, scroll, safe area) | `<Screen>` |
| Brand wordmark line at top | `<ScreenHeader trailing={…}/>` |
| Eyebrow + title + optional scribble | `<EyebrowTitle eyebrow="…" title="…" underline/>` |
| Card | `<HandRect padding={16} radius={radius.lg}>` |
| Accent card | `<HandRect fill={colors.pinkSoft} stroke={colors.pinkInk}>` |
| Dashed empty-state card | `<HandRect dashed>` |
| Filter pill | `<HandChip active={…} onPress={…}>` |
| Primary CTA | `<HandButton color={colors.pinkInk}>` |
| Text input | `<Field placeholder="…" value={…} onChangeText={…}/>` |
| Status pill | `<StatusBadge status="pending"/>` |
| Stylized nail photo placeholder | `<NailHand tone="pink"/>` |
| Sticker doodle | `<Doodle kind="flower" color={colors.yellow}/>` |
| Inline brush highlight | `<BrushHighlight color={colors.blue}>{…}</BrushHighlight>` |
| Hand-drawn underline | `<ScribbleUnderline width={64}/>` |
| Confetti bg layer | `<ConfettiBg intensity={0.4}/>` |
| Icon | `<Icons.Home color={colors.ink}/>` |
| Tab bar icon | `<TabBarIcon focused={…} icon={(c,s) => <Icons.X color={c} size={s}/>} label="Home"/>` |

---

## Notes & gotchas

### react-native-svg filters
- `feTurbulence` + `feDisplacementMap` work reliably on iOS.
- Android: works on recent versions. If you see jank on long lists, pass
  `wobble={0}` to specific `HandRect`s in dense rows.

### Font weights
- Special Elite, Patrick Hand, and DM Mono ship at single weights.
  Never use `fontWeight: 'bold'` with them — RN will synth-bold and the
  result looks wrong. Stick to `'400'`.
- Quicksand and Nunito have 400/500/600/700.

### Background
- App background is `colors.cream` plain View. The `assets/background.png`
  image and `assets/name.png` logo are no longer referenced — feel free
  to delete them.

### TypeScript
- The token export is `typeScale`, not `type` (avoiding TS keyword collision).
- All component prop interfaces are exported (`type NailTone`, `type DoodleKind`, etc).

### Tweaks
- The web prototype's font-set switcher doesn't ship to RN.
- If you want it in development, expose a context provider that toggles
  `fonts` between three sets and re-mount the `_layout` font useFonts call.
  Default to typewriter for production.

---

## Screen-by-screen reference

The 14 screens cover:

**Auth**
- `(auth)/login.tsx` — cream + brushstroke brand mark, email/password form, two role buttons (user / admin)
- `(auth)/register.tsx` — name/email/phone/password, terms checkbox

**User**
- `(user)/profile.tsx` — avatar + stats + info + preferences + next visit
- `(user)/collection.tsx` — 2-col grid, tap to flip card and see visit date
- `(user)/inspiration.tsx` — Pinterest masonry, heart to save
- `(user)/book.tsx` — full month calendar + 3 time blocks + confirm modal
- `(user)/appointments.tsx` — visit history (hidden from tabs, linked from Profile)

**Admin**
- `(admin)/dashboard.tsx` — greeting, 4 stats, today's schedule, new clients, recent uploads, slot mgmt CTA
- `(admin)/users.tsx` — searchable client list with avatars
- `(admin)/appointments.tsx` — appointment management with confirm/decline actions
- `(admin)/slots.tsx` — slot availability grouped by date
- `(admin)/upload.tsx` — photo upload form (client photo or inspiration)
- `(admin)/inspiration.tsx` — gallery management (hidden tab)

All screens follow the same template:
```
<Screen>
  <ScreenHeader trailing={…}/>
  <EyebrowTitle eyebrow="…" title="…"/>
  …content using HandRect / HandChip / HandButton…
</Screen>
```
