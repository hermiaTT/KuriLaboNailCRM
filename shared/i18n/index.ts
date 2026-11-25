import { useSyncExternalStore } from 'react';
import { getLanguage, subscribeLanguage } from './core';

/** Subscribe UI components to the account language without coupling translations to either client. */
export function useLanguage() {
  return useSyncExternalStore(subscribeLanguage, getLanguage, () => 'en' as const);
}
export { t, getLocale, getLanguage, setLanguage, LANGUAGES, statusLabel, weekDayLabels, formatDuration, formatClock, notificationMessage } from './core';
export type { Language } from './core';
