import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { Brand } from './UI';
import { Icon } from './Icons';
import { NotificationLink } from './NotificationLink';

const clientNavigation = [
  { to: '/client', label: 'Home', icon: 'home' as const, end: true },
  { to: '/client/book', label: 'Book', icon: 'calendar' as const },
  { to: '/client/appointments', label: 'Appointments', icon: 'clock' as const },
  { to: '/client/inspiration', label: 'Inspiration', icon: 'image' as const },
  { to: '/client/profile', label: 'Profile', icon: 'users' as const },
];

export function ClientShell() {
  const { user, logout } = useAuth();
  return (
    <div className="client-shell">
      <header className="client-header">
        <Brand />
        <nav>{clientNavigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}</nav>
        <div className="client-account"><NotificationLink to="/client/notifications" label={false} /><span className="mini-avatar">{user?.name?.[0]?.toUpperCase() ?? 'K'}</span><span>{user?.name?.split(' ')[0]}</span><button onClick={() => void logout()} aria-label="Sign out"><Icon name="logout" /></button></div>
      </header>
      <main className="client-content"><Outlet /></main>
      <nav className="mobile-nav client-mobile-nav">{clientNavigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}</nav>
    </div>
  );
}
