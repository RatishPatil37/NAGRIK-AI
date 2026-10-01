import React from 'react';
import { MapPin, Globe, Shield, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MunicipalWard } from '../../types';

interface WardHUDProps {
  wards: MunicipalWard[];
  selectedWardId: number | null;
  onSelectWard: (wardId: number) => void;
  language: string;
  onSelectLanguage: (lang: string) => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
  onOpenCommandPalette: () => void;
}

const LANGUAGES = [
  { code: 'en-IN', label: 'English', short: 'EN' },
  { code: 'hi-IN', label: 'हिंदी', short: 'HI' },
  { code: 'mr-IN', label: 'मराठी', short: 'MR' },
  { code: 'ta-IN', label: 'தமிழ்', short: 'TA' },
  { code: 'te-IN', label: 'తెలుగు', short: 'TE' },
];

export const WardHUD: React.FC<WardHUDProps> = ({
  wards,
  selectedWardId,
  onSelectWard,
  language,
  onSelectLanguage,
  isAdminMode,
  onToggleAdmin,
  onOpenCommandPalette,
}) => {
  const currentWard = wards.find((w) => w.ward_id === selectedWardId) || wards[3] || {
    ward_id: 4,
    ward_name: 'Ward 04: Bandra West & Khar',
    zone_name: 'Zone B',
  };

  return (
    <header className="sticky top-0 z-40 glass-nav px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Municipal Seal */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30"
          >
            🏛️
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-display">
                Nagrik AI
              </span>
              <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full tracking-wide">
                नागरिक AI
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 hidden sm:flex">
              <span className="flex items-center gap-1 text-emerald-400">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Live Municipal Gateway</span>
              </span>
              <span>•</span>
              <span>2026 Statutory Index</span>
            </div>
          </div>
        </div>

        {/* Living Ward Profile HUD Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ward Selector Pill */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs shadow-inner shadow-black/20 hover:border-emerald-500/50 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedWardId || currentWard.ward_id}
              onChange={(e) => onSelectWard(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id} className="bg-slate-900 text-white">
                  {w.ward_name} ({w.zone_name})
                </option>
              ))}
            </select>
          </motion.div>

          {/* Multilingual Selector Pill */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs shadow-inner shadow-black/20 hover:border-cyan-500/50 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.label} ({l.short})
                </option>
              ))}
            </select>
          </motion.div>

          {/* Command Palette Button (Cmd+K) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-all shadow-sm"
            title="Press Cmd+K or Ctrl+K to navigate"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Quick Nav</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-950 text-slate-400 rounded-md border border-slate-700">
              ⌘K
            </kbd>
          </motion.button>

          {/* Admin / Decision Support Toggle */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleAdmin}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
              isAdminMode
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700'
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${isAdminMode ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{isAdminMode ? 'Ward Command HUD' : 'Admin Command'}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
