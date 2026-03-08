
export type StudentClass = 
  | 'ECD' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' 
  | '11' | '12' | '13' | 'Hifz Class' | 'Passed Out';

export type TransportMode = 'School Bus' | 'Hostel' | 'On Foot' | 'Private Vehicle';
export type DateType = 'AD' | 'BS';
export type ExamTerm = 'First Terminal' | 'Second Terminal' | 'Third Terminal';
export type Gender = 'Male' | 'Female';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  role: UserRole;
  displayName: string;
  email?: string;
  relatedId?: string; // Teacher ID or Student ID
  isRestricted?: boolean;
}

export interface SchoolSettings {
  name: string;
  address: string;
  contact: string;
  logo?: string; // Base64 string
  allowStudentNotices: boolean;
  allowTeacherNotices: boolean;
  allowTeacherBilling: boolean;
  allowTeacherAdmission: boolean;
  allowStudentAttendance: boolean;
  restrictedUsername?: string;
  restrictedPassword?: string;
  examFees: Record<string, number>; // Persistent class-wise exam fees
}

export interface Notice {
  id: string;
  classId: StudentClass | 'All' | 'Teachers';
  title: string;
  content: string;
  date: string;
  authorName: string;
  authorRole: UserRole;
}

export type NepaliMonth = 
  | 'Baisakh' | 'Jestha' | 'Ashadh' | 'Shrawan' | 'Bhadra' | 'Ashwin' 
  | 'Kartik' | 'Mangsir' | 'Poush' | 'Magh' | 'Falgun' | 'Chaitra';

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  fatherName: string;
  motherName?: string;
  address: string;
  contactNumber: string;
  dob?: string;
  dobType?: DateType;
  gmail?: string;
  transportMode: TransportMode;
  currentClass: StudentClass;
  admissionDate: string;
  rollNumber: string;
  profilePicture?: string; // Base64 string
  dailyAllowance?: number; // For attendance calculations
  // Security & Analytics
  username?: string;
  password?: string;
  loginCount?: number;
  lastLoginDate?: string;
}

export interface SubjectAssignment {
  classId: StudentClass;
  subjectId: string;
  period: string;
}

export interface Teacher {
  id: string;
  name: string;
  gender: Gender;
  contactNumber: string;
  gmail?: string;
  address: string;
  joinDate: string;
  profilePicture?: string; // Base64 string
  assignments?: SubjectAssignment[];
  classTeacherOf?: StudentClass; // Added for attendance rights
  // Security & Analytics
  username?: string;
  password?: string;
  loginCount?: number;
  lastLoginDate?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: StudentClass;
  year: string; // BS Year
  month: NepaliMonth;
  day: number;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface SalaryRecord {
  id: string;
  teacherId: string;
  amount: number;
  month: NepaliMonth;
  year: string;
  paymentDate: string;
  remarks?: string;
}

export interface Subject {
  id: string;
  classId: StudentClass;
  name: string;
}

export interface MarkRecord {
  studentId: string;
  classId: StudentClass;
  subjectId: string;
  term: ExamTerm;
  marksObtained: number;
  maxMarks: number;
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Partial' | 'Due';
  month?: NepaliMonth;
  year?: string;
  receivedBy?: string;
}

export type ExpenditureCategory = 
  | 'Utilities' 
  | 'Maintenance' 
  | 'Office Supplies' 
  | 'Staff Welfare' 
  | 'Events' 
  | 'Infrastructure' 
  | 'Transportation' 
  | 'Food/Canteen' 
  | 'Others';

export interface Expenditure {
  id: string;
  description: string;
  category: ExpenditureCategory;
  amount: number;
  date: string;
  remarks?: string;
}
