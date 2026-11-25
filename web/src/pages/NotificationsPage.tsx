import { notificationMessage, t, getLocale, useLanguage } from '../lib/i18n';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, PageHeading, PaperCard } from '../components/UI';
import { api } from '../lib/api';
import type { AppNotification } from '../types';

export function NotificationsPage() {
  useLanguage();
  const navigate = useNavigate();
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

  async function openNotification(item: AppNotification) {
    try {
      await markRead(item);
    } finally {
      if (item.clientId) navigate(`/clients/${item.clientId}`);
    }
  }

  async function markAllRead() {
    await api<void>('/api/v1/notifications/read-all', { method: 'PUT' });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    window.dispatchEvent(new Event('notifications-updated'));
  }

  return <div className="page notification-page">
    <PageHeading eyebrow={t("STAY UPDATED")} title={t("Notifications")} action={unread > 0 ? <button className="secondary-button compact" onClick={() => void markAllRead()}>{t("Mark all read")}</button> : undefined} />
    <PaperCard className="notification-card">
      {loading ? <EmptyState>{t("Loading notifications…")}</EmptyState> : items.length === 0 ? <EmptyState>{t("No notifications yet.")}</EmptyState> : (
        <div className="notification-list">{items.map((item) => <button key={item.id} className={`notification-row ${item.read ? '' : 'unread'}`} onClick={() => void openNotification(item)}>
          <span className="notification-dot" />
          <span><strong>{t(item.title)}</strong><p>{notificationMessage(item.message)}</p><small>{new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(item.createdAt))}</small></span>
        </button>)}</div>
      )}
    </PaperCard>
  </div>;
}
