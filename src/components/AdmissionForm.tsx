
import React, { useState } from 'react';
import { UserPlus, Calendar, Phone, MapPin, Mail, Bus, UserCircle } from 'lucide-react';
import { Student, StudentClass, DateType, TransportMode, Gender } from '../types';
import { CLASSES, TRANSPORT_MODES } from '../constants';

interface AdmissionFormProps {
  students: Student[];
  onAddStudent: (students: Student[]) => void;
}

const AdmissionForm: React.FC<AdmissionFormProps> = ({ students, onAddStudent }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    gender: 'Male',
    fatherName: '',
    motherName: '',
    address: '',
    contactNumber: '',
    dob: '',
    dobType: 'BS',
    gmail: '',
    transportMode: 'On Foot',
    currentClass: 'ECD',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.fatherName || !formData.address || !formData.contactNumber) {
      setMessage({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    // Generate class-wise roll number (1, 2, 3...)
    const classStudents = students.filter(s => s.currentClass === formData.currentClass);
    let nextRoll = 1;
    if (classStudents.length > 0) {
      const rolls = classStudents
        .map(s => parseInt(s.rollNumber || '0'))
        .filter(n => !isNaN(n));
      nextRoll = rolls.length > 0 ? Math.max(...rolls) + 1 : 1;
    }

    const newStudent: Student = {
      ...formData as Student,
      id: crypto.randomUUID(),
      admissionDate: new Date().toISOString().split('T')[0],
      rollNumber: nextRoll.toString()
    };

    onAddStudent([...students, newStudent]);
    setMessage({ type: 'success', text: `Student admitted successfully with Roll No: ${nextRoll}` });
    setFormData({
      name: '',
      gender: 'Male',
      fatherName: '',
      motherName: '',
      address: '',
      contactNumber: '',
      dob: '',
      dobType: 'BS',
      gmail: '',
      transportMode: 'On Foot',
      currentClass: 'ECD',
    });

    setTimeout(() => setMessage(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border p-6 md:p-10">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <UserPlus className="text-indigo-600" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">New Student Admission</h2>
          <p className="text-slate-500">Register a new student to Madarsa Al-Markzul Islami</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
          <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
              {formData.profilePicture ? (
                <img src={formData.profilePicture} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-slate-200" size={64} />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-lg shadow-lg cursor-pointer">
              <UserPlus size={16} />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-sm font-bold text-slate-800 uppercase">Admission Photograph</h4>
            <p className="text-xs text-slate-500">Upload a formal photo for the student's ID card and official records.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Student Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Roshan"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <UserCircle size={16} className="text-slate-400" /> Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Father's Name *</label>
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Father's Full Name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mother's Name (Optional)</label>
            <input
              type="text"
              name="motherName"
              value={formData.motherName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Mother's Full Name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Admission Class *</label>
            <select
              name="currentClass"
              value={formData.currentClass}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
            >
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" /> Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Ward No, Village City"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Phone size={16} className="text-slate-400" /> Contact Number *
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="98XXXXXXXX"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" /> Date of Birth (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="YYYY-MM-DD"
              />
              <select
                name="dobType"
                value={formData.dobType}
                onChange={handleChange}
                className="px-2 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="BS">BS</option>
                <option value="AD">AD</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail size={16} className="text-slate-400" /> Gmail (Optional)
            </label>
            <input
              type="email"
              name="gmail"
              value={formData.gmail}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="student@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Bus size={16} className="text-slate-400" /> Mode of Transport *
            </label>
            <select
              name="transportMode"
              value={formData.transportMode}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
            >
              {TRANSPORT_MODES.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-800 shadow-lg shadow-indigo-700/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <UserPlus size={20} />
            Complete Admission
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdmissionForm;
