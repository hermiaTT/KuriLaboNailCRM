import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { Brand } from './UI';
import { Icon } from './Icons';

const navigation = [
  { to: '/', label: 'Home', icon: 'home' as const, end: true },
  { to: '/appointments', label: 'Appointments', icon: 'calendar' as const },
  { to: '/clients', label: 'Clients', icon: 'users' as const },
  { to: '/schedule', label: 'Schedule', icon: 'clock' as const },
  { to: '/inspiration', label: 'Inspiration', icon: 'image' as const },
  { to: '/services', label: 'Services', icon: 'services' as const },
];

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Brand /><p>studio manager</p></div>
        <nav>
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">{user?.name?.[0]?.toUpperCase() ?? 'K'}</div>
          <div><strong>{user?.name ?? 'Kuri'}</strong><small>administrator</small></div>
          <button onClick={() => void logout()} aria-label="Sign out"><Icon name="logout" /></button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
      <nav className="mobile-nav">
        {navigation.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
