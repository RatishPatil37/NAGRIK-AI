import React from 'react';
import { ArrowRight, ShieldCheck, Scale, Droplet, Building2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TypewriterHeroProps {
  onSelectQuery: (query: string) => void;
}

const CIVIC_PROMPT_CARDS = [
  {
    icon: Scale,
    title: 'Property Tax 10% Early Bird Rebate',
    description: 'Capital value assessment formula, rebate deadlines & statutory payment portals in Ward 04.',
    prompt: 'What is the early bird 10% rebate for Property Tax in Ward 4?',
    dept: 'Revenue & Assessment',
  },
  {
    icon: Droplet,
    title: 'Report Water Main Rupture / Contamination',
    description: 'Statutory 4-hour emergency leak dispatch with automatic docketing (MCGM-2026-W04-XXXX).',
    prompt: 'Report water pipe burst with contaminated water',
    dept: 'Hydraulic Engineering',
  },
  {
    icon: Building2,
    title: 'Building Plan Approval & Setbacks (OBPAS)',
    description: 'Statutory 15-day approval SLA, FSI coefficients & road-width setback guidelines.',
    prompt: 'What are the setbacks and approval SLAs for building plan permission?',
    dept: 'Town Planning & OBPAS',
  },
  {
    icon: Trash2,
    title: 'Solid Waste Dumping & Segregation Penalties',
    description: 'Commercial waste disposal penalties, 2026 plastic bylaws & door-to-door schedules.',
    prompt: 'What are the penalties for open garbage dumping under 2026 rules?',
    dept: 'Solid Waste Management',
  },
];

export const TypewriterHero: React.FC<TypewriterHeroProps> = ({ onSelectQuery }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto px-4 pt-8 pb-4 text-center"
    >
      {/* Top Civic Badge */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-slate-700 dark:text-zinc-300 text-xs font-mono mb-5"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Official Municipal Knowledge & Decision Support Operating System</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </motion.div>

      {/* Clean, Refined Greeting */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-3 font-display">
        How can Nagrik AI assist you today?
      </h1>

      <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8 font-normal leading-relaxed">
        Grounded strictly in verified municipal bylaws, property tax schedules, and engineering charters with zero hallucination.
      </p>

      {/* 2x2 Clean Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto text-left">
        {CIVIC_PROMPT_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * (idx + 1) }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectQuery(card.prompt)}
              className="p-4 rounded-xl liquid-glass border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-zinc-300 group-hover:text-emerald-400 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      {card.dept}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors font-display mb-1">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                <span>Click to consult</span>
                <span className="text-emerald-400/80 group-hover:text-emerald-400">Statutory SLA Grounded →</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
