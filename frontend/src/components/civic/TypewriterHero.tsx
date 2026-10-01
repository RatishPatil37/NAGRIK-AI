import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, ShieldCheck, Cpu, Zap, FileCheck2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SAMPLE_QUERIES = [
  "What is the 2026 Property Tax rebate deadline for Ward 04 Bandra?",
  "Report an urgent 12-inch water main rupture on Linking Road with sewage backflow.",
  "Mera birth certificate online download karne ka statutory procedure kya hai?",
  "What are the residential setback standards under Section 14(b) of the Building Bylaws?",
  "What are the commercial solid waste non-segregation penalties under 2026 rules?",
  "Where is the Ward 08 Kurla civic office located and what are the citizen counter timings?"
];

interface TypewriterHeroProps {
  onSelectQuery: (query: string) => void;
}

export const TypewriterHero: React.FC<TypewriterHeroProps> = ({ onSelectQuery }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = SAMPLE_QUERIES[currentTextIndex];
    const typingSpeed = isDeleting ? 20 : 40;

    if (!isDeleting && displayedText === fullText) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 2600);
      return () => clearTimeout(pauseTimer);
    } else if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % SAMPLE_QUERIES.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText((prev) =>
        isDeleting ? fullText.substring(0, prev.length - 1) : fullText.substring(0, prev.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentTextIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto px-4 pt-6 pb-4 text-center"
    >
      {/* Editorial Micro-Badge */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-zinc-300 text-xs font-mono mb-6"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
        <span>Statutory Municipal OS • 2026 Gazettes</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
      </motion.div>

      {/* Editorial Typography (Zero Neon) */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-4 font-display leading-[1.08]">
        Precision Civic Intelligence.
        <br />
        <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Zero Hallucination.
        </span>
      </h1>

      <p className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
        Grounded strictly in verified municipal bylaws, property tax schedules, and engineering charters. 
        Instant multilingual assistance with deterministic statutory citations.
      </p>

      {/* Liquid Glass Interactive Search Capsule (21st.dev Style) */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSelectQuery(displayedText || SAMPLE_QUERIES[currentTextIndex])}
        className="liquid-glass group cursor-pointer max-w-2xl mx-auto rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-left border border-white/10 hover:border-white/20 transition-all shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5">
              Live Prompt • Click To Consult
            </div>
            <div className="text-zinc-100 font-medium text-sm sm:text-base truncate">
              <span>{displayedText}</span>
              <span className="typing-cursor" />
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-zinc-300 text-xs font-mono group-hover:bg-white/[0.1] group-hover:text-white transition-all shrink-0">
          <span>Consult</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </motion.div>

      {/* Suggested Fast Query Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mt-4">
        {[
          { label: "Property Tax 10% Rebate", q: "What is the early bird 10% rebate for Property Tax in Ward 4?" },
          { label: "Report Water Main Rupture", q: "Report water pipe burst with contaminated water" },
          { label: "Building Plan Setbacks (OBPAS)", q: "What are the setbacks and approval SLAs for building plan permission?" },
          { label: "Garbage Bylaw Penalties", q: "What are the penalties for open garbage dumping under 2026 rules?" },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuery(item.q)}
            className="liquid-glass-pill px-3 py-1.5 rounded-full text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Minimalist Telemetry Grid (Zero Neon) */}
      <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-zinc-300" />
          <span>&lt;800ms Latency</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-3.5 h-3.5 text-zinc-300" />
          <span>100% Deterministic Grounding</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
          <span>&lt;5ms Emergency Gate</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-zinc-300" />
          <span>Triple Redundancy Fallback</span>
        </div>
      </div>
    </motion.div>
  );
};
