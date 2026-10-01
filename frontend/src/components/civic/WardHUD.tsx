import type { FC } from 'react';
import { MapPin, Globe, Shield, Sparkles } from 'lucide-react';
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

export const WardHUD: FC<WardHUDProps> = ({
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
    <header className="sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-700/60 shadow-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Municipal Seal */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-inner">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">Nagrik AI</span>
              <span className="text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.5 rounded">
                नागरिक AI
              </span>
            </div>
            <p className="text-[10px] text-slate-300 hidden sm:block">
              Municipal Knowledge & Decision Support Platform
            </p>
          </div>
        </div>

        {/* Living Ward Profile HUD Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ward Selector Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedWardId || currentWard.ward_id}
              onChange={(e) => onSelectWard(Number(e.target.value))}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id} className="bg-slate-900 text-white">
                  {w.ward_name} ({w.zone_name})
                </option>
              ))}
            </select>
          </div>

          {/* Multilingual Selector Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.label} ({l.short})
                </option>
              ))}
            </select>
          </div>

          {/* Command Palette Button (Cmd+K) */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/70 text-xs text-slate-300 transition-colors"
            title="Press Cmd+K or Ctrl+K to navigate"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 text-slate-400 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Admin / Decision Support Toggle */}
          <button
            onClick={onToggleAdmin}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isAdminMode
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAdminMode ? 'Ward Command' : 'Admin Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
