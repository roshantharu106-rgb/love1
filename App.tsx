
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  FileBadge, 
  LayoutDashboard,
  PlusCircle,
  Menu,
  X,
  ArrowRightLeft,
  ChevronDown,
  Briefcase,
  Banknote,
  ReceiptText,
  CreditCard,
  Calendar,
  Loader2,
  Database,
  ChevronRight,
  Zap,
  Plus,
  ArrowRight,
  LogOut,
  Megaphone,
  UserCircle,
  ShieldAlert,
  CalendarCheck,
  History
} from 'lucide-react';
import { Student, Subject, MarkRecord, Teacher, SalaryRecord, Invoice, Expenditure, User, Notice, AttendanceRecord, StudentClass, SchoolSettings } from './types';
import { storage } from './utils/storage';
import Dashboard from './components/Dashboard';
import AdmissionForm from './components/AdmissionForm';
import StudentDirectory from './components/StudentDirectory';
import MarkEntrySystem from './components/MarkEntrySystem';
import ReportsSection from './components/ReportsSection';
import StudentTransfer from './components/StudentTransfer';
import TeacherManagement from './components/TeacherManagement';
import SalaryManagement from './components/SalaryManagement';
import BillingSystem from './components/BillingSystem';
import ExpenditureManagement from './components/ExpenditureManagement';
import YearSelector from './components/YearSelector';
import Login from './components/Login';
import NoticeBoard from './components/NoticeBoard';
import UserManagement from './components/UserManagement';
import AttendanceSystem from './components/AttendanceSystem';
import ProfileView from './components/ProfileView';

type View = 
  | 'dashboard' 
  | 'admission' 
  | 'directory' 
  | 'mark-entry' 
  | 'reports' 
  | 'transfer' 
  | 'teacher-manage' 
  | 'teacher-salary'
  | 'billing'
  | 'expenditure'
  | 'notices'
  | 'security'
  | 'attendance'
  | 'profile';

