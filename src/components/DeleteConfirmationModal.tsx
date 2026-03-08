
import React, { useState } from 'react';
import { X, ShieldAlert, Trash2, Lock } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName
}) => {
  const [password, setPassword] = useState('');
  const REQUIRED_PASSWORD = 'RoshanPrameen_369@';

  if (!isOpen) return null;

  const isPasswordCorrect = password === REQUIRED_PASSWORD;

  const handleConfirm = () => {
    if (isPasswordCorrect) {
      onConfirm();
      setPassword('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-rose-100">
        <div className="bg-rose-50 px-8 py-6 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 p-2 rounded-xl text-white">
              <ShieldAlert size={20} />
            </div>
            <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-100 rounded-full text-rose-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">
              You are about to delete <span className="font-black text-slate-800">"{itemName}"</span>. This action is permanent and cannot be undone.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Lock size={12} className="text-rose-400" /> Security Password Required
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter deletion password"
              className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl font-bold text-slate-700 outline-none transition-all ${
                password && !isPasswordCorrect ? 'border-rose-200 focus:border-rose-400' : 'border-slate-100 focus:border-emerald-500'
              }`}
            />
            {password && !isPasswordCorrect && (
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight ml-1">Incorrect password</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isPasswordCorrect}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${
                isPasswordCorrect 
                ? 'bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700 active:scale-95' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200 shadow-none'
              }`}
            >
              <Trash2 size={16} />
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
