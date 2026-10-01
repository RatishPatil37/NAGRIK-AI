import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const SAMPLE_QUERIES = [
  "What is the 2026 Property Tax rebate deadline for Ward 04?",
  "How to report an urgent water pipeline leak on Linking Road?",
  "Mera birth certificate online download kaise karein?",
  "What are the building plan approval rules under Section 14(b)?",
  "Where is the Ward 08 Kurla civic ward office located?",
  "What are the solid waste segregation guidelines for residential societies?"
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
    const typingSpeed = isDeleting ? 25 : 45;

    if (!isDeleting && displayedText === fullText) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 2400);
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
      className="w-full max-w-4xl mx-auto px-4 py-8 text-center"
    >
      {/* Official Government Seal / Badge */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-6 shadow-lg shadow-emerald-500/5 backdrop-blur-md"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
        <span>Official Municipal AI Knowledge & Decision Workstation</span>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      </motion.div>

      {/* Main Title with Gradient Shimmer */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 font-display">
        Civic Intelligence.{" "}
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
          Zero Hallucination.
        </span>
      </h1>

      <p className="text-slate-300/80 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
        Grounded in verified 2026 Municipal Gazettes, Property Tax Bylaws, and Water Supply Charters.
        Ask in English, Hindi, or Marathi with real-time statutory citations.
      </p>

      {/* Interactive Typewriter Prompt Capsule */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSelectQuery(displayedText || SAMPLE_QUERIES[currentTextIndex])}
        className="glass-card-interactive group cursor-pointer max-w-2xl mx-auto rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 text-left shadow-2xl shadow-black/40 border border-slate-700/60 hover:border-emerald-500/40 relative overflow-hidden"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-emerald-400/90 uppercase tracking-wider mb-0.5">
              Live Prompt Demo • Click to Ask
            </div>
            <div className="text-slate-100 font-medium text-sm sm:text-base truncate">
              <span>{displayedText}</span>
              <span className="typing-cursor" />
            </div>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-300 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all shrink-0">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </motion.div>

      {/* Live Operational Metric Ticker */}
      <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-200 font-semibold">&lt;800ms</span> TTFT
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-slate-200 font-semibold">100%</span> RRF Evidence Pruned
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-200 font-semibold">&lt;5ms</span> Emergency Pre-Gate
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-slate-200 font-semibold">Gemini 3.7 + Groq</span> Resiliency
        </div>
      </div>
    </motion.div>
  );
};
