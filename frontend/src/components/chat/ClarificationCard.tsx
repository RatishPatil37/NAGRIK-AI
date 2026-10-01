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
      className="my-4 p-5 rounded-2xl liquid-glass border border-white/10 text-zinc-100 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] uppercase tracking-wider mb-2">
        <HelpCircle className="w-3.5 h-3.5 text-zinc-300" />
        <span>Administrative Clarification Required</span>
      </div>
      <p className="text-xs sm:text-sm text-zinc-200 font-normal mb-4 leading-relaxed">
        {clarification.prompt}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {clarification.options.map((opt, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectOption(opt.value, opt.label)}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06] text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded bg-white/[0.06] text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-white/10">
                {idx + 1}
              </span>
              <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                {opt.label}
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
