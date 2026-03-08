
import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Save, 
  Trash2, 
  ListChecks, 
  Calendar, 
  CheckCircle2, 
  Zap, 
  User, 
  Clock, 
  Tag,
  Grid3X3,
  LayoutList,
  ChevronRight,
  PlusCircle,
  Hash
} from 'lucide-react';
import { Student, StudentClass, Subject, MarkRecord, ExamTerm, Teacher } from '../types';
import { CLASSES, STANDARD_SUBJECTS } from '../constants';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface MarkEntrySystemProps {
  students: Student[];
  subjects: Subject[];
  marks: MarkRecord[];
  teachers: Teacher[];
  onUpdateSubjects: (subjects: Subject[]) => void;
  onUpdateMarks: (marks: MarkRecord[]) => void;
}

const MarkEntrySystem: React.FC<MarkEntrySystemProps> = ({ 
  students, subjects, marks, teachers, onUpdateSubjects, onUpdateMarks 
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'marks'>('marks');
  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');
  const [selectedClass, setSelectedClass] = useState<StudentClass>('ECD');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>('First Terminal');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subjectId: string; subjectName: string }>({
    isOpen: false,
    subjectId: '',
    subjectName: ''
  });

  const classSubjects = useMemo(() => subjects.filter(s => s.classId === selectedClass), [subjects, selectedClass]);
  const classStudents = useMemo(() => students.filter(s => s.currentClass === selectedClass), [students, selectedClass]);

  const getSubjectTeacherInfo = (subId: string, clsId: StudentClass) => {
    for (const teacher of teachers) {
      const assignment = teacher.assignments?.find(a => a.subjectId === subId && a.classId === clsId);
      if (assignment) {
        return { name: teacher.name, period: assignment.period };
      }
    }
    return null;
  };

  const handleAddSubject = (name?: string) => {
    const subName = name || newSubjectName.trim();
    if (!subName) return;
    
    // Avoid duplicate names in the same class
    if (classSubjects.some(s => s.name.toLowerCase() === subName.toLowerCase())) {
      return;
    }

    const newSub: Subject = {
      id: crypto.randomUUID(),
      classId: selectedClass,
      name: subName,
    };
    onUpdateSubjects([...subjects, newSub]);
    setNewSubjectName('');
  };

  const confirmDeleteSubject = () => {
    const id = deleteModal.subjectId;
    const updatedSubjects = subjects.filter(s => s.id !== id);
    const updatedMarks = marks.filter(m => m.subjectId !== id);
    onUpdateSubjects(updatedSubjects);
    onUpdateMarks(updatedMarks);
    if (selectedSubject === id) setSelectedSubject('');
  };

  const handleUpdateMark = (studentId: string, subjectId: string, field: 'marksObtained' | 'maxMarks', value: string) => {
    const numValue = parseFloat(value) || 0;
    const existingIndex = marks.findIndex(m => 
      m.studentId === studentId && 
      m.subjectId === subjectId && 
      m.term === selectedTerm
    );
    
    let nextMarks = [...marks];
    if (existingIndex > -1) {
      nextMarks[existingIndex] = { ...nextMarks[existingIndex], [field]: numValue };
    } else {
      nextMarks.push({ 
        studentId, 
        subjectId, 
        classId: selectedClass, 
        term: selectedTerm, 
        marksObtained: field === 'marksObtained' ? numValue : 0, 
        maxMarks: field === 'maxMarks' ? numValue : 100 
      });
    }
    onUpdateMarks(nextMarks);
  };

  const syncFullMarksMatrix = () => {
    const targetMax = 100;
    let nextMarks = [...marks];
    
    classStudents.forEach(student => {
      classSubjects.forEach(subject => {
        const idx = nextMarks.findIndex(m => 
          m.studentId === student.id && 
          m.subjectId === subject.id && 
          m.term === selectedTerm
        );
        if (idx > -1) {
          nextMarks[idx] = { ...nextMarks[idx], maxMarks: targetMax };
        } else {
          nextMarks.push({ 
            studentId: student.id, 
            subjectId: subject.id, 
            classId: selectedClass, 
            term: selectedTerm, 
            marksObtained: 0, 
            maxMarks: targetMax 
          });
        }
      });
    });
    onUpdateMarks(nextMarks);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Bars */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="bg-white border rounded-2xl shadow-sm flex overflow-hidden p-1 w-fit">
          <button 
            onClick={() => setActiveTab('marks')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'marks' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ListChecks size={20} /> Mark Entry
          </button>
          <button 
            onClick={() => setActiveTab('subjects')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'subjects' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <BookOpen size={20} /> Curriculum & Staffing
          </button>
        </div>

        {activeTab === 'marks' && (
          <div className="bg-white border rounded-2xl shadow-sm flex overflow-hidden p-1 w-fit animate-in fade-in slide-in-from-right-2">
            <button 
              onClick={() => setEntryMode('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${entryMode === 'single' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <LayoutList size={16} /> Single
            </button>
            <button 
              onClick={() => setEntryMode('bulk')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${entryMode === 'bulk' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Grid3X3 size={16} /> Matrix (Bulk)
            </button>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-4 no-print">
        <div className="flex flex-wrap items-center gap-8">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Current Class Selection</label>
            <select 
              value={selectedClass} 
              onChange={(e) => { setSelectedClass(e.target.value as StudentClass); setSelectedSubject(''); }} 
              className="block w-56 px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-black text-slate-700 transition-all appearance-none cursor-pointer"
            >
              {CLASSES.map(cls => <option key={cls} value={cls}>Class: {cls}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Examination Term</label>
            <select 
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value as ExamTerm)} 
              className="block w-56 px-5 py-3.5 bg-indigo-50/30 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 outline-none font-black text-indigo-800 transition-all appearance-none cursor-pointer"
            >
              <option value="First Terminal">First Terminal</option>
              <option value="Second Terminal">Second Terminal</option>
              <option value="Third Terminal">Third Terminal</option>
            </select>
          </div>

          {activeTab === 'marks' && entryMode === 'single' && (
            <div className="space-y-1.5 animate-in slide-in-from-left-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)} 
                className="block w-72 px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Choose Subject --</option>
                {classSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'subjects' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-inner"><Plus size={20} /></div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Manual Add</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Custom Subject Name</label>
                    <input 
                      type="text" 
                      value={newSubjectName} 
                      onChange={(e) => setNewSubjectName(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()} 
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold placeholder:font-medium" 
                      placeholder="Enter name..." 
                    />
                  </div>
                  <button 
                    onClick={() => handleAddSubject()} 
                    className="w-full bg-indigo-700 text-white font-black py-4 rounded-2xl hover:bg-indigo-800 shadow-xl shadow-indigo-700/20 active:scale-95 transition-all text-[11px] uppercase tracking-[0.15em]"
                  >
                    Add to Class {selectedClass}
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shadow-inner"><PlusCircle size={20} /></div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Quick Add</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 ml-1 leading-relaxed">Select standard subjects to add them instantly.</p>
                <div className="grid grid-cols-2 gap-2">
                   {STANDARD_SUBJECTS.map(name => {
                     const isAdded = classSubjects.some(s => s.name.toLowerCase() === name.toLowerCase());
                     return (
                       <button 
                        key={name}
                        onClick={() => handleAddSubject(name)}
                        disabled={isAdded}
                        className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-between ${
                          isAdded 
                          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                          : 'bg-white text-indigo-700 border-indigo-50 hover:bg-indigo-50 hover:border-indigo-200 active:scale-95'
                        }`}
                       >
                         {name}
                         {!isAdded && <Plus size={12} />}
                         {isAdded && <CheckCircle2 size={12} />}
                       </button>
                     );
                   })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                      <Hash size={18} />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Class {selectedClass} Master Curriculum</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{classSubjects.length} Registered Subjects</p>
                   </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Subject Details</th>
                      <th className="px-8 py-5">Assigned Faculty</th>
                      <th className="px-8 py-5">Daily Period</th>
                      <th className="px-8 py-5 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {classSubjects.map(sub => {
                      const staffing = getSubjectTeacherInfo(sub.id, selectedClass);
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6 font-black text-slate-800 uppercase text-sm tracking-tight">{sub.name}</td>
                          <td className="px-8 py-6">
                            {staffing ? (
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200/50"><User size={16} /></div>
                                <div>
                                   <div className="text-sm font-black text-slate-700">{staffing.name}</div>
                                   <div className="text-[9px] text-slate-400 font-bold uppercase">Assigned Professor</div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100/30 shadow-sm">Faculty Unassigned</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            {staffing ? (
                              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-slate-800/20">
                                <Clock size={12} className="text-indigo-400" /> {staffing.period} Period
                              </span>
                            ) : <span className="text-slate-200 font-black">---</span>}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => setDeleteModal({ isOpen: true, subjectId: sub.id, subjectName: sub.name })} 
                              className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {classSubjects.length === 0 && (
                  <div className="p-32 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-100"><BookOpen size={48} /></div>
                    <div className="space-y-1">
                       <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs italic">No subjects registered for this class.</p>
                       <p className="text-[10px] text-slate-300 font-medium">Use the Quick Add or Manual Add panel on the left.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mark Entry Content */
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
          {entryMode === 'single' ? (
            !selectedSubject ? (
              <div className="p-32 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><Calendar size={48} /></div>
                <div className="space-y-1">
                  <p className="text-slate-800 font-black uppercase tracking-[0.2em] text-sm">Select Subject Scope</p>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1 opacity-70">Pick a subject from the control panel above</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-8 bg-indigo-50/50 border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="px-5 py-2 bg-indigo-600 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.15em] shadow-xl shadow-indigo-600/30">{selectedTerm}</div>
                    <div className="flex items-center gap-3">
                       <h2 className="font-black text-slate-800 text-2xl uppercase tracking-tight">{classSubjects.find(s => s.id === selectedSubject)?.name}</h2>
                       <ChevronRight size={24} className="text-slate-300" />
                       <div className="flex flex-col">
                          <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest leading-none mb-1">Classroom</span>
                          <span className="text-slate-700 font-black text-base leading-none">Class {selectedClass}</span>
                       </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const firstStudent = classStudents[0];
                      if (!firstStudent) return;
                      const firstRecord = marks.find(m => m.studentId === firstStudent.id && m.subjectId === selectedSubject && m.term === selectedTerm);
                      const targetMax = firstRecord?.maxMarks || 100;
                      let nextMarks = [...marks];
                      classStudents.forEach(student => {
                        const idx = nextMarks.findIndex(m => m.studentId === student.id && m.subjectId === selectedSubject && m.term === selectedTerm);
                        if (idx > -1) nextMarks[idx] = { ...nextMarks[idx], maxMarks: targetMax };
                        else nextMarks.push({ studentId: student.id, subjectId: selectedSubject, classId: selectedClass, term: selectedTerm, marksObtained: 0, maxMarks: targetMax });
                      });
                      onUpdateMarks(nextMarks);
                    }} 
                    className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-indigo-200 text-indigo-700 text-xs font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-md uppercase tracking-widest active:scale-95"
                  >
                    <Zap size={16} /> Standardize FM (100)
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-6 w-24">Roll</th>
                        <th className="px-10 py-6">Identity</th>
                        <th className="px-10 py-6 w-56">FM (Weightage)</th>
                        <th className="px-10 py-6 w-56">OB (Evaluation)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {classStudents.map(student => {
                        const record = marks.find(m => m.studentId === student.id && m.subjectId === selectedSubject && m.term === selectedTerm);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50 group transition-all">
                            <td className="px-10 py-6 text-sm font-black text-indigo-700 font-mono tracking-tighter">{student.rollNumber || '---'}</td>
                            <td className="px-10 py-6">
                              <div className="font-black text-slate-800 text-base uppercase">{student.name}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Parent: {student.fatherName}</div>
                            </td>
                            <td className="px-10 py-6">
                              <input 
                                type="number" 
                                value={record?.maxMarks ?? ''} 
                                onChange={(e) => handleUpdateMark(student.id, selectedSubject, 'maxMarks', e.target.value)} 
                                placeholder="100" 
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-600 group-hover:bg-white transition-all focus:border-indigo-300" 
                              />
                            </td>
                            <td className="px-10 py-6">
                              <input 
                                type="number" 
                                value={record?.marksObtained ?? ''} 
                                onChange={(e) => handleUpdateMark(student.id, selectedSubject, 'marksObtained', e.target.value)} 
                                placeholder="0" 
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-indigo-700 focus:border-indigo-500 group-hover:bg-white transition-all shadow-inner focus:shadow-indigo-500/10" 
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {classStudents.length === 0 && (
                    <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic text-xs">No active enrollments for Class {selectedClass}</div>
                  )}
                </div>
              </>
            )
          ) : (
            /* Matrix View remains as previously implemented but with refined styles */
            <div className="flex flex-col">
               <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                     <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                        <Grid3X3 size={28} className="text-indigo-400" /> Curriculum Matrix Entry
                     </h2>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Institutional Grade Sheet • Class {selectedClass} • {selectedTerm}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={syncFullMarksMatrix} 
                      className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all active:scale-95 shadow-lg"
                    >
                      <Zap size={16} /> Global Sync FM (100)
                    </button>
                    <div className="px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-600/20">
                      <Hash size={16} /> {classSubjects.length} Modules Active
                    </div>
                  </div>
               </div>

               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-5 w-20 border-r border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll</th>
                        <th className="px-8 py-5 w-64 border-r border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Identity</th>
                        {classSubjects.map(sub => (
                          <th key={sub.id} className="px-5 py-5 min-w-[160px] border-r border-slate-100">
                             <div className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{sub.name}</div>
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg w-fit">
                                <User size={10} /> 
                                <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[100px]">
                                  {getSubjectTeacherInfo(sub.id, selectedClass)?.name || 'VACANT'}
                                </span>
                             </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.map(student => (
                        <tr key={student.id} className="hover:bg-indigo-50/30 group transition-all">
                          <td className="px-6 py-6 text-sm font-black text-indigo-700 font-mono border-r border-slate-100">{student.rollNumber || '---'}</td>
                          <td className="px-8 py-6 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-indigo-50 transition-all z-20">
                             <div className="font-black text-slate-800 text-sm uppercase leading-tight">{student.name}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Parent: {student.fatherName}</div>
                          </td>
                          {classSubjects.map(sub => {
                            const record = marks.find(m => m.studentId === student.id && m.subjectId === sub.id && m.term === selectedTerm);
                            return (
                              <td key={sub.id} className="px-4 py-4 border-r border-slate-50">
                                <div className="space-y-1.5">
                                   <div className="flex items-center justify-between px-1.5">
                                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">OB</span>
                                      <span className="text-[8px] font-black text-slate-400 uppercase">/ {record?.maxMarks || 100} FM</span>
                                   </div>
                                   <input 
                                    type="number" 
                                    value={record?.marksObtained ?? ''} 
                                    onChange={(e) => handleUpdateMark(student.id, sub.id, 'marksObtained', e.target.value)}
                                    placeholder="0" 
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-black text-slate-800 text-sm focus:border-indigo-500 focus:bg-white transition-all text-center shadow-inner" 
                                   />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <div className={`w-3.5 h-3.5 rounded-full shadow-sm ${saveSuccess ? 'bg-indigo-500 animate-pulse ring-4 ring-indigo-100' : 'bg-slate-300 ring-4 ring-slate-100'}`} />
               <div className="flex flex-col">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em]">Database Synchronization</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {saveSuccess ? 'System records updated successfully' : 'Changes tracked in temporary memory'}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-6">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-indigo-700 font-black text-[11px] uppercase tracking-widest bg-indigo-100 px-6 py-3 rounded-2xl border border-indigo-200 animate-in zoom-in-95 duration-300">
                  <CheckCircle2 size={18} /> Record Updated
                </div>
              )}
              <button 
                className="px-14 py-4 bg-indigo-700 text-white font-black rounded-2xl shadow-2xl shadow-indigo-700/20 hover:bg-indigo-800 uppercase tracking-[0.2em] text-xs flex items-center gap-4 active:scale-95 transition-all" 
                onClick={() => {
                  setSaveSuccess(true); 
                  setTimeout(() => setSaveSuccess(false), 2000);
                }}
              >
                <Save size={20} /> Commit All Entries
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} 
        onConfirm={confirmDeleteSubject} 
        title="Curriculum Deletion" 
        itemName={`Subject: ${deleteModal.subjectName}`} 
      />
    </div>
  );
};

export default MarkEntrySystem;