
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  GraduationCap, 
  Bus, 
  Home, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Banknote, 
  Calendar,
  Briefcase,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  UserCircle,
  Bell,
  Award,
  CheckCircle2,
  AlertCircle,
  Cloud
} from 'lucide-react';
import { Student, Teacher, Invoice, Expenditure, SalaryRecord, User as UserType, SchoolSettings } from '../types';
import { CLASSES } from '../constants';
import { storage } from '../utils/storage';

interface DashboardProps {
  students: Student[];
  teachers: Teacher[];
  invoices: Invoice[];
  expenditures: Expenditure[];
  salaryRecords: SalaryRecord[];
  currentUser?: UserType;
  schoolSettings: SchoolSettings;
}

type TimeRange = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'This Year';

const Dashboard: React.FC<DashboardProps> = ({ 
  students, 
  teachers, 
  invoices, 
  expenditures, 
  salaryRecords,
  currentUser = storage.getSession(),
  schoolSettings
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('This Month');
  const notices = storage.getNotices();

  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';
  const isCloudConnected = !!import.meta.env.VITE_SUPABASE_URL;

  // Derived data for Students
  const studentProfile = isStudent ? students.find(s => s.id === currentUser.relatedId) : null;
  const studentInvoices = isStudent ? invoices.filter(inv => inv.studentId === currentUser.relatedId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber)) : [];
  
  // Calculate active balance (latest due amount only)
  const currentDues = studentInvoices.length > 0 ? studentInvoices[0].dueAmount : 0;
  const unreadNotices = notices.filter(n => n.classId === 'All' || n.classId === studentProfile?.currentClass);

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'indigo' },
    { label: 'Active Faculty', value: teachers.length, icon: Briefcase, color: 'emerald' },
    { label: 'Bus Students', value: students.filter(s => s.transportMode === 'School Bus').length, icon: Bus, color: 'amber' },
    { label: 'Hostelites', value: students.filter(s => s.transportMode === 'Hostel').length, icon: Home, color: 'purple' },
  ];

  const financialStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const filterByTime = (dateStr: string) => {
      const d = new Date(dateStr);
      if (timeRange === 'Today') return d.getTime() >= today.getTime();
      if (timeRange === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return d.getTime() >= yesterday.getTime() && d.getTime() < today.getTime();
      }
      if (timeRange === 'This Week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return d.getTime() >= lastWeek.getTime();
      }
      if (timeRange === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeRange === 'This Year') return d.getFullYear() === now.getFullYear();
      return true;
    };

    const periodRevenue = invoices.filter(inv => filterByTime(inv.date)).reduce((s, i) => s + i.paidAmount, 0);
    const periodGenExp = expenditures.filter(exp => filterByTime(exp.date)).reduce((s, e) => s + e.amount, 0);
    const periodSalaries = salaryRecords.filter(sal => filterByTime(sal.paymentDate)).reduce((s, e) => s + e.amount, 0);
    const totalExp = periodGenExp + periodSalaries;

    const latestDuesSum = students.reduce((sum, student) => {
      const studentInvoices = invoices
        .filter(inv => inv.studentId === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber));
      return sum + (studentInvoices[0]?.dueAmount || 0);
    }, 0);

    return {
      revenue: periodRevenue,
      expenditure: totalExp,
      profit: periodRevenue - totalExp,
      salaries: periodSalaries,
      general: periodGenExp,
      currentOutstanding: latestDuesSum
    };
  }, [invoices, expenditures, salaryRecords, timeRange, students]);

  const classData = CLASSES.map(cls => ({
    name: cls,
    count: students.filter(s => s.currentClass === cls).length
  })).filter(d => d.count > 0);

  if (isStudent && studentProfile) {
    return (
      <div className="space-y-10 pb-20 animate-in fade-in duration-500">
        <div className="bg-indigo-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <GraduationCap className="absolute right-[-20px] top-[-20px] text-white/5" size={250} />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
             <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center border-2 border-white/20 shadow-inner">
                <UserCircle size={60} className="text-indigo-200 md:w-20 md:h-20" />
             </div>
             <div className="text-center md:text-left space-y-2 flex-1">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">{studentProfile.name}</h2>
                  {isCloudConnected && (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest">
                      <Cloud size={10} /> Cloud Active
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
                   <span className="px-3 py-1 md:px-4 md:py-1.5 bg-indigo-500/30 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-indigo-400/30">Class {studentProfile.currentClass}</span>
                   <span className="px-3 py-1 md:px-4 md:py-1.5 bg-amber-500/30 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-amber-400/30">Roll No: {studentProfile.rollNumber}</span>
                   <span className="text-indigo-200 font-bold text-xs md:text-sm">Father: {studentProfile.fatherName}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className={`rounded-[2.5rem] p-10 flex flex-col justify-center shadow-xl border relative overflow-hidden transition-all ${currentDues > 0 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}>
              <Banknote className={`absolute right-[-10%] top-[-10%] opacity-10`} size={180} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">Active Balance (Current Dues)</p>
              <h3 className="text-5xl font-black mb-6">NPR {currentDues.toLocaleString()}</h3>
              <div className="flex items-center gap-2">
                 {currentDues > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                 <span className="text-xs font-black uppercase">{currentDues > 0 ? 'Payment Required' : 'Fee Status: Fully Cleared'}</span>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transport</p>
                 <div className="flex items-center gap-2 font-black text-slate-800"><Bus size={16} className="text-indigo-500" /> {studentProfile.transportMode}</div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</p>
                 <div className="flex items-center gap-2 font-black text-slate-800"><Calendar size={16} className="text-indigo-500" /> {studentProfile.admissionDate}</div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                 <div className="flex items-center gap-2 font-black text-slate-800"><Phone size={16} className="text-indigo-500" /> {studentProfile.contactNumber}</div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Bell className="text-indigo-600" /> Recent Notices</h3>
                 <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{unreadNotices.length} Active</span>
              </div>
              <div className="space-y-4">
                 {unreadNotices.slice(0, 3).map(n => (
                   <div key={n.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                      <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">{new Date(n.date).toLocaleDateString()}</span>
                      <h4 className="font-black text-slate-800 uppercase text-sm mb-2 group-hover:text-indigo-700 transition-colors">{n.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 font-medium">{n.content}</p>
                   </div>
                 ))}
                 {unreadNotices.length === 0 && <div className="text-center py-10 text-slate-300 font-black uppercase text-[10px] tracking-widest italic">No new announcements</div>}
              </div>
           </div>

           <div className="bg-indigo-950 rounded-[3rem] p-10 text-white flex flex-col justify-center relative overflow-hidden shadow-2xl">
              <Award className="absolute right-[-10%] bottom-[-10%] text-white/5" size={250} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Academic Progress</h3>
              <p className="text-indigo-300 text-sm leading-relaxed mb-8 font-medium">Your current session progress is being tracked. Terminal report cards will be accessible via the "Reports" section once published by class instructors.</p>
              <div className="flex gap-4">
                 <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest">GPA: 3.8 (Pending)</div>
                 <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest">Rank: Top 5%</div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Admin/Teacher Dashboard View
  return (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-800 mt-2">{stat.value}</h3>
            </div>
            <div className={`p-3 md:p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 shadow-inner group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} className="md:w-8 md:h-8" />
            </div>
          </div>
        ))}
      </div>

      {isCloudConnected && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Cloud size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Cloud Database Connected</p>
              <p className="text-[9px] text-emerald-600 font-bold uppercase">All records are being synchronized to Supabase in real-time</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-emerald-200">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-emerald-700 uppercase">Live Sync Active</span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <Wallet className="text-indigo-600" /> Institutional Financial Pulse
              </h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Audit Overview: {timeRange}</p>
            </div>
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto no-scrollbar max-w-full">
              {(['Today', 'Yesterday', 'This Week', 'This Month', 'This Year'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    timeRange === range ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-indigo-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
              <TrendingUp className="absolute right-[-20px] top-[-20px] text-white/5" size={180} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><Banknote size={16} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Period Revenue (Cash Collected)</span>
                </div>
                <h4 className="text-5xl font-black tracking-tighter">NPR {financialStats.revenue.toLocaleString()}</h4>
                <div className="mt-6 flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ArrowUpRight size={16} /> {timeRange} Inflow
                </div>
              </div>
            </div>

            <div className="bg-rose-700 text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
              <TrendingDown className="absolute right-[-20px] top-[-20px] text-white/5" size={180} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><CreditCard size={16} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">Pending Realization (Latest Dues)</span>
                </div>
                <h4 className="text-5xl font-black tracking-tighter">NPR {financialStats.currentOutstanding.toLocaleString()}</h4>
                <p className="mt-4 text-[10px] font-black uppercase opacity-60">Aggregate of Newest Active Balances</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <GraduationCap className="text-indigo-600" /> Student Density
              </h3>
              <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase">Class-wise Analysis</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} fontWeight="900" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} fontWeight="900" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><Bell size={32} /></div>
                <div>
                   <h3 className="text-2xl font-black uppercase text-slate-800">Quick Notice Tracker</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Latest communications broadcasted</p>
                </div>
             </div>
             <div className="space-y-4">
                {notices.slice(0, 3).map(n => (
                   <div key={n.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-indigo-500 uppercase">
                          {n.classId === 'All' ? 'Global' : n.classId === 'Teachers' ? 'Teachers' : 'Class ' + n.classId}
                        </span>
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight truncate max-w-[200px]">{n.title}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{new Date(n.date).toLocaleDateString()}</span>
                   </div>
                ))}
                {notices.length === 0 && <div className="text-center py-6 text-slate-300 font-bold uppercase text-[10px]">No notices published</div>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
