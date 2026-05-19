import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pill, Syringe, FlaskConical, Scissors,
  Stethoscope, FileText, NotepadText, Search, ChevronDown,
  Download, FileDown, Camera, Calendar, User,
} from 'lucide-react';
import { usePetProfile } from '../hooks/usePetProfile';
import { getRecords, createRecord, uploadRecordFile } from '../lib/medicalRecords';
import { generateRecordPDF } from '../lib/pdfGenerator';
import type { MedicalRecord, MedicalRecordInput, MedicalRecordType } from '../lib/medicalRecords';
import AddRecordModal from '../components/AddRecordModal';
import RecordDetail from '../components/RecordDetail';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  prescription: { icon: Pill, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Prescription' },
  vaccine: { icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Vaccine' },
  lab_result: { icon: FlaskConical, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Lab Result' },
  surgery: { icon: Scissors, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', label: 'Surgery' },
  visit_note: { icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'Visit Note' },
  other: { icon: NotepadText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', label: 'Other' },
};

const FILTER_OPTIONS: { label: string; value: MedicalRecordType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Prescriptions', value: 'prescription' },
  { label: 'Vaccines', value: 'vaccine' },
  { label: 'Lab Results', value: 'lab_result' },
  { label: 'Surgery', value: 'surgery' },
  { label: 'Visit Notes', value: 'visit_note' },
  { label: 'Other', value: 'other' },
];

export default function MedicalRecords() {
  const navigate = useNavigate();
  const { profile } = usePetProfile();
  const petName = profile?.petName || profile?.name || 'Your Pet';
  const userId = profile?.uid || 'demo';

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MedicalRecordType | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = filter === 'all'
        ? await getRecords(userId)
        : await getRecords(userId, filter);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSave = async (input: MedicalRecordInput) => {
    await createRecord(userId, input);
    setShowAdd(false);
    setEditingRecord(null);
    await fetchRecords();
  };

  const handleDelete = () => {
    setSelectedRecord(null);
    fetchRecords();
  };

  const handleEdit = (record: MedicalRecord) => {
    setSelectedRecord(null);
    setEditingRecord(record);
    setShowAdd(true);
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-6">
      {/* Header — safe-area padding guaranteed via max() */}
      <header className="pt-[max(env(safe-area-inset-top),60px)] pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-white/30 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="cinematic-card-title text-2xl text-slate-900 dark:text-white">
                Medical Records
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {petName}'s complete health history
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-planet-yellow text-black font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-planet-yellow/20"
          >
            <Plus size={18} />
            Add Record
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === opt.value
                ? 'bg-planet-yellow/10 text-planet-yellow border border-planet-yellow/30'
                : 'bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-white/30 dark:border-slate-700/30 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Records List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/60 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText size={36} className="text-amber-300" />
          </div>
          <h2 className="cinematic-card-title text-lg text-slate-900 dark:text-white mb-2">
            No Medical Records Yet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Keep {petName}'s health history organized. Scan prescriptions, log vaccinations, and track lab results.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-planet-yellow text-black font-bold text-sm hover:brightness-110 transition-all"
          >
            <Camera size={18} />
            Scan Your First Prescription
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {records.map((record, i) => {
            const config = TYPE_CONFIG[record.type] || TYPE_CONFIG.other;
            const Icon = config.icon;
            return (
              <motion.button
                key={record.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedRecord(record)}
                className="w-full text-left p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-white/30 dark:border-slate-700/30 hover:border-planet-yellow/30 transition-all hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {record.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(record.date)}
                      </span>
                      {record.vetName && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {record.vetName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {record.medications.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-planet-yellow/10 text-planet-yellow font-bold">
                        {record.medications.length} med{record.medications.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {record.imageRef && (
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <Camera size={12} className="text-slate-400" />
                      </span>
                    )}
                    <ChevronDown size={16} className="text-slate-400 -rotate-90 group-hover:text-planet-yellow transition-colors" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Add Record Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddRecordModal
            petName={petName}
            onSave={handleSave}
            onClose={() => {
              setShowAdd(false);
              setEditingRecord(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Record Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <RecordDetail
            record={selectedRecord}
            petName={petName}
            userId={userId}
            onClose={() => setSelectedRecord(null)}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
