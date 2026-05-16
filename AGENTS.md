# Kuri Labo Project Rules

## Product Overview

Kuri Labo is an iOS-first mobile app for nail salon CRM and booking management.

This is NOT a web app.

The project should be built using React Native + Expo.

---

# Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Supabase

---
# Design Implementation Rules

Primary visual reference:
- https://solo-surge-31420687.figma.site/

Use the Figma prototype as the primary visual direction for:
- typography
- spacing
- color mood
- card style
- rounded corners
- soft shadows
- navigation feeling
- visual hierarchy
- overall cute, minimal, iOS-first aesthetic

Use PRD.md as the source of truth for product logic:
- product requirements
- booking rules
- appointment statuses
- user/admin roles
- slot availability logic
- data models
- screen flows

Precedence rules:
- Do not blindly copy the Figma prototype.
- If Figma conflicts with PRD.md, PRD.md wins for product logic.
- If Figma conflicts with AGENTS.md, AGENTS.md wins for development rules.
- Adapt the Figma style cleanly into the real Kuri Labo app.
- Keep implementation modular, maintainable, and consistent with the existing React Native + Expo Router structure.

---
## Design Source of Truth

The Figma prototype is the primary visual direction for the project.

However:
- PRD.md defines product logic
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
- Business hours are 10:00 AM - 7:00 PM.
- Users must be able to select future booking dates beyond the immediately visible week; do not limit booking UI to only the next 5 days.
- Each day has exactly 3 booking time blocks in MVP:
  1. 10:00 AM - 1:00 PM
  2. 1:00 PM - 4:00 PM
  3. 4:00 PM - 7:00 PM
- Available blocks should be visually clear and tappable.
- Booked blocks should be gray and disabled.
- Blocked blocks should also be disabled.
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

- Build incrementally
- Do not implement everything at once
- Start with layouts and placeholder screens
- Add backend logic later
- Keep code easy to extend

---

# Current MVP Scope

User:
- Login
- Register
- Profile
- Collection
- Inspiration
- Book

Admin:
- Dashboard
- User management
- Appointment management
- Slot management
- Image upload

---

# Important

Do NOT create a Vite web app.

Always prioritize mobile app architecture and iOS user experience.
