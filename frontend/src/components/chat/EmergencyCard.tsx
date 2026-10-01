import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EmergencyPayload } from '../../types';

interface EmergencyCardProps {
  emergency: EmergencyPayload;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({ emergency }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="my-4 p-5 rounded-2xl liquid-glass border border-rose-500/25 text-white relative overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-2.5">
        <span className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </span>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400/90 block">
            Life-Critical Safety Protocol Triggered
          </span>
          <h4 className="font-bold text-sm text-zinc-100 font-display">
            {emergency.title}
          </h4>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-zinc-300 font-normal mb-4 leading-relaxed max-w-2xl">
        {emergency.message}
      </p>

      {/* Emergency Helpline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {emergency.contacts.map((contact, idx) => (
          <motion.a
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            key={idx}
            href={`tel:${contact.number}`}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-rose-500/30 hover:bg-white/[0.05] transition-all group"
          >
            <div>
              <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                {contact.service}
              </div>
              <div className="text-[11px] text-zinc-400">{contact.action}</div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-300 font-mono font-bold text-xs transition-colors">
              <PhoneCall className="w-3 h-3" />
              <span>{contact.number}</span>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
};
