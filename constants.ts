
import { Domain, User, UserRole } from './types';

export const INITIAL_DOMAINS: Domain[] = [
  { id: '1', name: 'التواصل واللغة', incentivePerPoint: 200 },
  { id: '2', name: 'المهارات الحركية', incentivePerPoint: 300 },
  { id: '3', name: 'تعديل السلوك', incentivePerPoint: 500 },
  { id: '4', name: 'الإدراك والنمو العقلي', incentivePerPoint: 400 },
];

export const INITIAL_STAFF: User[] = [
  { id: 's1', name: 'فاطمة الزهراء', role: UserRole.STAFF, username: 'fatima' },
  { id: 's2', name: 'مريم الصديقة', role: UserRole.STAFF, username: 'maryam' },
  { id: 's3', name: 'الأستاذ أحمد', role: UserRole.TEACHER, username: 'ahmed' },
  { id: 'admin', name: 'مدير المركز', role: UserRole.ADMIN, username: 'admin' },
];

export const SUB_CATEGORIES = [
  { id: 'sc1', domainId: '1', title: 'التواصل البصري' },
  { id: 'sc2', domainId: '1', title: 'النطق والحوار' },
  { id: 'sc3', domainId: '2', title: 'التآزر البصري الحركي' },
  { id: 'sc4', domainId: '3', title: 'التحكم في الانفعالات' },
];
