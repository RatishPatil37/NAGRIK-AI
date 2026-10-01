import type { FC } from 'react';
import { AlertOctagon, PhoneCall } from 'lucide-react';
import type { EmergencyPayload } from '../../types';

interface EmergencyCardProps {
  emergency: EmergencyPayload;
}

export const EmergencyCard: FC<EmergencyCardProps> = ({ emergency }) => {
  return (
    <div className="my-3 p-4 rounded-2xl bg-red-50 border-2 border-red-600/90 text-slate-900 shadow-lg animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-2.5 text-red-700 font-bold text-sm mb-1.5">
        <AlertOctagon className="w-5 h-5 shrink-0 animate-bounce" />
        <span>{emergency.title}</span>
      </div>
      <p className="text-xs text-red-950 font-medium mb-3 leading-relaxed">
        {emergency.message}
      </p>

      {/* Emergency Helpline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {emergency.contacts.map((contact, idx) => (
          <a
            key={idx}
            href={`tel:${contact.number}`}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-red-200 hover:border-red-400 hover:bg-red-100/50 shadow-xs transition-colors group"
          >
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-red-800">
                {contact.service}
              </div>
              <div className="text-[11px] text-slate-500">{contact.action}</div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono font-bold text-xs shadow-xs">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{contact.number}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
