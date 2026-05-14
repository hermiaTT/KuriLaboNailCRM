import type {
  Appointment,
  AvailableSlot,
  InspirationImage,
  NailCollectionItem,
  User,
} from '../types/models';

export const profile: User = {
  id: 'user-1',
  name: 'Mina Tanaka',
  email: 'mina@example.com',
  phone: '(604) 555-0188',
  instagram: '@mina.nails',
  role: 'user',
};

export const collectionItems: NailCollectionItem[] = [
  {
    id: 'collection-1',
    imageUrl:
      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80',
    date: 'Apr 18, 2026',
    description: 'Soft milk tea gel with pearl accents',
    tags: ['gel', 'elegant'],
  },
  {
    id: 'collection-2',
    imageUrl:
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=80',
    date: 'Mar 02, 2026',
    description: 'Blush pink shimmer set',
    tags: ['pink', 'short'],
  },
];

export const inspirations: InspirationImage[] = [
  {
    id: 'inspiration-1',
    imageUrl:
      'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=80',
    sourceType: 'admin',
    title: 'Syrup pink',
    tags: ['cute', 'simple'],
  },
  {
    id: 'inspiration-2',
    imageUrl:
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
    sourceType: 'customer',
    title: 'Blue pearl',
    tags: ['chrome', 'blue'],
  },
  {
    id: 'inspiration-3',
    imageUrl:
      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=80',
    sourceType: 'admin',
    title: 'French bow',
    tags: ['french', 'wedding'],
  },
  {
    id: 'inspiration-4',
    imageUrl:
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80',
    sourceType: 'customer',
    title: 'Milky ribbon',
    tags: ['ribbon', 'pink'],
  },
  {
    id: 'inspiration-5',
    imageUrl:
      'https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=80',
    sourceType: 'admin',
    title: 'Tiny flower',
    tags: ['floral', 'cute'],
  },
  {
    id: 'inspiration-6',
    imageUrl:
      'https://images.unsplash.com/photo-1599206676335-193c82b13c9e?auto=format&fit=crop&w=900&q=80',
    sourceType: 'admin',
    title: 'Blue jelly',
    tags: ['blue', 'gel'],
  },
  {
    id: 'inspiration-7',
    imageUrl:
      'https://images.unsplash.com/photo-1610992015855-575f72f5458c?auto=format&fit=crop&w=900&q=80',
    sourceType: 'customer',
    title: 'Pearl blush',
    tags: ['pearl', 'elegant'],
  },
  {
    id: 'inspiration-8',
    imageUrl:
      'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=80',
    sourceType: 'admin',
    title: 'Soft chrome',
    tags: ['chrome', 'short'],
  },
];

export const slots: AvailableSlot[] = [
  { id: 'slot-1', date: 'May 18', startTime: '10:00 AM', endTime: '1:00 PM', status: 'available' },
  { id: 'slot-2', date: 'May 18', startTime: '1:00 PM', endTime: '4:00 PM', status: 'booked' },
  { id: 'slot-3', date: 'May 18', startTime: '4:00 PM', endTime: '7:00 PM', status: 'available' },
  { id: 'slot-4', date: 'May 19', startTime: '10:00 AM', endTime: '1:00 PM', status: 'blocked' },
  { id: 'slot-5', date: 'May 19', startTime: '1:00 PM', endTime: '4:00 PM', status: 'available' },
  { id: 'slot-6', date: 'May 19', startTime: '4:00 PM', endTime: '7:00 PM', status: 'booked' },
  { id: 'slot-7', date: 'May 20', startTime: '10:00 AM', endTime: '1:00 PM', status: 'available' },
  { id: 'slot-8', date: 'May 20', startTime: '1:00 PM', endTime: '4:00 PM', status: 'available' },
  { id: 'slot-9', date: 'May 20', startTime: '4:00 PM', endTime: '7:00 PM', status: 'blocked' },
  { id: 'slot-10', date: 'May 21', startTime: '10:00 AM', endTime: '1:00 PM', status: 'booked' },
  { id: 'slot-11', date: 'May 21', startTime: '1:00 PM', endTime: '4:00 PM', status: 'available' },
  { id: 'slot-12', date: 'May 21', startTime: '4:00 PM', endTime: '7:00 PM', status: 'available' },
  { id: 'slot-13', date: 'May 22', startTime: '10:00 AM', endTime: '1:00 PM', status: 'available' },
  { id: 'slot-14', date: 'May 22', startTime: '1:00 PM', endTime: '4:00 PM', status: 'blocked' },
  { id: 'slot-15', date: 'May 22', startTime: '4:00 PM', endTime: '7:00 PM', status: 'available' },
];

export const appointments: Appointment[] = [
  {
    id: 'appointment-1',
    clientName: 'Mina Tanaka',
    date: 'May 18',
    startTime: '10:00',
    endTime: '11:30',
    status: 'pending',
  },
  {
    id: 'appointment-2',
    clientName: 'Sara Lee',
    date: 'May 20',
    startTime: '13:00',
    endTime: '14:30',
    status: 'confirmed',
  },
];

export const customers: User[] = [
  profile,
  { id: 'user-2', name: 'Sara Lee', email: 'sara@example.com', phone: '(604) 555-0142', role: 'user' },
  { id: 'user-3', name: 'Yui Kim', email: 'yui@example.com', instagram: '@yui.gloss', role: 'user' },
];
