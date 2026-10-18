import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  MessageSquare,
  Search,
  Crosshair,
  Loader2,
  Shield,
  Home,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NagrikLogo } from '../brand/NagrikLogo';
import { AccountPopover, type UserProfile } from '../account/AccountPopover';
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
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  sessionsCount: number;
  onDetectWard: () => void;
  isDetectingWard: boolean;
  user: UserProfile;
  onOpenSettings: () => void;
  onNavigateHome: () => void;
  onSignOut?: () => void;
  activeView: 'landing' | 'conversation' | 'dashboard' | 'settings';
  onSelectView: (view: 'landing' | 'conversation' | 'dashboard') => void;
}

const LANGUAGES = [
  { code: 'en-IN', label: 'English', subtext: 'English (India)', native: 'English' },
  { code: 'hi-IN', label: 'हिंदी', subtext: 'Hindi (Official)', native: 'हिंदी' },
  { code: 'mr-IN', label: 'मराठी', subtext: 'Marathi (State Official)', native: 'मराठी' },
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
  user,
  onOpenSettings,
  onNavigateHome,
  onSignOut,
  activeView,
  onSelectView,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangMenuOpen]);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const currentWard =
    wards.find((w) => w.ward_id === selectedWardId) ||
    wards[3] || {
      ward_id: 4,
      ward_name: 'Ward 04: Bandra West & Khar',
      zone_name: 'Zone B',
    };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#08090D]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* ========================================================
            LEFT ZONE: Sidebar Toggle + Official Nagrik Logo + View Tabs
           ======================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* History Sidebar Toggle */}
          {activeView === 'conversation' && !isAdminMode && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center gap-1.5"
              title="Toggle Chat History (⌘O)"
              aria-label="Toggle chat history"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              {sessionsCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-white dark:bg-black/30 px-1.5 py-0.2 rounded-full hidden sm:inline text-zinc-300">
                  {sessionsCount}
                </span>
              )}
            </motion.button>
          )}

          {/* Authentic Nagrik AI Logo (Screenshot 3) */}
          <NagrikLogo size="md" onClick={onNavigateHome} />

          {/* Clean View Switcher Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 ml-2 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
            <button
              onClick={() => onSelectView('landing')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'landing'
                  ? 'bg-slate-100 dark:bg-white/[0.1] text-slate-950 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectView('conversation')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'conversation' && !isAdminMode
                  ? 'bg-slate-100 dark:bg-white/[0.1] text-slate-950 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={onToggleAdmin}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAdminMode
                  ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Ward Admin</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            CENTER ZONE: Unified Ward & Quick Search Capsule
            (Fills the empty void and eliminates 2 separate bulky controls)
           ======================================================== */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-auto">
          <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all text-xs">
            {/* Ward Selector with Integrated GPS Crosshair */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="relative flex-1 min-w-0">
                <select
                  value={selectedWardId || currentWard.ward_id}
                  onChange={(e) => onSelectWard(Number(e.target.value))}
                  className="bg-transparent text-slate-800 dark:text-zinc-200 font-medium focus:outline-none cursor-pointer text-xs pr-4 appearance-none w-full truncate"
                >
                  {wards.map((w) => (
                    <option
                      key={w.ward_id}
                      value={w.ward_id}
                      className="bg-white dark:bg-[#0E1017] text-slate-900 dark:text-zinc-200"
                    >
                      {w.ward_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
              </div>

              {/* Integrated GPS Auto-Detect Button */}
              <button
                onClick={onDetectWard}
                disabled={isDetectingWard}
                className="p-1 rounded text-slate-400 hover:text-emerald-500 transition-colors"
                title="Detect closest ward via GPS"
              >
                {isDetectingWard ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                ) : (
                  <Crosshair className="w-3 h-3" />
                )}
              </button>
            </div>

            <div className="h-3.5 w-[1px] bg-slate-300 dark:bg-white/10 mx-2 shrink-0" />

            {/* Quick ⌘K Search Pill */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Search Bylaws & Portals (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white dark:bg-black/40 text-slate-500 dark:text-zinc-400 rounded border border-slate-200 dark:border-white/10">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* ========================================================
            RIGHT ZONE: Only 3 Clean, Well-Spaced Controls
            1. Language  2. Theme Switcher  3. User Avatar (ss2)
           ======================================================== */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Ward Quick Selector (Visible only on small screens) */}
          <div className="flex lg:hidden items-center relative">
            <select
              value={selectedWardId || currentWard.ward_id}
              onChange={(e) => onSelectWard(Number(e.target.value))}
              className="bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-zinc-200 font-medium text-xs px-2.5 py-1.5 rounded-full pr-5 appearance-none max-w-[130px] truncate"
            >
              {wards.map((w) => (
                <option
                  key={w.ward_id}
                  value={w.ward_id}
                  className="bg-white dark:bg-[#0E1017] text-slate-900 dark:text-zinc-200"
                >
                  {w.ward_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none absolute right-2" />
          </div>

          {/* Custom Wide & Professional Multilingual Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-all cursor-pointer border border-slate-200/60 dark:border-white/10 shadow-sm"
              title="Select Language"
              aria-label="Select Language"
              aria-expanded={isLangMenuOpen}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-xs tracking-tight">{currentLang.native}</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
                  isLangMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </motion.button>

            {/* Floating Language Dropdown Card */}
            <AnimatePresence>
              {isLangMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#12141C] border border-slate-200/90 dark:border-white/10 shadow-2xl p-1.5 z-50 overflow-hidden"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-white/[0.06] mb-1 flex items-center justify-between">
                    <span>Language</span>
                    <span className="text-[9px] lowercase opacity-70">भाषा</span>
                  </div>
                  <div className="space-y-0.5">
                    {LANGUAGES.map((l) => {
                      const isSelected = language === l.code;
                      return (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            onSelectLanguage(l.code);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-white/[0.1] text-slate-950 dark:text-white font-bold'
                              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold leading-tight">{l.native}</div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500">{l.subtext}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Switcher Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </motion.button>

          {/* Dynamic User Avatar Trigger opening AccountPopover (Exact Match to Screenshot 2) */}
          <AccountPopover
            user={user}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
};
