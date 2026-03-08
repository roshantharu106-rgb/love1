
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  CheckSquare, 
  Square, 
  RefreshCcw, 
  Users, 
  CheckCircle2, 
  X, 
  Search,
  ArrowRight,
  Zap,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Check
} from 'lucide-react';
import { Student, StudentClass } from '../types';
import { CLASSES } from '../constants';

interface StudentTransferProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
}

const StudentTransfer: React.FC<StudentTransferProps> = ({ students, onUpdateStudents }) => {
  const [activeTab, setActiveTab] = useState<'bulk' | 'selection'>('selection');
  const [sourceClass, setSourceClass] = useState<StudentClass>('ECD');
  const [targetClass, setTargetClass] = useState<StudentClass>('1');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [lastAction, setLastAction] = useState<{ count: number; from: string; to: string; studentName?: string } | null>(null);

  // Stats for the Promotion Cards
  const classStats = useMemo(() => {
    return CLASSES.map(cls => ({
      name: cls,
      count: students.filter(s => s.currentClass === cls).length,
      nextClass: CLASSES[CLASSES.indexOf(cls) + 1] || 'Passed Out'
    })).filter(c => c.count > 0 || c.name !== 'Passed Out');
  }, [students]);

  const [promotionMappings, setPromotionMappings] = useState<Record<string, StudentClass>>({});

  useEffect(() => {
    const initialMappings: Record<string, StudentClass> = {};
    CLASSES.forEach((cls, idx) => {
      initialMappings[cls] = CLASSES[idx + 1] || 'Passed Out';
    });
    setPromotionMappings(initialMappings);
  }, []);

  // Handle mass promotion of an ENTIRE class
  const handleBulkClassPromotion = (from: StudentClass, to: StudentClass) => {
    const affectedStudents = students.filter(s => s.currentClass === from);
    if (affectedStudents.length === 0) return;
    if (from === to) {
      alert("Source and Target classes must be different.");
      return;
    }

    if (window.confirm(`Promote ALL ${affectedStudents.length} students from ${from} to ${to}?`)) {
      const updatedList = students.map(s => 
        s.currentClass === from ? { ...s, currentClass: to } : s
      );
      onUpdateStudents(updatedList);
      setLastAction({ count: affectedStudents.length, from, to });
    }
  };

  // Logic for the Selection Table
  const studentsInSource = useMemo(() => 
    students.filter(s => s.currentClass === sourceClass),
  [students, sourceClass]);

  const displayedStudents = useMemo(() => 
    studentsInSource.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  [studentsInSource, searchQuery]);

  // Toggle individual checkbox
  const toggleStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Toggle All visible in table
  const toggleAll = () => {
    if (displayedStudents.length === 0) return;
    const allVisibleSelected = displayedStudents.every(s => selectedIds.has(s.id));
    const next = new Set(selectedIds);
    
    if (allVisibleSelected) {
      displayedStudents.forEach(s => next.delete(s.id));
    } else {
      displayedStudents.forEach(s => next.add(s.id));
    }
    setSelectedIds(next);
  };

  // One-click individual transfer (Row action)
  const quickTransferIndividual = (student: Student) => {
    if (sourceClass === targetClass) {
      alert("Please select a different Target Class first.");
      return;
    }
    const updatedList = students.map(s => 
      s.id === student.id ? { ...s, currentClass: targetClass } : s
    );
    onUpdateStudents(updatedList);
    setLastAction({ count: 1, from: sourceClass, to: targetClass, studentName: student.name });
    
    // Clean up selection if they were selected
    const next = new Set(selectedIds);
    next.delete(student.id);
    setSelectedIds(next);
  };

  // Process all checked students
  const handleProcessSelected = () => {
    if (selectedIds.size === 0) return;
    if (sourceClass === targetClass) {
      alert("Source and Target classes must be different.");
      return;
    }

    if (window.confirm(`Transfer ${selectedIds.size} selected students to Class ${targetClass}?`)) {
      const updatedList = students.map(s => 
        selectedIds.has(s.id) ? { ...s, currentClass: targetClass } : s
      );
      onUpdateStudents(updatedList);
      setLastAction({ count: selectedIds.size, from: sourceClass, to: targetClass });
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border w-fit no-print">
        <button 
          onClick={() => setActiveTab('selection')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'selection' ? 'bg-indigo-700 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <CheckSquare size={18} /> Selection Transfer
        </button>
        <button 
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'bulk' ? 'bg-indigo-700 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <TrendingUp size={18} /> Class-Wise Promotion
        </button>
      </div>

      {lastAction && (
        <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <UserCheck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Transfer Successful</p>
              <p className="text-lg font-bold">
                {lastAction.studentName ? (
                  <><b>{lastAction.studentName}</b> moved to Class {lastAction.to}</>
                ) : (
                  <>{lastAction.count} students moved from {lastAction.from} to {lastAction.to}</>
                )}
              </p>
            </div>
          </div>
          <button onClick={() => setLastAction(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
      )}

      {activeTab === 'selection' ? (
        <div className="space-y-6">
          {/* Transfer Controls */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Move Students From</label>
                <select
                  value={sourceClass}
                  onChange={(e) => {
                    setSourceClass(e.target.value as StudentClass);
                    setSelectedIds(new Set());
                  }}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                >
                  {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>

              <div className="lg:col-span-1 flex justify-center pb-4">
                <div className="p-3 bg-indigo-50 rounded-full border border-indigo-100 shadow-inner">
                  <ArrowRightLeft className="text-indigo-600 rotate-90 lg:rotate-0" size={24} />
                </div>
              </div>

              <div className="lg:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">To Destination Class</label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value as StudentClass)}
                  className="w-full px-5 py-4 bg-indigo-50/30 border-2 border-indigo-100 rounded-2xl font-bold text-indigo-800 outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                >
                  {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>

              <div className="lg:col-span-3">
                <button
                  onClick={handleProcessSelected}
                  disabled={selectedIds.size === 0}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${
                    selectedIds.size > 0 
                      ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600 active:scale-95' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <RefreshCcw size={18} className={selectedIds.size > 0 ? "animate-spin-slow" : ""} />
                  Process {selectedIds.size} Selected
                </button>
              </div>
            </div>
          </div>

          {/* Student List with Multi-Select */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleAll}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:border-indigo-500 transition-all"
                >
                  {displayedStudents.length > 0 && displayedStudents.every(s => selectedIds.has(s.id)) ? (
                    <CheckSquare size={18} className="text-indigo-600" />
                  ) : (
                    <Square size={18} className="text-slate-300" />
                  )}
                  Select All
                </button>
                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block" />
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedIds.size} Students Checked
                </div>
              </div>

              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text"
                  placeholder="Find student by name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5 w-16">Check</th>
                    <th className="px-8 py-5">Student Information</th>
                    <th className="px-8 py-5">Roll No.</th>
                    <th className="px-8 py-5 text-right">Instant Move</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedStudents.length > 0 ? displayedStudents.map(student => (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(student.id) ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => toggleStudent(student.id)}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedIds.has(student.id) 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                              : 'bg-white border-slate-200 group-hover:border-indigo-300'
                          }`}
                        >
                          {selectedIds.has(student.id) && <Check size={16} />}
                        </button>
                      </td>
                      <td className="px-8 py-5" onClick={() => toggleStudent(student.id)}>
                        <div className="font-black text-slate-800 text-base">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Parent: {student.fatherName}</div>
                      </td>
                      <td className="px-8 py-5 font-black text-indigo-700 font-mono text-sm">{student.rollNumber || '---'}</td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quickTransferIndividual(student);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100 hover:bg-indigo-700 hover:text-white hover:border-indigo-700 transition-all shadow-sm active:scale-90"
                        >
                          Move to {targetClass}
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-32 text-center">
                        <Users size={48} className="mx-auto mb-4 opacity-10 text-slate-300" />
                        <p className="text-slate-400 font-bold italic">No students currently in Class {sourceClass}.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Card-based mass promotion for entire classes */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classStats.map((cls) => (
            <div key={cls.name} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Class {cls.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cls.count} Students Enrolled</span>
                </div>
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <TrendingUp className="text-indigo-500" size={24} />
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Promote To</label>
                  <select
                    value={promotionMappings[cls.name] || 'Passed Out'}
                    onChange={(e) => setPromotionMappings(prev => ({ ...prev, [cls.name]: e.target.value as StudentClass }))}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => handleBulkClassPromotion(cls.name as StudentClass, promotionMappings[cls.name] || 'Passed Out')}
                  disabled={cls.count === 0}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all ${
                    cls.count > 0 
                      ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-700/20 hover:bg-indigo-800 active:scale-95' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Zap size={16} /> Fast Promote All
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Legend */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-start gap-4 no-print">
        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
          <Zap size={24} />
        </div>
        <div className="text-amber-900">
          <h5 className="font-black uppercase text-xs tracking-widest mb-1">Transfer Information</h5>
          <p className="text-xs font-medium leading-relaxed opacity-80">
            <b>Selection Transfer:</b> Best for specific moves. Tick multiple students and use the "Process Selected" button at the top to move them all at once. Or use the row button for a single student. <br/>
            <b>Promotion:</b> Best for mass grade updates at the end of the academic year.
          </p>
        </div>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 5s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentTransfer;