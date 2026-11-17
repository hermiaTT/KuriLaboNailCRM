import type { SVGProps } from 'react';

type IconName = 'home' | 'calendar' | 'users' | 'clock' | 'image' | 'services' | 'logout' | 'arrow';

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const common = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4m8-4v4M3 10h18"/><path d="M8 14h.01m4 0h.01m4 0h.01m-8 3h.01m4 0h.01"/></>,
    users: <><circle cx="9" cy="8" r="4"/><path d="M2.5 21c.3-4 2.4-6 6.5-6s6.2 2 6.5 6"/><path d="M16 4.5a4 4 0 0 1 0 7M17 15c2.7.5 4.2 2.4 4.5 5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 4"/></>,
    services: <><path d="M12 3v18M3 12h18"/><path d="m5.5 5.5 13 13m0-13-13 13"/></>,
    logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4m4-4H9"/></>,
    arrow: <><path d="m9 18 6-6-6-6"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
