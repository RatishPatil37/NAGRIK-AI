import { useState, type FC } from 'react';
import { ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import type { CitationItem } from '../../types';

interface CitationChipProps {
  citation: CitationItem;
}

export const CitationChip: FC<CitationChipProps> = ({ citation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState<any>(null);

  const handleMouseEnter = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setIsOpen(true), 180);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setIsOpen(false), 150);
    setTimer(t);
  };

  return (
    <span
      className="relative inline-block align-baseline mx-0.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clickable Citation Pill */}
      <button
        type="button"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
      >
        <FileText className="w-3 h-3 text-emerald-700" />
        <span>[S{citation.index}]</span>
      </button>

      {/* Nature-Style Hover Card Popover */}
      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 sm:w-96 p-3.5 bg-white rounded-xl shadow-2xl border border-slate-300 text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
            <div>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white mb-1">
                {citation.department} GAZETTE
              </span>
              <h4 className="font-bold text-xs text-slate-900 leading-snug">
                {citation.title}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Section: {citation.section_ref}
              </p>
            </div>
            <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>

          {/* Verbatim Excerpt */}
          <p className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed max-h-36 overflow-y-auto">
            "{citation.text}"
          </p>

          {/* Action Links */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
            <a
              href={citation.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Read Gazette</span>
            </a>
            <a
              href={citation.official_portal_ref}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 hover:underline"
            >
              <span>MoHUA Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </span>
  );
};
