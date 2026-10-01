import type { FC } from 'react';
import { Clock, Printer, CheckCircle2, Hash } from 'lucide-react';
import type { EscalationTicket } from '../../types';

interface EscalationCardProps {
  escalation: EscalationTicket;
  wardName?: string;
  onOpenReceipt: (ticket: EscalationTicket) => void;
}

export const EscalationCard: FC<EscalationCardProps> = ({
  escalation,
  wardName = 'Ward 04: Bandra West',
  onOpenReceipt,
}) => {
  const deadlineDate = new Date(escalation.sla_deadline);
  const formattedDeadline = deadlineDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="my-3 p-4 rounded-2xl bg-white border border-slate-300 shadow-md">
      {/* Header Docket Badge */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs">
            {escalation.dept_code}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Official Grievance Docket
            </span>
            <div className="font-mono font-bold text-xs text-slate-900 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>{escalation.ticket_id}</span>
            </div>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            escalation.priority === 'emergency'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : escalation.priority === 'high'
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}
        >
          {escalation.priority} Priority
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-slate-700">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 block">Category</span>
          <span className="font-semibold text-slate-900">{escalation.category}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 block">Jurisdiction</span>
          <span className="font-semibold text-slate-900">{wardName}</span>
        </div>
        <div className="col-span-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-900">
            <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-[11px] font-semibold">Statutory SLA Redressal Target:</span>
          </div>
          <span className="font-mono font-bold text-xs text-emerald-950">{formattedDeadline}</span>
        </div>
      </div>

      {/* Action: Printable Receipt */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dispatched to Ward Field Unit</span>
        </span>
        <button
          onClick={() => onOpenReceipt(escalation)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  );
};
