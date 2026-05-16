import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Loader2, Key, ExternalLink } from 'lucide-react';
import { useAPIKeys, type APIKeyConfig } from '../hooks/useAPIKeys';

const PROVIDERS: {
  key: keyof APIKeyConfig;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  getLink: () => string;
  placeholder: string;
  isPrimary?: boolean;
}[] = [
  {
    key: 'gemini',
    name: 'Google Gemini',
    description: 'Fast, accurate AI responses. Free tier available with generous limits.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/20',
    getLink: () => 'https://aistudio.google.com/apikey',
    placeholder: 'AIza...',
    isPrimary: true,
  },
  {
    key: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'Industry-leading AI. Requires paid account with API credits.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    glowColor: 'shadow-emerald-500/20',
    getLink: () => 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-...',
  },
  {
    key: 'sarvam',
    name: 'Sarvam AI',
    description: 'Best-in-class speech recognition for Indian languages. Optional.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
    getLink: () => 'https://developers.sarvam.ai/',
    placeholder: 'sk_...',
  },
  {
    key: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Premium natural-sounding voices. Optional — browser TTS fallback available.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    glowColor: 'shadow-purple-500/20',
    getLink: () => 'https://elevenlabs.io/app/sign-in',
    placeholder: 'Enter your ElevenLabs API key...',
  },
];

interface APISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function APISettings({ isOpen, onClose }: APISettingsProps) {
  const { keys, status, freeTierCount, freeTierLimit, setKey, removeKey, testKey } = useAPIKeys();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});

  const handleInputChange = useCallback((provider: string, value: string) => {
    setInputValues(prev => ({ ...prev, [provider]: value }));
    setTestResults(prev => ({ ...prev, [provider]: null }));
  }, []);

  const handleSave = useCallback((provider: keyof APIKeyConfig) => {
    const value = inputValues[provider] || keys[provider];
    if (value.trim()) {
      setKey(provider, value);
      setInputValues(prev => ({ ...prev, [provider]: '' }));
    }
  }, [inputValues, keys, setKey]);

  const handleTest = useCallback(async (provider: keyof APIKeyConfig) => {
    const keyToTest = inputValues[provider] || keys[provider];
    if (!keyToTest) return;

    const success = await testKey(provider);
    setTestResults(prev => ({ ...prev, [provider]: success ? 'success' : 'error' }));
  }, [inputValues, keys, testKey]);

  const handleRemove = useCallback((provider: keyof APIKeyConfig) => {
    removeKey(provider);
    setInputValues(prev => ({ ...prev, [provider]: '' }));
    setTestResults(prev => ({ ...prev, [provider]: null }));
  }, [removeKey]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full z-[9999] flex flex-col"
          >
            <div className="flex-1 bg-[#111111] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-white text-lg">AI Settings</h2>
                  <p className="text-xs text-white/40 mt-0.5">Connect your API keys for unlimited access</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Free Tier Status */}
              <div className="px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Key size={14} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/80">Free Tier</p>
                    <p className="text-xs text-white/40">{freeTierCount} of {freeTierLimit} messages used</p>
                  </div>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${(freeTierCount / freeTierLimit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Provider Cards */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {PROVIDERS.map(provider => {
                  const isConnected = status[provider.key] === 'connected';
                  const isTesting = status[provider.key] === 'testing';
                  const testResult = testResults[provider.key];
                  const currentValue = keys[provider.key];
                  const inputValue = inputValues[provider.key] || '';

                  return (
                    <div
                      key={provider.key}
                      className={`rounded-2xl border p-4 transition-all ${
                        isConnected
                          ? `${provider.bgColor} ${provider.borderColor}`
                          : 'bg-white/3 border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${provider.bgColor} border ${provider.borderColor} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-lg font-bold ${provider.color}`}>
                            {provider.key === 'gemini' && 'G'}
                            {provider.key === 'openai' && 'O'}
                            {provider.key === 'sarvam' && 'S'}
                            {provider.key === 'elevenlabs' && 'E'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-heading font-bold text-sm ${provider.color}`}>
                              {provider.name}
                            </h3>
                            {provider.isPrimary && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">
                                Recommended
                              </span>
                            )}
                            {isConnected && (
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                                <Check size={10} />
                                Connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">{provider.description}</p>

                          {/* Input Area */}
                          <div className="mt-3 flex gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="password"
                                value={inputValue || currentValue}
                                onChange={e => handleInputChange(provider.key, e.target.value)}
                                placeholder={provider.placeholder}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                              />
                              {testResult === 'success' && (
                                <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                              )}
                              {testResult === 'error' && (
                                <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <a
                              href={provider.getLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
                            >
                              Get API Key
                              <ExternalLink size={10} />
                            </a>
                            <div className="flex gap-1.5 ml-auto">
                              {currentValue && (
                                <button
                                  onClick={() => handleRemove(provider.key)}
                                  className="text-[10px] font-medium text-red-400/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                  Remove
                                </button>
                              )}
                              <button
                                onClick={() => handleTest(provider.key)}
                                disabled={isTesting || !currentValue}
                                className="text-[10px] font-medium text-white/50 hover:text-white/80 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 size={10} className="animate-spin" />
                                    Testing...
                                  </>
                                ) : (
                                  'Test'
                                )}
                              </button>
                              {(inputValue || currentValue) && (
                                <button
                                  onClick={() => handleSave(provider.key)}
                                  className="text-[10px] font-bold text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                                >
                                  Save
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5">
                <p className="text-[10px] text-white/25 text-center">
                  Your API keys are stored locally on your device and never sent to any server.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
