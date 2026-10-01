import React, { useState, useEffect } from 'react';
import { Search, Droplets, Trash2, Home, Building2, PhoneCall, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export const CommandPalette: React.FC<CommandPaletteProps> = ({
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl liquid-glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search municipal service, tax rule, or complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Command List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 font-mono">
                No matching municipal services found. Press ESC to close.
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                return (
                  <motion.button
                    whileHover={{ x: 2 }}
                    key={idx}
                    onClick={() => {
                      onSelectAction(cmd.query);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-all group cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate font-display">
                        {cmd.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">{cmd.category}</div>
                    </div>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-black/40 text-zinc-400 rounded border border-white/10">
                      ↵
                    </kbd>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-black/30 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Navigate with mouse or keyboard</span>
            <span>ESC to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
