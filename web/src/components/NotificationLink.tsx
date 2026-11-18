import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from './Icons';

export function NotificationLink({ to, label = true }: { to: string; label?: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = () => void api<{ count: number }>('/api/v1/notifications/unread-count').then((value) => setCount(value.count)).catch(() => undefined);
    load();
    window.addEventListener('notifications-updated', load);
    return () => window.removeEventListener('notifications-updated', load);
  }, []);
  return <NavLink to={to} className="notification-link" aria-label="Notifications">
    <span className="notification-icon"><Icon name="bell" />{count > 0 && <i>{count > 99 ? '99+' : count}</i>}</span>
    {label && <span>Notifications</span>}
  </NavLink>;
}
