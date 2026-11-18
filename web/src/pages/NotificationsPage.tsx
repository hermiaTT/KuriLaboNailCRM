import { useEffect, useState } from 'react';
import { EmptyState, PageHeading, PaperCard } from '../components/UI';
import { api } from '../lib/api';
import type { AppNotification } from '../types';

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unread = items.filter((item) => !item.read).length;

  useEffect(() => {
    api<AppNotification[]>('/api/v1/notifications').then(setItems).finally(() => setLoading(false));
  }, []);

  async function markRead(item: AppNotification) {
    if (item.read) return;
    const updated = await api<AppNotification>(`/api/v1/notifications/${item.id}/read`, { method: 'PUT' });
    setItems((current) => current.map((value) => value.id === item.id ? updated : value));
    window.dispatchEvent(new Event('notifications-updated'));
  }

  async function markAllRead() {
    await api<void>('/api/v1/notifications/read-all', { method: 'PUT' });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    window.dispatchEvent(new Event('notifications-updated'));
  }

  return <div className="page notification-page">
    <PageHeading eyebrow="STAY UPDATED" title="Notifications" action={unread > 0 ? <button className="secondary-button compact" onClick={() => void markAllRead()}>Mark all read</button> : undefined} />
    <PaperCard className="notification-card">
      {loading ? <EmptyState>Loading notifications…</EmptyState> : items.length === 0 ? <EmptyState>No notifications yet.</EmptyState> : (
        <div className="notification-list">{items.map((item) => <button key={item.id} className={`notification-row ${item.read ? '' : 'unread'}`} onClick={() => void markRead(item)}>
          <span className="notification-dot" />
          <span><strong>{item.title}</strong><p>{item.message}</p><small>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(item.createdAt))}</small></span>
        </button>)}</div>
      )}
    </PaperCard>
  </div>;
}
