
import React, { useState, useMemo, useRef } from 'react';
import { Search, Printer, Download, Filter, Trash2, Edit, X, Save, Users, UserCircle, Bus, Loader2, Eye, MapPin, Phone, Calendar, Mail, GraduationCap, FileSpreadsheet, ReceiptText, Hash, UserCheck, Check, Camera, Upload, PlusCircle, CreditCard, Car, Home } from 'lucide-react';
import { Student, StudentClass, MarkRecord, Gender, TransportMode, DateType, User, SchoolSettings } from '../types';
import { CLASSES, TRANSPORT_MODES } from '../constants';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { storage } from '../utils/storage';

interface StudentDirectoryProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  marks: MarkRecord[];
  onUpdateMarks: (marks: MarkRecord[]) => void;
  currentUser: User;
  onSelectForBilling?: (studentId: string) => void;
  schoolSettings: SchoolSettings;
}

const StudentDirectory: React.FC<StudentDirectoryProps> = ({ 
  students, 
  onUpdateStudents,
  marks,
  onUpdateMarks,
  currentUser,
  onSelectForBilling,
  schoolSettings
}) => {
  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>('All');
  const [selectedTransportFilter, setSelectedTransportFilter] = useState<TransportMode | 'All'>('All');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<Gender | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfCaptureRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'admin';
  const isSelf = (id: string) => currentUser.role === 'student' && currentUser.relatedId === id;
  const canBill = isAdmin || (currentUser.role === 'teacher' && schoolSettings.allowTeacherBilling);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; studentId: string; studentName: string }>({
    isOpen: false,
    studentId: '',
    studentName: ''
  });

  const filteredStudents = useMemo(() => {
    return students
      .filter(student => {
        const matchesClass = selectedClass === 'All' || student.currentClass === selectedClass;
        const matchesGender = selectedGenderFilter === 'All' || student.gender === selectedGenderFilter;
        const matchesTransport = selectedTransportFilter === 'All' || student.transportMode === selectedTransportFilter;
        
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          student.name.toLowerCase().includes(q) || 
          student.fatherName.toLowerCase().includes(q) ||
          student.rollNumber.toLowerCase().includes(q) ||
          (isAdmin && student.contactNumber.includes(q)); 

        return matchesClass && matchesGender && matchesTransport && matchesSearch;
      })
      .sort((a, b) => {
        if (a.currentClass !== b.currentClass) {
          return a.currentClass.localeCompare(b.currentClass);
        }
        return a.name.localeCompare(b.name);
      });
  }, [students, selectedClass, selectedGenderFilter, selectedTransportFilter, searchQuery, isAdmin]);

  const stats = useMemo(() => {
    return {
      total: filteredStudents.length,
      male: filteredStudents.filter(s => s.gender === 'Male').length,
      female: filteredStudents.filter(s => s.gender === 'Female').length
    };
  }, [filteredStudents]);

  const maskPhone = (phone: string) => {
    if (!phone) return 'N/A';
    if (isAdmin || currentUser.role === 'teacher') return phone;
    return '*******' + phone.slice(-3);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEditing && editingStudent) {
          setEditingStudent({ ...editingStudent, profilePicture: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = () => {
    const headers = ['S.N.', 'Roll No', 'Full Name', 'Gender', 'Father Name', 'Mother Name', 'Address', 'Contact Number', 'Class', 'Transport Mode', 'Date of Birth', 'Email'];
    const rows = filteredStudents.map((s, idx) => [
      `"${idx + 1}"`,
      `"${s.rollNumber}"`,
      `"${s.name}"`,
      `"${s.gender}"`,
      `"${s.fatherName}"`,
      `"${s.motherName || ''}"`,
      `"${s.address}"`,
      `"${isAdmin ? s.contactNumber : 'PROTECTED'}"`,
      `"${s.currentClass}"`,
      `"${s.transportMode}"`,
      `"${s.dob || ''} ${s.dobType || ''}"`,
      `"${s.gmail || ''}"`
    ]);
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Students_Directory_${selectedClass}.csv`;
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!pdfCaptureRef.current) return;
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const element = pdfCaptureRef.current;
    const fileName = `Student_Directory_Class_${selectedClass}.pdf`;
    
    const opt = {
      margin: [5, 5, 5, 5],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false, letterRendering: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      // @ts-ignore
      await window.html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const openDeleteModal = (student: Student) => {
    setDeleteModal({ isOpen: true, studentId: student.id, studentName: student.name });
  };

  const confirmDelete = () => {
    onUpdateStudents(students.filter(s => s.id !== deleteModal.studentId));
    onUpdateMarks(marks.filter(m => m.studentId !== deleteModal.studentId));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    onUpdateStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditingStudent(null);
  };

  const handleCreateVoucher = (id: string) => {
    if (onSelectForBilling) {
      onSelectForBilling(id);
      setViewingStudent(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Summary Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 no-print">
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-indigo-500 transition-all">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Students</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">{stats.total}</h3>
           </div>
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Users size={20} className="md:w-6 md:h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Boys (Male)</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">{stats.male}</h3>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><UserCircle size={20} className="md:w-6 md:h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group hover:border-rose-500 transition-all">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Girls (Female)</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">{stats.female}</h3>
           </div>
           <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform"><UserCircle size={20} className="md:w-6 md:h-6" /></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={isAdmin ? "Search Name, Father, Roll..." : "Search Name..."} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded-xl outline-none w-full font-bold text-sm focus:border-indigo-500 transition-all" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-black text-slate-700 text-sm focus:border-indigo-500">
              <option value="All">All Classes</option>
              {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Commute Mode</label>
            <select value={selectedTransportFilter} onChange={(e) => setSelectedTransportFilter(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-black text-slate-700 text-sm focus:border-indigo-500">
              <option value="All">All Modes</option>
              {TRANSPORT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Sex</label>
            <select value={selectedGenderFilter} onChange={(e) => setSelectedGenderFilter(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-black text-slate-700 text-sm focus:border-indigo-500">
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/10">
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF Report
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10">
            <FileSpreadsheet size={16} /> Excel Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-16">S.N.</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Roll</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student & Guardian Information</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commute</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((s, index) => (
                <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-8 py-6 text-sm font-bold text-slate-400">{index + 1}</td>
                  <td className="px-8 py-6">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-50 bg-slate-100 flex items-center justify-center">
                      {s.profilePicture ? (
                        <img src={s.profilePicture} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="text-slate-300" size={32} />
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-indigo-700 font-mono">{s.rollNumber}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <div className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                         {s.name}
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${s.gender === 'Female' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                           {s.gender}
                         </span>
                       </div>
                       <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                          <span className="text-indigo-400">Father:</span> {s.fatherName}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                       <span className="px-3 py-1 text-[9px] font-black rounded-lg bg-indigo-50 text-indigo-700 uppercase border border-indigo-100">Class {s.currentClass}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit">
                        {s.transportMode === 'School Bus' && <Bus size={12} className="text-indigo-600" />}
                        {s.transportMode === 'Hostel' && <Home size={12} className="text-amber-600" />}
                        {s.transportMode === 'Private Vehicle' && <Car size={12} className="text-blue-600" />}
                        {s.transportMode === 'On Foot' && <Users size={12} className="text-emerald-600" />}
                        {s.transportMode}
                     </div>
                  </td>
                  <td className="px-8 py-6 text-right space-x-1">
                    <button onClick={() => setViewingStudent(s)} title="View Detailed Profile" className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-lg active:scale-90"><Eye size={18} /></button>
                    {canBill && (
                      <button onClick={() => handleCreateVoucher(s.id)} title="Quick Billing / Invoice" className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-lg active:scale-90"><ReceiptText size={18} /></button>
                    )}
                    {(isAdmin || isSelf(s.id)) && (
                      <button onClick={() => setEditingStudent(s)} title="Modify Student Record" className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-lg active:scale-90"><Edit size={18} /></button>
                    )}
                    {isAdmin && (
                      <button onClick={() => openDeleteModal(s)} title="Remove Profile Permanently" className="p-2.5 text-slate-400 hover:text-rose-50 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-lg active:scale-90"><Trash2 size={18} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Viewing & Editing Modals */}
      {viewingStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-indigo-100">
            <div className="px-8 py-6 border-b bg-indigo-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20"><UserCircle size={24} /></div>
                 <h3 className="text-xl font-black uppercase text-indigo-900 tracking-tight">Student Profile Information</h3>
              </div>
              <button onClick={() => setViewingStudent(null)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition-colors">
                <X size={28} />
              </button>
            </div>
            <div className="p-10">
               <div className="flex flex-col md:flex-row gap-10 items-start mb-10 border-b border-slate-100 pb-10">
                  <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center shrink-0">
                     {viewingStudent.profilePicture ? (
                       <img src={viewingStudent.profilePicture} alt={viewingStudent.name} className="w-full h-full object-cover" />
                     ) : (
                       <UserCircle className="text-slate-300" size={64} />
                     )}
                  </div>
                  <div className="space-y-4 flex-1">
                     <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Full Legal Identity</p>
                        <h4 className="text-3xl font-black text-slate-800 uppercase leading-none">{viewingStudent.name}</h4>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Class {viewingStudent.currentClass}</span>
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest">Roll #{viewingStudent.rollNumber}</span>
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest">{viewingStudent.gender}</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Father's Name</p>
                     <p className="text-base font-bold text-slate-700 uppercase">{viewingStudent.fatherName}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mother's Name</p>
                     <p className="text-base font-bold text-slate-700 uppercase">{viewingStudent.motherName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Number</p>
                     <div className="flex items-center gap-2 text-base font-bold text-slate-700"><Phone size={16} className="text-indigo-500" /> {maskPhone(viewingStudent.contactNumber)}</div>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transport Mode</p>
                     <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><Bus size={16} className="text-indigo-500" /> {viewingStudent.transportMode}</div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residential Address</p>
                     <div className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase"><MapPin size={16} className="text-indigo-500" /> {viewingStudent.address}</div>
                  </div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex flex-col md:flex-row gap-4 justify-between items-center">
               <button onClick={() => setViewingStudent(null)} className="w-full md:w-auto px-10 py-3.5 bg-white border-2 border-slate-200 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-100 hover:text-slate-600 transition-all">Dismiss Profile</button>
               {canBill && (
                 <button 
                   onClick={() => handleCreateVoucher(viewingStudent.id)}
                   className="w-full md:w-auto px-12 py-3.5 bg-indigo-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-700/30 flex items-center justify-center gap-3 hover:bg-indigo-800 hover:scale-[1.02] transition-all active:scale-95"
                 >
                   <CreditCard size={18} /> Generate Fee Invoice
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 border border-emerald-100">
            <div className="px-8 py-6 border-b bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20"><Edit size={24} /></div>
                 <h3 className="text-xl font-black uppercase text-emerald-900 tracking-tight">Modify Student Record</h3>
              </div>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-emerald-100 rounded-full text-emerald-700 transition-colors">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="mb-10 flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                 <div className="relative group shrink-0">
                    <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
                       {editingStudent.profilePicture ? (
                         <img src={editingStudent.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         <UserCircle className="text-slate-200" size={64} />
                       )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-all">
                       <Camera size={18} />
                       <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                    </label>
                 </div>
                 <div className="space-y-1">
                    <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">Identity Authentication</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Upload a clear passport-sized photograph for institutional identification cards.</p>
                    <button type="button" onClick={() => setEditingStudent({...editingStudent, profilePicture: undefined})} className="text-[9px] font-black text-rose-500 uppercase mt-2 hover:underline">Remove Current Picture</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Roll Number</label>
                  <input type="text" value={editingStudent.rollNumber} onChange={e => setEditingStudent({...editingStudent, rollNumber: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                  <select value={editingStudent.gender} onChange={e => setEditingStudent({...editingStudent, gender: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother's Name</label>
                  <input type="text" value={editingStudent.motherName || ''} onChange={e => setEditingStudent({...editingStudent, motherName: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gmail Address</label>
                  <input type="email" value={editingStudent.gmail || ''} onChange={e => setEditingStudent({...editingStudent, gmail: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                  <div className="flex gap-2">
                    <input type="text" value={editingStudent.dob || ''} onChange={e => setEditingStudent({...editingStudent, dob: e.target.value})} placeholder="YYYY-MM-DD" className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                    <select value={editingStudent.dobType || 'AD'} onChange={e => setEditingStudent({...editingStudent, dobType: e.target.value as any})} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800">
                      <option value="AD">AD</option>
                      <option value="BS">BS</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission Date</label>
                  <input type="date" value={editingStudent.admissionDate} onChange={e => setEditingStudent({...editingStudent, admissionDate: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Class</label>
                  <select value={editingStudent.currentClass} onChange={e => setEditingStudent({...editingStudent, currentClass: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800">
                    {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Allowance (NPR)</label>
                  <input type="number" value={editingStudent.dailyAllowance || ''} onChange={e => setEditingStudent({...editingStudent, dailyAllowance: Number(e.target.value)})} placeholder="0.00" className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl font-black text-indigo-700 outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Father's Name</label>
                  <input type="text" value={editingStudent.fatherName} onChange={e => setEditingStudent({...editingStudent, fatherName: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                  <input type="text" value={editingStudent.contactNumber} onChange={e => setEditingStudent({...editingStudent, contactNumber: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode of Transport</label>
                  <select value={editingStudent.transportMode} onChange={e => setEditingStudent({...editingStudent, transportMode: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800">
                    {TRANSPORT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                  <input type="text" value={editingStudent.address} onChange={e => setEditingStudent({...editingStudent, address: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" />
                </div>
              </div>
              
              <div className="mt-12 flex justify-end gap-4 border-t pt-8">
                 <button type="button" onClick={() => setEditingStudent(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">Discard Changes</button>
                 <button type="submit" className="px-12 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"><Save size={16} /> Save Record Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pdf-capture-container" ref={pdfCaptureRef}>
        <div className="pdf-page" style={{ padding: '10mm' }}>
           <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '3px solid #000', paddingBottom: '4mm' }}>
              <h1 style={{ fontSize: '22pt', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{schoolSettings.name}</h1>
              <p style={{ fontSize: '9pt', fontWeight: 700, margin: '1mm 0' }}>{schoolSettings.address}</p>
              <div style={{ marginTop: '2mm', display: 'inline-block', background: '#000', color: '#fff', padding: '1mm 6mm' }}>
                <h2 style={{ fontSize: '11pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1pt', margin: 0 }}>Official Student Directory</h2>
              </div>
              <p style={{ marginTop: '2mm', fontSize: '9pt', fontWeight: 800 }}>CLASS: {selectedClass} • TOTAL STUDENTS: {filteredStudents.length} • AUDIT DATE: {new Date().toLocaleDateString()}</p>
           </div>
           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
              <thead>
                 <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>S.N.</th>
                    <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>ROLL</th>
                    <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'left' }}>STUDENT NAME</th>
                    <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'left' }}>FATHER'S NAME</th>
                    <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>GENDER</th>
                    <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'left' }}>ADDRESS</th>
                    <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>CONTACT</th>
                 </tr>
              </thead>
              <tbody>
                 {filteredStudents.map((s, i) => (
                    <tr key={s.id} style={{ pageBreakInside: 'avoid' }}>
                       <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center' }}>{i + 1}</td>
                       <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center', fontWeight: 700 }}>{s.rollNumber}</td>
                       <td style={{ border: '1px solid #000', padding: '1.5mm', fontWeight: 800, textTransform: 'uppercase' }}>{s.name}</td>
                       <td style={{ border: '1px solid #000', padding: '1.5mm', textTransform: 'uppercase' }}>{s.fatherName}</td>
                       <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center' }}>{s.gender}</td>
                       <td style={{ border: '1px solid #000', padding: '1.5mm', textTransform: 'uppercase' }}>{s.address}</td>
                       <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center' }}>{s.contactNumber}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
           <div style={{ marginTop: '15mm', display: 'flex', justifyContent: 'space-between', fontSize: '9pt', fontWeight: 800, textTransform: 'uppercase' }}>
              <div style={{ width: '50mm', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '1mm' }}>Class Teacher</div>
              <div style={{ width: '50mm', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '1mm' }}>Principal Seal</div>
           </div>
        </div>
      </div>

      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={confirmDelete} title="Delete Student Profile" itemName={deleteModal.studentName} />
    </div>
  );
};

export default StudentDirectory;
