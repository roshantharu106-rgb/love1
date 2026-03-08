
import React, { useState, useMemo, useRef } from 'react';
import { 
  CreditCard, 
  Plus, 
  History, 
  Download, 
  Trash2, 
  Search, 
  Calendar, 
  TrendingDown, 
  PlusCircle, 
  Loader2,
  FileText,
  Wallet,
  ChevronRight,
  Hash,
  FileSpreadsheet,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  CheckCircle2
} from 'lucide-react';
import { Expenditure, ExpenditureCategory, SalaryRecord, Teacher, SchoolSettings } from '../types';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { storage } from '../utils/storage';

interface ExpenditureManagementProps {
  expenditures: Expenditure[];
  salaryRecords: SalaryRecord[];
  teachers: Teacher[];
  onUpdateExpenditures: (expenditures: Expenditure[]) => void;
  schoolSettings: SchoolSettings;
}

const CATEGORIES: ExpenditureCategory[] = [
  'Utilities', 'Maintenance', 'Office Supplies', 'Staff Welfare', 'Events', 'Infrastructure', 'Transportation', 'Food/Canteen', 'Others'
];

type FilterPreset = 'All Time' | 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'This Year' | 'Custom Range';

const ExpenditureManagement: React.FC<ExpenditureManagementProps> = ({ 
  expenditures, 
  salaryRecords, 
  teachers, 
  onUpdateExpenditures, 
  schoolSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'add'>('history');
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('All Time');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenditureCategory | 'All' | 'Salary'>('All');
  const [includeSalaries, setIncludeSalaries] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Expenditure>>({
    description: '',
    category: 'Utilities',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; recordId: string; itemName: string }>({
    isOpen: false,
    recordId: '',
    itemName: ''
  });

  const consolidatedList = useMemo(() => {
    let list: any[] = expenditures.map(e => ({ ...e, type: 'General' }));
    
    if (includeSalaries) {
      const salaryExp = salaryRecords.map(s => {
        const teacher = teachers.find(t => t.id === s.teacherId);
        return {
          id: s.id,
          description: `Staff Salary: ${teacher?.name || 'Staff'}`,
          category: 'Salary',
          amount: s.amount,
          date: s.paymentDate,
          remarks: `Paid for ${s.month} ${s.year}`,
          type: 'Salary'
        };
      });
      list = [...list, ...salaryExp];
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return list.filter(item => {
      const itemDate = new Date(item.date);
      const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      
      let matchesDate = true;
      if (filterPreset === 'Today') matchesDate = itemDay.getTime() === today.getTime();
      else if (filterPreset === 'Yesterday') {
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = itemDay.getTime() === yesterday.getTime();
      } else if (filterPreset === 'This Week') {
        const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
        matchesDate = itemDay.getTime() >= lastWeek.getTime();
      } else if (filterPreset === 'This Month') matchesDate = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      else if (filterPreset === 'This Year') matchesDate = itemDate.getFullYear() === now.getFullYear();
      else if (filterPreset === 'Custom Range') matchesDate = item.date >= fromDate && item.date <= toDate;

      const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;

      return matchesDate && matchesSearch && matchesCat;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenditures, salaryRecords, teachers, includeSalaries, filterPreset, fromDate, toDate, searchQuery, selectedCategory]);

  const totalOutflow = useMemo(() => {
    return consolidatedList.reduce((sum, item) => sum + item.amount, 0);
  }, [consolidatedList]);

  const handleExportExcel = () => {
    const headers = ['S.N.', 'Date', 'Particulars / Description', 'Category', 'Amount (NPR)', 'Remarks'];
    const rows = consolidatedList.map((item, idx) => [
      idx + 1,
      item.date, 
      item.description, 
      item.category, 
      item.amount, 
      item.remarks || ''
    ]);
    rows.push(['', '', 'GRAND TOTAL OUTFLOW', '', totalOutflow, '']);
    
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Expenditure_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const opt = {
      margin: 10,
      filename: `Audit_Expenditure_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, logging: false, letterRendering: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await window.html2pdf().from(pdfRef.current).set(opt).save();
    } catch (err) {
      console.error('PDF error:', err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddExpenditure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || formData.amount <= 0) return;

    const newExp: Expenditure = {
      id: crypto.randomUUID(),
      description: formData.description || '',
      category: formData.category as ExpenditureCategory,
      amount: Number(formData.amount),
      date: formData.date || new Date().toISOString().split('T')[0],
      remarks: formData.remarks
    };

    onUpdateExpenditures([...expenditures, newExp]);
    setFormData({ description: '', category: 'Utilities', amount: 0, date: new Date().toISOString().split('T')[0], remarks: '' });
    setActiveTab('history');
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border w-fit no-print">
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <History size={16} /> Audit Ledger
        </button>
        <button onClick={() => setActiveTab('add')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <PlusCircle size={16} /> New Entry
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl">
                 <Wallet className="absolute right-[-10%] top-[-10%] text-white/5" size={160} />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Filtered Cash Outflow</p>
                 <h3 className="text-5xl font-black">NPR {totalOutflow.toLocaleString()}</h3>
                 <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 w-fit px-4 py-1.5 rounded-full border border-emerald-500/20">
                    <TrendingDown size={14} /> Total Expenditure
                 </div>
              </div>
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Audit Transactions</p>
                 <h3 className="text-3xl font-black text-slate-800">{consolidatedList.length} Records Found</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-2">Audit Range: {filterPreset}</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 no-print space-y-6">
              <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Search</label>
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          <input type="text" placeholder="Filter details..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none w-56 focus:border-indigo-500" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Including Salaries</label>
                       <button 
                        onClick={() => setIncludeSalaries(!includeSalaries)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${includeSalaries ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                       >
                         {includeSalaries ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                         <span className="text-[10px] font-black uppercase">{includeSalaries ? 'Enabled' : 'Disabled'}</span>
                       </button>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-1.5 justify-end">
                    {['All Time', 'Today', 'Yesterday', 'This Week', 'This Month', 'This Year', 'Custom Range'].map((p: any) => (
                       <button key={p} onClick={() => setFilterPreset(p)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${filterPreset === p ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{p}</button>
                    ))}
                 </div>
              </div>

              {filterPreset === 'Custom Range' && (
                <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                   <div className="flex-1">
                      <label className="text-[8px] font-black uppercase text-indigo-400 ml-1">From</label>
                      <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl font-bold text-xs" />
                   </div>
                   <ChevronRight className="text-indigo-200 mt-4" />
                   <div className="flex-1">
                      <label className="text-[8px] font-black uppercase text-indigo-400 ml-1">To</label>
                      <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl font-bold text-xs" />
                   </div>
                </div>
              )}
           </div>

           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20"><History size={20}/></div>
                    <h3 className="text-lg font-black text-indigo-900 uppercase">Financial Audit Ledger</h3>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-all shadow-md">
                       <FileSpreadsheet size={14}/> Export Excel
                    </button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-rose-700 transition-all shadow-md">
                       {isDownloading ? <Loader2 className="animate-spin" size={14}/> : <Download size={14}/>} Download PDF
                    </button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                       <tr>
                          <th className="px-6 py-5 w-16 text-center">S.N.</th>
                          <th className="px-8 py-5">Date</th>
                          <th className="px-8 py-5">Particulars / Description</th>
                          <th className="px-8 py-5 text-right">Amount (NPR)</th>
                          <th className="px-8 py-5 text-right no-print">Manage</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {consolidatedList.length > 0 ? consolidatedList.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 group transition-all">
                             <td className="px-6 py-6 text-center text-slate-400 font-bold text-xs">{index + 1}</td>
                             <td className="px-8 py-6 font-bold text-slate-500 text-xs">{item.date}</td>
                             <td className="px-8 py-6">
                                <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.description}</div>
                                {item.remarks && <div className="text-[10px] text-slate-400 font-medium italic mt-0.5">{item.remarks}</div>}
                             </td>
                             <td className="px-8 py-6 text-right font-black text-slate-900">NPR {item.amount.toLocaleString()}</td>
                             <td className="px-8 py-6 text-right no-print">
                                {item.type === 'General' ? (
                                   <button onClick={() => setDeleteModal({ isOpen: true, recordId: item.id, itemName: item.description })} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
                                      <Trash2 size={18} />
                                   </button>
                                ) : (
                                   <span className="text-[8px] font-black text-slate-300 uppercase italic px-4">Locked (Payroll)</span>
                                )}
                             </td>
                          </tr>
                       )) : (
                          <tr><td colSpan={5} className="px-8 py-32 text-center text-slate-300 font-black uppercase text-xs italic opacity-60">No financial activity recorded</td></tr>
                       )}
                    </tbody>
                    {consolidatedList.length > 0 && (
                       <tfoot>
                          <tr className="bg-slate-50/50 font-black text-slate-900 border-t-2 border-slate-200">
                             <td colSpan={3} className="px-8 py-6 text-right uppercase text-xs tracking-[0.2em]">Grand Total Outflow (Sum):</td>
                             <td className="px-8 py-6 text-right text-xl">NPR {totalOutflow.toLocaleString()}</td>
                             <td className="no-print"></td>
                          </tr>
                       </tfoot>
                    )}
                 </table>
              </div>
           </div>
        </div>
      ) : (
        <div className="max-w-4xl bg-white rounded-[3rem] shadow-sm border p-12 animate-in slide-in-from-bottom-2 duration-300">
           <div className="mb-12 border-b border-slate-100 pb-8 flex items-center gap-6">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-inner"><CreditCard size={36} /></div>
              <div>
                 <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Post Expenditure Record</h3>
                 <p className="text-sm text-slate-400 mt-1 font-medium uppercase tracking-widest">Entry will be permanently logged in the audit vault</p>
              </div>
           </div>

           <form onSubmit={handleAddExpenditure} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category / Group</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-xs outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none">
                       {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tx Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-slate-700 outline-none focus:border-indigo-500" required />
                    </div>
                 </div>
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description / Particulars *</label>
                    <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Office Supplies / Maintenance" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-500" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Amount (NPR) *</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                      <input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="0.00" className="w-full pl-12 pr-6 py-5 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] font-black text-3xl text-indigo-700 outline-none focus:border-indigo-500" required />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Additional Remarks</label>
                    <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Bill No / Pay Method" className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-500" />
                 </div>
              </div>
              
              <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3 text-amber-600">
                    <AlertCircle size={20} />
                    <p className="text-[10px] font-black uppercase tracking-tight">Financial record entries are permanent for integrity</p>
                 </div>
                 <button type="submit" className="px-12 py-5 bg-indigo-700 text-white font-black rounded-3xl uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all">Save Expenditure Entry</button>
              </div>
           </form>
        </div>
      )}

      <div className="pdf-capture-container" ref={pdfRef}>
        <div className="pdf-page" style={{ padding: '12mm', fontFamily: 'sans-serif', minHeight: '297mm', background: '#fff', color: '#000' }}>
            <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '4px double #000', paddingBottom: '6mm' }}>
                <h1 style={{ fontSize: '24pt', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{schoolSettings.name}</h1>
                <p style={{ fontSize: '10pt', fontWeight: 700, margin: '1mm 0', opacity: 0.8 }}>{schoolSettings.address}</p>
                <div style={{ marginTop: '4mm', display: 'inline-block', border: '3px solid #000', padding: '1.5mm 10mm' }}>
                    <h2 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1mm', margin: 0 }}>Expenditure Audit Ledger</h2>
                </div>
                <p style={{ marginTop: '3mm', fontSize: '8pt', fontWeight: 800 }}>PERIOD: {fromDate} TO {toDate} • AUDIT DATE: {new Date().toLocaleDateString()}</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '8.5pt' }}>
                <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'center', width: '15mm' }}>S.N.</th>
                        <th style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'left', width: '30mm' }}>DATE</th>
                        <th style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'left' }}>PARTICULARS / DESCRIPTION</th>
                        <th style={{ border: '1px solid #000', padding: '2.5mm', textAlign: 'right', width: '40mm' }}>AMOUNT (NPR)</th>
                    </tr>
                </thead>
                <tbody>
                    {consolidatedList.map((item, idx) => (
                        <tr key={item.id} style={{ pageBreakInside: 'avoid' }}>
                            <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ border: '1px solid #000', padding: '2mm' }}>{item.date}</td>
                            <td style={{ border: '1px solid #000', padding: '2mm', fontWeight: 700, textTransform: 'uppercase' }}>
                               {item.description}
                               {item.remarks && <div style={{ fontSize: '7pt', fontWeight: 400, fontStyle: 'italic', color: '#666', marginTop: '0.5mm' }}>Note: {item.remarks}</div>}
                            </td>
                            <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'right', fontWeight: 900 }}>{item.amount.toLocaleString()}.00</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#f9f9f9', fontWeight: 900 }}>
                        <td colSpan={3} style={{ border: '1.5px solid #000', padding: '4mm', textAlign: 'right', textTransform: 'uppercase', fontSize: '10pt' }}>Total Aggregate Session Outflow:</td>
                        <td style={{ border: '1.5px solid #000', padding: '4mm', textAlign: 'right', fontSize: '11pt' }}>NPR {totalOutflow.toLocaleString()}.00</td>
                    </tr>
                </tfoot>
            </table>

            <div style={{ marginTop: '25mm', display: 'flex', justifyContent: 'space-between', padding: '0 10mm', fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>
               <div style={{ width: '60mm', textAlign: 'center' }}>
                  <div style={{ height: '15mm' }}></div>
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '2mm' }}>Accountant</div>
               </div>
               <div style={{ width: '60mm', textAlign: 'center' }}>
                  <div style={{ height: '15mm' }}></div>
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '2mm' }}>Principal / Seal</div>
               </div>
            </div>
            
            <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '5mm', opacity: 0.4 }}>
               <p style={{ fontSize: '7pt', textTransform: 'uppercase' }}>Digital Institutional Ledger Audit • {schoolSettings.name}</p>
            </div>
        </div>
      </div>

      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={() => { onUpdateExpenditures(expenditures.filter(e => e.id !== deleteModal.recordId)); setDeleteModal({...deleteModal, isOpen: false}); }} title="Delete Expenditure" itemName={deleteModal.itemName} />
    </div>
  );
};

export default ExpenditureManagement;
