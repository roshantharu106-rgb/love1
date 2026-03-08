
import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Trash2, User, X, Info, ShieldAlert, DollarSign, Send } from 'lucide-react';
import { Notice, StudentClass, UserRole, SchoolSettings } from '../types';
import { CLASSES } from '../constants';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface NoticeBoardProps {
  notices: Notice[];
  userRole: UserRole;
  userDisplayName: string;
  onUpdateNotices: (notices: Notice[]) => void;
  targetClass?: StudentClass; // student's own class
  schoolSettings: SchoolSettings;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ 
  notices, 
  userRole, 
  userDisplayName, 
  onUpdateNotices,
  targetClass,
  schoolSettings
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isExamFeePanelOpen, setIsExamFeePanelOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', classId: 'All' as StudentClass | 'All' | 'Teachers' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; noticeId: string; noticeTitle: string }>({
    isOpen: false,
    noticeId: '',
    noticeTitle: ''
  });

  const canPostNotices = useMemo(() => {
    if (userRole === 'admin') return true;
    if (userRole === 'teacher' && schoolSettings.allowTeacherNotices) return true;
    if (userRole === 'student' && schoolSettings.allowStudentNotices) return true;
    return false;
  }, [userRole, schoolSettings]);

  const filteredNotices = notices.filter(n => {
    if (userRole === 'student') {
      // Students see global notices, their own class notices, and notices intended for everyone
      return n.classId === 'All' || n.classId === targetClass || n.authorName === userDisplayName;
    }
    if (userRole === 'teacher') {
      // Teachers see global, teacher-specific, and class specific notices
      return n.classId === 'All' || n.classId === 'Teachers' || n.authorName === userDisplayName;
    }
    return true; // Admin sees everything
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPostNotices) return;

    const notice: Notice = {
      id: crypto.randomUUID(),
      title: newNotice.title,
      content: newNotice.content,
      classId: newNotice.classId,
      date: new Date().toISOString(),
      authorName: userDisplayName,
      authorRole: userRole
    };
    onUpdateNotices([...notices, notice]);
    setIsAdding(false);
    setNewNotice({ title: '', content: '', classId: 'All' });
  };

  const handleBroadcastExamFee = (cls: StudentClass) => {
    const fee = schoolSettings.examFees[cls] || 0;
    const notice: Notice = {
      id: crypto.randomUUID(),
      title: `Exam Fee Notice: Class ${cls}`,
      content: `Dear Parents/Students, this is a formal notification that the examination fee for Class ${cls} has been set to NPR ${fee.toLocaleString()}. Please clear the dues at the earliest to receive the admit card.`,
      classId: cls,
      date: new Date().toISOString(),
      authorName: userDisplayName,
      authorRole: userRole
    };
    onUpdateNotices([...notices, notice]);
    setIsExamFeePanelOpen(false);
  };

  const handleDeleteConfirm = () => {
    const updatedNotices = notices.filter(n => n.id !== deleteModal.noticeId);
    onUpdateNotices(updatedNotices);
    setDeleteModal({ isOpen: false, noticeId: '', noticeTitle: '' });
  };

  const openDeleteModal = (notice: Notice) => {
    setDeleteModal({
      isOpen: true,
      noticeId: notice.id,
      noticeTitle: notice.title
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Megaphone className="text-indigo-600" /> Announcements & Notices
        </h2>
        <div className="flex gap-3">
          {userRole === 'admin' && (
            <button 
              onClick={() => setIsExamFeePanelOpen(!isExamFeePanelOpen)}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-amber-600 shadow-xl shadow-amber-700/20 transition-all active:scale-95"
            >
              <DollarSign size={16} /> Broadcast Exam Fee
            </button>
          )}
          {!isAdding && canPostNotices && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-700 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-indigo-800 shadow-xl shadow-indigo-700/20 transition-all active:scale-95"
            >
              <Plus size={16} /> Post New Notice
            </button>
          )}
        </div>
      </div>

      {!canPostNotices && userRole !== 'admin' && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] border border-slate-800 flex items-center gap-4 shadow-xl">
           <div className="p-3 bg-white/10 rounded-2xl">
              <ShieldAlert size={24} className="text-amber-400" />
           </div>
           <div>
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Publishing Restricted</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">The institutional administrator has restricted your role from broadcasting new announcements.</p>
           </div>
        </div>
      )}

      {isExamFeePanelOpen && (
        <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-200 shadow-xl animate-in slide-in-from-top-4">
           <div className="flex items-center justify-between mb-6">
              <div>
                 <h3 className="font-black text-amber-900 uppercase">One-Click Exam Fee Broadcast</h3>
                 <p className="text-[10px] font-bold text-amber-700 uppercase mt-1">Sends a notification to the selected class with configured fee amounts.</p>
              </div>
              <button onClick={() => setIsExamFeePanelOpen(false)} className="text-amber-400 hover:text-amber-600 transition-colors"><X size={24}/></button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {CLASSES.map(cls => (
                <button 
                  key={cls}
                  onClick={() => handleBroadcastExamFee(cls)}
                  className="p-4 bg-white border border-amber-200 rounded-2xl hover:bg-amber-100 transition-all group flex flex-col items-center"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Class</span>
                  <span className="text-xl font-black text-amber-900">{cls}</span>
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-emerald-600">
                    <Send size={10} /> NPR {schoolSettings.examFees[cls] || 0}
                  </div>
                </button>
              ))}
           </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6">
            <div>
               <h3 className="font-black text-indigo-900 uppercase">Create Announcement</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Posting as: <span className="text-indigo-600">{userDisplayName} ({userRole})</span></p>
            </div>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
          </div>
          <form onSubmit={handleAddNotice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input 
                  type="text" 
                  placeholder="Headline / Title" 
                  value={newNotice.title}
                  onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <select 
                value={newNotice.classId}
                onChange={e => setNewNotice({...newNotice, classId: e.target.value as any})}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500"
              >
                {userRole === 'admin' && (
                   <>
                      <option value="All">Global (Everyone)</option>
                      <option value="Teachers">All Teachers Only</option>
                      {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls} Only</option>)}
                   </>
                )}
                {userRole === 'teacher' && (
                   <>
                      <option value="All">Global (Everyone)</option>
                      <option value="Teachers">Fellow Teachers</option>
                      {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                   </>
                )}
                {userRole === 'student' && (
                   <>
                      <option value={targetClass}>My Class ({targetClass})</option>
                      <option value="Teachers">All Teachers</option>
                   </>
                )}
              </select>
            </div>
            <textarea 
              placeholder="Write your detailed announcement here..."
              value={newNotice.content}
              onChange={e => setNewNotice({...newNotice, content: e.target.value})}
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-medium outline-none focus:border-indigo-500 h-32 resize-none"
              required
            />
            <div className="flex justify-end">
              <button type="submit" className="px-10 py-4 bg-indigo-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg">
                Publish Immediately
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNotices.length > 0 ? filteredNotices.map(notice => (
          <div key={notice.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                notice.classId === 'All' ? 'bg-indigo-50 text-indigo-600' : 
                notice.classId === 'Teachers' ? 'bg-emerald-50 text-emerald-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {notice.classId === 'All' ? '📢 Global' : 
                 notice.classId === 'Teachers' ? '💼 For Teachers' : 
                 `📌 Class ${notice.classId}`}
              </span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">{new Date(notice.date).toLocaleDateString()}</span>
            </div>
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">{notice.title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed font-medium mb-6">{notice.content}</p>
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-indigo-600">
                  <User size={14}/>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{notice.authorName}</p>
                   <p className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">{notice.authorRole}</p>
                </div>
              </div>
              {(userRole === 'admin' || notice.authorName === userDisplayName) && (
                <button 
                  onClick={() => openDeleteModal(notice)} 
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="lg:col-span-2 p-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-100 mb-6"><Megaphone size={40}/></div>
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">No announcements found</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4 no-print">
         <Info size={24} className="text-blue-500" />
         <div className="space-y-1">
            <h5 className="text-[11px] font-black text-blue-900 uppercase">Policy Notice</h5>
            <p className="text-[10px] text-blue-800 font-medium leading-relaxed uppercase opacity-80">
              Students and Teachers can publish announcements if permitted by the institutional administrator. Admin retains full rights to delete any notice found inappropriate.
            </p>
         </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} 
        onConfirm={handleDeleteConfirm} 
        title="Institutional Notice Deletion" 
        itemName={deleteModal.noticeTitle} 
      />
    </div>
  );
};

export default NoticeBoard;
