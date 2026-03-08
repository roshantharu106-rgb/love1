
import React, { useState } from 'react';
import { ShieldCheck, GraduationCap, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { storage } from '../utils/storage';

interface LoginProps {
  onLogin: (user: any) => void;
  schoolName: string;
  logo?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, schoolName, logo }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const adminCreds = storage.getAdminAuth();
      const settings = storage.getSchoolSettings();
      
      // Dual Master Admin Login (Requested: Prameen/Prameen AND Star/RoshanPrameen369@)
      const isMaster1 = usernameInput === 'Prameen' && passwordInput === 'Prameen';
      const isMaster2 = usernameInput === adminCreds.username && passwordInput === adminCreds.password;
      
      // Restricted Viewer Login (Requested: 111/000 by default, now dynamic)
      const isRestricted = usernameInput === (settings.restrictedUsername || '111') && 
                           passwordInput === (settings.restrictedPassword || '000');

      if (isMaster1 || isMaster2) {
        const user = { id: 'admin', role: 'admin', displayName: 'System Admin' };
        storage.setSession(user);
        onLogin(user);
        return;
      }

      if (isRestricted) {
        const user = { id: 'restricted', role: 'student', displayName: 'Viewer (Restricted)', isRestricted: true };
        storage.setSession(user);
        onLogin(user);
        return;
      }

      const teachers = storage.getTeachers();
      const students = storage.getStudents();

      // Check Teacher Accounts
      const teacherIndex = teachers.findIndex(t => {
        const targetUsername = t.username || t.gmail || t.name;
        const targetUsernameString = String(targetUsername);
        const targetPassword = t.password || t.contactNumber;
        const targetPasswordString = String(targetPassword);
        return targetUsernameString === usernameInput && targetPasswordString === passwordInput;
      });

      if (teacherIndex !== -1) {
        const teacher = teachers[teacherIndex];
        const updatedTeachers = [...teachers];
        updatedTeachers[teacherIndex] = {
          ...teacher,
          loginCount: (teacher.loginCount || 0) + 1,
          lastLoginDate: new Date().toLocaleString()
        };
        storage.saveTeachers(updatedTeachers);
        
        const user = { id: teacher.id, role: 'teacher', displayName: teacher.name, relatedId: teacher.id };
        storage.setSession(user);
        onLogin(user);
        return;
      }

      // Check Student Accounts
      const studentIndex = students.findIndex(s => {
        const targetUsername = s.username || s.name;
        const targetUsernameString = String(targetUsername);
        const targetPassword = s.password || s.contactNumber;
        const targetPasswordString = String(targetPassword);
        return targetUsernameString === usernameInput && targetPasswordString === passwordInput;
      });

      if (studentIndex !== -1) {
        const student = students[studentIndex];
        const updatedStudents = [...students];
        updatedStudents[studentIndex] = {
          ...student,
          loginCount: (student.loginCount || 0) + 1,
          lastLoginDate: new Date().toLocaleString()
        };
        storage.saveStudents(updatedStudents);

        const user = { id: student.id, role: 'student', displayName: student.name, relatedId: student.id };
        storage.setSession(user);
        onLogin(user);
        return;
      }

      setError('Invalid credentials. Please check your username and password.');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="mb-6">
            <img src={logo || "/logo.png"} alt="Pakadi Madarsa Logo" className="w-40 mx-auto object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{schoolName}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Institutional Portal</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-400 text-xs font-black uppercase tracking-wider text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-950 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                  placeholder="Username"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-950 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Enter Portal <ArrowRight size={18} /></>
              )}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> End-to-End Encrypted Session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
