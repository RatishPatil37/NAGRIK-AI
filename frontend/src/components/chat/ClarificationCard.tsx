import type { FC } from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import type { ClarificationPayload } from '../../types';

interface ClarificationCardProps {
  clarification: ClarificationPayload;
  onSelectOption: (value: any, label: string) => void;
}

export const ClarificationCard: FC<ClarificationCardProps> = ({
  clarification,
  onSelectOption,
}) => {
  return (
    <div className="my-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-slate-900 shadow-sm animate-in fade-in duration-150">
      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
        <HelpCircle className="w-4 h-4 shrink-0" />
        <span>Administrative Clarification Required</span>
      </div>
      <p className="text-xs text-slate-800 font-medium mb-3">
        {clarification.prompt}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {clarification.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectOption(opt.value, opt.label)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/60 text-left transition-colors group cursor-pointer"
          >
            <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-900">
              {opt.label}
            </span>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};
