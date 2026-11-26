import translations from './zh-CN.json';

export type Language = 'en' | 'zh-CN';
export const LANGUAGES = [{ value: 'en', label: 'English' }, { value: 'zh-CN', label: '中文' }] as const;
let language: Language = 'en';
const listeners = new Set<() => void>();

export function getLanguage(): Language { return language; }
export function getLocale() { return language === 'zh-CN' ? 'zh-CN' : 'en-US'; }
export function setLanguage(next: string | undefined) {
  const valid = next === 'zh-CN' ? 'zh-CN' : 'en';
  if (valid === language) return;
  language = valid;
  listeners.forEach((listener) => listener());
}
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** English source text is the key; placeholders keep dynamic values out of the dictionary. */
export function t(key: string, values: Record<string, string | number> = {}): string {
  const dictionary: Record<string, string> = translations;
  const text = language === 'zh-CN' ? dictionary[key] ?? key : key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}

export function statusLabel(status: string) {
  return t(status.toLowerCase().replaceAll('_', ' '));
}
export function weekDayLabels(mondayFirst = false) {
  const english = mondayFirst ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const chinese = mondayFirst ? ['一', '二', '三', '四', '五', '六', '日'] : ['日', '一', '二', '三', '四', '五', '六'];
  return language === 'zh-CN' ? chinese : english;
}
export function formatDuration(minutes: number) {
  return minutes < 60 || minutes % 60 !== 0 ? t('{count} min', { count: minutes }) : t('{count} hr', { count: minutes / 60 });
}
export function formatClock(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hour, minute));
}

/** Translate only the server's known system notification formats; preserve service names verbatim. */
export function notificationMessage(message: string) {
  const formats: Array<[RegExp, string]> = [
    [/^A client requested (.+)\.$/, 'A client requested {service}.'],
    [/^Kuri added a (.+) appointment to your schedule\.$/, 'Kuri added a {service} appointment to your schedule.'],
    [/^A client asked to cancel (.+)\.$/, 'A client asked to cancel {service}.'],
    [/^Your (.+) appointment is confirmed\.$/, 'Your {service} appointment is confirmed.'],
    [/^Kuri updated the time for your (.+) appointment\.$/, 'Kuri updated the time for your {service} appointment.'],
    [/^(.+) registered and was automatically linked to (.+)\.$/, '{client} registered and was automatically linked to {profile}.'],
    [/^(.+) registered\. Review the client profile and merge it with an existing record if needed\.$/, '{client} registered. Review the client profile and merge it with an existing record if needed.'],
  ];
  for (const [pattern, key] of formats) {
    const match = message.match(pattern);
    if (match) return t(key, { service: match[1], client: match[1], profile: match[2] ?? '' });
  }
  return t(message);
}

export const LANGUAGE_SAVE_ERROR = 'Language preference was not saved. Please update the service and try again.';

/** Older APIs may return 200 while silently ignoring an unknown profile field. */
export function isLanguageSaved(profile: { preferredLanguage?: string }, requested: string): boolean {
  return (requested === 'en' || requested === 'zh-CN') && profile.preferredLanguage === requested;
}