const PRESET_YEARS = ['2081', '2082', '2083', '2084', '2085'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getSession());
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [academicYear, setAcademicYear] = useState<string | null>(storage.getSelectedYear());
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(storage.getSchoolSettings());
  
  // App data state
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  // State for navigating to billing from directory
  const [preselectedBillingStudentId, setPreselectedBillingStudentId] = useState<string | undefined>(undefined);

  // UI state
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(true);
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(false);
  const [isYearSwitcherOpen, setIsYearSwitcherOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load data for the active year
  const loadYearData = useCallback(async (year: string, skipSync = false) => {
    if (!skipSync) {
      setIsSyncing(true);
      await storage.syncFromCloud(year);
      setIsSyncing(false);
    }
    setStudents(storage.getStudents());
    setTeachers(storage.getTeachers());
    setSalaryRecords(storage.getSalaryRecords());
    setSubjects(storage.getSubjects());
    setMarks(storage.getMarks());
    setInvoices(storage.getInvoices());
    setExpenditures(storage.getExpenditures());
    setNotices(storage.getNotices());
    setAttendance(storage.getAttendance());
  }, []);

  useEffect(() => {
    const initGlobals = async () => {
      await storage.syncGlobalsFromCloud();
      setSchoolSettings(storage.getSchoolSettings());
    };
    initGlobals();
  }, []);

  useEffect(() => {
    if (academicYear) {
      loadYearData(academicYear);
    }
  }, [academicYear, loadYearData]);

  const handleYearSelection = async (year: string) => {
    if (year === academicYear) return;
    setIsLoadingSession(true);
    storage.setSelectedYear(year);
    
    // Sync from cloud before loading
    await storage.syncFromCloud(year);
    
    loadYearData(year, true); // Skip internal sync since we just did it
    setAcademicYear(year);
    setActiveView('dashboard');
    setIsLoadingSession(false);
    setIsYearSwitcherOpen(false);
  };

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.isRestricted) {
      setActiveView('billing');
    } else {
      setActiveView('dashboard');
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} schoolName={schoolSettings.name} logo={schoolSettings.logo} />;
  }

  if (!academicYear) {
    return <YearSelector onYearSelected={handleYearSelection} schoolName={schoolSettings.name} logo={schoolSettings.logo} />;
  }

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    storage.saveStudents(newStudents);
  };

  const handleUpdateTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    storage.saveTeachers(newTeachers);
  };

  const handleUpdateSalary = (newRecords: SalaryRecord[]) => {
    setSalaryRecords(newRecords);
    storage.saveSalaryRecords(newRecords);
  };

  const handleUpdateSubjects = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    storage.saveSubjects(newSubjects);
  };

  const handleUpdateMarks = (newMarkRecords: MarkRecord[]) => {
    setMarks(newMarkRecords);
    storage.saveMarks(newMarkRecords);
  };

  const handleUpdateInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    storage.saveInvoices(newInvoices);
  };

  const handleUpdateExpenditures = (newExpenditures: Expenditure[]) => {
    setExpenditures(newExpenditures);
    storage.saveExpenditures(newExpenditures);
  };

  const handleUpdateNotices = (newNotices: Notice[]) => {
    setNotices(newNotices);
    storage.saveNotices(newNotices);
  };

  const handleUpdateAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendance(newRecords);
    storage.saveAttendance(newRecords);
  };

  const handleSelectStudentForBilling = (studentId: string) => {
    setPreselectedBillingStudentId(studentId);
    setActiveView('billing');
  };

  const handleUpdateSchoolSettings = (settings: SchoolSettings) => {
    setSchoolSettings(settings);
    storage.saveSchoolSettings(settings);
  };

  const handleUpdateAdmin = (creds: any) => {
    storage.saveAdminAuth(creds);
    if (currentUser?.role === 'admin') {
      const updatedUser = {
        ...currentUser,
        displayName: creds.name,
        profilePicture: creds.profilePicture
      };
      setCurrentUser(updatedUser);
      storage.setSession(updatedUser);
    }
  };

  const studentItems = [
    { id: 'admission', label: 'Admission', icon: PlusCircle, roles: schoolSettings.allowTeacherAdmission ? ['admin', 'teacher'] : ['admin'] },
    { id: 'directory', label: 'Student Directory', icon: Users, roles: ['admin', 'teacher', 'student'] },
    { id: 'transfer', label: 'Student Transfer', icon: ArrowRightLeft, roles: ['admin'] },
    { id: 'attendance', label: 'Attendance System', icon: CalendarCheck, roles: ['admin', 'teacher', 'student'] },
    { id: 'mark-entry', label: 'Mark Entry', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
    { id: 'reports', label: 'Certificates & Lists', icon: FileBadge, roles: ['admin', 'teacher', 'student'] },
  ];

  const teacherItems = [
    { id: 'teacher-manage', label: 'Manage Staff', icon: Briefcase, roles: ['admin'] },
    { id: 'teacher-salary', label: 'Salary Management', icon: Banknote, roles: ['admin', 'teacher'] },
  ];

  const billingItems = [
    { id: 'billing', label: 'Invoices & Dues', icon: ReceiptText, roles: ['admin', 'teacher', 'student'] },
    { id: 'expenditure', label: 'Expenditures', icon: CreditCard, roles: ['admin'] },
  ];

  const securityItems = [
    { id: 'security', label: 'User & Settings', icon: ShieldAlert, roles: ['admin'] },
  ];

  const renderView = () => {
    const isTeacher = currentUser.role === 'teacher';
    const isStudent = currentUser.role === 'student';
    const isAdmin = currentUser.role === 'admin';
    const isRestricted = currentUser.isRestricted;
    
    const teacherProfile = isTeacher ? teachers.find(t => t.id === currentUser.relatedId) : null;
    const studentProfile = isStudent ? students.find(s => s.id === currentUser.relatedId) : null;

    if (isRestricted && !['billing', 'notices', 'dashboard', 'profile'].includes(activeView)) {
      return <Dashboard students={students} teachers={teachers} invoices={invoices} expenditures={expenditures} salaryRecords={salaryRecords} currentUser={currentUser} schoolSettings={schoolSettings} />;
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard students={students} teachers={teachers} invoices={invoices} expenditures={expenditures} salaryRecords={salaryRecords} currentUser={currentUser} schoolSettings={schoolSettings} />;
      case 'profile':
        return <ProfileView currentUser={currentUser} students={students} teachers={teachers} onUpdateStudents={handleUpdateStudents} onUpdateTeachers={handleUpdateTeachers} onUpdateAdmin={handleUpdateAdmin} />;
      case 'admission':
        return <AdmissionForm students={students} onAddStudent={handleUpdateStudents} />;
      case 'directory':
        return <StudentDirectory students={students} onUpdateStudents={handleUpdateStudents} marks={marks} onUpdateMarks={handleUpdateMarks} currentUser={currentUser} onSelectForBilling={handleSelectStudentForBilling} schoolSettings={schoolSettings} />;
      case 'transfer':
        return <StudentTransfer students={students} onUpdateStudents={handleUpdateStudents} />;
      case 'teacher-manage':
        return <TeacherManagement teachers={teachers} subjects={subjects} onUpdateTeachers={handleUpdateTeachers} />;
      case 'teacher-salary':
        const filteredSalary = isTeacher ? salaryRecords.filter(r => r.teacherId === currentUser.relatedId) : salaryRecords;
        return <SalaryManagement teachers={isTeacher && teacherProfile ? [teacherProfile] : teachers} salaryRecords={filteredSalary} onUpdateSalary={handleUpdateSalary} currentUser={currentUser} schoolSettings={schoolSettings} />;
      case 'billing':
        return (
          <BillingSystem 
            students={students} 
            invoices={invoices} 
            onUpdateInvoices={handleUpdateInvoices} 
            currentUser={currentUser} 
            onUpdateNotices={handleUpdateNotices} 
            notices={notices}
            preselectedStudentId={preselectedBillingStudentId}
            onClearPreselectedStudent={() => setPreselectedBillingStudentId(undefined)}
            schoolSettings={schoolSettings}
            onUpdateSettings={handleUpdateSchoolSettings}
          />
        );
      case 'expenditure':
        return <ExpenditureManagement expenditures={expenditures} salaryRecords={salaryRecords} teachers={teachers} onUpdateExpenditures={handleUpdateExpenditures} schoolSettings={schoolSettings} />;
      case 'mark-entry':
        const filteredSubjects = isTeacher && teacherProfile?.assignments 
          ? subjects.filter(sub => teacherProfile.assignments?.some(a => a.subjectId === sub.id))
          : subjects;
        return <MarkEntrySystem students={students} subjects={filteredSubjects} marks={marks} teachers={teachers} onUpdateSubjects={handleUpdateSubjects} onUpdateMarks={handleUpdateMarks} />;
      case 'reports':
        const filteredStudentsForReport = isStudent && studentProfile ? [studentProfile] : students;
        return <ReportsSection students={filteredStudentsForReport} subjects={subjects} marks={marks} schoolSettings={schoolSettings} />;
      case 'notices':
        return <NoticeBoard notices={notices} userRole={currentUser.role} userDisplayName={currentUser.displayName} onUpdateNotices={handleUpdateNotices} targetClass={studentProfile?.currentClass} schoolSettings={schoolSettings} />;
      case 'security':
        return <UserManagement students={students} teachers={teachers} onUpdateStudents={handleUpdateStudents} onUpdateTeachers={handleUpdateTeachers} schoolSettings={schoolSettings} onUpdateSettings={handleUpdateSchoolSettings} onUpdateAdmin={handleUpdateAdmin} />;
      case 'attendance':
        return <AttendanceSystem students={students} attendanceRecords={attendance} onUpdateAttendance={handleUpdateAttendance} currentUser={currentUser} teachers={teachers} schoolSettings={schoolSettings} onUpdateStudents={handleUpdateStudents} />;
      default:
        return <Dashboard students={students} teachers={teachers} invoices={invoices} expenditures={expenditures} salaryRecords={salaryRecords} currentUser={currentUser} schoolSettings={schoolSettings} />;
    }
  };

  const getActiveLabel = () => {
    if (activeView === 'dashboard') return currentUser.role === 'student' ? 'My Student Portal' : 'Institutional Overview';
    if (activeView === 'notices') return 'Digital Notice Board';
    if (activeView === 'security') return 'User & Settings';
    if (activeView === 'attendance') return 'B.S. Attendance System';
    const combinedItems = [...studentItems, ...teacherItems, ...billingItems, ...securityItems];
    return combinedItems.find(i => i.id === activeView)?.label || 'Institutional Management';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden relative font-sans">
      {isLoadingSession && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-6">
           <div className="relative"><Loader2 className="animate-spin text-indigo-50" size={64} /><Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={24} /></div>
           <div className="text-center"><h2 className="text-2xl font-black uppercase tracking-widest mb-2">Switching Session</h2></div>
        </div>
      )}

      <aside className={`no-print fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
        <div className="flex flex-col p-6 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-lg">
                <img src={schoolSettings.logo || "/logo.png"} alt="School Logo" className="w-8 h-8 object-contain" />
              </div>
              <div className="truncate">
                <h1 className="text-xs font-black uppercase tracking-tighter leading-none truncate w-40">{schoolSettings.name}</h1>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mt-1">Portal: {currentUser.role}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-slate-900 rounded-lg"><X size={20} /></button>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-5 overflow-y-auto custom-scrollbar pb-6">
          {!currentUser.isRestricted && (
            <button
              onClick={() => { setActiveView('dashboard'); if (window.innerWidth < 768) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${activeView === 'dashboard' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-slate-100/60 hover:bg-slate-900 hover:text-white'}`}
            >
              <LayoutDashboard size={20} /> Dashboard
            </button>
          )}

          <button
            onClick={() => { setActiveView('notices'); if (window.innerWidth < 768) setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${activeView === 'notices' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-100/60 hover:bg-slate-900 hover:text-white'}`}
          >
            <Megaphone size={20} /> Notice Board
          </button>

          <button
            onClick={() => { setActiveView('profile'); if (window.innerWidth < 768) setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${activeView === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-100/60 hover:bg-slate-900 hover:text-white'}`}
          >
            <UserCircle size={20} /> My Profile
          </button>

          {!currentUser.isRestricted && (
            <div className="space-y-2">
              <button onClick={() => setIsStudentMenuOpen(!isStudentMenuOpen)} className="w-full flex items-center justify-between px-4 py-1 group">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Academics</span>
                <ChevronDown size={12} className={`text-slate-700 transition-transform ${isStudentMenuOpen ? '' : '-rotate-90'}`} />
              </button>
              {isStudentMenuOpen && (
                <div className="space-y-1 bg-slate-900/30 p-1.5 rounded-2xl border border-slate-900">
                  {studentItems.filter(i => i.roles.includes(currentUser.role)).map(item => (
                    <button key={item.id} onClick={() => { setActiveView(item.id as View); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${activeView === item.id ? 'bg-indigo-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                      <item.icon size={16} className={activeView === item.id ? 'text-amber-400' : 'text-indigo-600'} /> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {!currentUser.isRestricted && (
              <button onClick={() => setIsTeacherMenuOpen(!isTeacherMenuOpen)} className="w-full flex items-center justify-between px-4 py-1 group">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Management</span>
                <ChevronDown size={12} className={`text-slate-700 transition-transform ${isTeacherMenuOpen ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(isTeacherMenuOpen || currentUser.isRestricted) && (
              <div className="space-y-1 bg-slate-900/30 p-1.5 rounded-2xl border border-slate-900">
                {!currentUser.isRestricted && teacherItems.filter(i => i.roles.includes(currentUser.role)).map(item => (
                  <button key={item.id} onClick={() => { setActiveView(item.id as View); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${activeView === item.id ? 'bg-indigo-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <item.icon size={16} className={activeView === item.id ? 'text-amber-400' : 'text-indigo-600'} /> {item.label}
                  </button>
                ))}
                {billingItems.filter(i => i.roles.includes(currentUser.role) && (!currentUser.isRestricted || i.id === 'billing')).map(item => (
                  <button key={item.id} onClick={() => { setActiveView(item.id as View); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${activeView === item.id ? 'bg-indigo-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <item.icon size={16} className={activeView === item.id ? 'text-amber-400' : 'text-indigo-600'} /> {item.label}
                  </button>
                ))}
                {!currentUser.isRestricted && currentUser.role === 'admin' && securityItems.map(item => (
                  <button key={item.id} onClick={() => { setActiveView(item.id as View); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${activeView === item.id ? 'bg-indigo-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <item.icon size={16} className={activeView === item.id ? 'text-amber-400' : 'text-indigo-600'} /> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-900">
           <div className="p-4 bg-slate-900/40 rounded-3xl border border-slate-900 mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black overflow-hidden shrink-0">
                    {currentUser.role === 'student' && students.find(s => s.id === currentUser.relatedId)?.profilePicture ? (
                      <img src={students.find(s => s.id === currentUser.relatedId)?.profilePicture} className="w-full h-full object-cover" />
                    ) : currentUser.role === 'teacher' && teachers.find(t => t.id === currentUser.relatedId)?.profilePicture ? (
                      <img src={teachers.find(t => t.id === currentUser.relatedId)?.profilePicture} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.displayName.charAt(0)
                    )}
                 </div>
                 <div className="flex-1 truncate">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{currentUser.role}</p>
                    <p className="text-xs font-bold text-white truncate">{currentUser.displayName}</p>
                 </div>
              </div>
              <button onClick={handleLogout} className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                <LogOut size={12}/> Logout Session
              </button>
           </div>
           
           <div className="p-4 bg-slate-900/40 rounded-3xl border border-slate-900">
              <button 
                onClick={() => setIsYearSwitcherOpen(!isYearSwitcherOpen)}
                className="w-full flex items-center justify-between group"
              >
                 <div className="flex items-center gap-2">
                    <History size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Quick Switch Session</span>
                 </div>
                 <ChevronDown size={12} className={`text-slate-600 transition-transform duration-300 ${isYearSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isYearSwitcherOpen && (
                <div className="grid grid-cols-3 gap-1.5 mt-3 animate-in slide-in-from-top-2 duration-300">
                   {PRESET_YEARS.map(year => (
                      <button
                        key={year}
                        onClick={() => handleYearSelection(year)}
                        className={`py-2 rounded-lg text-[10px] font-black transition-all ${academicYear === year ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                      >
                        {year}
                      </button>
                   ))}
                </div>
              )}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="no-print h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className={`md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl ${isSidebarOpen ? 'hidden' : 'block'}`}><Menu size={24} /></button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Session: {academicYear} BS</span>
                {isSyncing && <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 animate-pulse uppercase tracking-widest"><Loader2 size={8} className="animate-spin" /> Cloud Syncing</div>}
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{getActiveLabel()}</h2>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-black text-indigo-900 uppercase tracking-tighter leading-none">{schoolSettings.name}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest truncate max-w-[250px]">{schoolSettings.address}</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-10"><div className="max-w-7xl mx-auto pb-20">{renderView()}</div></div>
      </main>
    </div>
  );
};

export default App;
