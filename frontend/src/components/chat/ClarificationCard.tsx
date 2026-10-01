import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ClarificationPayload } from '../../types';

interface ClarificationCardProps {
  clarification: ClarificationPayload;
  onSelectOption: (value: any, label: string) => void;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  clarification,
  onSelectOption,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="my-4 p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-slate-900/90 border border-amber-500/40 text-slate-100 shadow-xl backdrop-blur-xl relative overflow-hidden"
    >
      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5 font-display">
        <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>Administrative Clarification Required</span>
      </div>
      <p className="text-xs sm:text-sm text-slate-200 font-medium mb-4 leading-relaxed">
        {clarification.prompt}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {clarification.options.map((opt, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectOption(opt.value, opt.label)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 hover:border-amber-400 hover:bg-amber-950/30 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors">
                {opt.label}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
