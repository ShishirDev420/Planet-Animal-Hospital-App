import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Edit3, Trash2, Pill, Syringe, FlaskConical, Scissors,
  FileText, Stethoscope, ZoomIn, ZoomOut, Calendar, User, Building2,
  Clock, AlertCircle, CheckCircle2, FileDown,
} from 'lucide-react';
import type { MedicalRecord } from '../lib/medicalRecords';
import { deleteRecord, getFileDownloadUrl } from '../lib/medicalRecords';
import { generateRecordPDF } from '../lib/pdfGenerator';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  prescription: { icon: Pill, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  vaccine: { icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  lab_result: { icon: FlaskConical, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  surgery: { icon: Scissors, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  visit_note: { icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  other: { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
};

interface RecordDetailProps {
  record: MedicalRecord;
  petName: string;
  userId: string;
  onClose: () => void;
  onDelete: () => void;
  onEdit: (record: MedicalRecord) => void;
}

export default function RecordDetail({
  record,
  petName,
  userId,
  onClose,
  onDelete,
  onEdit,
}: RecordDetailProps) {
  const [imageZoomed, setImageZoomed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const config = TYPE_CONFIG[record.type] || TYPE_CONFIG.other;
  const Icon = config.icon;

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDownloadPDF = () => {
    setLoading(true);
    try {
      const blob = generateRecordPDF(record, petName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${petName}-${record.type}-${formatDate(record.date)}.pdf`.replace(/\s+/g, '-');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecord(userId, record.id);
      onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const loadImage = async () => {
    if (imageUrl) return;
    if (record.imageRef) {
      try {
        const url = await getFileDownloadUrl(record.imageRef);
        setImageUrl(url);
      } catch {}
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
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
          {/* Header */}
          <div className="p-6 pb-4 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div>
                  <h2 className="cinematic-card-title text-xl text-slate-900 dark:text-white">
                    {record.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {record.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap gap-2 mb-3">
              {record.date && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Calendar size={12} />
                  {formatDate(record.date)}
                </span>
              )}
              {record.vetName && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <User size={12} />
                  {record.vetName}
                </span>
              )}
              {record.clinicName && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Building2 size={12} />
                  {record.clinicName}
                </span>
              )}
              {record.verified ? (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={12} />
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 hide-scrollbar space-y-5">
            {/* Image */}
            {record.imageRef && (
              <div>
                <button
                  onClick={() => { loadImage(); setImageZoomed(!imageZoomed); }}
                  className="w-full relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group"
                >
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt="Prescription"
                        className={`w-full object-contain transition-all duration-300 ${imageZoomed ? 'max-h-[400px]' : 'max-h-[200px]'}`}
                      />
                      <div className="absolute top-3 right-3 bg-black/40 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {imageZoomed ? <ZoomOut size={16} className="text-white" /> : <ZoomIn size={16} className="text-white" />}
                      </div>
                    </>
                  ) : (
                    <div
                      onClick={loadImage}
                      className="h-32 flex items-center justify-center cursor-pointer"
                    >
                      <p className="text-sm text-slate-400">Tap to load image</p>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Medications */}
            {record.medications.length > 0 && (
              <div>
                <h3 className="cinematic-card-title text-sm mb-3 text-slate-900 dark:text-white">
                  Medications
                </h3>
                <div className="space-y-2">
                  {record.medications.map((med, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Pill size={14} className="text-planet-yellow" />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {med.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 ml-6">
                        {med.dosage && <span>{med.dosage}</span>}
                        {med.frequency && <span>{med.frequency}</span>}
                        {med.duration && <span>{med.duration}</span>}
                      </div>
                      {med.notes && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-6">
                          {med.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {record.instructions && (
              <div>
                <h3 className="cinematic-card-title text-sm mb-2 text-slate-900 dark:text-white">
                  Instructions
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                  {record.instructions}
                </p>
              </div>
            )}

            {/* Diagnosis */}
            {record.diagnosis && (
              <div>
                <h3 className="cinematic-card-title text-sm mb-2 text-slate-900 dark:text-white">
                  Diagnosis
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
                  {record.diagnosis}
                </p>
              </div>
            )}

            {/* Description */}
            {record.description && (
              <div>
                <h3 className="cinematic-card-title text-sm mb-2 text-slate-900 dark:text-white">
                  Notes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {record.description}
                </p>
              </div>
            )}

            {/* Follow-up */}
            {record.followUpDate && (
              <div className="flex items-center gap-2 text-sm text-planet-yellow bg-planet-yellow/5 rounded-xl p-3">
                <Clock size={16} />
                <span>Follow-up: {record.followUpDate}</span>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
            <button
              onClick={() => onEdit(record)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-planet-yellow text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              Download PDF
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 ml-auto"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
