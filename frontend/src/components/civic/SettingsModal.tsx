import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sliders,
  Volume2,
  Cpu,
  Trash2,
  Database,
  Check,
  Languages,
  Moon,
  Sun,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onSelectLanguage: (lang: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isTTSEnabled: boolean;
  onToggleTTS: () => void;
  onClearSessions: () => void;
  sessionsCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectLanguage,
  theme,
  onToggleTheme,
  isTTSEnabled,
  onToggleTTS,
  onClearSessions,
  sessionsCount,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl rounded-2xl liquid-glass border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display">
                  System Preferences & Settings
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Nagrik AI Municipal OS v2.6 Core Configuration
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm">
            {/* Section 1: AI Model Engine Architecture */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Tier AI LLM Routing</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        Google Gemini 3.7 Flash
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        PRIMARY ENGINE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Deterministic statutory reasoning with bracketed evidence verification.
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-black/10 dark:border-white/5 flex items-center justify-between opacity-80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-zinc-300 text-xs">
                        Google Gemini 3.5 Flash-Lite
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        SURGE TIER
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Sub-600ms escalation fallback for high-throughput citizen peaks.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-black/10 dark:border-white/5 flex items-center justify-between opacity-80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-zinc-300 text-xs">
                        Groq Llama 3.3 70B
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        EMERGENCY FAILOVER
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      External cloud provider redundancy for uninterrupted civic services.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Speech & Regional Voice Gateway */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Regional Voice & Audio Output</span>
              </div>
              <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-xs">
                      Auto-Play Verified Voice Output
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Speaks responses automatically using Microsoft Edge Neural TTS voices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleTTS}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isTTSEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isTTSEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Default Regional Voice:</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {language === 'mr-IN' ? 'mr-IN-AarohiNeural' : language === 'hi-IN' ? 'hi-IN-SwaraNeural' : 'en-IN-NeerjaNeural'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Language & Theme Interface */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
                <Languages className="w-3.5 h-3.5 text-emerald-400" />
                <span>Language & Appearance</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Language Picker */}
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                  <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1.5">
                    Statutory Script
                  </label>
                  <select
                    value={language}
                    onChange={(e) => onSelectLanguage(e.target.value)}
                    className="w-full bg-transparent text-slate-900 dark:text-white text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="en-IN" className="bg-white dark:bg-[#0E1017]">English (National)</option>
                    <option value="hi-IN" className="bg-white dark:bg-[#0E1017]">हिंदी (Hindi)</option>
                    <option value="mr-IN" className="bg-white dark:bg-[#0E1017]">मराठी (Marathi)</option>
                  </select>
                </div>

                {/* Theme Toggle */}
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-zinc-400">
                      Display Theme
                    </label>
                    <span className="text-xs font-medium text-slate-900 dark:text-white capitalize">
                      {theme} Mode
                    </span>
                  </div>
                  <button
                    onClick={onToggleTheme}
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-slate-700 dark:text-zinc-200 hover:text-white transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Privacy & Client Storage */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacy & Client Storage</span>
              </div>
              <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-xs">
                    Local Conversation Cache ({sessionsCount} / 20 Sessions)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 max-w-sm">
                    Stored strictly in your local browser sandbox with FIFO auto-pruning.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all stored conversation sessions from local storage?')) {
                      onClearSessions();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/[0.02] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            <span>Server Status: Render API Gateway Online</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-medium text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
