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
# UI Consistency Rules

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

The app must feel:
- cute
- minimal
- soft
- cozy
- elegant
- mobile-first

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

# Color Palette

Primary Colors:
- Pastel Pink: #ffc0cb
- Baby Blue: #89CFF0

Supporting Colors:
- White: #ffffff
- Soft Pink Background: #fff5f7
- Light Blue Background: #f0f9ff
- Soft Gray: #f5f5f5

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
