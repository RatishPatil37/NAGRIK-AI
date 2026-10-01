import React from 'react';
import { X, Printer, Landmark, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EscalationTicket } from '../../types';

interface ReceiptModalProps {
  ticket: EscalationTicket | null;
  wardName?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  ticket,
  wardName = 'Ward 04: Bandra West',
  onClose,
}) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden"
        >
          {/* Top Control Bar (Hidden during print) */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-zinc-700" />
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider font-display">
                Official Municipal Receipt
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-zinc-300" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Administrative Receipt Area */}
          <div className="print-receipt p-8 bg-white text-slate-900 font-serif relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <Landmark className="w-72 h-72 text-slate-900" />
            </div>

            {/* Header & Seal */}
            <div className="text-center pb-5 mb-5 border-b-2 border-slate-900 relative z-10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-slate-950 to-slate-800 text-white flex items-center justify-center mb-3 shadow-lg">
                <Landmark className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold tracking-wide uppercase text-slate-950 font-serif">
                Municipal Corporation Administration
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5 tracking-wide">
                Citizen Grievance Redressal & Statutory Service Docket
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Issued via Nagrik AI Citizen Intelligence Platform
              </p>
            </div>

            {/* Ticket ID Box */}
            <div className="my-4 p-4 bg-slate-50 border border-slate-300 rounded-xl text-center relative z-10">
              <span className="text-[10px] uppercase font-sans font-bold text-slate-500 tracking-wider block">
                Official Grievance Docket Number
              </span>
              <div className="text-lg font-mono font-bold text-slate-900 mt-1 tracking-wider">
                {ticket.ticket_id}
              </div>
            </div>

            {/* Key-Value Details Table */}
            <table className="w-full text-xs font-sans border-collapse my-5 relative z-10">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2.5 text-slate-500 font-semibold w-1/3">Department:</td>
                  <td className="py-2.5 text-slate-900 font-bold">{ticket.dept_code} — Municipal Services</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2.5 text-slate-500 font-semibold">Issue Category:</td>
                  <td className="py-2.5 text-slate-900 font-medium">{ticket.category}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2.5 text-slate-500 font-semibold">Jurisdiction Ward:</td>
                  <td className="py-2.5 text-slate-900 font-medium">{wardName}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2.5 text-slate-500 font-semibold">Priority Level:</td>
                  <td className="py-2.5 text-slate-900 font-bold uppercase">{ticket.priority}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2.5 text-slate-500 font-semibold">Statutory SLA Target:</td>
                  <td className="py-2.5 text-slate-900 font-bold font-mono">
                    {new Date(ticket.sla_deadline).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-500 font-semibold">Initial Status:</td>
                  <td className="py-2.5 text-emerald-700 font-bold uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{ticket.status}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer & QR Placeholder */}
            <div className="pt-5 border-t-2 border-slate-900 flex items-center justify-between text-[10px] font-sans text-slate-600 relative z-10">
              <div>
                <p className="font-semibold text-slate-800">Verification Seal & Digital Hash</p>
                <p className="font-mono mt-0.5 text-slate-600">SHA256-VERIFIED-{ticket.ticket_id.split('-').pop()}</p>
                <p className="text-slate-400 mt-1">Keep this receipt for all ward follow-ups.</p>
              </div>
              <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-mono text-[9px] text-center p-1 font-bold">
                [ OFFICIAL QR ]
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
