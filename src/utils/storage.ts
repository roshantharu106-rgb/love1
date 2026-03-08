
import { Student, Subject, MarkRecord, Teacher, SalaryRecord, Invoice, Expenditure, Notice, AttendanceRecord, SchoolSettings } from '../types';
import { syncService } from './sync';

const GLOBAL_KEYS = {
  CURRENT_YEAR: 'madarsa_active_bs_year',
  AUTH_USER: 'madarsa_auth_session',
  ADMIN_AUTH: 'madarsa_admin_creds',
  SCHOOL_SETTINGS: 'madarsa_institutional_settings'
};

const DEFAULT_SETTINGS: SchoolSettings = {
  name: 'Madarsa Al-Markzul Islami',
  address: 'Mayadevi 1, Pakadi, Kapilvastu, Lumbini, Nepal',
  contact: '9821999972',
  logo: '/logo.png',
  allowStudentNotices: true,
  allowTeacherNotices: true,
  allowTeacherBilling: false,
  allowTeacherAdmission: false,
  allowStudentAttendance: true,
  restrictedUsername: '111',
  restrictedPassword: '000',
  examFees: {}
};

const DEFAULT_ADMIN = {
  username: 'Star',
  password: 'RoshanPrameen369@',
  name: 'Super Administrator',
  profilePicture: '',
  contactNumber: '',
  gmail: '',
  address: ''
};

export const storage = {
  // Institutional Settings
  getSchoolSettings: (): SchoolSettings => {
    const settings = localStorage.getItem(GLOBAL_KEYS.SCHOOL_SETTINGS);
    if (!settings) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(settings);
    return { ...DEFAULT_SETTINGS, ...parsed };
  },

  saveSchoolSettings: (settings: SchoolSettings) => {
    localStorage.setItem(GLOBAL_KEYS.SCHOOL_SETTINGS, JSON.stringify(settings));
    syncService.push('GLOBAL', 'settings', settings);
  },

  // Admin Credentials (The configurable "Star" account)
  getAdminAuth: () => {
    const creds = localStorage.getItem(GLOBAL_KEYS.ADMIN_AUTH);
    return creds ? JSON.parse(creds) : DEFAULT_ADMIN;
  },
  
  saveAdminAuth: (creds: { username: string; password: string; name: string; profilePicture?: string; contactNumber?: string; gmail?: string; address?: string }) => {
    localStorage.setItem(GLOBAL_KEYS.ADMIN_AUTH, JSON.stringify(creds));
    syncService.push('GLOBAL', 'admin', creds);
  },

  // Global Year Management
  getSelectedYear: (): string | null => {
    return localStorage.getItem(GLOBAL_KEYS.CURRENT_YEAR);
  },
  
  setSelectedYear: (year: string) => {
    localStorage.setItem(GLOBAL_KEYS.CURRENT_YEAR, year);
  },

  // Auth Session
  getSession: () => {
    const session = localStorage.getItem(GLOBAL_KEYS.AUTH_USER);
    return session ? JSON.parse(session) : null;
  },

  setSession: (user: any) => {
    localStorage.setItem(GLOBAL_KEYS.AUTH_USER, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(GLOBAL_KEYS.AUTH_USER);
  },

  // Cross-Session Specific Methods
  getDataForYear: (year: string, key: string): any[] => {
    const data = localStorage.getItem(`${year}_${key}`);
    return data ? JSON.parse(data) : [];
  },

  saveDataForYear: (year: string, key: string, data: any[]) => {
    localStorage.setItem(`${year}_${key}`, JSON.stringify(data));
    syncService.push(year, key, data);
  },

  // Cloud Sync Methods
  syncFromCloud: async (year: string) => {
    const cloudData = await syncService.pullYear(year);
    if (cloudData) {
      cloudData.forEach(item => {
        localStorage.setItem(`${year}_${item.key}`, JSON.stringify(item.data));
      });
      return true;
    }
    return false;
  },

  syncGlobalsFromCloud: async () => {
    const settings = await syncService.pull('GLOBAL', 'settings');
    if (settings) localStorage.setItem(GLOBAL_KEYS.SCHOOL_SETTINGS, JSON.stringify(settings));
    
    const admin = await syncService.pull('GLOBAL', 'admin');
    if (admin) localStorage.setItem(GLOBAL_KEYS.ADMIN_AUTH, JSON.stringify(admin));
  },

  // Active Session Scoped Data Methods
  getStudents: (): Student[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'students'),
  saveStudents: (students: Student[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'students', students),
  
  getTeachers: (): Teacher[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'teachers'),
  saveTeachers: (teachers: Teacher[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'teachers', teachers),
  
  getSalaryRecords: (): SalaryRecord[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'salary'),
  saveSalaryRecords: (records: SalaryRecord[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'salary', records),
  
  getSubjects: (): Subject[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'subjects'),
  saveSubjects: (subjects: Subject[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'subjects', subjects),
  
  getMarks: (): MarkRecord[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'marks'),
  saveMarks: (marks: MarkRecord[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'marks', marks),
  
  getInvoices: (): Invoice[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'invoices'),
  saveInvoices: (invoices: Invoice[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'invoices', invoices),
  
  getExpenditures: (): Expenditure[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'expenditures'),
  saveExpenditures: (expenditures: Expenditure[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'expenditures', expenditures),

  getNotices: (): Notice[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'notices'),
  saveNotices: (notices: Notice[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'notices', notices),

  getAttendance: (): AttendanceRecord[] => storage.getDataForYear(storage.getSelectedYear() || 'TEMP', 'attendance'),
  saveAttendance: (records: AttendanceRecord[]) => storage.saveDataForYear(storage.getSelectedYear() || 'TEMP', 'attendance', records)
};
