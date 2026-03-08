
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Banknote, 
  History, 
  PlusCircle, 
  Search, 
  Trash2, 
  Download, 
  Wallet,
  Filter,
  Loader2,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { Teacher, SalaryRecord, NepaliMonth, User as UserType, SchoolSettings } from '../types';
import { NEPALI_MONTHS } from '../constants';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { storage } from '../utils/storage';

interface SalaryManagementProps {
  teachers: Teacher[];
  salaryRecords: SalaryRecord[];
  onUpdateSalary: (records: SalaryRecord[]) => void;
  currentUser: UserType;
  schoolSettings: SchoolSettings;
}

const NEPALI_YEARS = Array.from({ length: 11 }, (_, i) => (2080 + i).toString());

const SalaryManagement: React.FC<SalaryManagementProps> = ({ 
  teachers, 
  salaryRecords, 
  onUpdateSalary, 
  currentUser, 
  schoolSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeacher, setFilterTeacher] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<NepaliMonth | 'All'>('All');
  const [filterYear, setFilterYear] = useState<string>(storage.getSelectedYear() || '2081');
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'admin';

  const [formData, setFormData] = useState({
    teacherId: '',
    amount: 0,
    month: NEPALI_MONTHS[0] as NepaliMonth,
    year: storage.getSelectedYear() || '2081',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; recordId: string; itemName: string }>({
    isOpen: false,
    recordId: '',
    itemName: ''
  });

  const filteredRecords = useMemo(() => {
    return salaryRecords.filter(record => {
      const teacher = teachers.find(t => t.id === record.teacherId);
      const matchesSearch = (teacher?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeacher = filterTeacher === 'All' || record.teacherId === filterTeacher;
      const matchesMonth = filterMonth === 'All' || record.month === filterMonth;
      const matchesYear = filterYear === '' || record.year === filterYear;
      return matchesSearch && matchesTeacher && matchesMonth && matchesYear;
    }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [salaryRecords, teachers, searchQuery, filterTeacher, filterMonth, filterYear]);

  const totalDisbursed = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.amount, 0), [filteredRecords]);

  const handlePaySalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId || formData.amount <= 0) return;
    const newRecord: SalaryRecord = { id: crypto.randomUUID(), teacherId: formData.teacherId, amount: Number(formData.amount), month: formData.month, year: formData.year, paymentDate: formData.paymentDate, remarks: formData.remarks };
    onUpdateSalary([...salaryRecords, newRecord]);
    setFormData({ ...formData, teacherId: '', amount: 0, remarks: '' });
    setActiveTab('history');
  };

  const handleExportExcel = () => {
    const headers = ['S.N.', 'Payment Date', 'Staff Member', 'Month', 'Year', 'Amount (NPR)'];
    const rows = filteredRecords.map((r, idx) => {
      const t = teachers.find(teach => teach.id === r.teacherId);
      return [idx + 1, r.paymentDate, t?.name || 'Unknown', r.month, r.year, r.amount];
    });
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Salary_Disbursement_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border w-fit no-print">
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <History size={16} /> Disbursement Audit
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('pay')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pay' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <PlusCircle size={16} /> Process Payroll
          </button>
        )}
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <Wallet className="absolute right-[-10%] top-[-10%] text-white/5" size={180} />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Filtered Aggregate Outflow</p>
                <h3 className="text-5xl font-black tracking-tighter">NPR {totalDisbursed.toLocaleString()}</h3>
                <p className="mt-4 text-[10px] font-black uppercase bg-indigo-500/20 w-fit px-4 py-1.5 rounded-full border border-indigo-400/20 text-indigo-300">{filteredRecords.length} Transactions Captured</p>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 no-print space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Month</label>
                  <div className="relative">
                    <select value={filterMonth} onChange={e => setFilterMonth(e.target.value as any)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                      <option value="All">Aggregate (All Months)</option>
                      {NEPALI_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Member</label>
                  <div className="relative">
                    <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                      <option value="All">All Faculty</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Audit Search</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" placeholder="Filter by particulars..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs focus:border-indigo-500 outline-none" />
                  </div>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><History size={20}/></div>
                    <h3 className="text-lg font-black text-indigo-900 uppercase">Payroll Audit Ledger</h3>
                 </div>
                 <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                    <FileSpreadsheet size={16}/> Export Institutional Excel
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                          <th className="px-6 py-5 w-16 text-center">S.N.</th>
                          <th className="px-8 py-5">Value Date</th>
                          <th className="px-8 py-5">Faculty Member</th>
                          <th className="px-8 py-5">Salary Period</th>
                          <th className="px-8 py-5 text-right">Disbursed (NPR)</th>
                          <th className="px-8 py-5 text-right no-print">Manage</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredRecords.map((record, idx) => {
                          const t = teachers.find(teach => teach.id === record.teacherId);
                          return (
                             <tr key={record.id} className="hover:bg-slate-50/50 group transition-all">
                                <td className="px-6 py-6 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                                <td className="px-8 py-6 font-bold text-slate-500 text-xs">{record.paymentDate}</td>
                                <td className="px-8 py-6">
                                   <div className="font-black text-slate-800 uppercase text-sm tracking-tight">{t?.name || 'Unknown Staff'}</div>
                                   {record.remarks && <div className="text-[10px] text-slate-400 font-medium italic mt-0.5">{record.remarks}</div>}
                                </td>
                                <td className="px-8 py-6">
                                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase border border-indigo-100/50">
                                      {record.month} {record.year}
                                   </span>
                                </td>
                                <td className="px-8 py-6 text-right font-black text-slate-900">NPR {record.amount.toLocaleString()}</td>
                                <td className="px-8 py-6 text-right no-print">
                                   {isAdmin && (
                                      <button 
                                        onClick={() => setDeleteModal({ isOpen: true, recordId: record.id, itemName: `Payment to ${t?.name}` })} 
                                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                      >
                                         <Trash2 size={18} />
                                      </button>
                                   )}
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                    {filteredRecords.length > 0 && (
                       <tfoot>
                          <tr className="bg-slate-50/50 border-t-2 border-slate-200">
                             <td colSpan={4} className="px-8 py-6 text-right font-black uppercase text-xs tracking-widest text-slate-400">Ledger Sub-Total:</td>
                             <td className="px-8 py-6 text-right text-xl font-black text-slate-900">NPR {totalDisbursed.toLocaleString()}</td>
                             <td className="no-print"></td>
                          </tr>
                       </tfoot>
                    )}
                 </table>
                 {filteredRecords.length === 0 && (
                   <div className="p-32 text-center text-slate-300 font-black uppercase text-xs italic tracking-widest opacity-60">No financial audit records found for selection</div>
                 )}
              </div>
           </div>
        </div>
      ) : (
        <div className="max-w-4xl bg-white rounded-[2.5rem] shadow-sm border p-12 animate-in slide-in-from-bottom-2">
           <div className="mb-10 border-b border-slate-100 pb-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><Banknote size={28} /></div>
              <div>
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Record Payroll Disbursement</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Post individual salary payments to the permanent ledger</p>
              </div>
           </div>
           <form onSubmit={handlePaySalary} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Faculty Member *</label>
                    <select value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer" required>
                       <option value="">-- Choose Member --</option>
                       {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Salary Month *</label>
                    <select value={formData.month} onChange={e => setFormData({...formData, month: e.target.value as NepaliMonth})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                       {NEPALI_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Amount (NPR) *</label>
                    <input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="0.00" className="w-full p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl font-black text-2xl text-indigo-700 outline-none focus:border-indigo-500 shadow-inner" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Date *</label>
                    <input type="date" value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500" required />
                 </div>
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notes / Remarks</label>
                    <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="e.g. Bank Transfer Ref / Partial Payment Note" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500" />
                 </div>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-end">
                 <button type="submit" className="px-14 py-5 bg-indigo-700 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-700/20 uppercase tracking-widest text-xs active:scale-95 transition-all">Execute Payroll Post</button>
              </div>
           </form>
        </div>
      )}

      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={() => { onUpdateSalary(salaryRecords.filter(r => r.id !== deleteModal.recordId)); setDeleteModal({ ...deleteModal, isOpen: false }); }} title="Void Salary Record" itemName={deleteModal.itemName} />
    </div>
  );
};

export default SalaryManagement;
