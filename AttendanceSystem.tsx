
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CalendarCheck, 
  UserCheck, 
  BarChart3, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Printer, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users,
  GraduationCap,
  Loader2,
  FileSpreadsheet,
  Lock,
  Settings2,
  DollarSign,
  Eye,
  EyeOff,
  Check,
  CheckSquare,
  Square,
  Calendar,
  Info
} from 'lucide-react';
import { Student, AttendanceRecord, StudentClass, User, NepaliMonth, Teacher, SchoolSettings } from '../types';
import { CLASSES, NEPALI_MONTHS } from '../constants';
import { storage } from '../utils/storage';

interface AttendanceSystemProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  currentUser: User;
  teachers: Teacher[];
  schoolSettings: SchoolSettings;
  onUpdateStudents: (students: Student[]) => void;
}

const DAYS_IN_MONTH = Array.from({ length: 32 }, (_, i) => i + 1);
const YEARS_BS = Array.from({ length: 11 }, (_, i) => (2080 + i).toString());

const AttendanceSystem: React.FC<AttendanceSystemProps> = ({ 
  students, 
  attendanceRecords, 
  onUpdateAttendance, 
  currentUser,
  teachers,
  schoolSettings,
  onUpdateStudents
}) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'reports' | 'allowance'>('entry');
  const [selectedClass, setSelectedClass] = useState<StudentClass>('ECD');
  const [selectedMonth, setSelectedMonth] = useState<NepaliMonth>(NEPALI_MONTHS[0]);
  const [selectedMonths, setSelectedMonths] = useState<NepaliMonth[]>([NEPALI_MONTHS[0]]);
  const [selectedYear, setSelectedYear] = useState<string>(storage.getSelectedYear() || '2081');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'admin';
  const isStudent = currentUser.role === 'student';
  const isAttendanceDisallowed = isStudent && !schoolSettings.allowStudentAttendance;

  // Force student to reports tab if attendance access is disallowed
  useEffect(() => {
    if (isAttendanceDisallowed) {
      setActiveTab('reports');
    }
  }, [isAttendanceDisallowed]);
  
  const classStudents = useMemo(() => {
    const filtered = students.filter(s => s.currentClass === selectedClass);
    if (isAttendanceDisallowed) {
      return filtered.filter(s => s.id === currentUser.relatedId);
    }
    return filtered;
  }, [students, selectedClass, isAttendanceDisallowed, currentUser.relatedId]);

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    const existingIdx = attendanceRecords.findIndex(r => 
      r.studentId === studentId && 
      r.classId === selectedClass && 
      r.year === selectedYear && 
      r.month === selectedMonth && 
      r.day === selectedDay
    );

    const newRecords = [...attendanceRecords];
    if (existingIdx > -1) {
      newRecords[existingIdx] = { ...newRecords[existingIdx], status };
    } else {
      newRecords.push({
        id: crypto.randomUUID(),
        studentId,
        classId: selectedClass,
        year: selectedYear,
        month: selectedMonth,
        day: selectedDay,
        status
      });
    }
    onUpdateAttendance(newRecords);
  };

  const toggleMonthSelection = (m: NepaliMonth) => {
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter(month => month !== m));
      }
    } else {
      setSelectedMonths([...selectedMonths, m].sort((a, b) => NEPALI_MONTHS.indexOf(a) - NEPALI_MONTHS.indexOf(b)));
    }
  };

  // Bulk fill allowance for all students in the current class when one is updated
  const handleUpdateAllowanceBulk = (amount: number) => {
    const updated = students.map(s => {
      if (s.currentClass === selectedClass) {
        return { ...s, dailyAllowance: amount };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  const allowanceLedgerData = useMemo(() => {
    return classStudents.map(s => {
      const recordsForMonths = attendanceRecords.filter(r => 
        r.studentId === s.id && 
        selectedMonths.includes(r.month) && 
        r.year === selectedYear &&
        r.status === 'Present'
      );
      
      const totalPresent = recordsForMonths.length;
      const rate = s.dailyAllowance || 0;
      const totalPayable = totalPresent * rate;

      return {
        ...s,
        totalPresent,
        totalPayable
      };
    });
  }, [classStudents, attendanceRecords, selectedMonths, selectedYear]);

  const grandTotalAllowance = allowanceLedgerData.reduce((sum, item) => sum + item.totalPayable, 0);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const opt = {
      margin: 10,
      filename: `Madarsa_Attendance_Ledger_${selectedClass}_${selectedYear}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      // @ts-ignore
      await window.html2pdf().from(reportRef.current).set(opt).save();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getDayStatus = (studentId: string, day: number) => {
    return attendanceRecords.find(r => 
      r.studentId === studentId && 
      r.year === selectedYear && 
      r.month === selectedMonth && 
      r.day === day
    )?.status;
  };

  const getMonthStats = (studentId: string) => {
    const records = attendanceRecords.filter(r => 
      r.studentId === studentId && 
      r.year === selectedYear && 
      r.month === selectedMonth
    );
    return {
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      leave: records.filter(r => r.status === 'Leave').length,
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!isAttendanceDisallowed && (
        <div className="flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border w-full sm:w-fit no-print gap-1">
          <button onClick={() => setActiveTab('entry')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'entry' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarCheck size={16} /> Mark Attendance</button>
          <button onClick={() => setActiveTab('reports')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><BarChart3 size={16} /> Monthly Reports</button>
          <button onClick={() => setActiveTab('allowance')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'allowance' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><DollarSign size={16} /> Allowance Ledger</button>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 no-print">
         <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full lg:w-auto">
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Grade</label><select value={selectedClass} onChange={e => setSelectedClass(e.target.value as any)} className="block w-full lg:w-40 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs outline-none focus:border-indigo-500">{CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}</select></div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Year</label><select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="block w-full lg:w-32 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs outline-none focus:border-indigo-500">{YEARS_BS.map(y => <option key={y} value={y}>{y} BS</option>)}</select></div>
               
               {activeTab !== 'allowance' ? (
                  <div className="space-y-1.5 animate-in fade-in duration-200"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Month</label><select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value as any)} className="block w-full lg:w-40 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs outline-none focus:border-indigo-500">{NEPALI_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
               ) : null}
            </div>
            
            {activeTab === 'allowance' && (
               <div className="flex-1 space-y-1.5 animate-in slide-in-from-left-4 duration-300 w-full">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Multi-Month Range for Allowance Calculation</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-2xl border-2 border-slate-100">
                     {NEPALI_MONTHS.map(m => (
                        <button key={m} onClick={() => toggleMonthSelection(m)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border transition-all ${selectedMonths.includes(m) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}>{m.substring(0,3)}</button>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>
      
      {activeTab === 'entry' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
           <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-inner"><CalendarCheck size={28}/></div>
                 <div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Daily Roll Call</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry for Day {selectedDay} of {selectedMonth}</p></div>
              </div>
              <div className="flex items-center gap-4">
                 <label className="text-xs font-black uppercase text-slate-500">Pick Day:</label>
                 <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))} className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl font-black text-sm outline-none focus:border-indigo-500">{DAYS_IN_MONTH.map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>
           </div>
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-6 md:px-10 py-5">Roll</th>
                  <th className="px-6 md:px-10 py-5">Student Identity</th>
                  <th className="px-6 md:px-10 py-5 text-center">Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classStudents.map(s => {
                  const record = attendanceRecords.find(r => r.studentId === s.id && r.classId === selectedClass && r.year === selectedYear && r.month === selectedMonth && r.day === selectedDay);
                  return (
                    <tr key={s.id} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="px-6 md:px-10 py-6 font-black text-indigo-700 font-mono text-base">#{s.rollNumber}</td>
                      <td className="px-6 md:px-10 py-6">
                        <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Parent: {s.fatherName}</div>
                      </td>
                      <td className="px-6 md:px-10 py-6">
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                          <button onClick={() => handleStatusChange(s.id, 'Present')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${record?.status === 'Present' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-50' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-emerald-200'}`}>Present</button>
                          <button onClick={() => handleStatusChange(s.id, 'Absent')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${record?.status === 'Absent' ? 'bg-rose-600 text-white shadow-xl shadow-rose-500/30 ring-4 ring-rose-50' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-rose-200'}`}>Absent</button>
                          <button onClick={() => handleStatusChange(s.id, 'Leave')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${record?.status === 'Leave' ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/30 ring-4 ring-amber-50' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-amber-200'}`}>Leave</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
           <div className="p-8 border-b bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20"><BarChart3 size={28}/></div>
                 <div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Monthly Attendance Grid</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedMonth} {selectedYear} • Summary for Class {selectedClass}</p></div>
              </div>
           </div>
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-900 text-white">
                    <tr>
                       <th className="px-4 py-4 text-[9px] font-black uppercase sticky left-0 bg-slate-900 z-10 border-r border-slate-800">Student (Roll)</th>
                       {DAYS_IN_MONTH.map(d => <th key={d} className="px-2 py-4 text-[9px] font-black text-center min-w-[30px] border-r border-slate-800">{d}</th>)}
                       <th className="px-4 py-4 text-[9px] font-black text-center bg-emerald-700">P</th>
                       <th className="px-4 py-4 text-[9px] font-black text-center bg-rose-700">A</th>
                       <th className="px-4 py-4 text-[9px] font-black text-center bg-amber-700">L</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {classStudents.map(s => {
                       const stats = getMonthStats(s.id);
                       return (
                          <tr key={s.id} className="hover:bg-indigo-50/20 group">
                             <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-indigo-50 transition-all z-10 border-r border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[120px]">{s.name}</p>
                                <p className="text-[8px] font-bold text-indigo-500 uppercase">Roll: {s.rollNumber}</p>
                             </td>
                             {DAYS_IN_MONTH.map(d => {
                                const status = getDayStatus(s.id, d);
                                return (
                                   <td key={d} className="p-1 border-r border-slate-50 text-center">
                                      {status === 'Present' && <div className="w-4 h-4 rounded-full bg-emerald-500 mx-auto" title="Present" />}
                                      {status === 'Absent' && <div className="w-4 h-4 rounded-full bg-rose-500 mx-auto" title="Absent" />}
                                      {status === 'Leave' && <div className="w-4 h-4 rounded-full bg-amber-500 mx-auto" title="Leave" />}
                                      {!status && <div className="w-1 h-1 rounded-full bg-slate-200 mx-auto" />}
                                   </td>
                                );
                             })}
                             <td className="px-4 py-3 text-center font-black text-[10px] text-emerald-700 bg-emerald-50/30">{stats.present}</td>
                             <td className="px-4 py-3 text-center font-black text-[10px] text-rose-700 bg-rose-50/30">{stats.absent}</td>
                             <td className="px-4 py-3 text-center font-black text-[10px] text-amber-700 bg-amber-50/30">{stats.leave}</td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
           <div className="p-6 bg-slate-50 border-t flex flex-wrap items-center gap-4 md:gap-8 no-print">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase text-slate-400">Present</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-[9px] font-black uppercase text-slate-400">Absent</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-[9px] font-black uppercase text-slate-400">On Leave</span></div>
           </div>
        </div>
      )}

      {activeTab === 'allowance' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6">
          <div className="bg-white p-6 rounded-[2rem] border border-indigo-100 bg-indigo-50/30 flex items-start gap-4 no-print">
             <Info className="text-indigo-600 mt-1 shrink-0" size={20} />
             <div className="space-y-1">
                <p className="text-xs font-black text-indigo-900 uppercase">Automated Billing Logic</p>
                <p className="text-[10px] text-indigo-700 font-bold uppercase opacity-80">Typing a daily allowance amount into any student's field will automatically standardize and fill that amount for all students in this grade.</p>
             </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-8 border-b bg-indigo-50/50 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><DollarSign size={24}/></div>
                   <div>
                      <h4 className="text-xl font-black text-indigo-900 uppercase">Institutional Allowance Ledger</h4>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Calculated for: {selectedMonths.join(' + ')}</p>
                   </div>
                </div>
                <button onClick={handleDownloadPDF} disabled={isDownloading} className="w-full md:w-auto px-8 py-3.5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                   {isDownloading ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} Generate Auditor PDF
                </button>
             </div>
             
             <div className="overflow-x-auto p-4 md:p-12 bg-slate-100/50">
                <div ref={reportRef} className="bg-white p-6 md:p-12 min-h-[297mm] shadow-2xl mx-auto border border-slate-200 w-full md:w-[277mm] overflow-x-auto">
                   <div className="text-center mb-10 border-b-8 border-double border-slate-900 pb-8">
                      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2">{schoolSettings.name}</h1>
                      <p className="text-sm md:text-xl font-bold text-slate-500 uppercase tracking-widest">{schoolSettings.address}</p>
                      <div className="mt-10 border-4 border-slate-900 inline-block px-6 md:px-12 py-3 bg-slate-900 text-white">
                         <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em]">Student Attendance & Allowance Ledger</h2>
                      </div>
                      <p className="text-[10px] md:text-sm font-black uppercase text-slate-400 mt-6 tracking-widest">Grade: {selectedClass} • Session: {selectedYear} BS • Months: {selectedMonths.join(', ')}</p>
                   </div>

                   <div className="overflow-x-auto">
                      <table className="w-full border-collapse border-2 border-black text-[9pt] min-w-[800px]">
                         <thead>
                            <tr className="bg-slate-100">
                               <th className="border-2 border-black p-3 w-16 text-center">S.N.</th>
                               <th className="border-2 border-black p-3 w-16 text-center">Roll</th>
                               <th className="border-2 border-black p-3 text-left">Student Information</th>
                               {selectedMonths.map(m => <th key={m} className="border-2 border-black p-3 w-20 text-center uppercase font-black">{m.substring(0,3)}</th>)}
                               <th className="border-2 border-black p-3 w-28 text-center bg-indigo-50 font-black">Total P</th>
                               <th className="border-2 border-black p-3 w-32 text-center bg-amber-50 font-black">Allowance/Day</th>
                               <th className="border-2 border-black p-3 w-36 text-right font-black bg-emerald-50">Total NPR</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-black">
                            {allowanceLedgerData.map((s, idx) => (
                               <tr key={s.id}>
                                  <td className="border-2 border-black p-3 text-center">{idx + 1}</td>
                                  <td className="border-2 border-black p-3 text-center font-black">{s.rollNumber}</td>
                                  <td className="border-2 border-black p-3">
                                     <p className="font-black uppercase text-sm">{s.name}</p>
                                     <p className="text-[8pt] text-slate-500 font-bold">F: {s.fatherName}</p>
                                  </td>
                                  {selectedMonths.map(m => {
                                     const count = attendanceRecords.filter(r => r.studentId === s.id && r.month === m && r.year === selectedYear && r.status === 'Present').length;
                                     return <td key={m} className="border-2 border-black p-3 text-center font-bold">{count}</td>;
                                  })}
                                  <td className="border-2 border-black p-3 text-center font-black bg-indigo-50 text-indigo-700">{s.totalPresent}</td>
                                  <td className="border-2 border-black p-3 text-center bg-amber-50">
                                     <input 
                                       type="number" 
                                       value={s.dailyAllowance || ''} 
                                       onChange={(e) => handleUpdateAllowanceBulk(Number(e.target.value))}
                                       className="w-full bg-transparent text-center font-black border-none outline-none"
                                       placeholder="0"
                                     />
                                  </td>
                                  <td className="border-2 border-black p-3 text-right font-black bg-emerald-50 text-emerald-900">NPR {s.totalPayable.toLocaleString()}</td>
                               </tr>
                            ))}
                         </tbody>
                         <tfoot>
                            <tr className="bg-slate-900 text-white font-black">
                               <td colSpan={selectedMonths.length + 4} className="border-2 border-black p-4 text-right uppercase tracking-widest">Aggregate Grand Total:</td>
                               <td className="border-2 border-black p-4 text-right text-xl">NPR {grandTotalAllowance.toLocaleString()}</td>
                            </tr>
                         </tfoot>
                      </table>
                   </div>
                   <div className="mt-24 flex flex-col md:flex-row justify-between px-6 md:px-16 gap-12">
                      <div className="text-center w-full md:w-64 border-t-2 border-black pt-3 font-black uppercase text-[10pt] tracking-widest">Class Teacher</div>
                      <div className="text-center w-full md:w-64 border-t-2 border-black pt-3 font-black uppercase text-[10pt] tracking-widest">Principal</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSystem;
