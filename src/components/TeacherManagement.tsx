
import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Users, 
  Phone, 
  MapPin, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Search, 
  BookOpen, 
  Plus, 
  Tag, 
  Clock, 
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  Mail,
  UserCheck,
  Camera,
  UserCircle,
  GraduationCap as GradIcon,
  ShieldCheck
} from 'lucide-react';
import { Teacher, Gender, StudentClass, Subject, SubjectAssignment } from '../types';
import { CLASSES } from '../constants';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface TeacherManagementProps {
  teachers: Teacher[];
  subjects: Subject[];
  onUpdateTeachers: (teachers: Teacher[]) => void;
}

const PERIODS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const TeacherManagement: React.FC<TeacherManagementProps> = ({ teachers, subjects, onUpdateTeachers }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    gender: 'Male',
    contactNumber: '',
    gmail: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    assignments: [],
    classTeacherOf: undefined,
    profilePicture: undefined
  });

  const [newAssignment, setNewAssignment] = useState<{ classId: StudentClass; subjectId: string; period: string }>({
    classId: 'ECD',
    subjectId: '',
    period: '1st'
  });

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; teacherId: string; teacherName: string }>({
    isOpen: false,
    teacherId: '',
    teacherName: ''
  });

  const stats = useMemo(() => {
    return {
      total: teachers.length,
      male: teachers.filter(t => t.gender === 'Male').length,
      female: teachers.filter(t => t.gender === 'Female').length
    };
  }, [teachers]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEditing && editingTeacher) {
          setEditingTeacher({ ...editingTeacher, profilePicture: base64String });
        } else {
          setFormData({ ...formData, profilePicture: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAssignment = () => {
    if (!newAssignment.subjectId) return;
    const currentAssignments = editingTeacher ? (editingTeacher.assignments || []) : (formData.assignments || []);
    if (currentAssignments.some(a => a.classId === newAssignment.classId && a.subjectId === newAssignment.subjectId)) {
      alert("Subject combo already exists.");
      return;
    }
    const updatedAssignments = [...currentAssignments, { ...newAssignment }];
    if (editingTeacher) setEditingTeacher({ ...editingTeacher, assignments: updatedAssignments });
    else setFormData({ ...formData, assignments: updatedAssignments });
    setNewAssignment({ ...newAssignment, subjectId: '' });
  };

  const handleRemoveAssignment = (index: number) => {
    if (editingTeacher) {
      const updated = (editingTeacher.assignments || []).filter((_, i) => i !== index);
      setEditingTeacher({ ...editingTeacher, assignments: updated });
    } else {
      const updated = (formData.assignments || []).filter((_, i) => i !== index);
      setFormData({ ...formData, assignments: updated });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newTeacher: Teacher = {
      id: crypto.randomUUID(),
      name: formData.name || '',
      gender: formData.gender as Gender || 'Male',
      contactNumber: formData.contactNumber || '',
      gmail: formData.gmail || '',
      address: formData.address || '',
      joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
      assignments: formData.assignments || [],
      classTeacherOf: formData.classTeacherOf,
      profilePicture: formData.profilePicture
    };

    onUpdateTeachers([...teachers, newTeacher]);
    setFormData({ name: '', gender: 'Male', contactNumber: '', gmail: '', address: '', joinDate: new Date().toISOString().split('T')[0], assignments: [], classTeacherOf: undefined, profilePicture: undefined });
    setActiveTab('list');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    onUpdateTeachers(teachers.map(t => t.id === editingTeacher.id ? editingTeacher : t));
    setEditingTeacher(null);
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';

  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.contactNumber.includes(searchQuery));

  return (
    <div className="space-y-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-indigo-500 transition-all">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Faculty</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
           </div>
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male Staff</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.male}</h3>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><UserCircle size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-rose-500 transition-all">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female Staff</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.female}</h3>
           </div>
           <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform"><UserCircle size={24} /></div>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border w-fit no-print">
        <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={16} /> Faculty List</button>
        <button onClick={() => setActiveTab('add')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><UserPlus size={16} /> Recruit Staff</button>
      </div>

      {activeTab === 'add' ? (
        <div className="max-w-4xl bg-white rounded-[2.5rem] shadow-sm border p-8 md:p-12 animate-in slide-in-from-bottom-2">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
               <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
                     {formData.profilePicture ? <img src={formData.profilePicture} className="w-full h-full object-cover" /> : <UserCircle className="text-slate-200" size={80} />}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer">
                     <Camera size={20} /><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                  </label>
               </div>
               <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-lg font-black text-slate-800 uppercase">Recruitment Photo</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase max-w-sm">Please upload a formal identification photograph for the faculty portal.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500" placeholder="e.g. Abdullah Khan" required /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Gender</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700"><option value="Male">Male</option><option value="Female">Female</option></select></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Gmail Address</label><input type="email" value={formData.gmail} onChange={e => setFormData({...formData, gmail: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500" placeholder="staff@gmail.com" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact No</label><input type="text" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500" placeholder="98XXXXXXXX" required /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class Teacher Assignment</label><select value={formData.classTeacherOf || ''} onChange={e => setFormData({...formData, classTeacherOf: e.target.value as StudentClass || undefined})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500"><option value="">-- No Class Assignment --</option>{CLASSES.map(cls => <option key={cls} value={cls}>Grade {cls}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Residential Address</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500" placeholder="City, Ward No" required /></div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Workload (Subject & Period)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Grade</label><select value={newAssignment.classId} onChange={e => setNewAssignment({...newAssignment, classId: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs">{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Subject</label><select value={newAssignment.subjectId} onChange={e => setNewAssignment({...newAssignment, subjectId: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"><option value="">-- Choose --</option>{subjects.filter(s => s.classId === newAssignment.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Period</label><select value={newAssignment.period} onChange={e => setNewAssignment({...newAssignment, period: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs">{PERIODS.map(p => <option key={p} value={p}>{p} Period</option>)}</select></div>
                <button type="button" onClick={handleAddAssignment} className="h-11 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-lg">Assign Load</button>
              </div>
              <div className="flex flex-wrap gap-2">
                 {(formData.assignments || []).map((a, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm">
                       Class {a.classId} • {getSubjectName(a.subjectId)} • {a.period} <button type="button" onClick={() => handleRemoveAssignment(i)} className="text-rose-500"><X size={14}/></button>
                    </span>
                 ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-14 py-5 bg-indigo-700 text-white font-black rounded-2xl hover:bg-indigo-800 shadow-2xl active:scale-95 transition-all flex items-center gap-4 uppercase text-xs tracking-widest"><UserPlus size={20} /> Finalize Recruitment</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-6 border-b flex items-center justify-between no-print">
              <div className="relative w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input type="text" placeholder="Find professor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" />
              </div>
           </div>
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                 <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty Profile</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Assignments</th>
                    <th className="px-8 py-5 text-right no-print">Manage</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredTeachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-white flex items-center justify-center shrink-0">
                                {t.profilePicture ? <img src={t.profilePicture} className="w-full h-full object-cover" /> : <UserCircle className="text-slate-200" size={32} />}
                             </div>
                             <div>
                                <h5 className="font-black text-slate-800 uppercase text-sm">{t.name}</h5>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 flex flex-wrap items-center gap-x-3">
                                   <span className="flex items-center gap-1"><Phone size={10} className="text-indigo-400"/> {t.contactNumber}</span>
                                   {t.gmail && <span className="flex items-center gap-1 lowercase"><Mail size={10} className="text-indigo-400"/> {t.gmail}</span>}
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                             {t.classTeacherOf ? (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-black uppercase w-fit">Class Teacher: Grade {t.classTeacherOf}</span>
                             ) : (
                                <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-[9px] font-black uppercase w-fit">Subject Specialist</span>
                             )}
                             <div className="flex flex-wrap gap-1">
                                {(t.assignments || []).slice(0, 2).map((a, i) => (
                                   <span key={i} className="text-[8px] font-bold text-slate-400 uppercase bg-white border border-slate-100 px-1.5 py-0.5 rounded-md">Grade {a.classId} • {getSubjectName(a.subjectId)}</span>
                                ))}
                                {(t.assignments?.length || 0) > 2 && <span className="text-[8px] font-black text-indigo-400 uppercase">+{t.assignments!.length - 2} more</span>}
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right no-print space-x-2">
                          <button onClick={() => setEditingTeacher(t)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all"><Edit size={18} /></button>
                          <button onClick={() => setDeleteModal({isOpen: true, teacherId: t.id, teacherName: t.name})} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-white rounded-2xl transition-all"><Trash2 size={18} /></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {editingTeacher && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in zoom-in-95">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-indigo-100">
              <div className="px-10 py-6 border-b bg-indigo-50/50 flex items-center justify-between">
                 <h3 className="text-xl font-black uppercase text-indigo-900 tracking-tight">Modify Professor Identity</h3>
                 <button onClick={() => setEditingTeacher(null)}><X size={28}/></button>
              </div>
              <form onSubmit={handleUpdate} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <div className="flex items-center gap-6">
                    <div className="relative">
                       <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-50 flex items-center justify-center">
                          {editingTeacher.profilePicture ? <img src={editingTeacher.profilePicture} className="w-full h-full object-cover" /> : <UserCircle className="text-slate-200" size={48} />}
                       </div>
                       <label className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer">
                          <Camera size={16} /><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                       </label>
                    </div>
                    <div className="space-y-1">
                       <h5 className="font-black text-slate-800 uppercase text-lg">{editingTeacher.name}</h5>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professor / Senior Staff Member</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Legal Name</label><input type="text" value={editingTeacher.name} onChange={e => setEditingTeacher({...editingTeacher, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gender</label><select value={editingTeacher.gender} onChange={e => setEditingTeacher({...editingTeacher, gender: e.target.value as Gender})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gmail Address</label><input type="email" value={editingTeacher.gmail || ''} onChange={e => setEditingTeacher({...editingTeacher, gmail: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contact No</label><input type="text" value={editingTeacher.contactNumber} onChange={e => setEditingTeacher({...editingTeacher, contactNumber: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Join Date</label><input type="date" value={editingTeacher.joinDate} onChange={e => setEditingTeacher({...editingTeacher, joinDate: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Class Teacher Assignment</label><select value={editingTeacher.classTeacherOf || ''} onChange={e => setEditingTeacher({...editingTeacher, classTeacherOf: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"><option value="">None</option>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Residential Address</label><input type="text" value={editingTeacher.address} onChange={e => setEditingTeacher({...editingTeacher, address: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" /></div>
                 </div>

                 <div className="space-y-4 pt-6 border-t">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Update Load Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Grade</label><select value={newAssignment.classId} onChange={e => setNewAssignment({...newAssignment, classId: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs">{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Subject</label><select value={newAssignment.subjectId} onChange={e => setNewAssignment({...newAssignment, subjectId: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"><option value="">-- Choose --</option>{subjects.filter(s => s.classId === newAssignment.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Period</label><select value={newAssignment.period} onChange={e => setNewAssignment({...newAssignment, period: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs">{PERIODS.map(p => <option key={p} value={p}>{p} Period</option>)}</select></div>
                      <button type="button" onClick={handleAddAssignment} className="h-11 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-lg">Modify Load</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {(editingTeacher.assignments || []).map((a, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm">
                             Class {a.classId} • {getSubjectName(a.subjectId)} • {a.period} <button type="button" onClick={() => handleRemoveAssignment(i)} className="text-rose-500"><X size={14}/></button>
                          </span>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6 flex justify-end gap-3 border-t">
                    <button type="button" onClick={() => setEditingTeacher(null)} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    <button type="submit" className="px-10 py-4 bg-indigo-700 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Apply Records Overwrite</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={() => { onUpdateTeachers(teachers.filter(t => t.id !== deleteModal.teacherId)); setDeleteModal({ ...deleteModal, isOpen: false }); }} title="Faculty Termination" itemName={deleteModal.teacherName} />
    </div>
  );
};

export default TeacherManagement;
