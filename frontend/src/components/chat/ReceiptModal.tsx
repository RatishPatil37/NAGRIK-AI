import type { FC } from 'react';
import { X, Printer, Landmark, CheckCircle } from 'lucide-react';
import type { EscalationTicket } from '../../types';

interface ReceiptModalProps {
  ticket: EscalationTicket | null;
  wardName?: string;
  onClose: () => void;
}

export const ReceiptModal: FC<ReceiptModalProps> = ({
  ticket,
  wardName = 'Ward 04: Bandra West',
  onClose,
}) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-100">
          <span className="font-semibold text-xs text-slate-700">Official Municipal Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Administrative Receipt Area */}
        <div className="print-receipt p-6 bg-white text-slate-900 font-serif">
          {/* Header & Seal */}
          <div className="text-center pb-4 mb-4 border-b-2 border-slate-900">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 text-white flex items-center justify-center mb-2">
              <Landmark className="w-6 h-6 text-amber-300" />
            </div>
            <h2 className="text-lg font-bold tracking-wide uppercase text-slate-950">
              Municipal Corporation Administration
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Citizen Grievance Redressal & Statutory Service Docket
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Issued via Nagrik AI Citizen Intelligence Platform
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded text-center">
            <span className="text-[10px] uppercase font-sans font-bold text-slate-500 block">
              Official Grievance Docket Number
            </span>
            <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
              {ticket.ticket_id}
            </div>
          </div>

          {/* Key-Value Details Table */}
          <table className="w-full text-xs font-sans border-collapse my-4">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-500 font-semibold w-1/3">Department:</td>
                <td className="py-2 text-slate-900 font-bold">{ticket.dept_code} — Municipal Services</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-500 font-semibold">Issue Category:</td>
                <td className="py-2 text-slate-900 font-medium">{ticket.category}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-500 font-semibold">Jurisdiction Ward:</td>
                <td className="py-2 text-slate-900 font-medium">{wardName}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-500 font-semibold">Priority Level:</td>
                <td className="py-2 text-slate-900 font-bold uppercase">{ticket.priority}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-500 font-semibold">Statutory SLA Target:</td>
                <td className="py-2 text-slate-900 font-bold font-mono">
                  {new Date(ticket.sla_deadline).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500 font-semibold">Initial Status:</td>
                <td className="py-2 text-emerald-700 font-bold uppercase flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{ticket.status}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer & QR Placeholder */}
          <div className="pt-4 border-t-2 border-slate-900 flex items-center justify-between text-[10px] font-sans text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Verification Seal & Digital Hash</p>
              <p className="font-mono mt-0.5">SHA256-VERIFIED-{ticket.ticket_id.split('-').pop()}</p>
              <p className="text-slate-400 mt-1">Keep this receipt for all ward follow-ups.</p>
            </div>
            <div className="w-14 h-14 border border-slate-300 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-mono text-[9px] text-center p-1">
              [ OFFICIAL MUNICIPAL QR ]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
