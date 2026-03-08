
import React, { useState } from 'react';
import { Calendar, GraduationCap, ArrowRight, ShieldCheck, Zap, ChevronRight, PlusCircle } from 'lucide-react';

interface YearSelectorProps {
  onYearSelected: (year: string) => void;
  schoolName: string;
  logo?: string;
}

const PRESET_YEARS = ['2081', '2082', '2083', '2084', '2085'];

const YearSelector: React.FC<YearSelectorProps> = ({ onYearSelected, schoolName, logo }) => {
  const [customYear, setCustomYear] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6 overflow-y-auto font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full" />

      <div className="max-w-4xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-16">
          <div className="mb-8">
            <img src={logo || "/logo.png"} alt="Pakadi Madarsa Logo" className="w-48 mx-auto object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 leading-none">{schoolName}</h1>
          <div className="flex items-center justify-center gap-3">
             <div className="h-[1px] w-12 bg-slate-800" />
             <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Academic Session Selection</p>
             <div className="h-[1px] w-12 bg-slate-800" />
          </div>
        </div>

        {!isCustomMode ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {PRESET_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => onYearSelected(year)}
                  className="group relative bg-slate-900/40 backdrop-blur-md border-2 border-slate-800 p-8 rounded-[2.5rem] text-center hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-300 active:scale-95 shadow-xl"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={16} className="text-amber-400" />
                  </div>
                  <Calendar className="mx-auto text-slate-700 group-hover:text-indigo-400 mb-4 transition-colors" size={32} />
                  <span className="block text-3xl font-black text-white group-hover:text-indigo-100 transition-colors">{year}</span>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-400/60 transition-colors mt-1 block">B.S. Session</span>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <span className="text-[10px] font-black uppercase tracking-widest">Enter Session</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setIsCustomMode(true)}
                className="flex items-center gap-3 px-8 py-4 bg-slate-900/60 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-slate-800 hover:text-white hover:border-slate-600 transition-all active:scale-95"
              >
                <PlusCircle size={16} /> Enter Other Year
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border-2 border-slate-800 p-10 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-4">
            <h3 className="text-white font-black text-xl uppercase tracking-tight mb-2">Manual Entry</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Enter a custom Bikram Sambat year</p>
            
            <div className="space-y-6">
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={24} />
                <input
                  type="text"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 2086"
                  className="w-full pl-14 pr-6 py-6 bg-slate-950 border-2 border-slate-800 rounded-3xl text-white font-black text-2xl outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCustomMode(false)}
                  className="flex-1 py-5 bg-slate-800/50 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-800 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => customYear && onYearSelected(customYear)}
                  disabled={!customYear}
                  className="flex-[2] py-5 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Start Session <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 text-center">
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] flex items-center justify-center gap-3">
             <ShieldCheck size={14} className="text-indigo-900" /> Secure Database Partitioning Active
           </p>
        </div>
      </div>
    </div>
  );
};

export default YearSelector;
