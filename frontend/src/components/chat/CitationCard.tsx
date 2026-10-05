import React, { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CitationItem } from '../../types';

import { GazettePreviewModal } from './GazettePreviewModal';

interface CitationChipProps {
  citation: CitationItem;
  onSelect?: (citation: CitationItem) => void;
}

export const CitationChip: React.FC<CitationChipProps> = ({ citation, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timer, setTimer] = useState<any>(null);

  const handleMouseEnter = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setIsOpen(true), 120);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setIsOpen(false), 200);
    setTimer(t);
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(citation);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <span
        className="relative inline-block align-baseline mx-0.5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Clickable Liquid Glass Citation Pill */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          <FileText className="w-3 h-3 text-zinc-400" />
          <span>[S{citation.index}]</span>
        </motion.button>

      {/* Nature-Style Hover Card Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 bottom-full left-0 mb-2 w-80 sm:w-96 p-4 liquid-glass rounded-2xl shadow-2xl border border-white/15 text-zinc-100 text-xs backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/[0.08]">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono text-zinc-400 bg-white/[0.05] border border-white/[0.08] mb-1 uppercase tracking-wider">
                  {citation.department} GAZETTE RECORD
                </span>
                <h4 className="font-bold text-xs text-white leading-snug font-display">
                  {citation.title}
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Section: {citation.section_ref}
                </p>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-300 bg-white/[0.06] px-2 py-0.5 rounded font-mono border border-white/10">
                <CheckCircle2 className="w-3 h-3 text-zinc-300" />
                Verified
              </span>
            </div>

            {/* Matched Text */}
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.05] text-[11px] text-zinc-300 leading-relaxed font-mono">
              <span className="text-zinc-500 mr-1.5 font-sans font-bold">"</span>
              {citation.text}
              <span className="text-zinc-500 ml-1.5 font-sans font-bold">"</span>
            </div>

            {/* Gazette Reference */}
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Ref: {citation.official_portal_ref || citation.doc_id}</span>
              <span className="text-zinc-500">Statutory 2026</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>

    {isModalOpen && (
      <GazettePreviewModal
        citation={citation}
        onClose={() => setIsModalOpen(false)}
      />
    )}
  </>
  );
};
