
import React, { useState } from 'react';
import { ArrowRightLeft, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import { Student, StudentClass } from '../types';
import { CLASSES } from '../constants';

interface PromotionSystemProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
}

const PromotionSystem: React.FC<PromotionSystemProps> = ({ students, onUpdateStudents }) => {
  const [sourceClass, setSourceClass] = useState<StudentClass>('ECD');
  const [targetClass, setTargetClass] = useState<StudentClass>('1');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sourceStudents = students.filter(s => s.currentClass === sourceClass);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === sourceStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sourceStudents.map(s => s.id)));
    }
  };

  const handlePromote = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Promote ${selectedIds.size} students to ${targetClass}?`)) {
      const updatedStudents = students.map(s => 
        selectedIds.has(s.id) ? { ...s, currentClass: targetClass } : s
      );
      onUpdateStudents(updatedStudents);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600">Source Class</label>
          <select
            value={sourceClass}
            onChange={(e) => {
              setSourceClass(e.target.value as StudentClass);
              setSelectedIds(new Set());
            }}
            className="w-full px-4 py-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-emerald-500"
          >
            {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>

        <div className="flex justify-center pb-2">
          <div className="bg-slate-50 p-2 rounded-full border">
            <ArrowRightLeft className="text-slate-400 rotate-90 md:rotate-0" size={24} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600">Target Class</label>
          <select
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value as StudentClass)}
            className="w-full px-4 py-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-emerald-500"
          >
            {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors">
              {selectedIds.size === sourceStudents.length && sourceStudents.length > 0 ? (
                <CheckSquare size={18} className="text-emerald-600" />
              ) : (
                <Square size={18} />
              )}
              Select All ({sourceStudents.length})
            </button>
          </div>
          <button
            onClick={handlePromote}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
              selectedIds.size > 0 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCcw size={18} />
            Promote Selected ({selectedIds.size})
          </button>
        </div>

        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Father's Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Current Class</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sourceStudents.length > 0 ? sourceStudents.map(student => (
                <tr 
                  key={student.id} 
                  className={`hover:bg-emerald-50/30 transition-colors cursor-pointer ${selectedIds.has(student.id) ? 'bg-emerald-50/50' : ''}`}
                  onClick={() => toggleSelect(student.id)}
                >
                  <td className="px-6 py-4">
                    {selectedIds.has(student.id) ? (
                      <CheckSquare size={18} className="text-emerald-600" />
                    ) : (
                      <Square size={18} className="text-slate-300" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{student.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Roll: {student.rollNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.fatherName}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{student.contactNumber}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600">
                      {student.currentClass}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    No students currently in {sourceClass}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionSystem;
