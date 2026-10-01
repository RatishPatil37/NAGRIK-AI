import React, { useState } from 'react';
import { ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CitationItem } from '../../types';

interface CitationChipProps {
  citation: CitationItem;
}

export const CitationChip: React.FC<CitationChipProps> = ({ citation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState<any>(null);

  const handleMouseEnter = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setIsOpen(true), 150);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setIsOpen(false), 200);
    setTimer(t);
  };

  return (
    <span
      className="relative inline-block align-baseline mx-0.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clickable Citation Pill */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 shadow-xs transition-colors cursor-pointer"
      >
        <FileText className="w-3 h-3 text-emerald-400" />
        <span>[S{citation.index}]</span>
      </motion.button>

      {/* Nature-Style Hover Card Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 bottom-full left-0 mb-2 w-80 sm:w-96 p-4 glass-card rounded-2xl shadow-2xl border border-slate-700/80 text-slate-100 text-xs backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-700/60">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1.5 uppercase tracking-wider">
                  {citation.department} GAZETTE RECORD
                </span>
                <h4 className="font-bold text-xs text-white leading-snug font-display">
                  {citation.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Section: {citation.section_ref}
                </p>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Verified
              </span>
            </div>

            {/* Verbatim Excerpt */}
            <p className="text-[11px] text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 italic leading-relaxed max-h-36 overflow-y-auto">
              "{citation.text}"
            </p>

            {/* Action Links */}
            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2 text-[11px]">
              <a
                href={citation.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Read Gazette</span>
              </a>
              <a
                href={citation.official_portal_ref}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 hover:underline"
              >
                <span>MoHUA Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
