import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, Check, Loader2 } from 'lucide-react';

interface PrescriptionScannerProps {
  petName?: string;
  onScanComplete: (medications: Array<{ name: string; dosage: string; time: string }>) => void;
  onClose: () => void;
}

export default function PrescriptionScanner({ petName, onScanComplete, onClose }: PrescriptionScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setScanning(true);
    setError(null);

    try {
      // Send to Pawl backend
      const formData = new FormData();
      formData.append('image', file);
      formData.append('pet_name', petName || 'pet');

      const PAWL_BACKEND_URL = import.meta.env.VITE_PAWL_URL || 'http://localhost:8000';
      const response = await fetch(`${PAWL_BACKEND_URL}/parse-prescription`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        if (data.medications && data.medications.length > 0) {
          onScanComplete(data.medications);
        }
      } else {
        setError(data.message || 'Failed to parse prescription');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setScanning(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-white">
                📸 Scan Prescription
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Take a clear photo of your vet's prescription
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Upload Area */}
          {!preview && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-12 text-center cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <Camera size={48} className="mx-auto mb-4 text-amber-500" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tap to upload prescription image
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                JPG, PNG or PDF (max 5MB)
              </p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <img
                src={preview}
                alt="Prescription preview"
                className="w-full h-64 object-contain rounded-xl border border-slate-200 dark:border-slate-700"
              />
              {scanning && (
                <div className="flex items-center justify-center gap-2 mt-4 text-amber-600 dark:text-amber-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-medium">Analyzing prescription...</span>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold mb-2">
                <Check size={18} />
                <span>Prescription Read Successfully!</span>
              </div>
              {result.medications?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300">Found medications:</p>
                  {result.medications.map((med: any, idx: number) => (
                    <div key={idx} className="text-sm bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {med.name || 'Medication'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {med.dosage || 'Dose not clear'} • {med.time || 'Timing not clear'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  No medications clearly detected. Please verify with your vet.
                </p>
              )}
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Actions */}
          <div className="flex gap-3">
            {!preview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Choose Photo
              </button>
            )}
            {preview && !result && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-6 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Re-upload
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
