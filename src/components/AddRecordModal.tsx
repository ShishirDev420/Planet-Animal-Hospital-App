import PrescriptionScanner from './PrescriptionScanner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2,
  Pill, Syringe, FlaskConical, Scissors, Stethoscope, NotepadText,
  Save,
} from 'lucide-react';
import type { MedicalRecordType, MedicalRecordInput } from '../lib/medicalRecords';

type Step = 'type' | 'manual' | 'saving';

interface AddRecordModalProps {
  petName: string;
  onSave: (input: MedicalRecordInput) => Promise<void>;
  onClose: () => void;
}

const RECORD_TYPES: { value: MedicalRecordType; label: string; icon: any; color: string; bg: string; description: string }[] = [
  { value: 'prescription', label: 'Prescription', icon: Pill, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', description: 'Scan or enter medication details' },
  { value: 'vaccine', label: 'Vaccine', icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', description: 'Record vaccination dates and types' },
  { value: 'lab_result', label: 'Lab Result', icon: FlaskConical, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', description: 'Blood work, X-rays, test reports' },
  { value: 'surgery', label: 'Surgery', icon: Scissors, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', description: 'Surgical procedures and recovery notes' },
  { value: 'visit_note', label: 'Visit Note', icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', description: 'General consultation notes' },
  { value: 'other', label: 'Other', icon: NotepadText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', description: 'Any other medical document' },
];

export default function AddRecordModal({ petName, onSave, onClose }: AddRecordModalProps) {
  const [saveError,setSaveError]=useState('');
  const [privatePrescription,setPrivatePrescription]=useState(false);
  const [step, setStep] = useState<Step>('type');
  const [recordType, setRecordType] = useState<MedicalRecordType>('prescription');
  // Manual form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vetName, setVetName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleTypeSelect = (type: MedicalRecordType) => {
    setRecordType(type);
    if (type === 'prescription') {
      setPrivatePrescription(true);
    } else {
      setStep('manual');
    }
  };

  const handleSave = async () => {
    setStep('saving');

    const input: MedicalRecordInput = {
      type: recordType,
      title: title || `${recordType.replace('_', ' ')} for ${petName}`,
      date: new Date(date),
      vetName,
      clinicName,
      description,
      tags: [],
      imageRef: '',
      pdfRef: '',
      ocrRawText: '',
      medications: [],
      instructions,
      diagnosis: '',
      followUpDate: '',
      appointmentId: null,
      verified: false,
    };

    try { await onSave(input); } catch (e) { setSaveError((e as Error).message || 'Could not save this record.'); setStep('manual'); }
  };

  if(privatePrescription) return <PrescriptionScanner onClose={onClose}/>;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <h2 className="cinematic-card-title text-lg text-slate-900 dark:text-white">
                {step === 'type' && 'Add Medical Record'}
                {step === 'manual' && 'Enter Details'}
                {step === 'saving' && 'Saving...'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                for {petName}
              </p>
            </div>
            {step !== 'saving' && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 hide-scrollbar space-y-4">
            {/* Step 1: Choose Type */}
            {step === 'type' && (
              <div className="grid grid-cols-2 gap-3">
                {RECORD_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => handleTypeSelect(t.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                        t.value === 'prescription'
                          ? 'border-planet-yellow bg-planet-yellow/5 dark:bg-planet-yellow/10'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${t.bg} flex items-center justify-center mb-2`}>
                        <Icon size={18} className={t.color} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {t.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step: Manual Entry for non-prescription types */}
            {step === 'manual' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Title *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${recordType.replace('_', ' ')} record`} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Date *</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Vet Name</label>
                    <input type="text" value={vetName} onChange={(e) => setVetName(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Clinic</label>
                  <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Instructions / Notes</label>
                  <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow resize-none" />
                </div>
              </div>
            )}

            {/* Step: Saving */}
            {step === 'saving' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={40} className="animate-spin text-planet-yellow mb-4" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Saving record...
                </p>
              </div>
            )}
          </div>

          {saveError&&<p role="alert" className="px-5 text-sm text-red-500">{saveError}</p>}
          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
            {step === 'manual' && (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-2xl bg-planet-yellow text-black font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save Record
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

    </AnimatePresence>
  );
}
