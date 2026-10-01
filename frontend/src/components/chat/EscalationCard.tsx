import React, { useEffect, useState } from 'react';
import { Clock, Printer, CheckCircle2, Hash, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
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

  useEffect(() => {
    // Fire celebratory confetti on ticket creation
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10B981', '#06B6D4', '#F59E0B'],
      });
    } catch (e) {
      // Graceful fallback if canvas is restricted
    }
  }, []);

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="my-4 p-5 rounded-2xl glass-card border border-emerald-500/30 shadow-2xl relative overflow-hidden group"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Docket Badge */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-700/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/20 font-mono">
            {escalation.dept_code}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Official Grievance Docket
            </span>
            <div className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>{escalation.ticket_id}</span>
              <button
                onClick={handleCopyTicket}
                className="text-slate-400 hover:text-emerald-300 transition-colors p-1"
                title="Copy Ticket ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
            escalation.priority === 'emergency'
              ? 'bg-red-500/15 text-red-300 border-red-500/40 shadow-red-500/10'
              : escalation.priority === 'high'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-500/10'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
          }`}
        >
          {escalation.priority} Priority
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs mb-4 text-slate-300 relative z-10">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Issue Category</span>
          <span className="font-semibold text-white">{escalation.category}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Ward Jurisdiction</span>
          <span className="font-semibold text-white">{wardName}</span>
        </div>
        <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0 animate-spin-slow" />
            <span className="text-xs font-semibold">Statutory SLA Redressal Target:</span>
          </div>
          <span className="font-mono font-bold text-xs text-emerald-200">{formattedDeadline}</span>
        </div>
      </div>

      {/* Action: Printable Receipt */}
      <div className="flex items-center justify-between pt-1 relative z-10">
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Dispatched to Municipal Ward Field Unit</span>
        </span>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpenReceipt(escalation)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Receipt</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
