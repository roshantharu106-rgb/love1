
import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  GraduationCap, 
  Users, 
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Database,
  UserCheck
} from 'lucide-react';
import { storage } from '../utils/storage';
import { StudentClass, Student } from '../types';
import { CLASSES } from '../constants';

const PRESET_YEARS = ['2081', '2082', '2083', '2084', '2085'];

const CLASS_PROMOTION_MAP: Record<string, StudentClass> = {
  'ECD': '1',
  '1': '2',
  '2': '3',
  '3': '4',
  '4': '5',
  '5': '6',
  '6': '7',
  '7': '8',
  '8': '9',
  '9': '10',
  '10': '11',
  '11': '12',
  '12': '13',
  '13': 'Passed Out',
  'Hifz Class': 'Hifz Class',
  'Passed Out': 'Passed Out'
};

const SessionMigration: React.FC = () => {
  const currentActiveYear = storage.getSelectedYear();
  
  // State
  const [sourceYear, setSourceYear] = useState<string>(PRESET_YEARS[0]);
  const [targetYear, setTargetYear] = useState<string>(currentActiveYear || PRESET_YEARS[1]);
  const [selectedSourceClass, setSelectedSourceClass] = useState<StudentClass>('ECD');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Derived Data
  const sourceStudents = useMemo(() => {
    const all = storage.getDataForYear(sourceYear, 'students') as Student[];
    return all.filter(s => s.currentClass === selectedSourceClass);
  }, [sourceYear, selectedSourceClass]);

  const targetClass = useMemo(() => {
    return CLASS_PROMOTION_MAP[selectedSourceClass] || selectedSourceClass;
  }, [selectedSourceClass]);

  const handleTransfer = () => {
    if (sourceYear === targetYear) {
      alert("Source and Target academic sessions must be different.");
      return;
    }

    if (sourceStudents.length === 0) {
      alert(`No students found in Class ${selectedSourceClass} for the ${sourceYear} session.`);
      return;
    }

    const confirmMsg = `Transfer ${sourceStudents.length} students from ${sourceYear} (Class ${selectedSourceClass}) to ${targetYear} (Class ${targetClass})?\n\nStudents will remain in ${sourceYear} and also appear in ${targetYear}.`;
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Get current target session students
      const existingTargetStudents = storage.getDataForYear(targetYear, 'students') as Student[];
      
      // 2. Map source students to their new promoted state for the target year
      const promotedStudents = sourceStudents.map(s => ({
        ...s,
        currentClass: targetClass,
        // We keep IDs the same so the system recognizes it's the same person across years
        // Admission date remains the same as original
      }));

      // 3. Merge (Avoid duplicates based on ID)
      const targetIds = new Set(existingTargetStudents.map(s => s.id));
      const newStudentsToBuffer = promotedStudents.filter(s => !targetIds.has(s.id));
      
      const updatedTargetList = [...existingTargetStudents, ...newStudentsToBuffer];

      // 4. Save back to target year
      storage.saveDataForYear(targetYear, 'students', updatedTargetList);

      setSuccess(`Successfully transferred ${newStudentsToBuffer.length} students to ${targetYear}. ${promotedStudents.length - newStudentsToBuffer.length} were already present.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error(err);
      alert("An error occurred during the session transfer.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-10 bg-indigo-950 text-white relative">
          <Database className="absolute right-10 top-1/2 -translate-y-1/2 text-white/5" size={180} />
          <div className="relative z-10">
            <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
              <Zap className="text-amber-400" size={32} /> Student Session Transfer
            </h3>
            <p className="text-indigo-300 mt-2 font-bold uppercase tracking-widest text-[10px]">Promote students to another academic year without removing from source</p>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between text-emerald-700 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} />
                <span className="font-black uppercase text-xs tracking-widest">{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-emerald-400">
                <RefreshCw size={20} className="animate-spin" />
              </button>
            </div>
          )}

          {/* Year Range Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <div className="md:col-span-5 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Session</label>
              <select 
                value={sourceYear}
                onChange={e => setSourceYear(e.target.value)}
                className="w-full p-5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all text-center text-xl shadow-sm"
              >
                {PRESET_YEARS.map(y => <option key={y} value={y}>{y} BS</option>)}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-center">
              <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 shadow-inner">
                <ArrowRight size={24} />
              </div>
            </div>

            <div className="md:col-span-5 space-y-2">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">To Session</label>
              <select 
                value={targetYear}
                onChange={e => setTargetYear(e.target.value)}
                className="w-full p-5 bg-white border-2 border-indigo-200 rounded-2xl font-black text-indigo-900 outline-none focus:border-indigo-500 transition-all text-center text-xl shadow-sm"
              >
                {PRESET_YEARS.map(y => <option key={y} value={y}>{y} BS</option>)}
              </select>
            </div>
          </div>

          {/* Class Transformation Logic */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-8 shadow-sm">
             <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <GraduationCap className="text-indigo-600" />
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Class-Wise Transformation</h4>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                <div className="md:col-span-4">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Select Source Class</label>
                   <select 
                    value={selectedSourceClass}
                    onChange={e => setSelectedSourceClass(e.target.value as StudentClass)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500"
                   >
                     {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                   </select>
                </div>

                <div className="md:col-span-3 flex flex-col items-center">
                   <div className="flex items-center gap-1 mb-1">
                      <span className="text-[8px] font-black text-indigo-400 uppercase">Promoting</span>
                   </div>
                   <ChevronRight className="text-indigo-200" size={32} />
                </div>

                <div className="md:col-span-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                   <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Auto-Determined Target</label>
                   <div className="text-xl font-black text-indigo-900">Class {targetClass}</div>
                </div>
             </div>

             {/* Summary Stats Card */}
             <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-xl">
                      <Users size={24} className="text-amber-400" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Students to Process</p>
                      <h5 className="text-2xl font-black">{sourceStudents.length} Students</h5>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Status</p>
                   <p className="text-xs font-bold text-emerald-400 uppercase">{sourceStudents.length > 0 ? 'Ready for Transfer' : 'Class Empty'}</p>
                </div>
             </div>
          </div>

          {/* Safety Information */}
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
             <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
             <div className="space-y-1">
                <h6 className="text-xs font-black text-amber-900 uppercase">Non-Destructive Transfer</h6>
                <p className="text-[10px] text-amber-800 font-medium leading-relaxed uppercase opacity-80">
                  Executing this transfer will only <b>add</b> students to the {targetYear} session. Existing records in {sourceYear} are not modified or deleted. 
                  Invoices, grades, and attendance from the previous year are <b>not</b> carried over to ensure financial audit accuracy for the new session.
                </p>
             </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleTransfer}
              disabled={isProcessing || sourceYear === targetYear || sourceStudents.length === 0}
              className="w-full py-5 bg-indigo-700 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-700/20 hover:bg-indigo-800 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <UserCheck size={20} />}
              {isProcessing ? "Processing Transfer..." : "Execute Class Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionMigration;
