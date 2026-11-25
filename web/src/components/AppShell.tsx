import { t, useLanguage } from '../lib/i18n';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { Brand } from './UI';
import { Icon } from './Icons';
import { NotificationLink } from './NotificationLink';

const navigation = [
  { to: '/', label: 'Home', icon: 'home' as const, end: true },
  { to: '/appointments', label: 'Appointments', icon: 'calendar' as const },
  { to: '/clients', label: 'Clients', icon: 'users' as const },
  { to: '/schedule', label: 'Schedule', icon: 'clock' as const },
  { to: '/inspiration', label: 'Inspiration', icon: 'image' as const },
  { to: '/services', label: 'Services', icon: 'services' as const },
];

export function AppShell() {
  useLanguage();
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Brand /><p>{t("studio manager")}</p></div>
        <nav>
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <Icon name={item.icon} />
              <span>{t(item.label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-notifications"><NotificationLink to="/notifications" /></div>
        <div className="sidebar-profile">
          <Link className="avatar" to="/profile" aria-label={t("Open profile")}>{user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user?.name?.[0]?.toUpperCase() ?? 'K'}</Link>
          <div><strong>{user?.name ?? 'Kuri'}</strong><small>{t("administrator")}</small></div>
          <button onClick={() => void logout()} aria-label={t("Sign out")}><Icon name="logout" /></button>
        </div>
      </aside>
      <div className="mobile-admin-bar"><Brand /><div><NotificationLink to="/notifications" label={false} /><span className="mini-avatar">{user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user?.name?.[0]?.toUpperCase() ?? 'K'}</span><button onClick={() => void logout()} aria-label={t("Sign out")}><Icon name="logout" /></button></div></div>
      <main className="content"><Outlet /></main>
      <nav className="mobile-nav">
        {navigation.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <Icon name={item.icon} />
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
