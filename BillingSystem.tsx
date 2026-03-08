
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ReceiptText, 
  History, 
  AlertCircle, 
  Download, 
  Printer, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  PlusCircle, 
  User, 
  Loader2,
  MapPin,
  Bus,
  MessageSquare,
  Send,
  ArrowUpRight,
  TrendingDown,
  FileText,
  Calendar,
  ChevronRight,
  MessageCircle,
  Calculator,
  Info,
  Zap,
  RefreshCw,
  FileSpreadsheet,
  Settings2,
  LayoutGrid
} from 'lucide-react';
import { Student, StudentClass, Invoice, InvoiceItem, User as UserType, SchoolSettings } from '../types';
import { CLASSES } from '../constants';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { storage } from '../utils/storage';

interface BillingSystemProps {
  students: Student[];
  invoices: Invoice[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
  currentUser: UserType;
  onUpdateNotices?: (notices: any[]) => void;
  notices?: any[];
  preselectedStudentId?: string;
  onClearPreselectedStudent?: () => void;
  schoolSettings: SchoolSettings;
  onUpdateSettings?: (settings: SchoolSettings) => void;
}

type DateFilterPreset = 'All Time' | 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'This Year' | 'Custom Range';

const STANDARD_FEES = [
  'Admission Fee', 'Monthly Tuition Fee', 'Examination Fee', 'Bus Fee', 'Library Fee', 'Hostel Fee', 'Uniform Fee', 'Computer Fee', 'Misc'
];

const DEFAULT_ITEMS: InvoiceItem[] = [];

const BillingSystem: React.FC<BillingSystemProps> = ({ 
  students, 
  invoices, 
  onUpdateInvoices, 
  currentUser,
  preselectedStudentId,
  onClearPreselectedStudent,
  schoolSettings,
  onUpdateSettings
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  const canCreateInvoices = isAdmin || (isTeacher && schoolSettings.allowTeacherBilling);

  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'dues'>(
    (preselectedStudentId && canCreateInvoices) ? 'create' : (isStudent ? 'dues' : 'history')
  );
  
  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('All Time');
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().split('T')[0]);
  const [customTo, setCustomTo] = useState(new Date().toISOString().split('T')[0]);
  const [isBulkFeeEditorOpen, setIsBulkFeeEditorOpen] = useState(false);
  
  const currentClassExamFee = useMemo(() => {
    return selectedClass !== 'All' ? (schoolSettings.examFees[selectedClass] || 0) : 0;
  }, [schoolSettings.examFees, selectedClass]);

  const [isDownloading, setIsDownloading] = useState(false);
  const historyReportRef = useRef<HTMLDivElement>(null);
  const duesReportRef = useRef<HTMLDivElement>(null);
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const receiptPDFRef = useRef<HTMLDivElement>(null);
  
  const [showReceiptModal, setShowReceiptModal] = useState<Invoice | null>(null);

  // Add print styles dynamically
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
        }
        body * {
          visibility: hidden;
        }
        #receipt-print-area, #receipt-print-area * {
          visibility: visible;
        }
        /* Ensure parent containers don't clip the print area */
        .fixed, .absolute, .relative, div {
          overflow: visible !important;
          max-height: none !important;
          height: auto !important;
        }
        #receipt-print-area {
          position: absolute !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          top: 0 !important;
          width: 180mm !important;
          max-width: 180mm !important;
          height: auto !important;
          margin: 0 !important;
          padding: 8mm !important;
          border: 1px solid #eee !important;
          box-shadow: none !important;
          background: white !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          box-sizing: border-box !important;
          font-size: 10pt !important;
        }
        #receipt-print-area h1 { font-size: 18pt !important; margin-bottom: 2mm !important; }
        #receipt-print-area h3 { font-size: 12pt !important; margin-bottom: 2mm !important; }
        #receipt-print-area p { margin: 0 !important; line-height: 1.4 !important; }
        #receipt-print-area table { font-size: 10pt !important; width: 100% !important; border-collapse: collapse !important; margin-bottom: 4mm !important; }
        #receipt-print-area th, #receipt-print-area td { padding: 2mm 3mm !important; border: 1px solid #000 !important; }
        #receipt-print-area .p-3 { padding: 3mm !important; border-width: 1px !important; }
        #receipt-print-area .gap-4 { gap: 4mm !important; }
        #receipt-print-area .mb-4 { margin-bottom: 4mm !important; }
        #receipt-print-area .mb-2 { margin-bottom: 2mm !important; }
        #receipt-print-area .mt-4 { margin-top: 6mm !important; }
        #receipt-print-area .text-base { font-size: 11pt !important; }
        #receipt-print-area .text-lg { font-size: 12pt !important; }
        #receipt-print-area .text-2xl { font-size: 18pt !important; }
        #receipt-print-area .grid { gap: 4mm !important; }
        #receipt-print-area .space-y-1 { space-y: 1mm !important; }
        #receipt-print-area * {
          color: #000 !important;
          border-color: #000 !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [formData, setFormData] = useState<{
    studentId: string;
    classId: StudentClass;
    items: InvoiceItem[];
    paidAmount: number;
    date: string;
    receivedBy: string;
  }>({
    studentId: '',
    classId: 'ECD',
    items: [...DEFAULT_ITEMS],
    paidAmount: 0,
    date: new Date().toISOString().split('T')[0],
    receivedBy: currentUser.displayName
  });

  useEffect(() => {
    if (preselectedStudentId && canCreateInvoices) {
      const student = students.find(s => s.id === preselectedStudentId);
      if (student) {
        setFormData(prev => ({
          ...prev,
          studentId: student.id,
          classId: student.currentClass
        }));
        setActiveTab('create');
        if (onClearPreselectedStudent) onClearPreselectedStudent();
      }
    }
  }, [preselectedStudentId, students, canCreateInvoices]);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; recordId: string; itemName: string }>({
    isOpen: false,
    recordId: '',
    itemName: ''
  });

  const getStudentById = (id: string) => students.find(s => s.id === id);

  const getStudentCurrentDues = (studentId: string) => {
    const studentInvoices = invoices
      .filter(inv => inv.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber));
    
    return studentInvoices.length > 0 ? studentInvoices[0].dueAmount : 0;
  };

  useEffect(() => {
    if (formData.studentId && canCreateInvoices) {
      const currentDues = getStudentCurrentDues(formData.studentId);
      const baseItems = formData.items.filter(item => 
        !item.description.toLowerCase().includes("previous outstanding")
      );

      if (currentDues > 0) {
        setFormData(prev => ({
          ...prev,
          items: [
            ...baseItems,
            { description: `Previous Outstanding Dues`, amount: currentDues }
          ]
        }));
      } else {
        setFormData(prev => ({ ...prev, items: baseItems }));
      }
    }
  }, [formData.studentId, canCreateInvoices]);

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return invoices.filter(inv => {
      const student = students.find(s => s.id === inv.studentId);
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        student?.name.toLowerCase().includes(q) || 
        student?.fatherName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q);

      const matchesClass = selectedClass === 'All' || student?.currentClass === selectedClass;
      const matchesUser = isStudent ? inv.studentId === currentUser.relatedId : true;

      const invDate = new Date(inv.date);
      const invDay = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate());
      
      let matchesDate = true;
      if (dateFilter === 'Today') matchesDate = invDay.getTime() === today.getTime();
      else if (dateFilter === 'Yesterday') {
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = invDay.getTime() === yesterday.getTime();
      } else if (dateFilter === 'This Week') {
        const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
        matchesDate = invDay.getTime() >= lastWeek.getTime();
      } else if (dateFilter === 'This Month') matchesDate = invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      else if (dateFilter === 'This Year') matchesDate = invDate.getFullYear() === now.getFullYear();
      else if (dateFilter === 'Custom Range') matchesDate = inv.date >= customFrom && inv.date <= customTo;

      return matchesSearch && matchesClass && matchesUser && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber));
  }, [invoices, students, searchQuery, selectedClass, isStudent, currentUser.relatedId, dateFilter, customFrom, customTo]);

  const duesList = useMemo(() => {
    const studentsWithDues = students.map(student => {
      const currentDue = getStudentCurrentDues(student.id);
      return { ...student, currentDue };
    }).filter(s => s.currentDue > 0);

    const matchesClass = (s: any) => selectedClass === 'All' || s.currentClass === selectedClass;
    const matchesUser = (s: any) => isStudent ? s.id === currentUser.relatedId : true;
    const q = searchQuery.toLowerCase();
    const matchesSearch = (s: any) => 
      s.name.toLowerCase().includes(q) || 
      s.fatherName.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q);

    return studentsWithDues.filter(s => matchesClass(s) && matchesUser(s) && matchesSearch(s));
  }, [students, invoices, selectedClass, isStudent, currentUser.relatedId, searchQuery]);

  const totalCollectedSum = useMemo(() => filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0), [filteredInvoices]);
  const totalDuesSum = useMemo(() => duesList.reduce((sum, s) => sum + s.currentDue, 0), [duesList]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateInvoices || !formData.studentId) return;
    
    const lastInvoiceNum = invoices.length > 0 
      ? Math.max(...invoices.map(inv => {
          const match = inv.invoiceNumber.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })) 
      : 0;
    
    const nextNum = lastInvoiceNum + 1;
    const newInvoiceNumber = `INV-${nextNum.toString().padStart(4, '0')}`;
    const invoiceTotal = formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const closingBalance = Math.max(0, invoiceTotal - formData.paidAmount);
    
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: newInvoiceNumber,
      studentId: formData.studentId,
      date: formData.date,
      items: formData.items.map(it => ({ ...it, amount: Number(it.amount) || 0 })),
      totalAmount: Number(invoiceTotal),
      paidAmount: Number(formData.paidAmount),
      dueAmount: Number(closingBalance),
      status: closingBalance <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Due'),
      receivedBy: formData.receivedBy || currentUser.displayName
    };

    onUpdateInvoices([...invoices, newInvoice]);
    setShowReceiptModal(newInvoice);
    setFormData({ 
      studentId: '', 
      classId: formData.classId, 
      items: [...DEFAULT_ITEMS], 
      paidAmount: 0, 
      date: new Date().toISOString().split('T')[0],
      receivedBy: currentUser.displayName
    });
  };

  const handleDownloadPDF = async (title: string, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDownloading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const opt = {
      margin: 0,
      filename: `${title}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        letterRendering: true, 
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      // @ts-ignore
      await window.html2pdf().from(ref.current).set(opt).save();
    } catch (err) {
      console.error(err);
      alert("System failed to generate PDF. Ensure the generation library is fully loaded.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportCSV = (type: 'history' | 'dues') => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = "";

    if (type === 'history') {
      headers = ['S.N.', 'Receipt ID', 'Date', 'Student Name', 'Father Name', 'Class', 'Total Billed', 'Collected Amount', 'Closing Balance'];
      rows = filteredInvoices.map((inv, idx) => {
        const s = getStudentById(inv.studentId);
        return [idx + 1, inv.invoiceNumber, inv.date, s?.name, s?.fatherName, s?.currentClass, inv.totalAmount, inv.paidAmount, inv.dueAmount];
      });
      rows.push(['', '', '', '', '', 'COLLECTED AMOUNT (SUM):', '', totalCollectedSum, '']);
      filename = `Collected_Fees_Report_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ['S.N.', 'Roll No', 'Student Name', 'Father Name', 'Class', 'Outstanding Dues'];
      rows = duesList.map((s, idx) => [idx + 1, s.rollNumber, s.name, s.fatherName, s.currentClass, s.currentDue]);
      rows.push(['', '', '', '', 'SUM OF DUES ONLY:', totalDuesSum]);
      filename = `Outstanding_Dues_Export_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleUpdateExamFeeGeneric = (cls: StudentClass, amount: string) => {
    if (!onUpdateSettings) return;
    const newAmount = Number(amount) || 0;
    const updatedSettings = {
      ...schoolSettings,
      examFees: {
        ...schoolSettings.examFees,
        [cls]: newAmount
      }
    };
    onUpdateSettings(updatedSettings);
    storage.saveSchoolSettings(updatedSettings);
  };

  const generateWhatsAppLink = (student: any) => {
    const fee = schoolSettings.examFees[student.currentClass] || 0;
    const totalWithExam = student.currentDue + fee;
    const message = `*PAYMENT REMINDER* 
${schoolSettings.name}

Dear Parent, 
This is to inform you that your ward *${student.name}* (Class ${student.currentClass}, Roll No: ${student.rollNumber}) has the following outstanding balance for the current term:

Academic Dues: NPR ${student.currentDue.toLocaleString()}
Exam Fee (Session): NPR ${fee.toLocaleString()}
-----------------------------------
*Total Payable Amount: NPR ${totalWithExam.toLocaleString()}*

Please settle the dues at the earliest.
Thank you, 
Institutional Registrar`;
    const phone = student.contactNumber.replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap bg-white p-1.5 rounded-2xl shadow-sm border w-fit no-print">
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <History size={16} /> Paid Ledger
        </button>
        {canCreateInvoices && (
          <button onClick={() => setActiveTab('create')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <PlusCircle size={16} /> New Voucher
          </button>
        )}
        <button onClick={() => setActiveTab('dues')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dues' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <AlertCircle size={16} /> Outstanding Dues
        </button>
      </div>

      {(activeTab === 'history' || activeTab === 'dues') && !isStudent && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6 no-print animate-in fade-in duration-300">
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="flex flex-wrap items-end gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Scope</label>
                   <select value={selectedClass} onChange={e => setSelectedClass(e.target.value as any)} className="block w-40 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs outline-none focus:border-indigo-500 appearance-none">
                      <option value="All">All Classes</option>
                      {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Audit Search</label>
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input type="text" placeholder="Name, Invoice #, Guardian..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-indigo-500 w-72" />
                   </div>
                </div>
              </div>

              {activeTab === 'history' && (
                <div className="flex-1 space-y-1.5 animate-in slide-in-from-right-4">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Revenue Timeline Filter</label>
                  <div className="flex flex-wrap gap-2 p-1.5 bg-indigo-50/30 border-2 border-indigo-50 rounded-2xl">
                    {(['All Time', 'Today', 'Yesterday', 'This Week', 'This Month', 'This Year', 'Custom Range'] as DateFilterPreset[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setDateFilter(p)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${dateFilter === p ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600 hover:bg-white'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'dues' && isAdmin && (
                <button 
                  onClick={() => setIsBulkFeeEditorOpen(!isBulkFeeEditorOpen)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isBulkFeeEditorOpen ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white text-indigo-700 border-indigo-50 hover:border-indigo-200'}`}
                >
                  <Settings2 size={16} /> {isBulkFeeEditorOpen ? 'Close Fee Editor' : 'Configure Exam Fees'}
                </button>
              )}
           </div>

           {dateFilter === 'Custom Range' && activeTab === 'history' && (
             <div className="flex items-center gap-4 p-5 bg-white border-2 border-indigo-100 rounded-2xl animate-in zoom-in-95">
                <div className="flex-1 space-y-1">
                   <label className="text-[8px] font-black uppercase text-indigo-400 ml-1">Start Date</label>
                   <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-full px-4 py-2 bg-slate-50 rounded-xl font-bold text-xs" />
                </div>
                <div className="mt-4"><ChevronRight className="text-indigo-200" /></div>
                <div className="flex-1 space-y-1">
                   <label className="text-[8px] font-black uppercase text-indigo-400 ml-1">End Date</label>
                   <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-full px-4 py-2 bg-slate-50 rounded-xl font-bold text-xs" />
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'dues' && isBulkFeeEditorOpen && isAdmin && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl animate-in slide-in-from-top-4 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-700 shadow-inner"><Calculator size={20} /></div>
                 <div>
                    <h3 className="font-black text-indigo-900 uppercase">Class-Wise Exam Fee Override</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Changes here are persistent and will reflect in WhatsApp reminders immediately.</p>
                 </div>
              </div>
              <button onClick={() => setIsBulkFeeEditorOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {CLASSES.map(cls => (
                <div key={cls} className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade {cls}</label>
                   <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">NPR</span>
                      <input 
                        type="number" 
                        value={schoolSettings.examFees[cls] || ''} 
                        onChange={e => handleUpdateExamFeeGeneric(cls, e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500"
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-700/20"><History size={24}/></div>
                 <div>
                    <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Revenue Receipt Ledger</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Transactions for: {dateFilter === 'Custom Range' ? `${customFrom} to ${customTo}` : dateFilter}</p>
                 </div>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => handleExportCSV('history')} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                    <FileSpreadsheet size={16}/> Export Excel
                  </button>
                  <button onClick={() => handleDownloadPDF('Revenue_Audit_Ledger', historyReportRef)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all shadow-md active:scale-95">
                    {isDownloading ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} Download Audit PDF
                  </button>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                  <tr>
                    <th className="px-8 py-5 w-16 text-center">S.N.</th>
                    <th className="px-8 py-5">Receipt ID</th>
                    <th className="px-8 py-5">Student Information</th>
                    <th className="px-8 py-5 text-center">Class</th>
                    <th className="px-8 py-5 text-right">Collected (NPR)</th>
                    <th className="px-8 py-5 text-right no-print">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.map((inv, idx) => {
                    const student = getStudentById(inv.studentId);
                    return (
                      <tr key={inv.id} className="hover:bg-indigo-50/10 transition-colors group">
                        <td className="px-8 py-6 text-center font-bold text-slate-400 text-sm">{idx + 1}</td>
                        <td className="px-8 py-6 font-black text-indigo-700 tracking-tight">{inv.invoiceNumber}</td>
                        <td className="px-8 py-6">
                           <div className="font-black text-slate-800 uppercase text-sm leading-tight group-hover:text-indigo-800 transition-colors">{student?.name}</div>
                           <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-2"><Calendar size={10}/> {inv.date}</div>
                        </td>
                        <td className="px-8 py-6 text-center"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500 border border-slate-200/50">{student?.currentClass}</span></td>
                        <td className="px-8 py-6 text-right font-black text-emerald-700 text-base">NPR {inv.paidAmount.toLocaleString()}</td>
                        <td className="px-8 py-6 text-right no-print space-x-1">
                          <button onClick={() => setShowReceiptModal(inv)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-white rounded-2xl transition-all shadow-none hover:shadow-lg active:scale-95"><Printer size={20} /></button>
                          {isAdmin && <button onClick={() => setDeleteModal({ isOpen: true, recordId: inv.id, itemName: inv.invoiceNumber })} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-white rounded-2xl transition-all shadow-none hover:shadow-lg active:scale-95"><Trash2 size={20} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr><td colSpan={6} className="px-8 py-32 text-center text-slate-300 font-black uppercase text-xs italic tracking-widest">No matching revenue transactions found</td></tr>
                  )}
                </tbody>
                {filteredInvoices.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                      <td colSpan={4} className="px-8 py-8 text-right uppercase text-xs tracking-widest text-slate-400">Total Collected Revenue:</td>
                      <td className="px-8 py-8 text-right text-3xl text-emerald-800 tracking-tighter">NPR {totalCollectedSum.toLocaleString()}</td>
                      <td className="no-print"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dues' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b bg-amber-50/30 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-700/20"><AlertCircle size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight">Active Accounts Receivable</h3>
                       <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Students with unsettled balances</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={() => handleExportCSV('dues')} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                      <FileSpreadsheet size={16}/> Export Excel
                    </button>
                    <button onClick={() => handleDownloadPDF('Institutional_Dues_Report', duesReportRef)} className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-rose-700 shadow-lg active:scale-95 transition-all">
                       {isDownloading ? <Loader2 className="animate-spin" size={16}/> : <FileText size={16}/>} Generate Dues PDF
                    </button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                       <tr>
                          <th className="px-8 py-5 w-16 text-center">S.N.</th>
                          <th className="px-8 py-5">Roll</th>
                          <th className="px-8 py-5">Student Identity</th>
                          <th className="px-8 py-5 text-center">Class</th>
                          <th className="px-8 py-5 text-right">Balance Due (NPR)</th>
                          <th className="px-8 py-5 text-right no-print">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {duesList.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-amber-50/20 transition-colors group">
                             <td className="px-8 py-6 text-center font-bold text-slate-400 text-sm">{idx + 1}</td>
                             <td className="px-8 py-6 font-black text-amber-700 font-mono tracking-tight text-base">#{s.rollNumber}</td>
                             <td className="px-8 py-6">
                                <div className="font-black text-slate-800 uppercase text-sm leading-tight group-hover:text-amber-800 transition-colors">{s.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold mt-1">Father: {s.fatherName}</div>
                             </td>
                             <td className="px-8 py-6 text-center"><span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500 shadow-sm">Class {s.currentClass}</span></td>
                             <td className="px-8 py-6 text-right font-black text-rose-700 text-base">NPR {s.currentDue.toLocaleString()}</td>
                             <td className="px-8 py-6 text-right no-print">
                                {isAdmin && (
                                  <div className="flex items-center justify-end gap-3">
                                    <button 
                                      onClick={() => window.open(generateWhatsAppLink(s), '_blank')} 
                                      title="Send WhatsApp Reminder" 
                                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95"
                                    >
                                      <Send size={18} />
                                    </button>
                                    <button 
                                      onClick={() => { setActiveTab('create'); setFormData(prev => ({...prev, studentId: s.id, classId: s.currentClass})); }} 
                                      title="Record Payment Entry" 
                                      className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                      <PlusCircle size={18} />
                                    </button>
                                  </div>
                                )}
                             </td>
                          </tr>
                       ))}
                       {duesList.length === 0 && (
                          <tr><td colSpan={6} className="px-8 py-32 text-center text-slate-300 font-black uppercase text-xs italic tracking-widest">Accounts are fully cleared</td></tr>
                       )}
                    </tbody>
                    {duesList.length > 0 && (
                       <tfoot>
                          <tr className="bg-amber-50/30 font-black text-slate-900 border-t-2 border-amber-100">
                             <td colSpan={4} className="px-8 py-8 text-right uppercase text-xs tracking-widest text-amber-600">Aggregate Receivables Outstanding:</td>
                             <td className="px-8 py-8 text-right text-3xl text-rose-800 tracking-tighter">NPR {totalDuesSum.toLocaleString()}</td>
                             <td className="no-print"></td>
                          </tr>
                       </tfoot>
                    )}
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'create' && canCreateInvoices && (
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
           <div className="p-10 bg-indigo-900 text-white relative">
              <ReceiptText className="absolute right-10 top-1/2 -translate-y-1/2 text-white/5" size={180} />
              <div className="relative z-10">
                 <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4"><PlusCircle className="text-indigo-400" /> Collection Entry</h3>
                 <p className="text-indigo-300 mt-1 font-bold uppercase tracking-widest text-xs">Record incoming fee payments into the institutional ledger</p>
              </div>
           </div>
           
           <form onSubmit={handleCreateInvoice} className="p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Scope</label>
                    <select value={formData.classId} onChange={e => { setFormData({...formData, classId: e.target.value as any, studentId: ''}); }} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                       {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Remitter (Student) *</label>
                    <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer" required>
                       <option value="">-- Choose Profile --</option>
                       {students.filter(s => s.currentClass === formData.classId).map(s => <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollNumber})</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calculator size={14} className="text-indigo-600"/> Billing Particulars</h4>
                    <button type="button" onClick={() => setFormData({...formData, items: [...formData.items, { description: 'Examination Fee', amount: schoolSettings.examFees[formData.classId] || 0 }]})} className="text-[10px] font-black text-indigo-700 uppercase tracking-widest hover:underline transition-all">+ Add Custom Fee Head</button>
                 </div>
                 <div className="space-y-3">
                    {formData.items.map((item, index) => (
                       <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in duration-200">
                          <div className="md:col-span-8 relative">
                             <input type="text" value={item.description} onChange={e => { const newItems = [...formData.items]; newItems[index].description = e.target.value; setFormData({...formData, items: newItems}); }} list="fee-presets" className="w-full pl-4 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" placeholder="Description" />
                             <datalist id="fee-presets">{STANDARD_FEES.map(f => <option key={f} value={f} />)}</datalist>
                          </div>
                          <div className="md:col-span-3 relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">NPR</span>
                             <input type="number" value={item.amount || ''} onChange={e => { const newItems = [...formData.items]; newItems[index].amount = Number(e.target.value); setFormData({...formData, items: newItems}); }} className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-indigo-700 outline-none focus:border-indigo-500 transition-all" placeholder="0.00" />
                          </div>
                          <div className="md:col-span-1 flex items-center justify-center">
                             <button type="button" onClick={() => { const newItems = formData.items.filter((_, i) => i !== index); setFormData({...formData, items: newItems}); }} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"><Trash2 size={18}/></button>
                          </div>
                       </div>
                    ))}
                    {formData.items.length === 0 && (
                      <div className="py-6 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No line items added. Fees do not auto-load by policy.</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-end justify-between gap-10">
                 <div className="space-y-4 w-full md:w-80">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Cash Received Now *</label>
                       <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xl">NPR</span>
                          <input type="number" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} className="w-full pl-20 pr-6 py-5 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] font-black text-3xl text-emerald-800 outline-none focus:border-emerald-500 shadow-inner" placeholder="0.00" required />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Received By</label>
                       <input type="text" value={formData.receivedBy} onChange={e => setFormData({...formData, receivedBy: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" />
                    </div>
                 </div>

                 <div className="bg-indigo-50/50 p-10 rounded-[3rem] border border-indigo-100 flex-1 w-full md:w-auto">
                    <div className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-4">
                       <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">Gross Bill Total</span>
                       <span className="text-2xl font-black text-indigo-900 font-mono">NPR {formData.items.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-black text-rose-400 uppercase tracking-widest">Post-Collection Dues</span>
                       <span className="text-2xl font-black text-rose-700 font-mono">NPR {Math.max(0, formData.items.reduce((s, i) => s + (i.amount || 0), 0) - (formData.paidAmount || 0)).toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              <button type="submit" className="w-full py-6 bg-indigo-700 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-700/20 uppercase tracking-[0.2em] text-xs hover:bg-indigo-800 active:scale-95 transition-all flex items-center justify-center gap-3">
                 <Zap size={20} /> Authorize Transaction & Generate Receipt
              </button>
           </form>
        </div>
      )}

      {/* REFINED PDF CAPTURE CONTAINERS FOR A4 PORTRAIT - MINIMIZED TO PREVENT CLIPPING */}
      <div className="pdf-capture-container">
         <div ref={historyReportRef} style={{ width: '200mm', minHeight: '280mm', padding: '5mm', background: '#fff', color: '#000', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '6mm', borderBottom: '1.5px solid #000', paddingBottom: '2mm' }}>
              <h1 style={{ fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>{schoolSettings.name}</h1>
              <p style={{ fontSize: '8pt', fontWeight: 700, margin: '1mm 0' }}>{schoolSettings.address}</p>
              <div style={{ marginTop: '2mm', display: 'inline-block', background: '#000', color: '#fff', padding: '1mm 4mm' }}>
                <h2 style={{ fontSize: '10pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5pt', margin: 0 }}>Revenue Collection Ledger</h2>
              </div>
              <p style={{ marginTop: '2mm', fontSize: '8pt', fontWeight: 800 }}>AUDIT DATE: {new Date().toLocaleDateString()} • PERIOD: {dateFilter}</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid #000', fontSize: '7.5pt' }}>
               <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center', width: '8%' }}>S.N.</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'left', width: '18%' }}>ID / DATE</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'left', width: '39%' }}>STUDENT NAME</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center', width: '10%' }}>CLASS</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'right', width: '25%' }}>COLLECTED (NPR)</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredInvoices.map((inv, idx) => {
                    const student = getStudentById(inv.studentId);
                    return (
                      <tr key={inv.id} style={{ pageBreakInside: 'avoid' }}>
                        <td style={{ border: '1px solid #000', padding: '1.2mm', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '1.2mm', fontSize: '6.5pt', wordBreak: 'break-all' }}>
                          <div style={{ fontWeight: 800 }}>{inv.invoiceNumber}</div>
                          <div style={{ opacity: 0.7 }}>{inv.date}</div>
                        </td>
                        <td style={{ border: '1px solid #000', padding: '1.2mm', textTransform: 'uppercase', fontWeight: 700, wordBreak: 'break-word' }}>{student?.name}</td>
                        <td style={{ border: '1px solid #000', padding: '1.2mm', textAlign: 'center' }}>{student?.currentClass}</td>
                        <td style={{ border: '1px solid #000', padding: '1.2mm', textAlign: 'right', fontWeight: 800 }}>{inv.paidAmount.toLocaleString()}.00</td>
                      </tr>
                    );
                  })}
               </tbody>
               <tfoot>
                  <tr style={{ background: '#f2f2f2', fontWeight: 900 }}>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '2mm', textAlign: 'right', fontSize: '9pt' }}>AGGREGATE REVENUE:</td>
                    <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'right', fontSize: '10pt' }}>NPR {totalCollectedSum.toLocaleString()}.00</td>
                  </tr>
               </tfoot>
            </table>
            
            <div style={{ marginTop: '15mm', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>
              <div style={{ width: '40mm', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '1mm' }}>Accountant</div>
              <div style={{ width: '40mm', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '1mm' }}>Principal Seal</div>
            </div>
         </div>

         <div ref={duesReportRef} style={{ width: '200mm', minHeight: '280mm', padding: '5mm', background: '#fff', color: '#000', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '6mm', borderBottom: '1.5px solid #000', paddingBottom: '2mm' }}>
              <h1 style={{ fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>{schoolSettings.name}</h1>
              <p style={{ fontSize: '8pt', fontWeight: 700, margin: '1mm 0' }}>{schoolSettings.address}</p>
              <div style={{ marginTop: '2mm', display: 'inline-block', background: '#000', color: '#fff', padding: '1mm 4mm' }}>
                <h2 style={{ fontSize: '10pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5pt', margin: 0 }}>Outstanding Receivables Report</h2>
              </div>
              <p style={{ marginTop: '2mm', fontSize: '8pt', fontWeight: 800 }}>STATUS AS OF: {new Date().toLocaleDateString()}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid #000', fontSize: '7.5pt' }}>
               <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center', width: '8%' }}>S.N.</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center', width: '10%' }}>ROLL</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'left', width: '47%' }}>STUDENT IDENTITY</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center', width: '10%' }}>CLASS</th>
                    <th style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'right', width: '25%' }}>BALANCE DUE (NPR)</th>
                  </tr>
               </thead>
               <tbody>
                  {duesList.map((s, idx) => (
                    <tr key={s.id} style={{ pageBreakInside: 'avoid' }}>
                      <td style={{ border: '1px solid #000', padding: '1.2mm', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '1.2mm', textAlign: 'center', fontWeight: 800 }}>{s.rollNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '1.2mm', wordBreak: 'break-word' }}>
                         <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{s.name}</div>
                         <div style={{ fontSize: '6.5pt', opacity: 0.7 }}>F: {s.fatherName}</div>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '1.2mm', textAlign: 'center' }}>{s.currentClass}</td>
                      <td style={{ border: '1px solid #000', padding: '1.2mm', textAlign: 'right', fontWeight: 800 }}>{s.currentDue.toLocaleString()}.00</td>
                    </tr>
                  ))}
               </tbody>
               <tfoot>
                  <tr style={{ background: '#f2f2f2', fontWeight: 900 }}>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '2mm', textAlign: 'right', fontSize: '9pt' }}>TOTAL OUTSTANDING:</td>
                    <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'right', fontSize: '10pt', color: '#b91c1c' }}>NPR {totalDuesSum.toLocaleString()}.00</td>
                  </tr>
               </tfoot>
            </table>
            
            <div style={{ marginTop: '15mm', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase' }}>
              <div style={{ width: '40mm', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '1mm' }}>Registrar</div>
              <div style={{ width: '40mm', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '1mm' }}>Principal Seal</div>
            </div>
         </div>

         {/* DEDICATED RECEIPT FOR PDF CAPTURE */}
         {showReceiptModal && (
           <div ref={receiptPDFRef} style={{ width: '210mm', minHeight: '297mm', padding: '15mm', background: '#fff', color: '#000', fontFamily: 'sans-serif', boxSizing: 'border-box', position: 'relative' }}>
              <div style={{ width: '180mm', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '2px solid #000', paddingBottom: '4mm' }}>
                  <h1 style={{ fontSize: '24pt', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>{schoolSettings.name}</h1>
                  <p style={{ fontSize: '10pt', fontWeight: 700, margin: '2mm 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{schoolSettings.address}</p>
                  <div style={{ marginTop: '4mm', display: 'inline-block', padding: '1mm 4mm', border: '1.5px solid #000' }}>
                    <h2 style={{ fontSize: '12pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', margin: 0, color: '#000' }}>Payment Voucher / Receipt</h2>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10mm', marginBottom: '8mm' }}>
                  <div style={{ border: '1.5px solid #000', padding: '4mm', borderRadius: '4mm' }}>
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', color: '#666', marginBottom: '2mm' }}>Remitter Details</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 1mm 0' }}>{getStudentById(showReceiptModal.studentId)?.name}</p>
                    <p style={{ fontSize: '10pt', fontWeight: 700, margin: '0 0 1mm 0' }}>Guardian: {getStudentById(showReceiptModal.studentId)?.fatherName}</p>
                    <p style={{ fontSize: '9pt', fontWeight: 600, margin: 0 }}>Address: {getStudentById(showReceiptModal.studentId)?.address}</p>
                  </div>
                  <div style={{ border: '1.5px solid #000', padding: '4mm', borderRadius: '4mm' }}>
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', color: '#666', marginBottom: '2mm' }}>Invoice Info</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, margin: '0 0 1mm 0' }}>Voucher #: {showReceiptModal.invoiceNumber}</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, margin: '0 0 1mm 0' }}>Date: {showReceiptModal.date}</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, margin: '0 0 1mm 0' }}>Grade: {getStudentById(showReceiptModal.studentId)?.currentClass}</p>
                    <p style={{ fontSize: '9pt', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Transport: {getStudentById(showReceiptModal.studentId)?.transportMode}</p>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8mm', border: '2px solid #000' }}>
                  <thead style={{ background: '#000', color: '#fff' }}>
                    <tr>
                      <th style={{ padding: '3mm 4mm', textAlign: 'left', textTransform: 'uppercase', fontSize: '9pt' }}>Particulars</th>
                      <th style={{ padding: '3mm 4mm', textAlign: 'right', textTransform: 'uppercase', fontSize: '9pt', width: '40mm' }}>Amount (NPR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showReceiptModal.items.map((it, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '3mm 4mm', fontSize: '11pt', fontWeight: 700, textTransform: 'uppercase' }}>{it.description}</td>
                        <td style={{ padding: '3mm 4mm', fontSize: '11pt', fontWeight: 800, textAlign: 'right' }}>{it.amount.toLocaleString()}.00</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f5f5f5' }}>
                      <td style={{ padding: '4mm', textAlign: 'right', fontSize: '11pt', fontWeight: 900, textTransform: 'uppercase' }}>Gross Total:</td>
                      <td style={{ padding: '4mm', textAlign: 'right', fontSize: '14pt', fontWeight: 900 }}>NPR {showReceiptModal.totalAmount.toLocaleString()}.00</td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10mm' }}>
                  <div style={{ width: '80mm' }}>
                    <div style={{ border: '1.5px solid #000', padding: '2mm 4mm', display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
                      <span style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>Received Now</span>
                      <span style={{ fontSize: '10pt', fontWeight: 900 }}>NPR {showReceiptModal.paidAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ border: '1.5px solid #000', padding: '2mm 4mm', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>Final Dues</span>
                      <span style={{ fontSize: '10pt', fontWeight: 900 }}>NPR {showReceiptModal.dueAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ width: '60mm', borderTop: '1.5px solid #000', textAlign: 'center', paddingTop: '2mm', fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase' }}>
                    Received By: {showReceiptModal.receivedBy || 'Office Registrar'}
                  </div>
                </div>

                <div style={{ marginTop: '20mm', textAlign: 'center', fontSize: '8pt', color: '#666', fontStyle: 'italic' }}>
                  This is a computer-generated receipt and does not require a physical signature.
                </div>
              </div>
           </div>
         )}
      </div>

      {isAdmin && <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={() => { onUpdateInvoices(invoices.filter(inv => inv.id !== deleteModal.recordId)); setDeleteModal({...deleteModal, isOpen: false}); }} title="Void Bill" itemName={deleteModal.itemName} />}
      
      {showReceiptModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in zoom-in-95 overflow-y-auto">
           <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
              <div className="px-10 py-6 border-b flex justify-between items-center bg-indigo-50/50">
                 <h3 className="text-lg font-black text-indigo-900 uppercase">Institutional Payment Voucher</h3>
                 <button onClick={() => setShowReceiptModal(null)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition-colors"><X size={28}/></button>
              </div>
               <div className="p-4 md:p-10 flex justify-center bg-slate-100/30">
                  <div ref={receiptPrintRef} id="receipt-print-area" className="bg-white p-6 md:p-8 w-full max-w-[180mm] shadow-xl flex flex-col text-black box-border">
                    <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2">
                       <div className="text-left">
                          <p className="text-[10px] font-black uppercase">Invoice: <span className="text-indigo-900">{showReceiptModal.invoiceNumber}</span></p>
                          <p className="text-[10px] font-black uppercase">Date: {showReceiptModal.date}</p>
                       </div>
                       <div className="text-center flex-1">
                          <h1 className="text-2xl font-black uppercase leading-none mb-1 tracking-tighter text-black">{schoolSettings.name}</h1>
                          <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]">{schoolSettings.address}</p>
                       </div>
                       <div className="w-24"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 text-sm">
                       <div className="p-3 bg-white rounded-xl border-2 border-black flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[9px] font-black text-black uppercase tracking-widest mb-0.5"><User size={10} className="text-black"/> Remitter Information</div>
                          <p className="text-base font-black text-black uppercase leading-none mb-0.5">{getStudentById(showReceiptModal.studentId)?.name}</p>
                          <p className="text-[10px] font-black text-black uppercase">Guardian: {getStudentById(showReceiptModal.studentId)?.fatherName}</p>
                          <p className="text-[10px] font-black text-black uppercase">Transport: {getStudentById(showReceiptModal.studentId)?.transportMode}</p>
                          <div className="flex items-center gap-2 text-[9px] text-black font-bold">
                             <MapPin size={10} className="text-black"/> {getStudentById(showReceiptModal.studentId)?.address}
                          </div>
                       </div>
                       <div className="p-3 bg-white rounded-xl border-2 border-black flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[9px] font-black text-black uppercase tracking-widest mb-0.5"><Bus size={10} className="text-black"/> Academic & Transport</div>
                          <p className="text-base font-black text-black uppercase leading-none mb-0.5">Grade {getStudentById(showReceiptModal.studentId)?.currentClass}</p>
                          <div className="flex items-center gap-2 text-[9px] text-black font-black uppercase tracking-tighter">
                             <Bus size={10} className="text-black"/> Roll No: {getStudentById(showReceiptModal.studentId)?.rollNumber}
                          </div>
                       </div>
                    </div>
                    <table className="w-full border-collapse mb-4 overflow-hidden rounded-t-lg border-2 border-black">
                       <thead className="bg-black"><tr className="text-[9px] font-black uppercase text-white"><th className="py-1.5 px-4 text-left">Particulars / Description</th><th className="py-1.5 px-4 text-right w-32">Amount (NPR)</th></tr></thead>
                       <tbody className="divide-y divide-black border-black">{showReceiptModal.items.map((it, i) => (<tr key={i}><td className="py-1.5 px-4 text-[11px] font-black uppercase text-black">{it.description}</td><td className="py-1.5 px-4 text-[11px] font-black text-right text-black">{it.amount.toLocaleString()}.00</td></tr>))}</tbody>
                       <tfoot><tr className="bg-slate-50 border-t-2 border-black"><td className="py-2 px-4 text-[11px] font-black uppercase text-black text-right">Gross Total:</td><td className="py-2 px-4 text-base font-black text-right text-black">NPR {showReceiptModal.totalAmount.toLocaleString()}.00</td></tr></tfoot>
                    </table>
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mt-4 gap-4">
                       <div className="w-full sm:w-auto space-y-1"><div className="p-1 bg-white text-black rounded border border-black font-black text-[9px] uppercase flex justify-between gap-4"><span>Received Now</span><span>NPR {showReceiptModal.paidAmount.toLocaleString()}</span></div><div className="p-1 bg-white text-black rounded border border-black font-black text-[9px] uppercase flex justify-between gap-4"><span>Final Dues</span><span>NPR {showReceiptModal.dueAmount.toLocaleString()}</span></div></div>
                       <div className="text-center w-full sm:w-48 border-t border-black pt-1 font-black uppercase text-[8px] tracking-tight text-black">Received By: {showReceiptModal.receivedBy || 'Office Registrar'}</div>
                    </div>
                  </div>
               </div>
              <div className="p-8 bg-white border-t flex flex-wrap justify-end gap-4">
                 <button onClick={() => setShowReceiptModal(null)} className="px-8 py-4 bg-slate-200 text-slate-700 font-black rounded-[2rem] uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-300 transition-all active:scale-95">
                    Close
                 </button>
                 <button onClick={() => handleDownloadPDF(`Invoice_${showReceiptModal.invoiceNumber}`, receiptPDFRef)} disabled={isDownloading} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-emerald-700 transition-all disabled:opacity-50">
                    {isDownloading ? <Loader2 className="animate-spin" size={20}/> : <Download size={20}/>} Download Receipt
                 </button>
                 <button onClick={() => window.print()} className="px-10 py-4 bg-indigo-700 text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-xs items-center gap-3 flex transition-all active:scale-95"><Printer size={20}/> Execute Print</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BillingSystem;
