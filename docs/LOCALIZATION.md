# Chinese and English UI

The account field `preferredLanguage` accepts `en` and `zh-CN`. Existing accounts default to English. Flyway migration `V10__profile_language.sql` adds the column and its database constraint.

Both clients load the preference from authentication responses and `GET /api/v1/users/me`. Personal Details keeps the selection as a form draft. Only a successful `PUT /api/v1/users/me` applies the returned language to the interface. `refreshUser(updated)` updates authentication state from that response without a second request. A request from an older client that omits `preferredLanguage` preserves the existing preference.

- `shared/i18n/core.ts`: framework-independent translation store, formatters and notification text handling.
- `shared/i18n/zh-CN.json`: Chinese translations keyed by English UI text. Dynamic values use `{name}` placeholders.
- `shared/i18n/index.ts`: mobile React subscription.
- `web/src/lib/i18n.ts`: web React subscription. The clients share the core and dictionary while using their own installed React runtimes.
- `components/LanguagePicker.tsx`: native language radio buttons.

Subscribe rendering components with `useLanguage()`, and translate presentation with `t()`. Keep status enums, form values, dates sent to the API, routes, customer names, service names, notes and uploaded content unchanged. Translate errors when displaying them rather than storing their translated text in state. Display dates use `getLocale()`; machine-readable date/time calculations retain their stable locale and salon timezone.

Run `npm run test:i18n`, both clients' type checks, and the web build. Backend `LanguagePreferenceTests` covers service behavior and request validation without a database. `KuriLaboEndToEndFlowTests.languagePreferencePersistsAcrossClientsAndRejectsUnsupportedValues` verifies persistence and both authentication client types against PostgreSQL.

Devices already open do not receive a live language-change notification. They pick up the account preference when authentication/profile data is next refreshed. Test native layout on iOS before releasing; an Expo export checks bundling, not device behavior.
