import { getLanguage, subscribeLanguage } from '../../../shared/i18n/core';
import { useSyncExternalStore } from 'react';


export function useLanguage() {
  return useSyncExternalStore(subscribeLanguage, getLanguage, () => 'en' as const);
}
export { t, getLocale, getLanguage, setLanguage, LANGUAGES, statusLabel, weekDayLabels, formatDuration, formatClock, notificationMessage } from '../../../shared/i18n/core';
