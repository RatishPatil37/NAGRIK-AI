import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  MapPin,
  PhoneCall,
  Lock,
} from 'lucide-react';
import type { MunicipalWard } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWard: MunicipalWard | undefined;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentWard,
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
          className="relative w-full max-w-md rounded-2xl liquid-glass border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header Banner */}
          <div className="relative p-6 bg-gradient-to-br from-emerald-600/20 via-slate-900/40 to-transparent border-b border-black/5 dark:border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close account modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-bold text-base flex items-center justify-center shadow-lg font-mono">
                  CP
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0E1017] flex items-center justify-center text-white">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Citizen Portal Identity
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                  MCGM-CITIZEN-2026-9402
                </p>
              </div>
            </div>
          </div>

          {/* Account Details Body */}
          <div className="p-6 space-y-4 text-xs">
            {/* Jurisdiction Card */}
            <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Jurisdiction & Municipal Ward</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-300">Registered Ward:</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {currentWard?.ward_name || 'Ward 04: Bandra West'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-300">Administrative Zone:</span>
                <span className="font-mono text-slate-700 dark:text-zinc-300">
                  {currentWard?.zone_name || 'Zone B (Western Suburbs)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-300">Corporation:</span>
                <span className="text-slate-700 dark:text-zinc-300">
                  Municipal Corporation of Greater Mumbai
                </span>
              </div>
            </div>

            {/* Statutory Security & Privacy */}
            <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Statutory Data Privacy</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Queries are processed with zero-retention ephemeral vectors under the Digital Personal Data Protection (DPDP) Act 2023. Grievance dockets are signed with SHA-256 tokens.
              </p>
            </div>

            {/* Emergency Contacts Direct Line */}
            <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                <span>Official Municipal Contacts</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">1916</div>
                  <div className="text-[9px] text-slate-500 dark:text-zinc-400">Disaster Cell</div>
                </div>
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">101</div>
                  <div className="text-[9px] text-slate-500 dark:text-zinc-400">Fire Control</div>
                </div>
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">108</div>
                  <div className="text-[9px] text-slate-500 dark:text-zinc-400">Ambulance</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/[0.02] flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
              Session: Encrypted Local Token
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-950 font-medium text-xs transition-colors hover:opacity-90"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
