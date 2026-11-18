# Kuri Labo Project Rules

## V2 Architecture Override (Current)

The V2 rewrite supersedes older stack and backend statements later in this file.

Current sources of truth, in precedence order:

1. `docs/REQUIREMENTS_V2.md` — current product and booking rules
2. `docs/ARCHITECTURE_V2.md` — current system architecture and delivery phases
3. `docs/DATA_MODEL_V2.md` — current data model
4. This file — shared engineering and design rules
5. `PRD.md` — legacy product reference for unchanged UI flows only

Current V2 stack:

- Expo + React Native + TypeScript for the mobile app
- React + Vite + TypeScript for the web user portal and admin dashboard
- Spring Boot + Java 21 for the backend API
- PostgreSQL in Docker, managed through Flyway migrations
- Kafka introduced through the transactional outbox after the synchronous core is stable
- S3-compatible object storage for media; MinIO is used in local development

All mobile and web functionality accesses data through the Spring Boot API. Preserve the existing Expo UI while extending the product.

Kuri Labo is now a multi-client product: the iOS-first mobile app remains important, and a responsive React web version is also required.

## Product Overview

Kuri Labo is an iOS-first nail salon CRM and booking product. The Expo mobile
app and React web app share the same Spring Boot API and PostgreSQL database.

---

# Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Spring Boot API
- PostgreSQL

---
# Design Implementation Rules


Use `docs/REQUIREMENTS_V2.md` as the source of truth for product logic:
- product requirements
- booking rules
- appointment statuses
- user/admin roles
- slot availability logic
- data models
- screen flows

Precedence rules:
- Do not blindly copy the Figma prototype.
- If Figma conflicts with `docs/REQUIREMENTS_V2.md`, the requirements win for product logic.
- If Figma conflicts with AGENTS.md, AGENTS.md wins for development rules.
- Adapt the Figma style cleanly into the real Kuri Labo app.
- Keep implementation modular, maintainable, and consistent with the existing React Native + Expo Router structure.

---
## Design Source of Truth


- `docs/REQUIREMENTS_V2.md` defines product logic
- AGENTS.md defines engineering and design rules

If there is conflict:
- preserve product logic
- adapt visuals cleanly
- avoid blindly copying static prototype layouts

---
# UI Consistency Rules

- Primary visual reference: https://solo-surge-31420687.figma.site/
- Treat the Figma prototype as the main visual direction for mood, spacing, iOS polish, and overall UX feel.
- Do not blindly copy every Figma screen; adapt layouts and flows to the actual Kuri Labo product requirements in PRD.md.
- Keep the UI cute and minimal
- Avoid cluttered layouts
- Prefer whitespace over dense information
- Use soft pastel gradients carefully
- Keep cards rounded and airy
- Prioritize image presentation
- Maintain a cozy and elegant feeling


# Navigation Rules

- Keep navigation simple
- Avoid deep nested navigation
- Prioritize fast booking flow
- Inspiration browsing should feel smooth and visual


# Inspiration Page Rules

- Inspiration is one of the most important pages
- Use Pinterest-style layouts
- Large images are preferred
- The page should encourage browsing and saving references

# Booking UI Rules

- The Book screen should use a calendar / schedule format.
- Load business hours, services, duration, and available start times from the Spring Boot API.
- Users must be able to select future dates beyond the immediately visible week.
- Available times should be visually clear and tappable; occupied and blocked times are disabled.
- Keep the Book screen cute, minimal, pastel, and iOS-first.
- Do not use a dense enterprise calendar UI.

# Component Rules

- Reuse card components
- Reuse button styles
- Keep design consistent across screens
- Avoid random styles per page

# UI Style Rules

Primary visual direction:
- The Figma prototype at https://solo-surge-31420687.figma.site/ is the current visual north star.
- Preserve its soft spacing, cozy mood, iOS-first feeling, and overall UX direction when implementing screens.
- Product correctness comes from PRD.md; if the prototype and PRD differ, keep the prototype's visual style but follow the PRD's product requirements.

The app must feel:
- cute
- minimal
- soft
- cozy
- elegant
- mobile-first

