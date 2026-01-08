
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  TEACHER = 'TEACHER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
}

export interface Domain {
  id: string;
  name: string;
  incentivePerPoint: number;
}

export interface SubCategory {
  id: string;
  domainId: string;
  title: string;
}

export interface Assessment {
  id: string;
  staffId: string;
  staffName: string;
  domainId: string;
  domainName: string;
  subCategoryId: string;
  subCategoryTitle: string;
  points: number;
  totalIncentive: number;
  date: string; // ISO string
}

export interface DashboardStats {
  totalDaily: number;
  totalMonthly: number;
  totalStaffCount: number;
}
