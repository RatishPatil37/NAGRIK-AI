import React from 'react';
import {
  MapPin,
  Globe,
  Shield,
  Command,
  ChevronDown,
  Sun,
  Moon,
  MessageSquare,
  Crosshair,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { MunicipalWard } from '../../types';
import { getTranslation } from '../../lib/i18n';

interface WardHUDProps {
  wards: MunicipalWard[];
  selectedWardId: number | null;
  onSelectWard: (wardId: number) => void;
  language: string;
  onSelectLanguage: (lang: string) => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
  onOpenCommandPalette: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  sessionsCount: number;
  onDetectWard: () => void;
  isDetectingWard: boolean;
}

const LANGUAGES = [
  { code: 'en-IN', label: 'English', short: 'EN' },
  { code: 'hi-IN', label: 'हिंदी', short: 'HI' },
  { code: 'mr-IN', label: 'मराठी', short: 'MR' },
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
  theme,
  onToggleTheme,
  onToggleSidebar,
  sessionsCount,
  onDetectWard,
  isDetectingWard,
}) => {
  const t = getTranslation(language);

  const currentWard = wards.find((w) => w.ward_id === selectedWardId) || wards[3] || {
    ward_id: 4,
    ward_name: 'Ward 04: Bandra West & Khar',
    zone_name: 'Zone B',
  };

  return (
    <header className="sticky top-0 z-40 liquid-glass-nav px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gemini-Style Sidebar Toggle Button */}
          {!isAdminMode && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSidebar}
              className="p-2 rounded-xl liquid-glass-pill text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Toggle Chat History (⌘O)"
              aria-label="Toggle chat history"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              {sessionsCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-white/[0.08] px-1.5 py-0.2 rounded-full hidden sm:inline text-zinc-300">
                  {sessionsCount}
                </span>
              )}
            </motion.button>
          )}

          {/* Municipal Vector Crest */}
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/5 dark:bg-white/[0.06] border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-zinc-100 shadow-sm"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 dark:text-zinc-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" />
                <path d="M12 7v10" />
                <path d="M8 11h8" />
              </svg>
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white font-display">
                  {t.brandTitle}
                </span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 px-1 py-0.5 rounded bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.07]">
                  OS v2.6
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 hidden sm:flex font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                <span>{t.brandTagline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Liquid Glass Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Ward Selector with Geolocation Auto-Detect Button */}
          <div className="flex items-center gap-1">
            <div className="relative flex items-center liquid-glass-pill px-2.5 py-1.5 rounded-full text-xs text-slate-700 dark:text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0 mr-1" />
              <select
                value={selectedWardId || currentWard.ward_id}
                onChange={(e) => onSelectWard(Number(e.target.value))}
                className="bg-transparent text-slate-800 dark:text-zinc-200 font-medium focus:outline-none cursor-pointer text-xs pr-4 appearance-none max-w-[130px] sm:max-w-[200px] truncate"
              >
                {wards.map((w) => (
                  <option
                    key={w.ward_id}
                    value={w.ward_id}
                    className="bg-white dark:bg-[#0E1017] text-slate-900 dark:text-zinc-200"
                  >
                    {w.ward_name} ({w.zone_name})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500 pointer-events-none absolute right-2" />
            </div>

            {/* Geolocation Detect Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDetectWard}
              disabled={isDetectingWard}
              className="p-2 rounded-full liquid-glass-pill text-slate-700 dark:text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title={t.detectWard}
              aria-label="Detect Ward via GPS"
            >
              {isDetectingWard ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
            </motion.button>
          </div>

          {/* Multilingual Selector Liquid Pill */}
          <div className="relative flex items-center liquid-glass-pill px-2 py-1.5 rounded-full text-xs text-slate-700 dark:text-zinc-300">
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0 mr-1" />
            <select
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-zinc-200 font-medium focus:outline-none cursor-pointer text-xs pr-3 appearance-none"
            >
              {LANGUAGES.map((l) => (
                <option
                  key={l.code}
                  value={l.code}
                  className="bg-white dark:bg-[#0E1017] text-slate-900 dark:text-zinc-200"
                >
                  {l.short}
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none absolute right-1" />
          </div>

          {/* Dark / Light Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            className="p-2 rounded-xl liquid-glass-pill text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </motion.button>

          {/* Command Palette Trigger (Cmd+K) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
            title="Press Cmd+K or Ctrl+K to search"
          >
            <Command className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="font-medium text-[11px]">{t.searchCommand}</span>
            <kbd className="px-1 py-0.2 text-[8px] font-mono bg-black/5 dark:bg-black/40 text-slate-500 dark:text-zinc-400 rounded border border-black/10 dark:border-white/10">
              ⌘K
            </kbd>
          </motion.button>

          {/* Ward Admin Mode Switcher */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleAdmin}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              isAdminMode
                ? 'bg-slate-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold shadow-sm'
                : 'liquid-glass-pill text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Shield
              className={`w-3.5 h-3.5 ${
                isAdminMode
                  ? 'text-white dark:text-zinc-900'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            />
            <span className="hidden sm:inline">
              {isAdminMode ? t.executiveHudButton : t.adminModeButton}
            </span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
