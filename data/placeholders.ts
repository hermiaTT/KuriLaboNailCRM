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
    imageUrl: '',
    date: 'Apr 18, 2026',
    description: 'Glass glitter ribbon set',
    tags: ['glass', 'ribbon'],
  },
  {
    id: 'collection-2',
    imageUrl: '',
    date: 'Mar 02, 2026',
    description: 'Soft gold french tips',
    tags: ['gold', 'french'],
  },
];

export const inspirations: InspirationImage[] = [
  {
    id: 'inspiration-1',
    imageUrl: '',
    sourceType: 'admin',
    title: 'Glass ribbon',
    tags: ['glass', 'ribbon'],
  },
  {
    id: 'inspiration-2',
    imageUrl: '',
    sourceType: 'customer',
    title: 'Gold tip',
    tags: ['gold', 'french'],
  },
  {
    id: 'inspiration-3',
    imageUrl: '',
    sourceType: 'admin',
    title: 'Dot lace',
    tags: ['lace', 'minimal'],
  },
  {
    id: 'inspiration-4',
    imageUrl: '',
    sourceType: 'customer',
    title: 'Star french',
    tags: ['star', 'cute'],
  },
  {
    id: 'inspiration-5',
    imageUrl: '',
    sourceType: 'admin',
    title: 'Mirror sage',
    tags: ['chrome', 'sage'],
  },
  {
    id: 'inspiration-6',
    imageUrl: '',
    sourceType: 'admin',
    title: 'Pink knit',
    tags: ['pink', 'long'],
  },
  {
    id: 'inspiration-7',
    imageUrl: '',
    sourceType: 'customer',
    title: 'Silver glass',
    tags: ['silver', 'glass'],
  },
  {
    id: 'inspiration-8',
    imageUrl: '',
    sourceType: 'admin',
    title: 'Soft black',
    tags: ['black', 'minimal'],
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
