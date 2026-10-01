import React, { useState } from 'react';
import { Clock, Printer, Hash, Copy, Check, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EscalationTicket } from '../../types';

interface EscalationCardProps {
  escalation: EscalationTicket;
  wardName?: string;
  onOpenReceipt: (ticket: EscalationTicket) => void;
}

export const EscalationCard: React.FC<EscalationCardProps> = ({
  escalation,
  wardName = 'Ward 04: Bandra West',
  onOpenReceipt,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(escalation.ticket_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deadlineDate = new Date(escalation.sla_deadline);
  const formattedDeadline = deadlineDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const calculatedHours = Math.max(4, Math.round(diffMs / (1000 * 60 * 60)));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="my-4 p-5 rounded-2xl liquid-glass border border-white/10 text-white relative overflow-hidden"
    >
      {/* Top Docket Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-zinc-200">
            {escalation.dept_code}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              Official Grievance Docket Registered
            </span>
            <div className="font-mono font-bold text-sm text-zinc-100 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-zinc-500" />
              <span>{escalation.ticket_id}</span>
              <button
                onClick={handleCopyTicket}
                className="text-zinc-400 hover:text-white transition-colors p-1"
                title="Copy Ticket ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-zinc-200" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${
            escalation.priority === 'emergency'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              : escalation.priority === 'high'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : 'bg-zinc-800 text-zinc-300 border-white/10'
          }`}
        >
          {escalation.priority} Priority
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs mb-4 text-zinc-300">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[10px] text-zinc-400 block mb-0.5 font-mono">Department & Category</span>
          <span className="font-medium text-zinc-200">{escalation.category}</span>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[10px] text-zinc-400 block mb-0.5 font-mono">Jurisdiction</span>
          <span className="font-medium text-zinc-200">{wardName}</span>
        </div>
      </div>

      {/* SLA Timer Indicator */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between text-xs mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-300 font-medium">Statutory SLA Target</span>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-zinc-100">{calculatedHours}h Statutory Target</div>
          <div className="text-[10px] text-zinc-400 font-mono">Deadline: {formattedDeadline}</div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Cryptographically Sealed</span>
        </span>
        <button
          onClick={() => onOpenReceipt(escalation)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg liquid-glass-pill text-xs font-medium text-zinc-200 hover:text-white transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-zinc-400" />
          <span>Print Official Receipt</span>
        </button>
      </div>
    </motion.div>
  );
};
