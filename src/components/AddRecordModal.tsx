import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, FileText, Upload, Loader2, Check, AlertCircle,
  Pill, Syringe, FlaskConical, Scissors, Stethoscope, NotepadText,
  ChevronLeft, ChevronRight, Pencil, Save,
} from 'lucide-react';
import CameraCapture from './CameraCapture';
import { parsePrescriptionImage } from '../lib/ocr';
import type { OCRResult } from '../lib/ocr';
import type { MedicalRecordType, MedicalRecordInput, Medication } from '../lib/medicalRecords';

type Step = 'type' | 'capture' | 'review' | 'manual' | 'saving';

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
  const [step, setStep] = useState<Step>('type');
  const [recordType, setRecordType] = useState<MedicalRecordType>('prescription');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Manual form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vetName, setVetName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);

  const handleTypeSelect = (type: MedicalRecordType) => {
    setRecordType(type);
    if (type === 'prescription') {
      setStep('capture');
    } else {
      setStep('manual');
    }
  };

  const handleCapture = (file: File) => {
    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCapturedPreview(dataUrl);
      runOCR(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runOCR = async (base64Image: string) => {
    setOcrLoading(true);
    setOcrError(null);
    try {
      const result = await parsePrescriptionImage(base64Image);
      setOcrResult(result);
      if (result.success && result.medications.length === 0 && !result.instructions) {
        setOcrError('No readable text found. You can enter details manually.');
      }
    } catch (err: any) {
      setOcrError(err.message || 'OCR failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSkipOCR = () => {
    setStep('manual');
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
      ocrRawText: ocrResult?.rawText || '',
      medications: ocrResult?.medications.length ? ocrResult.medications : medications,
      instructions: instructions || ocrResult?.instructions || '',
      diagnosis: diagnosis || ocrResult?.diagnosis || '',
      followUpDate: followUpDate || ocrResult?.date || '',
      appointmentId: null,
      verified: !!ocrResult?.success && ocrResult.confidence !== 'low',
    };

    await onSave(input);
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

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
                {step === 'capture' && 'Scan Prescription'}
                {step === 'review' && 'Review & Verify'}
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

            {/* Step 2: Scan (prescription flow) or OCR result */}
            {(step === 'capture' || step === 'review') && (
              <>
                {step === 'capture' && (
                  <div
                    onClick={() => {
                      /* Will open camera */
                    }}
                    className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-10 text-center cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <Camera size={48} className="mx-auto mb-4 text-amber-500" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tap to open camera
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Take a clear photo of the prescription
                    </p>
                  </div>
                )}

                {capturedPreview && (
                  <div>
                    <div className="flex gap-4 mb-4">
                      <img
                        src={capturedPreview}
                        alt="Prescription"
                        className="w-1/3 h-40 object-contain rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1">
                        {ocrLoading && (
                          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                            <Loader2 size={20} className="animate-spin" />
                            <span className="text-sm font-medium">Analyzing prescription...</span>
                          </div>
                        )}

                        {ocrError && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle size={14} />
                              <span className="font-bold">OCR Issue</span>
                            </div>
                            <p>{ocrError}</p>
                            <button
                              onClick={handleSkipOCR}
                              className="mt-2 text-xs font-bold text-planet-yellow hover:underline"
                            >
                              Enter details manually instead
                            </button>
                          </div>
                        )}

                        {ocrResult && ocrResult.success && !ocrError && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <Check size={16} />
                              <span className="text-sm font-bold">
                                Read Successfully ({ocrResult.confidence} confidence)
                              </span>
                            </div>
                            {ocrResult.medications.map((med, i) => (
                              <div key={i} className="text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="font-bold">{med.name || 'Unknown med'}</p>
                                <p className="text-slate-500">{med.dosage} {med.frequency} {med.duration}</p>
                              </div>
                            ))}
                            {ocrResult.instructions && (
                              <p className="text-xs text-slate-500 line-clamp-2">
                                {ocrResult.instructions}
                              </p>
                            )}
                            <button
                              onClick={() => setStep('review')}
                              className="text-xs font-bold text-planet-yellow hover:underline"
                            >
                              Review and fill in details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {step === 'capture' && !ocrLoading && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleSkipOCR}
                          className="flex-1 py-3 px-4 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Skip & Enter Manually
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Review form (step === 'review') */}
                {step === 'review' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Record Title
                      </label>
                      <input
                        type="text"
                        value={title || `Prescription — ${ocrResult?.vetName || vetName || ''}`}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Vet Name</label>
                        <input type="text" value={vetName || ocrResult?.vetName || ''} onChange={(e) => setVetName(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Clinic</label>
                      <input type="text" value={clinicName || ocrResult?.clinicName || ''} onChange={(e) => setClinicName(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                    </div>

                    {/* Medications */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Medications</label>
                        <button onClick={addMedication} className="text-xs font-bold text-planet-yellow hover:underline">
                          + Add
                        </button>
                      </div>
                      {(ocrResult?.medications.length ? ocrResult.medications : medications).map((med, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-2 border border-slate-100 dark:border-slate-700">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Medicine name"
                              value={med.name}
                              onChange={(e) => ocrResult?.medications.length ? null : updateMedication(i, 'name', e.target.value)}
                              readOnly={!!ocrResult?.medications.length}
                              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-planet-yellow"
                            />
                            <input
                              type="text"
                              placeholder="Dosage (e.g. 250mg)"
                              value={med.dosage}
                              onChange={(e) => ocrResult?.medications.length ? null : updateMedication(i, 'dosage', e.target.value)}
                              readOnly={!!ocrResult?.medications.length}
                              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-planet-yellow"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="Frequency" value={med.frequency} onChange={(e) => ocrResult?.medications.length ? null : updateMedication(i, 'frequency', e.target.value)} readOnly={!!ocrResult?.medications.length} className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                            <input type="text" placeholder="Duration" value={med.duration} onChange={(e) => ocrResult?.medications.length ? null : updateMedication(i, 'duration', e.target.value)} readOnly={!!ocrResult?.medications.length} className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                            <input type="text" placeholder="Notes" value={med.notes} onChange={(e) => ocrResult?.medications.length ? null : updateMedication(i, 'notes', e.target.value)} readOnly={!!ocrResult?.medications.length} className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                          </div>
                          {!ocrResult?.medications.length && (
                            <button onClick={() => removeMedication(i)} className="text-xs text-rose-500 mt-2 hover:underline">
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Instructions</label>
                      <textarea
                        value={instructions || ocrResult?.instructions || ''}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Diagnosis</label>
                      <input type="text" value={diagnosis || ocrResult?.diagnosis || ''} onChange={(e) => setDiagnosis(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Follow-up Date</label>
                      <input type="text" value={followUpDate || ocrResult?.date || ''} onChange={(e) => setFollowUpDate(e.target.value)} placeholder="e.g. 2026-06-15 or '2 weeks'" className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-planet-yellow" />
                    </div>
                  </div>
                )}
              </>
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

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
            {step === 'capture' && capturedPreview && !ocrLoading && !ocrResult && !ocrError && (
              <button
                onClick={handleSkipOCR}
                className="flex-1 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Skip & Enter Manually
              </button>
            )}

            {step === 'review' && (
              <>
                <button
                  onClick={() => setStep('capture')}
                  className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm"
                >
                  <ChevronLeft size={16} className="inline mr-1" />
                  Back
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-2xl bg-planet-yellow text-black font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save Record
                </button>
              </>
            )}

            {step === 'manual' && (
              <>
                {recordType === 'prescription' && (
                  <button
                    onClick={() => setStep('capture')}
                    className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm"
                  >
                    <ChevronLeft size={16} className="inline mr-1" />
                    Scan Instead
                  </button>
                )}
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

      {/* Camera layer */}
      {step === 'capture' && !capturedPreview && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setStep(recordType === 'prescription' ? 'type' : 'manual')}
        />
      )}
    </AnimatePresence>
  );
}
