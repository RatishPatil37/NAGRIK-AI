import { useState, useEffect, type FC } from 'react';
import { Search, Droplets, Trash2, Home, Building2, PhoneCall, CheckCircle, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (query: string) => void;
}

const COMMANDS = [
  {
    category: 'Property Tax & Revenue',
    icon: Home,
    title: 'Property Tax Online Payment & 10% Rebate Rules',
    query: 'What is the property tax early bird rebate and how do I pay online before May 31st?',
  },
  {
    category: 'Water Supply & Sewerage',
    icon: Droplets,
    title: 'Report Water Pipeline Burst / Contamination (4h SLA)',
    query: 'A major water pipeline burst on the road with sewage overflow, please escalate immediately.',
  },
  {
    category: 'Solid Waste & Sanitation',
    icon: Trash2,
    title: 'Source Waste Segregation Rules & Penalty Schedule',
    query: 'What are the fines for littering and open dumping under solid waste bylaws?',
  },
  {
    category: 'Town Planning & Permissions',
    icon: Building2,
    title: 'Online Building Plan Permission (OBPAS) & Setback Rules',
    query: 'What are the setback requirements and approval SLA for residential building plots up to 500 sq meters?',
  },
  {
    category: 'Emergency Dispatch',
    icon: PhoneCall,
    title: 'Disaster Management & Life-Critical Emergency Hotlines',
    query: 'Emergency SOS fire building collapse assistance numbers',
  },
  {
    category: 'Grievance Tracking',
    icon: CheckCircle,
    title: 'Track Existing Municipal Ticket ID',
    query: 'How can I track my municipal grievance status with my ticket ID?',
  },
];

export const CommandPalette: FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setSearchTerm('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCommands = COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Type a municipal service, tax rule, or complaint (e.g. water, tax, permit)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching municipal services found. Press Esc to close.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectAction(cmd.query);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/90 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-900 truncate">
                      {cmd.title}
                    </div>
                    <div className="text-[11px] text-slate-500">{cmd.category}</div>
                  </div>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-400 rounded border border-slate-200">
                    ↵
                  </kbd>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono">ESC to cancel</span>
        </div>
      </div>
    </div>
  );
};
