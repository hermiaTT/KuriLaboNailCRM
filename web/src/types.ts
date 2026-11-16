export type UserSummary = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  name: string;
  phone: string | null;
  birthday: string | null;
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: null;
  user: UserSummary;
};

export type AdminUser = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  name: string;
  phone: string | null;
  createdAt: string;
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
};

export type ServiceDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  active: boolean;
  displayOrder: number;
};

export type AvailabilityBlock = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdBy: string;
};

export type Availability = {
  date: string;
  timezone: string;
  serviceId: string;
  durationMinutes: number;
  slots: Array<{
    startTime: string;
    endTime: string;
    startAt: string;
    endAt: string;
    available: boolean;
  }>;
};

export type CurrentProfile = UserSummary & {
  instagram: string | null;
  wechat: string | null;
  preferredNailStyle: string | null;
  allergyNotes: string | null;
};
