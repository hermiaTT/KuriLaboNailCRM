import { notificationMessage, t, getLocale, useLanguage } from '../lib/i18n';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppointmentManagementModal } from '../components/admin/AppointmentManagementModal';
import { EmptyState, PageHeading, PaperCard } from '../components/UI';
import { api } from '../lib/api';
import type { AdminAppointment, AppNotification, NailSet } from '../types';

export function NotificationsPage() {
  useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [nailSets, setNailSets] = useState<NailSet[]>([]);
  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);
  const unread = items.filter((item) => !item.read).length;
  const hasRead = items.some((item) => item.read);
  const visibleItems = showRead ? items : items.filter((item) => !item.read);

  useEffect(() => {
    api<AppNotification[]>('/api/v1/notifications').then(setItems).finally(() => setLoading(false));
    if (user?.role === 'ADMIN') {
      api<AdminAppointment[]>('/api/v1/admin/appointments').then(setAppointments);
      api<NailSet[]>('/api/v1/inspiration').then(setNailSets);
    }
  }, [user?.role]);

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
      if (item.appointmentId) {
        if (user?.role === 'ADMIN') {
          const cached = appointments.find((appointment) => appointment.id === item.appointmentId);
          if (cached) {
            setSelected(cached);
            return;
          }
          const fresh = await api<AdminAppointment[]>('/api/v1/admin/appointments');
          setAppointments(fresh);
          const appointment = fresh.find((value) => value.id === item.appointmentId);
          if (appointment) setSelected(appointment);
          return;
        }
        navigate('/client/appointments');
        return;
      }
      if (item.clientId && user?.role === 'ADMIN') navigate(`/clients/${item.clientId}`);
    }
  }

  async function markAllRead() {
    await api<void>('/api/v1/notifications/read-all', { method: 'PUT' });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    window.dispatchEvent(new Event('notifications-updated'));
  }

  return <div className="page notification-page">
    <PageHeading eyebrow={t("STAY UPDATED")} title={t("Notifications")} action={(hasRead || unread > 0) ? <div className="heading-actions">
      {hasRead && <button className="secondary-button compact" onClick={() => setShowRead((value) => !value)}>{showRead ? t("Hide read") : t("Show read")}</button>}
      {unread > 0 && <button className="secondary-button compact" onClick={() => void markAllRead()}>{t("Mark all read")}</button>}
    </div> : undefined} />
    <PaperCard className="notification-card">
      {loading ? <EmptyState>{t("Loading notifications…")}</EmptyState> : visibleItems.length === 0 ? <EmptyState>{items.length === 0 ? t("No notifications yet.") : t("You're all caught up.")}</EmptyState> : (
        <div className="notification-list">{visibleItems.map((item) => <button key={item.id} className={`notification-row ${item.read ? '' : 'unread'}`} onClick={() => void openNotification(item)}>
          <span className="notification-dot" />
          <span><strong>{t(item.title)}</strong><p>{notificationMessage(item.message)}</p><small>{new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(item.createdAt))}</small></span>
        </button>)}</div>
      )}
    </PaperCard>
    {selected && <AppointmentManagementModal
      appointment={selected}
      nailSet={nailSets.find((item) => item.appointmentId === selected.id)}
      onClose={() => setSelected(null)}
      onUpdated={(updated) => {
        setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
        setSelected(updated);
      }}
    />}
  </div>;
}
