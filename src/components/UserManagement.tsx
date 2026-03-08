
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Eye, 
  EyeOff, 
  Search, 
  UserCircle, 
  TrendingUp, 
  Lock,
  X,
  Save,
  Activity,
  Award,
  Settings,
  BarChart3,
  Building2,
  Megaphone,
  ReceiptText,
  Clock,
  History,
  Edit,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  MapPin,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Calculator,
  Upload,
  PlusCircle,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { Student, Teacher, UserRole, SchoolSettings, StudentClass } from '../types';
import { storage } from '../utils/storage';
import { CLASSES } from '../constants';

interface UserManagementProps {
  students: Student[];
  teachers: Teacher[];
  onUpdateStudents: (students: Student[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  schoolSettings: SchoolSettings;
  onUpdateSettings: (settings: SchoolSettings) => void;
  onUpdateAdmin?: (name: string, username: string, password: string, profilePicture?: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  students, 
  teachers, 
  onUpdateStudents, 
  onUpdateTeachers,
  schoolSettings,
  onUpdateSettings,
  onUpdateAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'branding'>('users');
  const [activeRole, setActiveRole] = useState<UserRole | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<{ id: string, role: UserRole, username: string, password: string, displayName: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [tempSettings, setTempSettings] = useState<SchoolSettings>(schoolSettings);
  const [tempAdmin, setTempAdmin] = useState(storage.getAdminAuth());
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  const allUsers = useMemo(() => {
    const teacherAccounts = teachers.map(t => ({
      id: t.id,
      name: t.name,
      role: 'teacher' as UserRole,
      username: t.username || t.gmail || t.name,
      password: t.password || t.contactNumber,
      loginCount: t.loginCount || 0,
      lastLogin: t.lastLoginDate || 'Never Recorded',
    }));
    const studentAccounts = students.map(s => ({
      id: s.id,
      name: s.name,
      role: 'student' as UserRole,
      username: s.username || s.name,
      password: s.password || s.contactNumber,
      loginCount: s.loginCount || 0,
      lastLogin: s.lastLoginDate || 'Never Recorded',
    }));
    return [...teacherAccounts, ...studentAccounts];
  }, [students, teachers]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesRole = activeRole === 'All' || u.role === activeRole;
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    }).sort((a, b) => b.loginCount - a.loginCount);
  }, [allUsers, activeRole, searchQuery]);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editingUser.role === 'teacher') {
      onUpdateTeachers(teachers.map(t => t.id === editingUser.id ? { ...t, username: editingUser.username, password: editingUser.password } : t));
    } else {
      onUpdateStudents(students.map(s => s.id === editingUser.id ? { ...s, username: editingUser.username, password: editingUser.password } : s));
    }
    setEditingUser(null);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);
    if (onUpdateAdmin) {
      onUpdateAdmin(tempAdmin);
    } else {
      storage.saveAdminAuth(tempAdmin);
    }
    setBrandingSuccess(true);
    setTimeout(() => setBrandingSuccess(false), 2000);
  };

  const handleExamFeeChange = (cls: string, amount: string) => {
    setTempSettings({
      ...tempSettings,
      examFees: {
        ...tempSettings.examFees,
        [cls]: Number(amount) || 0
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings({
          ...tempSettings,
          logo: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border w-fit">
        <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Account Access Vault</button>
        <button onClick={() => setActiveTab('branding')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'branding' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Institutional Branding & Permissions</button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 bg-slate-50/50 border-b flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-600"><ShieldCheck size={32} /></div>
              <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Security Credentials Vault</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrator oversight • Student & Teacher accounts</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input type="text" placeholder="Filter name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-indigo-500" /></div>
               <select value={activeRole} onChange={e => setActiveRole(e.target.value as any)} className="px-4 py-2 bg-white border border-slate-100 rounded-xl font-black text-[10px] uppercase appearance-none cursor-pointer">
                  <option value="All">All Roles</option>
                  <option value="teacher">Teachers</option>
                  <option value="student">Students</option>
               </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-5">Academic User</th>
                  <th className="px-8 py-5">Login ID</th>
                  <th className="px-8 py-5">Access Password</th>
                  <th className="px-8 py-5 text-center">Session Statistics</th>
                  <th className="px-8 py-5 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-indigo-50/10 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.role === 'teacher' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>{user.name.charAt(0)}</div>
                        <div><p className="font-black text-slate-800 uppercase text-sm">{user.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{user.role}</p></div>
                      </div>
                    </td>
                    <td className="px-8 py-6"><span className="font-mono text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{user.username}</span></td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-sm ${showPasswords[user.id] ? 'text-indigo-600 font-bold' : 'text-slate-300'}`}>{showPasswords[user.id] ? user.password : '••••••••••••'}</span>
                        <button onClick={() => setShowPasswords(prev => ({...prev, [user.id]: !prev[user.id]}))} className="p-1.5 hover:bg-white rounded-lg transition-all">{showPasswords[user.id] ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1"><Activity size={14} className="text-emerald-500" /><span className="font-black text-slate-800 text-xs">{user.loginCount} Logins</span></div>
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-tighter"><History size={10} /> {user.lastLogin}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button onClick={() => setEditingUser({id: user.id, role: user.role, username: user.username, password: user.password, displayName: user.name})} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-none hover:shadow-lg active:scale-95"><Edit size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-left-6 duration-300">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-10 bg-slate-900 text-white relative">
                <Building2 className="absolute right-10 top-1/2 -translate-y-1/2 text-white/5" size={180} />
                <div className="relative z-10">
                   <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">Institutional Identity</h3>
                   <p className="text-indigo-300 mt-2 font-bold uppercase tracking-widest text-[10px]">Customize school name, address, and primary master admin credentials</p>
                </div>
             </div>
             
             <form onSubmit={handleSaveBranding} className="p-12 space-y-10">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                   <div className="shrink-0 space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Institutional Logo</label>
                      <div className="relative group">
                         <div className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center overflow-hidden group-hover:border-indigo-400 transition-all">
                            {tempSettings.logo ? (
                               <img src={tempSettings.logo} alt="School Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                               <ImageIcon className="text-slate-300" size={48} />
                            )}
                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all cursor-pointer">
                               <Upload size={24} />
                               <span className="text-[8px] font-black uppercase tracking-widest mt-2">Upload New</span>
                            </div>
                         </div>
                         <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                         />
                      </div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">Recommended: Square PNG/JPG</p>
                   </div>

                   <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institution Name</label>
                         <input 
                            type="text" 
                            value={tempSettings.name} 
                            onChange={e => setTempSettings({...tempSettings, name: e.target.value})} 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500" 
                            required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                         <input 
                            type="text" 
                            value={tempSettings.contact} 
                            onChange={e => setTempSettings({...tempSettings, contact: e.target.value})} 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500" 
                            required
                         />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><MapPin size={12}/> Complete Address</label>
                         <input 
                            type="text" 
                            value={tempSettings.address} 
                            onChange={e => setTempSettings({...tempSettings, address: e.target.value})} 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500" 
                            required
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50">
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Calculator size={16} className="text-indigo-600"/> Class-Wise Exam Fee Config</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                      {CLASSES.map(cls => (
                         <div key={cls} className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade {cls}</label>
                            <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">NPR</span>
                               <input 
                                  type="number" 
                                  value={tempSettings.examFees[cls] || ''} 
                                  onChange={e => handleExamFeeChange(cls, e.target.value)}
                                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-indigo-500 shadow-sm"
                                  placeholder="0"
                               />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50">
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Lock size={16} className="text-indigo-600"/> Restricted Viewer Credentials (111 Account)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-amber-50/30 p-8 rounded-[2.5rem] border border-amber-100">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest ml-1">Restricted Username</label>
                         <input 
                            type="text" 
                            value={tempSettings.restrictedUsername || ''} 
                            onChange={e => setTempSettings({...tempSettings, restrictedUsername: e.target.value})} 
                            className="w-full p-4 bg-white border-2 border-amber-100 rounded-2xl font-black text-amber-900 outline-none focus:border-amber-500 shadow-sm" 
                            placeholder="111"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest ml-1">Restricted Password</label>
                         <input 
                            type="text" 
                            value={tempSettings.restrictedPassword || ''} 
                            onChange={e => setTempSettings({...tempSettings, restrictedPassword: e.target.value})} 
                            className="w-full p-4 bg-white border-2 border-amber-100 rounded-2xl font-black text-amber-900 outline-none focus:border-amber-500 shadow-sm" 
                            placeholder="000"
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50">
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Lock size={16} className="text-indigo-600"/> Master Admin Credentials (Star Account)</h4>
                   <div className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100 space-y-8">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                         <div className="relative shrink-0">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
                               {tempAdmin.profilePicture ? (
                                  <img src={tempAdmin.profilePicture} alt="Admin Profile" className="w-full h-full object-cover" />
                               ) : (
                                  <UserCircle className="text-slate-200" size={64} />
                               )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-all">
                               <Camera size={16} />
                               <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={e => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                           setTempAdmin({...tempAdmin, profilePicture: reader.result as string});
                                        };
                                        reader.readAsDataURL(file);
                                     }
                                  }} 
                                  className="hidden" 
                               />
                            </label>
                         </div>
                         <div className="flex-1 space-y-2">
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Admin Display Name</label>
                            <input 
                               type="text" 
                               value={tempAdmin.name || ''} 
                               onChange={e => setTempAdmin({...tempAdmin, name: e.target.value})} 
                               className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl font-black text-indigo-900 outline-none focus:border-indigo-500 shadow-sm" 
                               placeholder="Super Administrator"
                               required
                            />
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Admin Username</label>
                            <input 
                               type="text" 
                               value={tempAdmin.username} 
                               onChange={e => setTempAdmin({...tempAdmin, username: e.target.value})} 
                               className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl font-black text-indigo-900 outline-none focus:border-indigo-500 shadow-sm" 
                               required
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Admin Password</label>
                            <input 
                               type="text" 
                               value={tempAdmin.password} 
                               onChange={e => setTempAdmin({...tempAdmin, password: e.target.value})} 
                               className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl font-black text-indigo-900 outline-none focus:border-indigo-500 shadow-sm" 
                               required
                            />
                         </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-indigo-100">
                         <ShieldAlert className="text-amber-500" size={20}/>
                         <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">Changes to these credentials will apply to the "Star" account immediately. The "Prameen" account remains as a hardcoded institutional recovery backup.</p>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Security & Feature Permissions</h4>
                   <div className="space-y-4">
                      {/* Teacher Billing Permission */}
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${tempSettings.allowTeacherBilling ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}><ReceiptText size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Teacher Billing Access</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Allow teachers to generate invoices and collect fees</p>
                            </div>
                         </div>
                         <button type="button" onClick={() => setTempSettings({...tempSettings, allowTeacherBilling: !tempSettings.allowTeacherBilling})}>
                            {tempSettings.allowTeacherBilling ? <ToggleRight className="text-indigo-600" size={48} /> : <ToggleLeft className="text-slate-300" size={48} />}
                         </button>
                      </div>

                      {/* Student Notice Permission */}
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${tempSettings.allowStudentNotices ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}><Megaphone size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Student notice publishing</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Enable/Disable students from posting on the Digital Board</p>
                            </div>
                         </div>
                         <button type="button" onClick={() => setTempSettings({...tempSettings, allowStudentNotices: !tempSettings.allowStudentNotices})}>
                            {tempSettings.allowStudentNotices ? <ToggleRight className="text-indigo-600" size={48} /> : <ToggleLeft className="text-slate-300" size={48} />}
                         </button>
                      </div>

                      {/* Teacher Notice Permission */}
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${tempSettings.allowTeacherNotices ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}><Megaphone size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Teacher notice publishing</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Enable/Disable faculty members from broadcasting announcements</p>
                            </div>
                         </div>
                         <button type="button" onClick={() => setTempSettings({...tempSettings, allowTeacherNotices: !tempSettings.allowTeacherNotices})}>
                            {tempSettings.allowTeacherNotices ? <ToggleRight className="text-indigo-600" size={48} /> : <ToggleLeft className="text-slate-300" size={48} />}
                         </button>
                      </div>

                      {/* Teacher Admission Permission */}
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${tempSettings.allowTeacherAdmission ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}><PlusCircle size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Teacher Admission Access</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Allow teachers to access the New Student Admission form</p>
                            </div>
                         </div>
                         <button type="button" onClick={() => setTempSettings({...tempSettings, allowTeacherAdmission: !tempSettings.allowTeacherAdmission})}>
                            {tempSettings.allowTeacherAdmission ? <ToggleRight className="text-indigo-600" size={48} /> : <ToggleLeft className="text-slate-300" size={48} />}
                         </button>
                      </div>

                      {/* Student Attendance Permission */}
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${tempSettings.allowStudentAttendance ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}><Clock size={20} /></div>
                            <div>
                               <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Student Attendance Access</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Allow students full access to attendance system (otherwise restricted to personal grid)</p>
                            </div>
                         </div>
                         <button type="button" onClick={() => setTempSettings({...tempSettings, allowStudentAttendance: !tempSettings.allowStudentAttendance})}>
                            {tempSettings.allowStudentAttendance ? <ToggleRight className="text-indigo-600" size={48} /> : <ToggleLeft className="text-slate-300" size={48} />}
                         </button>
                      </div>
                   </div>
                </div>

                <button type="submit" className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${brandingSuccess ? 'bg-emerald-600' : 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-600/20'}`}>
                   {brandingSuccess ? <><CheckCircle2 size={18}/> Branding Sync Successful</> : <>Commit Branding & Security Sync <ChevronRight size={18}/></>}
                </button>
             </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-indigo-100">
              <div className="px-10 py-6 border-b flex items-center justify-between bg-indigo-50/50">
                 <h3 className="text-lg font-black text-indigo-900 uppercase">Override Credentials</h3>
                 <button onClick={() => setEditingUser(null)}><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveCredentials} className="p-10 space-y-6">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">{editingUser.displayName.charAt(0)}</div>
                    <div><p className="font-black text-slate-800 uppercase text-sm leading-none">{editingUser.displayName}</p><p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">{editingUser.role}</p></div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Username</label>
                    <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input type="text" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-indigo-700 text-white font-black rounded-[2rem] uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-700/20 active:scale-95 transition-all">Synchronize New Credentials</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