Default app background:
- Use `assets/background.png` as the global app background image.
- Use #FFFDFA as the fallback warm off-white screen background.
- Use #fff5f7 only as a soft pink accent surface, not as the global app background.

Text color:
- Use #5c3206 as the primary app text color across titles, body text, metadata, labels, and navigation.
- Use white text only when required for legibility on dark/photographic surfaces, such as the active navigation pill or image overlays.

Typography:
- Use Fredoka for titles, section headings, brand text, and expressive display labels.
- Use Nunito for body text, inputs, metadata, captions, badges, and general UI copy.

Inspired by:
- Japanese nail salon apps
- Korean beauty apps
- Pinterest
- Lemon8

Avoid:
- enterprise SaaS dashboard feeling
- overly complex layouts
- heavy borders
- dark mode by default



---

# UI Requirements

- Use rounded-xl or rounded-2xl styles
- Use soft shadows
- Prefer large image cards
- Use clean spacing
- Keep interfaces airy and uncluttered
- Focus on visuals over text
- Make inspiration browsing visually appealing

---

# UX Rules

- Mobile-first
- iOS-first
- Smooth and simple navigation
- Minimal user friction
- Avoid overwhelming screens
- Prioritize ease of booking

---

# Coding Rules

- Use TypeScript everywhere
- Keep components modular
- Avoid giant files
- Separate UI from business logic
- Prefer reusable components
- Use clean folder structures
- Keep screens lightweight

---

# Development Rules

- Build incrementally.
- Preserve the existing Expo UI while replacing legacy data access screen by screen.
- Connect mobile functionality to the existing Spring Boot API.
- Keep code easy to extend.

---

# Backend Rules

## Spring Boot API

- Mobile and web clients must use the Spring Boot API for authentication and product data.
- Mobile requests go through `lib/api.ts`; screens must not access PostgreSQL directly.
- Store mobile access and refresh tokens in device storage and use `clientType: 'MOBILE'`.
- Media uploads go through the API and are stored by the backend media service.
- Do not add a second backend client or let screens access PostgreSQL directly.

## Auth

- Auth state is managed in `context/AuthContext.tsx`.
- Use `useAuth()` to access `session`, `profile`, `loading`, `signIn`, `signUp`, and `signOut`.
- Never call authentication endpoints directly from screens.
- `profile.role` determines routing: `'user'` → user tabs, `'admin'` → admin tabs.
- Auth redirects are handled in `app/_layout.tsx` (RootNavigator) via `useEffect` watching `session` + `profile`.
- Do not add manual navigation after sign in/sign up — the layout handles it automatically.

## Database Schema

- PostgreSQL schema changes are made only through Flyway migrations in
  `backend/kuri-api/src/main/resources/db/migration`.
- `docs/DATA_MODEL_V2.md` describes the current model.
- Authorization is enforced by Spring Security on the API.

## Creating Admin Users

The first administrator registers normally and is promoted by changing the
corresponding PostgreSQL `app_user.role` to `ADMIN`. Existing administrators
can manage later role changes through the admin client-management flow.

---

# Current MVP Scope

User:
- Login
- Register (with name, email, phone, birthday, password)
- Profile
- Collection
- Inspiration
- Book
- My Appointments

Admin:
- Dashboard
- User management
- Appointment management
- Slot management
- Image upload

## Development Phase Status

- Spring Boot API, PostgreSQL, and React web deployment: ✅ Done
- Expo UI: ✅ Existing
- Expo API migration: 🔄 In progress
- iOS device testing and polish: ⏳ Not started

---

# Date Handling

- Date-only API fields use ISO strings (`YYYY-MM-DD`).
- Birthday uses the iOS native DateTimePicker (`@react-native-community/datetimepicker`, `display="spinner"`).
- Format dates for display using `toLocaleDateString('en-US', ...)`.
- Never store dates as full ISO timestamps (with time) for date-only fields.

---

# Important

Always prioritize mobile app architecture and iOS user experience when working
inside the Expo application. Keep the existing React web client intact.
