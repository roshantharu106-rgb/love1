
import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  FileJson,
  Copy,
  Info,
  Cloud,
  CloudSync
} from 'lucide-react';
import { storage } from '../utils/storage';

interface DataManagementProps {
  onDataRestored: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onDataRestored }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentYear = storage.getSelectedYear();

  const getScopedData = () => {
    const data: Record<string, any> = {};
    const prefix = currentYear ? `${currentYear}_` : '';
    const keys = [
      'students',
      'subjects',
      'marks',
      'teachers',
      'salary',
      'invoices',
      'expenditures'
    ];
    
    keys.forEach(k => {
      const fullKey = `${prefix}${k}`;
      const val = localStorage.getItem(fullKey);
      data[k] = val ? JSON.parse(val) : [];
    });
    
    return {
      year: currentYear,
      timestamp: new Date().toISOString(),
      payload: data
    };
  };

  const handleExport = () => {
    const backup = getScopedData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Madarsa_Backup_${currentYear}_BS_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setStatus({ type: 'success', text: `Backup for session ${currentYear} generated successfully!` });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        
        // Safety check for year mismatch
        if (backup.year && backup.year !== currentYear) {
          if (!window.confirm(`Warning: This backup is from session ${backup.year}, but you are currently in session ${currentYear}. Do you want to overwrite session ${currentYear} with this data?`)) {
            setIsProcessing(false);
            return;
          }
        }

        if (window.confirm(`Are you absolutely sure? All current records for session ${currentYear} will be deleted and replaced with this backup.`)) {
          const prefix = currentYear ? `${currentYear}_` : '';
          const data = backup.payload || backup; // Support both old and new backup formats
          
          Object.keys(data).forEach(key => {
            // Only import keys that we know about to avoid polluting storage
            if (['students', 'subjects', 'marks', 'teachers', 'salary', 'invoices', 'expenditures'].includes(key)) {
              localStorage.setItem(`${prefix}${key}`, JSON.stringify(data[key]));
            }
          });
          
          setStatus({ type: 'success', text: `Data for session ${currentYear} restored successfully.` });
          onDataRestored();
        }
      } catch (err) {
        setStatus({ type: 'error', text: 'Error: The selected file is not a valid Madarsa backup JSON.' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyToClipboard = () => {
    const data = JSON.stringify(getScopedData());
    navigator.clipboard.writeText(data);
    setStatus({ type: 'success', text: `Data for session ${currentYear} copied to clipboard!` });
  };

  const handleCloudSync = async () => {
    setIsProcessing(true);
    setStatus({ type: 'info', text: 'Initiating cloud synchronization...' });
    try {
      const success = await storage.syncFromCloud(currentYear || 'TEMP');
      if (success) {
        setStatus({ type: 'success', text: `Cloud data for session ${currentYear} synchronized successfully!` });
        onDataRestored();
      } else {
        setStatus({ type: 'info', text: 'No new data found on cloud for this session.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Cloud synchronization failed. Check your connection.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-10 bg-slate-900 text-white relative">
           <Database className="absolute right-10 top-1/2 -translate-y-1/2 text-white/5" size={160} />
           <div className="relative z-10">
              <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
                <ShieldCheck className="text-indigo-400" size={32} /> Session Data Vault
              </h3>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Currently managing: <span className="text-white bg-indigo-600 px-2 py-0.5 rounded ml-1">{currentYear} BS Session</span></p>
           </div>
        </div>

        <div className="p-10 space-y-10">
          {status && (
            <div className={`p-5 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${
              status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
              status.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              <div className="flex items-center gap-3">
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                <span className="font-black text-xs uppercase tracking-widest">{status.text}</span>
              </div>
              <button onClick={() => setStatus(null)}><X size={18} /></button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Cloud size={18} className="text-sky-600" /> Cloud Sync (Supabase)
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Manually pull the latest data from your Supabase cloud database for the <b>{currentYear} BS</b> session.
              </p>
              <div className="pt-2">
                <button 
                  onClick={handleCloudSync}
                  disabled={isProcessing}
                  className="w-full py-4 bg-sky-600 text-white font-black rounded-2xl shadow-xl shadow-sky-600/20 hover:bg-sky-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <CloudSync size={18} className={isProcessing ? "animate-spin" : ""} />
                  {isProcessing ? "Syncing..." : `Pull ${currentYear} from Cloud`}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Download size={18} className="text-indigo-600" /> Export Session Backup
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Save the database for the <b>{currentYear} BS</b> session as a JSON file. Use this to keep a copy of your records on your computer.
              </p>
              <div className="pt-2 flex flex-col gap-3">
                <button 
                  onClick={handleExport}
                  className="w-full py-4 bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-700/20 hover:bg-indigo-800 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                >
                  <FileJson size={18} /> Download {currentYear} Backup
                </button>
                <button 
                  onClick={handleCopyToClipboard}
                  className="w-full py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                >
                  <Copy size={18} /> Copy Sync String
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Upload size={18} className="text-amber-600" /> Restore Session Data
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Import data into the <b>{currentYear} BS</b> session from a backup file. <b>Note:</b> This will overwrite all existing data for this session.
              </p>
              <div className="pt-2">
                <label className="w-full py-5 bg-amber-50 border-2 border-dashed border-amber-200 text-amber-700 font-black rounded-2xl hover:bg-amber-100 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 cursor-pointer">
                  <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
                  {isProcessing ? "Processing..." : "Select Backup File"}
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-start gap-4">
             <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
               <Info size={24} />
             </div>
             <div>
                <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1">Session Isolation Protocol</h5>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  The system now uses isolated storage for each year. When you back up, it only backs up the current session's data. To move everything to a new computer, switch to each year and perform a backup individually, or use the global backup tool (coming soon).
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
