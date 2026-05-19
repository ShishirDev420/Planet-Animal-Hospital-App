import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, RefreshCw, Zap, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setCameraError('Camera access denied or unavailable. Use file upload instead.');
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleFlash = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities?.();
      if ((capabilities as any)?.torch) {
        track.applyConstraints({ advanced: [{ torch: !flashOn }] as any });
        setFlashOn(!flashOn);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setTimeout(startCamera, 200);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const confirmCapture = () => {
    if (!capturedImage) return;
    const arr = capturedImage.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const file = new File([u8arr], `prescription-${Date.now()}.jpg`, { type: mime });
    onCapture(file);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="cinematic-card-title text-lg text-slate-900 dark:text-white">
                Capture Prescription
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Take a clear photo of the document
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured prescription"
                className="w-full h-full object-contain"
              />
            ) : cameraError ? (
              <div className="text-center p-8">
                <ImageIcon size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-300 text-sm mb-4">{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-2xl bg-planet-yellow text-black font-bold text-sm hover:brightness-110 transition-all"
                >
                  Upload from Gallery
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <RefreshCw size={32} className="animate-spin text-white/60" />
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}
          </div>

          <div className="p-4 flex items-center justify-center gap-4">
            {!capturedImage && !cameraError && (
              <>
                <button
                  onClick={toggleFlash}
                  className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Toggle flash"
                >
                  <Zap size={20} className={flashOn ? 'text-planet-yellow' : ''} />
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="w-16 h-16 rounded-full border-4 border-planet-yellow bg-white flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-planet-yellow" />
                </button>

                <button
                  onClick={switchCamera}
                  className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Switch camera"
                >
                  <RefreshCw size={20} />
                </button>
              </>
            )}

            {capturedImage && (
              <div className="flex gap-3">
                <button
                  onClick={retakePhoto}
                  className="px-6 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Retake
                </button>
                <button
                  onClick={confirmCapture}
                  className="px-6 py-3 rounded-2xl bg-planet-yellow text-black font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Upload size={16} />
                  Use Photo
                </button>
              </div>
            )}

            {cameraError && !capturedImage && (
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm"
              >
                Cancel
              </button>
            )}
          </div>

          {!capturedImage && !cameraError && (
            <div className="px-4 pb-4 flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline"
              >
                Or upload from gallery
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
