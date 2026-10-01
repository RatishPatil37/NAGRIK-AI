import React from 'react';
import { AlertOctagon, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EmergencyPayload } from '../../types';

interface EmergencyCardProps {
  emergency: EmergencyPayload;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({ emergency }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="my-4 p-5 rounded-2xl bg-gradient-to-br from-red-950/70 via-red-900/50 to-slate-900/90 border-2 border-red-500/80 text-white shadow-2xl shadow-red-900/30 relative overflow-hidden backdrop-blur-xl"
    >
      {/* Pulsing Red Ambient Beacon */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

      <div className="flex items-center gap-3 text-red-400 font-bold text-sm sm:text-base mb-2 font-display">
        <span className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
          <AlertOctagon className="w-5 h-5 shrink-0 animate-bounce" />
        </span>
        <span className="tracking-wide uppercase">{emergency.title}</span>
      </div>

      <p className="text-xs sm:text-sm text-red-100/90 font-medium mb-4 leading-relaxed max-w-2xl">
        {emergency.message}
      </p>

      {/* Emergency Helpline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {emergency.contacts.map((contact, idx) => (
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={idx}
            href={`tel:${contact.number}`}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-red-500/30 hover:border-red-400 hover:bg-red-950/40 shadow-sm transition-all group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                {contact.service}
              </div>
              <div className="text-[11px] text-slate-400">{contact.action}</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 group-hover:bg-red-500 text-white font-mono font-bold text-xs shadow-md shadow-red-600/30 transition-colors">
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>{contact.number}</span>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
};
