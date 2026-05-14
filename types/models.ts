export type UserRole = 'user' | 'admin';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export type SlotStatus = 'available' | 'booked' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  role: UserRole;
}

export interface NailCollectionItem {
  id: string;
  imageUrl: string;
  date: string;
  description?: string;
  tags?: string[];
}

export interface InspirationImage {
  id: string;
  imageUrl: string;
  sourceType: 'customer' | 'admin';
  title?: string;
  tags?: string[];
}

export interface Appointment {
  id: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
}

export interface AvailableSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}
