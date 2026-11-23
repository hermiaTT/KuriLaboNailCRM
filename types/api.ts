import type { ApiUser } from '../lib/api';

export type CurrentProfile = ApiUser & {
  instagram: string | null;
  wechat: string | null;
  preferredNailStyle: string | null;
  allergyNotes: string | null;
  avatarUrl: string | null;
};

export type Appointment = {
  id: string;
  customerId: string;
  serviceId: string | null;
  serviceName: string;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  status:
    | 'PENDING_CONFIRMATION'
    | 'CONFIRMED'
    | 'CANCELLATION_REQUESTED'
    | 'COMPLETED'
    | 'NO_SHOW'
    | 'REJECTED'
    | 'CANCELLED';
  note: string | null;
  referenceImages: NailSetImage[];
};

export type AdminAppointment = Appointment & {
  serviceNotes: string | null;
  finalPrice: number | null;
};

export type NailSetImage = {
  id: string;
  url: string;
  displayOrder: number;
};

export type NailSet = {
  id: string;
  clientId: string | null;
  appointmentId: string | null;
  title: string;
  description: string | null;
  createdAt: string;
  favorited: boolean;
  images: NailSetImage[];
};

export type ServiceDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
  displayOrder: number;
};

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  available: boolean;
};

export type Availability = {
  date: string;
  timezone: string;
  serviceId: string;
  durationMinutes: number;
  slots: AvailabilitySlot[];
};

export type AdminUser = {
  id: string;
  email: string | null;
  accountType: 'REGISTERED' | 'GUEST';
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  name: string;
  phone: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUser & {
  birthday: string | null;
  instagram: string | null;
  wechat: string | null;
  preferredNailStyle: string | null;
  allergyNotes: string | null;
  adminNotes: string | null;
  avatarUrl: string | null;
};

export type AvailabilityBlock = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdBy: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  appointmentId: string | null;
  read: boolean;
  createdAt: string;
};

export type SalonContact = {
  salonName: string;
  wechatId: string | null;
  contactMessage: string | null;
};
