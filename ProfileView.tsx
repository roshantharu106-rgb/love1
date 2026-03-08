
import React, { useState, useEffect } from 'react';
import { User, Camera, Save, UserCircle, ShieldCheck, Mail, Phone, MapPin, Calendar, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Student, Teacher, User as UserType } from '../types';
import { storage } from '../utils/storage';

interface ProfileViewProps {
  currentUser: UserType;
  students: Student[];
  teachers: Teacher[];
  onUpdateStudents: (students: Student[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onUpdateAdmin?: (creds: any) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  currentUser, 
  students, 
  teachers, 
  onUpdateStudents, 
  onUpdateTeachers,
  onUpdateAdmin
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (currentUser.role === 'student' && currentUser.relatedId) {
      const student = students.find(s => s.id === currentUser.relatedId);
      if (student) setProfileData(student);
    } else if (currentUser.role === 'teacher' && currentUser.relatedId) {
      const teacher = teachers.find(t => t.id === currentUser.relatedId);
      if (teacher) setProfileData(teacher);
    } else if (currentUser.role === 'admin') {
      const admin = storage.getAdminAuth();
      setProfileData({
        id: 'ADMIN_ID',
        name: admin.name || 'Super Administrator',
        username: admin.username,
        password: admin.password,
        profilePicture: admin.profilePicture || '',
        contactNumber: admin.contactNumber || '',
        gmail: admin.gmail || '',
        address: admin.address || '',
        role: 'admin'
      });
    }
  }, [currentUser, students, teachers]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profileData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileData({ ...profileData, profilePicture: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profileData) return;
    setIsSaving(true);
    
    try {
      if (currentUser.role === 'student') {
        const updatedStudents = students.map(s => s.id === profileData.id ? (profileData as Student) : s);
        onUpdateStudents(updatedStudents);
      } else if (currentUser.role === 'teacher') {
        const updatedTeachers = teachers.map(t => t.id === profileData.id ? (profileData as Teacher) : t);
        onUpdateTeachers(updatedTeachers);
      } else if (currentUser.role === 'admin' && onUpdateAdmin) {
        onUpdateAdmin(profileData);
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <UserCircle size={64} className="mb-4 opacity-20" />
        <p className="font-black uppercase tracking-widest text-xs">No Profile Data Found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-indigo-900 relative">
          <div className="absolute -bottom-12 left-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl bg-slate-50 overflow-hidden flex items-center justify-center">
                {profileData.profilePicture ? (
                  <img src={profileData.profilePicture} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="text-slate-200" size={80} />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <Camera size={20} />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-10 px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <input 
                type="text" 
                value={profileData.name} 
                onChange={e => setProfileData({...profileData, name: e.target.value})}
                className="text-3xl font-black text-slate-800 uppercase tracking-tight bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none w-full"
                placeholder="Full Name"
              />
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                  {currentUser.role} Account
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ID: {profileData.id.slice(0, 8)}
                </span>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-3 px-8 py-4 bg-indigo-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-800 shadow-xl shadow-indigo-700/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? <Save className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>

          {message && (
            <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Phone size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Phone Number</p>
                    <input 
                      type="text" 
                      value={profileData.contactNumber || ''} 
                      onChange={e => setProfileData({...profileData, contactNumber: e.target.value})}
                      className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full"
                      placeholder="Not provided"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Mail size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Email Address</p>
                    <input 
                      type="email" 
                      value={profileData.gmail || ''} 
                      onChange={e => setProfileData({...profileData, gmail: e.target.value})}
                      className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full"
                      placeholder="Not provided"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><MapPin size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Residential Address</p>
                    <input 
                      type="text" 
                      value={profileData.address || ''} 
                      onChange={e => setProfileData({...profileData, address: e.target.value})}
                      className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full"
                      placeholder="Not provided"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Institutional Details</h3>
              <div className="space-y-4">
                {currentUser.role === 'admin' ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><UserCircle size={18} /></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Admin Username</p>
                        <input 
                          type="text" 
                          value={profileData.username} 
                          onChange={e => setProfileData({...profileData, username: e.target.value})}
                          className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck size={18} /></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Admin Password</p>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={profileData.password} 
                            onChange={e => setProfileData({...profileData, password: e.target.value})}
                            className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full pr-10"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><GraduationCap size={18} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Current Grade / Class</p>
                        <p className="font-bold text-slate-700">
                          {currentUser.role === 'student' ? (profileData as Student).currentClass : (profileData as Teacher).classTeacherOf ? `Class Teacher of ${(profileData as Teacher).classTeacherOf}` : 'Subject Specialist'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Calendar size={18} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{currentUser.role === 'student' ? 'Admission Date' : 'Joining Date'}</p>
                        <p className="font-bold text-slate-700">
                          {currentUser.role === 'student' ? (profileData as Student).admissionDate : (profileData as Teacher).joinDate}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Account Security</p>
                    <p className="font-bold text-emerald-600">Verified Institutional Account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
