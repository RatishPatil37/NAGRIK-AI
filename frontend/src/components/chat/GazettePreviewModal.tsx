import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import type { CitationItem } from '../../types';

interface GazettePreviewModalProps {
  citation: CitationItem | null;
  onClose: () => void;
}

export const GazettePreviewModal: React.FC<GazettePreviewModalProps> = ({ citation, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!citation) return null;

  const downloadUrl = citation.source_url
    ? citation.source_url
    : `/api/v1/documents/${citation.doc_id}/download`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-zinc-950/90 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden backdrop-blur-2xl text-zinc-100"
        >
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-zinc-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-white/[0.08] border border-white/10 text-zinc-300">
                    {citation.department} STATUTORY GAZETTE
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Citation [S{citation.index}]
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1 font-display">
                  {citation.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-zinc-500 block text-[10px]">SECTION / CLAUSE</span>
              <span className="text-zinc-200 font-semibold">{citation.section_ref || 'Official Text'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-zinc-500 block text-[10px]">DOCUMENT IDENTIFIER</span>
              <span className="text-zinc-200 font-semibold truncate block">{citation.doc_id}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-zinc-500 block text-[10px]">OFFICIAL PORTAL REF</span>
              <a
                href={citation.official_portal_ref || 'https://mohua.gov.in'}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-300 hover:text-white inline-flex items-center gap-1 truncate"
              >
                <span>Portal Link</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>

          {/* Matched Gazette Excerpt */}
          <div className="mb-6">
            <span className="text-[11px] font-mono text-zinc-400 mb-2 block uppercase tracking-wider">
              Exact Gazette Record Excerpt:
            </span>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs sm:text-sm text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
              <span className="text-amber-300/80 bg-amber-400/10 px-1 py-0.5 rounded">
                "{citation.text}"
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <span>Official Government of India Civic Corpus</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors"
              >
                Close
              </button>

              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Gazette</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
