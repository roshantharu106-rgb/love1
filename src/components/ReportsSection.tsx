
import React, { useState, useMemo, useRef } from 'react';
import { 
  FileBadge, 
  GraduationCap, 
  Printer, 
  Download, 
  Loader2, 
  Award, 
  Trophy, 
  Medal, 
  Search, 
  ChevronRight,
  TrendingUp,
  User,
  Users,
  Hash,
  Filter,
  FileText,
  Star,
  CheckSquare,
  Square,
  IdCard,
  UserCircle
} from 'lucide-react';
import { Student, StudentClass, Subject, MarkRecord, ExamTerm, SchoolSettings } from '../types';
import { CLASSES } from '../constants';

interface ReportsSectionProps {
  students: Student[];
  subjects: Subject[];
  marks: MarkRecord[];
  schoolSettings: SchoolSettings;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ students, subjects, marks, schoolSettings }) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'rankings' | 'admit-cards'>('individual');
  const [selectedClass, setSelectedClass] = useState<StudentClass>('ECD');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [reportType, setReportType] = useState<'combined' | 'character'>('combined');
  const [selectedAdmitTerm, setSelectedAdmitTerm] = useState<ExamTerm>('First Terminal');
  const [selectedAdmitStudentIds, setSelectedAdmitStudentIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  
  const individualRef = useRef<HTMLDivElement>(null);
  const meritListRef = useRef<HTMLDivElement>(null);
  const admitCardsRef = useRef<HTMLDivElement>(null);

  const classStudents = useMemo(() => students.filter(s => s.currentClass === selectedClass), [students, selectedClass]);
  const selectedStudent = useMemo(() => classStudents.find(s => s.id === selectedStudentId), [classStudents, selectedStudentId]);

  // Handle multi-select for admit cards
  const toggleAdmitStudent = (id: string) => {
    const next = new Set(selectedAdmitStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAdmitStudentIds(next);
  };

  const toggleAllAdmit = () => {
    if (selectedAdmitStudentIds.size === classStudents.length) {
      setSelectedAdmitStudentIds(new Set());
    } else {
      setSelectedAdmitStudentIds(new Set(classStudents.map(s => s.id)));
    }
  };

  // Aggregated Performance Calculation
  const getStudentPerformance = (studentId: string, classId: StudentClass) => {
    const classSubjects = subjects.filter(s => s.classId === classId);
    if (classSubjects.length === 0) return { totalObtained: 0, totalMax: 0, percentage: 0 };

    const terms: ExamTerm[] = ['First Terminal', 'Second Terminal', 'Third Terminal'];
    let totalObtained = 0;
    let totalMax = 0;

    classSubjects.forEach(sub => {
      terms.forEach(term => {
        const record = marks.find(m => m.studentId === studentId && m.subjectId === sub.id && m.term === term);
        if (record) {
          totalObtained += record.marksObtained;
          totalMax += record.maxMarks;
        }
      });
    });

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    return { totalObtained, totalMax, percentage };
  };

  // Rankings and Toppers Logic
  const rankingsData = useMemo(() => {
    const allStats = students.map(s => {
      const perf = getStudentPerformance(s.id, s.currentClass);
      return { ...s, ...perf };
    }).filter(s => s.totalMax > 0);

    const schoolRankings = [...allStats].sort((a, b) => b.percentage - a.percentage).slice(0, 10);
    const classRankings = [...allStats]
      .filter(s => s.currentClass === selectedClass)
      .sort((a, b) => b.percentage - a.percentage);

    return { schoolRankings, classRankings };
  }, [students, subjects, marks, selectedClass]);

  // Combined Grade Sheet Data
  const combinedData = useMemo(() => {
    if (!selectedStudentId) return [];
    const classSubjects = subjects.filter(s => s.classId === selectedClass);
    const terms: ExamTerm[] = ['First Terminal', 'Second Terminal', 'Third Terminal'];

    return classSubjects.map(sub => {
      const termDetails = terms.map(term => {
        const record = marks.find(m => m.studentId === selectedStudentId && m.subjectId === sub.id && m.term === term);
        return {
          obtained: record?.marksObtained ?? 0,
          full: record?.maxMarks ?? 100,
          exists: !!record
        };
      });

      const totalObtained = termDetails.reduce((a, b) => a + b.obtained, 0);
      const totalFull = termDetails.reduce((a, b) => a + b.full, 0);

      return {
        name: sub.name,
        first: termDetails[0],
        second: termDetails[1],
        third: termDetails[2],
        totalObtained,
        totalFull
      };
    });
  }, [selectedStudentId, selectedClass, subjects, marks]);

  const grandObtained = combinedData.reduce((acc, curr) => acc + curr.totalObtained, 0);
  const grandMax = combinedData.reduce((acc, curr) => acc + curr.totalFull, 0);
  const percentage = grandMax > 0 ? ((grandObtained / grandMax) * 100).toFixed(2) : '0';

  const getGrade = (p: string | number) => {
    const n = typeof p === 'string' ? parseFloat(p) : p;
    if (n >= 90) return 'A+';
    if (n >= 80) return 'A';
    if (n >= 70) return 'B+';
    if (n >= 60) return 'B';
    if (n >= 50) return 'C+';
    if (n >= 40) return 'C';
    return 'D';
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleDownloadPDF = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    setIsDownloading(true);
    
    const opt = {
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      // @ts-ignore
      await window.html2pdf().from(ref.current).set(opt).save();
    } catch (error) {
      console.error('PDF Generation Failure:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border w-fit no-print">
        <button 
          onClick={() => setActiveTab('individual')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'individual' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Award size={16} /> Individual Reports
        </button>
        <button 
          onClick={() => setActiveTab('admit-cards')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'admit-cards' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <IdCard size={16} /> Examination Admit Cards
        </button>
        <button 
          onClick={() => setActiveTab('rankings')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'rankings' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Trophy size={16} /> Rankings & Merit List
        </button>
      </div>

      {activeTab === 'admit-cards' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 no-print">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Scope</label>
                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value as any); setSelectedAdmitStudentIds(new Set()); }} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-500">
                       {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Examination Term</label>
                    <select value={selectedAdmitTerm} onChange={e => setSelectedAdmitTerm(e.target.value as ExamTerm)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-500">
                       <option value="First Terminal">First Terminal</option>
                       <option value="Second Terminal">Second Terminal</option>
                       <option value="Third Terminal">Third Terminal</option>
                    </select>
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => handleDownloadPDF(admitCardsRef, `Admit_Cards_Class_${selectedClass}`)}
                      disabled={selectedAdmitStudentIds.size === 0 || isDownloading}
                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-800 shadow-xl disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} Generate {selectedAdmitStudentIds.size} Cards
                    </button>
                 </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                       <Users size={18} className="text-indigo-600" /> Select Students to Include
                    </h4>
                    <button onClick={toggleAllAdmit} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                       {selectedAdmitStudentIds.size === classStudents.length ? 'Deselect All' : 'Select All Students'}
                    </button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {classStudents.map(s => (
                       <button 
                        key={s.id} 
                        onClick={() => toggleAdmitStudent(s.id)}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${selectedAdmitStudentIds.has(s.id) ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-100 grayscale opacity-60'}`}
                       >
                         {selectedAdmitStudentIds.has(s.id) ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-300" />}
                         <div className="truncate">
                            <p className="text-[10px] font-black text-slate-800 uppercase truncate">{s.name}</p>
                            <p className="text-[8px] font-bold text-slate-400">Roll: {s.rollNumber}</p>
                         </div>
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-slate-100/50 rounded-[3rem] p-12 border border-slate-200 flex justify-center items-start min-h-[800px] no-print">
              <div className="scale-[0.55] md:scale-[0.75] lg:scale-[0.85] origin-top bg-white shadow-2xl border border-slate-200 w-[210mm] min-h-[297mm] overflow-hidden p-[10mm]">
                 <AdmitCardsPreview 
                    students={classStudents.filter(s => selectedAdmitStudentIds.has(s.id))} 
                    schoolSettings={schoolSettings} 
                    term={selectedAdmitTerm} 
                 />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 no-print space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row gap-8 items-end justify-between">
              <div className="flex flex-wrap items-end gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => { setSelectedClass(e.target.value as any); setSelectedStudentId(''); }} 
                    className="block w-40 px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-black text-slate-700 appearance-none"
                  >
                    {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Student</label>
                  <select 
                    value={selectedStudentId} 
                    onChange={(e) => setSelectedStudentId(e.target.value)} 
                    className="block w-72 px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 appearance-none"
                  >
                    <option value="">-- Choose Profile --</option>
                    {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollNumber})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setReportType('combined')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'combined' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}
                >
                  Grade Sheet
                </button>
                <button 
                  onClick={() => setReportType('character')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'character' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}
                >
                  Certificate
                </button>
              </div>
            </div>

            {selectedStudent && (
              <div className="pt-6 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={() => handleDownloadPDF(individualRef, `${reportType === 'combined' ? 'GradeSheet' : 'CharacterCertificate'}_${selectedStudent.name.replace(/\s+/g, '_')}`)} 
                  disabled={isDownloading}
                  className="flex items-center gap-3 px-10 py-4 bg-indigo-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-indigo-800 shadow-2xl shadow-indigo-700/20 active:scale-95 transition-all"
                >
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Download One-Page Official PDF
                </button>
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="bg-slate-100/50 rounded-[3rem] p-12 border border-slate-200 flex justify-center items-start min-h-[800px] no-print overflow-hidden">
               <div className="scale-[0.55] md:scale-[0.75] lg:scale-[0.85] origin-top bg-white shadow-2xl border border-slate-200 w-[210mm] min-h-[297mm] overflow-hidden">
                  <ReportContent selectedStudent={selectedStudent} schoolSettings={schoolSettings} reportType={reportType} combinedData={combinedData} grandObtained={grandObtained} grandMax={grandMax} percentage={percentage} getGrade={getGrade} getOrdinal={getOrdinal} rankingsData={rankingsData} />
               </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'rankings' && (
        <div className="space-y-8 animate-in fade-in duration-500 no-print">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                 <div className="p-10 bg-indigo-900 text-white relative">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div>
                          <h3 className="text-2xl font-black uppercase flex items-center gap-4">
                             <Medal size={28} className="text-amber-400" /> Class {selectedClass} Merit List
                          </h3>
                          <p className="text-indigo-300 font-bold uppercase text-[10px] mt-2">Rankings by session aggregate</p>
                       </div>
                       <button 
                        onClick={() => handleDownloadPDF(meritListRef, `Merit_List_Class_${selectedClass}`)}
                        className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-xl"
                       >
                         <Download size={16} /> Download Rankings Report
                       </button>
                    </div>
                 </div>
                 <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                       <Filter size={18} className="text-slate-400" />
                       <select 
                          value={selectedClass} 
                          onChange={(e) => setSelectedClass(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-black text-[10px] uppercase text-slate-700 outline-none"
                        >
                          {CLASSES.map(cls => <option key={cls} value={cls}>Grade {cls}</option>)}
                       </select>
                    </div>
                    <div className="space-y-4">
                       {rankingsData.classRankings.map((s, i) => (
                          <div key={s.id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-100">
                             <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${i < 3 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' : 'bg-slate-50 text-slate-400'}`}>{i + 1}</div>
                                <div>
                                   <h4 className="font-black text-slate-800 uppercase text-sm">{s.name}</h4>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase">Roll: {s.rollNumber} • {getOrdinal(i+1)} Position</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-indigo-700">{s.percentage.toFixed(1)}%</p>
                                <p className="text-[9px] font-black uppercase text-slate-400">{getGrade(s.percentage)} Grade</p>
                             </div>
                          </div>
                       ))}
                       {rankingsData.classRankings.length === 0 && (
                          <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] italic">No exam records for class {selectedClass}</div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-center relative overflow-hidden">
                 <Star className="absolute right-[-20px] top-[-20px] text-white/5" size={200} />
                 <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-4"><TrendingUp className="text-emerald-400" /> Institutional Top 10</h3>
                 <div className="space-y-3">
                    {rankingsData.schoolRankings.map((s, idx) => (
                       <div key={s.id} className="flex justify-between items-center py-3 border-b border-white/5">
                          <span className="text-xs font-bold uppercase"><span className="text-indigo-400 mr-2">#{idx+1}</span> {s.name}</span>
                          <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg">Class {s.currentClass} • {s.percentage.toFixed(1)}%</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="pdf-capture-container">
        <div ref={individualRef}>
           {selectedStudent && (
             <ReportContent 
               selectedStudent={selectedStudent} 
               schoolSettings={schoolSettings} 
               reportType={reportType} 
               combinedData={combinedData} 
               grandObtained={grandObtained} 
               grandMax={grandMax} 
               percentage={percentage} 
               getGrade={getGrade} 
               getOrdinal={getOrdinal} 
               rankingsData={rankingsData} 
             />
           )}
        </div>
        <div ref={meritListRef}>
           <MeritListTemplate 
             selectedClass={selectedClass} 
             schoolSettings={schoolSettings} 
             rankingsData={rankingsData} 
             getOrdinal={getOrdinal} 
           />
        </div>
        <div ref={admitCardsRef}>
           <AdmitCardsPreview 
              students={classStudents.filter(s => selectedAdmitStudentIds.has(s.id))} 
              schoolSettings={schoolSettings} 
              term={selectedAdmitTerm} 
           />
        </div>
      </div>
    </div>
  );
};

const ReportContent: React.FC<any> = ({ 
  selectedStudent, 
  schoolSettings, 
  reportType, 
  combinedData, 
  grandObtained, 
  grandMax, 
  percentage, 
  getGrade, 
  getOrdinal, 
  rankingsData 
}) => {
  if (reportType === 'combined') {
    return (
      <div className="pdf-page" style={{ display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', padding: '5mm 10mm 10mm 10mm' }}>
        <div style={{ textAlign: 'center', marginBottom: '3mm', borderBottom: '2px solid #000', paddingBottom: '2mm' }}>
          <h1 style={{ fontSize: '20pt', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{schoolSettings.name}</h1>
          <p style={{ fontSize: '8pt', fontWeight: 700, margin: '0.5mm 0', opacity: 0.7 }}>{schoolSettings.address}</p>
          <div style={{ marginTop: '1.5mm', display: 'inline-block', border: '2px solid #000', padding: '1mm 5mm' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1pt', margin: 0 }}>Academic Grade Sheet</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8mm', marginBottom: '4mm', fontSize: '8.5pt', textTransform: 'uppercase', fontWeight: 700 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1mm', lineHeight: '1.4' }}>
            <span style={{ opacity: 0.7 }}>Student Name:</span> <span style={{ fontWeight: 900 }}>{selectedStudent.name}</span>
            <span style={{ opacity: 0.7 }}>Father's Name:</span> <span style={{ fontWeight: 900 }}>{selectedStudent.fatherName}</span>
            <span style={{ opacity: 0.7 }}>Mother's Name:</span> <span style={{ fontWeight: 900 }}>{selectedStudent.motherName || '---'}</span>
            <span style={{ opacity: 0.7 }}>Address:</span> <span style={{ fontWeight: 900 }}>{selectedStudent.address}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1mm', lineHeight: '1.4' }}>
            <span style={{ opacity: 0.7 }}>Grade / Class:</span> <span style={{ fontWeight: 900 }}>Class {selectedStudent.currentClass}</span>
            <span style={{ opacity: 0.7 }}>Roll Number:</span> <span style={{ fontWeight: 900 }}>#{selectedStudent.rollNumber}</span>
            <span style={{ opacity: 0.7 }}>Gender:</span> <span style={{ fontWeight: 900 }}>{selectedStudent.gender}</span>
            <span style={{ opacity: 0.7 }}>Date of Birth:</span> <span style={{ fontWeight: 900 }}>{selectedStudent.dob || '---'}</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', border: '2px solid #000' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'left' }}>Subject Module</th>
              <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>Aggregate (OB/FM)</th>
              <th style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {combinedData.map((item: any, i: number) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '2mm', fontWeight: 700, textTransform: 'uppercase' }}>{item.name}</td>
                <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>{item.totalObtained} / {item.totalFull}</td>
                <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center', fontWeight: 800 }}>{getGrade((item.totalObtained / item.totalFull) * 100)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f0f0', fontWeight: 900 }}>
              <td style={{ border: '2px solid #000', padding: '3mm', textAlign: 'right' }}>AGGREGATE SESSION TOTAL:</td>
              <td style={{ border: '2px solid #000', padding: '3mm', textAlign: 'center' }}>{grandObtained} / {grandMax}</td>
              <td style={{ border: '2px solid #000', padding: '3mm', textAlign: 'center', fontSize: '10pt' }}>{percentage}%</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: '6mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm' }}>
          <div style={{ padding: '1.5mm', border: '1.5px solid #000', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase' }}>Final Session Grade</p>
            <p style={{ margin: 0, fontSize: '11pt', fontWeight: 900 }}>{getGrade(percentage)}</p>
          </div>
          <div style={{ padding: '1.5mm', border: '1.5px solid #000', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase' }}>Academic Position</p>
            <p style={{ margin: 0, fontSize: '11pt', fontWeight: 900 }}>{getOrdinal(rankingsData.classRankings.findIndex((r: any) => r.id === selectedStudent.id) + 1)}</p>
          </div>
        </div>

        {/* Signature Section positioned slightly higher */}
        <div style={{ marginTop: '15mm', marginBottom: '5mm', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase' }}>
          <div style={{ width: '55mm' }}>
            <div style={{ borderTop: '2px solid #000', paddingTop: '2mm' }}>
              Class Teacher
            </div>
          </div>
          <div style={{ width: '55mm' }}>
            <div style={{ borderTop: '2px solid #000', paddingTop: '2mm' }}>
              Principal / Seal
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Character Certificate Template
  return (
    <div className="pdf-page" style={{ padding: '4mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '297mm', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '4mm double #000', fontFamily: 'Noto Serif, serif', textAlign: 'center', padding: '6mm', position: 'relative', boxSizing: 'border-box' }}>
        <div style={{ marginTop: '0mm' }}>
          <h1 style={{ fontSize: '20pt', fontWeight: 900, margin: 0, textTransform: 'uppercase', color: '#1e1b4b' }}>{schoolSettings.name}</h1>
          <p style={{ fontSize: '8pt', fontWeight: 700, margin: '1mm 0', opacity: 0.8, textTransform: 'uppercase' }}>{schoolSettings.address}</p>
          <div style={{ height: '4mm' }}></div>
          <h2 style={{ fontSize: '22pt', fontStyle: 'italic', margin: 0, borderBottom: '1.5px solid #ccc', display: 'inline-block', padding: '0 8mm 1mm 8mm', color: '#1e3a8a' }}>Character Certificate</h2>
        </div>
        
        <div style={{ marginTop: '6mm', fontSize: '10.5pt', lineHeight: '1.6', padding: '0 4mm', color: '#334155' }}>
          <p style={{ margin: '2mm 0' }}>This is to certify that Mr./Ms. <span style={{ fontWeight: 900, fontSize: '13pt', textTransform: 'uppercase', color: '#000' }}>{selectedStudent.name}</span></p>
          <p style={{ margin: '2mm 0' }}>Son / Daughter of Mr. <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#000' }}>{selectedStudent.fatherName}</span> & Mrs. <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#000' }}>{selectedStudent.motherName || '---'}</span>,</p>
          <p style={{ margin: '2mm 0' }}>residing at <span style={{ fontWeight: 700, color: '#000' }}>{selectedStudent.address}</span>, and born on <span style={{ fontWeight: 700, color: '#000' }}>{selectedStudent.dob || '---'}</span>,</p>
          <p style={{ margin: '2mm 0' }}>bearing Roll Number <span style={{ fontWeight: 900, color: '#000' }}>#{selectedStudent.rollNumber}</span>, has been a bonafide student of this institution in <span style={{ fontWeight: 900, color: '#000' }}>Grade {selectedStudent.currentClass}</span> during the academic session <span style={{ fontWeight: 700, color: '#000' }}>{new Date().getFullYear()} AD</span>.</p>
          
          <div style={{ margin: '4mm 10mm', padding: '2.5mm', border: '1.5px dashed #94a3b8', background: '#f8fafc', borderRadius: '4mm' }}>
            <p style={{ fontSize: '8.5pt', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5mm', color: '#1e40af' }}>Academic Achievement Record</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '10.5pt', fontWeight: 900, color: '#000' }}>
              <div style={{textAlign: 'center'}}>
                 <p style={{fontSize: '7pt', color: '#64748b', margin: 0}}>MARKS OBTAINED</p>
                 <span>{grandObtained} / {grandMax}</span>
              </div>
              <div style={{width: '1px', background: '#cbd5e1'}}></div>
              <div style={{textAlign: 'center'}}>
                 <p style={{fontSize: '7pt', color: '#64748b', margin: 0}}>PERCENTAGE</p>
                 <span style={{color: '#1e3a8a'}}>{percentage}%</span>
              </div>
              <div style={{width: '1px', background: '#cbd5e1'}}></div>
              <div style={{textAlign: 'center'}}>
                 <p style={{fontSize: '7pt', color: '#64748b', margin: 0}}>FINAL GRADE</p>
                 <span>{getGrade(percentage)}</span>
              </div>
            </div>
          </div>

          <p style={{ fontStyle: 'italic', fontSize: '9.5pt', lineHeight: '1.5', margin: '4mm 0' }}>"Throughout his/her tenure at this institution, his/her character and conduct have been found exemplary. He/She has demonstrated commendable dedication to academic pursuits and moral values. We wish them grand success in all future endeavors."</p>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', padding: '0 6mm 8mm 6mm', fontSize: '8.5pt', fontWeight: 700, textTransform: 'uppercase' }}>
          <div style={{ width: '50mm' }}>
            <div style={{ borderTop: '1.5px solid #000', paddingTop: '2mm', textAlign: 'center' }}>
              Class Teacher
            </div>
          </div>
          <div style={{ width: '50mm' }}>
            <div style={{ borderTop: '1.5px solid #000', paddingTop: '2mm', textAlign: 'center' }}>
              Principal / Director
              <p style={{fontSize: '6.5pt', fontWeight: 500, marginTop: '1mm', color: '#94a3b8'}}>(OFFICIAL SEAL)</p>
            </div>
          </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: '6mm', width: '100%', left: 0, textAlign: 'center' }}>
           <p style={{fontSize: '7.5pt', color: '#94a3b8', margin: 0}}>Date of Issue: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

const MeritListTemplate: React.FC<any> = ({ selectedClass, schoolSettings, rankingsData, getOrdinal }) => {
  return (
    <div style={{ background: '#fff', color: '#000', fontFamily: 'sans-serif' }}>
       <div className="pdf-page" style={{ height: 'auto', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '5px double #000', paddingBottom: '6mm' }}>
            <h1 style={{ fontSize: '24pt', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{schoolSettings.name}</h1>
            <p style={{ fontSize: '10pt', fontWeight: 700, margin: '1mm 0' }}>{schoolSettings.address}</p>
            <div style={{ marginTop: '4mm', display: 'inline-block', border: '2.5px solid #000', padding: '2mm 8mm' }}>
              <h2 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1pt', margin: 0 }}>Official Class Merit List</h2>
            </div>
            <p style={{ marginTop: '3mm', fontSize: '10pt', fontWeight: 800 }}>ACADEMIC LEVEL: CLASS {selectedClass} • SESSION: {new Date().getFullYear()} AD</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '9pt' }}>
            <thead>
              <tr style={{ background: '#f1f1f1' }}>
                <th style={{ border: '1px solid #000', padding: '3mm', width: '15mm', textAlign: 'center' }}>Rank</th>
                <th style={{ border: '1px solid #000', padding: '3mm', width: '15mm', textAlign: 'center' }}>Roll</th>
                <th style={{ border: '1px solid #000', padding: '3mm', textAlign: 'left' }}>Student Name</th>
                <th style={{ border: '1px solid #000', padding: '3mm', textAlign: 'left' }}>Father's Name</th>
                <th style={{ border: '1px solid #000', padding: '3mm', textAlign: 'right', width: '25mm' }}>Score</th>
                <th style={{ border: '1px solid #000', padding: '3mm', textAlign: 'right', width: '20mm' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {rankingsData.classRankings.map((r: any, idx: number) => (
                <tr key={r.id} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'center', fontWeight: 900 }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'center', fontWeight: 700 }}>{r.rollNumber}</td>
                  <td style={{ border: '1px solid #000', padding: '2.5mm', fontWeight: 800, textTransform: 'uppercase' }}>{r.name}</td>
                  <td style={{ border: '1px solid #000', padding: '2.5mm', textTransform: 'uppercase' }}>{r.fatherName}</td>
                  <td style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'right' }}>{r.totalObtained}/{r.totalMax}</td>
                  <td style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'right', fontWeight: 900 }}>{r.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rankingsData.classRankings.length > 0 && (
            <div style={{ marginTop: 'auto' }}>
              <div style={{ marginTop: '10mm', padding: '4mm', background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: '8pt', fontStyle: 'italic', lineHeight: '1.4' }}>
                Verification Note: This merit list is computed based on session-wide aggregate scores across all terminal evaluations.
              </div>

              <div style={{ marginTop: '10mm', paddingBottom: '15mm', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>
                <div style={{ width: '50mm' }}>
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '1.5mm' }}>
                    Class Teacher
                  </div>
                </div>
                <div style={{ width: '50mm' }}>
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '1.5mm' }}>
                    Principal
                  </div>
                </div>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};

const AdmitCardsPreview: React.FC<any> = ({ students, schoolSettings, term }) => {
  // Chunk students into pairs for A4 (2 per page)
  const studentPairs = [];
  for (let i = 0; i < students.length; i += 2) {
    studentPairs.push(students.slice(i, i + 2));
  }

  return (
    <div style={{ background: '#fff', width: '100%' }}>
       {studentPairs.map((pair, pageIdx) => (
          <div key={pageIdx} className="pdf-page" style={{ padding: '6mm', display: 'flex', flexDirection: 'column', gap: '6mm', pageBreakAfter: 'always' }}>
             {pair.map((student: Student) => (
                <div key={student.id} style={{ height: '128mm', border: '2px solid #000', padding: '5mm', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '3mm', marginBottom: '4mm' }}>
                      <h1 style={{ fontSize: '16pt', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>{schoolSettings.name}</h1>
                      <p style={{ fontSize: '7.5pt', fontWeight: 700, margin: '0.5mm 0' }}>{schoolSettings.address}</p>
                      <div style={{ background: '#000', color: '#fff', display: 'inline-block', padding: '1mm 5mm', marginTop: '1.5mm' }}>
                         <span style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8mm' }}>Examination Admit Card</span>
                      </div>
                      <p style={{ fontSize: '8pt', fontWeight: 900, margin: '1.5mm 0 0 0' }}>{term} - {new Date().getFullYear()} AD</p>
                   </div>

                   <div style={{ display: 'flex', gap: '10mm', alignItems: 'start' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3mm', fontSize: '10pt', fontWeight: 800, textTransform: 'uppercase' }}>
                         <div>
                            <span style={{ opacity: 0.6, fontSize: '8pt' }}>Student Name:</span>
                            <div style={{ borderBottom: '1px solid #ccc', padding: '1mm 0' }}>{student.name}</div>
                         </div>
                         <div>
                            <span style={{ opacity: 0.6, fontSize: '8pt' }}>Father's Name:</span>
                            <div style={{ borderBottom: '1px solid #ccc', padding: '1mm 0' }}>{student.fatherName}</div>
                         </div>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm' }}>
                            <div>
                               <span style={{ opacity: 0.6, fontSize: '8pt' }}>Class:</span>
                               <div style={{ borderBottom: '1px solid #ccc', padding: '1mm 0' }}>{student.currentClass}</div>
                            </div>
                            <div>
                               <span style={{ opacity: 0.6, fontSize: '8pt' }}>Roll Number:</span>
                               <div style={{ borderBottom: '1px solid #ccc', padding: '1mm 0' }}>#{student.rollNumber}</div>
                            </div>
                         </div>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm' }}>
                            <div>
                               <span style={{ opacity: 0.6, fontSize: '8pt' }}>Date of Birth:</span>
                               <div style={{ borderBottom: '1px solid #ccc', padding: '1mm 0', fontSize: '9pt' }}>{student.dob || '---'}</div>
                            </div>
                            <div>
                               <span style={{ opacity: 0.6, fontSize: '8pt' }}>Address:</span>
                               <div style={{ borderBottom: '1px solid #ccc', padding: '1mm 0', fontSize: '9pt' }}>{student.address}</div>
                            </div>
                         </div>
                      </div>
                      <div style={{ width: '35mm', height: '40mm', border: '1.5px solid #000', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyItems: 'center', overflow: 'hidden' }}>
                         {student.profilePicture ? (
                            <img src={student.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                            <div style={{ textAlign: 'center', width: '100%', opacity: 0.2 }}>
                               <UserCircle size={48} style={{ margin: 'auto' }} />
                               <p style={{ fontSize: '6pt' }}>Photo</p>
                            </div>
                         )}
                      </div>
                   </div>

                   <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>
                      <div style={{ width: '45mm', textAlign: 'center' }}>
                         <div style={{ borderTop: '1px solid #000', paddingTop: '1mm' }}>Class Teacher</div>
                      </div>
                      <div style={{ width: '45mm', textAlign: 'center' }}>
                         <div style={{ borderTop: '1px solid #000', paddingTop: '1mm' }}>Principal Seal</div>
                      </div>
                   </div>

                   <div style={{ position: 'absolute', right: '-15mm', top: '15mm', background: '#f1f5f9', transform: 'rotate(45deg)', padding: '2mm 40mm', zIndex: -1, opacity: 0.5 }}>
                      <span style={{ fontSize: '8pt', fontWeight: 900 }}>OFFICIAL CARD</span>
                   </div>
                </div>
             ))}
          </div>
       ))}
    </div>
  );
};

export default ReportsSection;
