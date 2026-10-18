import React from 'react';
import { ShieldCheck, BookOpen, Globe, ArrowRight, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { NagrikLogo } from '../brand/NagrikLogo';

interface LandingPageProps {
  onStartExploring: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAccount?: () => void;
}

const TESTIMONIALS = [
  {
    name: 'Ravi Kumar',
    role: 'Government Employee',
    avatar: 'RK',
    quote:
      'As a government employee, I often need to stay updated on new regulations and procedures. This application has been invaluable in providing accurate and timely information. The user-friendly interface and comprehensive coverage of laws and regulations have made it easier for me to perform my duties efficiently.',
  },
  {
    name: 'Aarti Sharma',
    role: 'Small Business Owner',
    avatar: 'AS',
    quote:
      'Running a small business comes with numerous legal and regulatory challenges. This application has simplified compliance by offering clear and accessible information on various business regulations. The guidance provided has helped me ensure that my business adheres to all legal requirements, which has saved me time and reduced the risk of non-compliance.',
  },
  {
    name: 'Rajesh Patel',
    role: 'College Student',
    avatar: 'RP',
    quote:
      'As a college student, I often need to understand my rights and responsibilities, especially when it comes to student-related issues. This application has been a great resource for learning about my rights and accessing relevant information quickly. The detailed explanations and examples have helped me make informed decisions and better understand my position in various situations.',
  },
  {
    name: 'Sneha Iyer',
    role: 'Social Activist',
    avatar: 'SI',
    quote:
      'In my work as a social activist, having access to accurate and detailed information on laws and regulations is crucial. This application has provided me with essential insights into legal frameworks and social justice issues. Its comprehensive resources have supported my advocacy efforts and enabled me to educate others effectively about their rights and legal options.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartExploring,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#08090D] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar (Screenshot 4) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#08090D]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/[0.06] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo (Screenshot 3) */}
          <NagrikLogo size="md" />

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              onClick={onStartExploring}
              className="px-4 py-2 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs sm:text-sm font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Exact Match to Screenshot 4) */}
      <section className="pt-16 sm:pt-24 pb-14 px-4 sm:px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.15] mb-4 font-display">
            Empowering Indian Citizens with <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-emerald-500 to-green-600 font-black">
              AI-Generated Answers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Nagrik AI - AI-Powered Insights on Laws, Rights, and Regulations in India
          </p>

          {/* Primary CTA Button: Start Exploring for Free */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartExploring}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Start Exploring for Free</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* 3 Pillar Feature Cards (Exact Match to Screenshot 4) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto text-center">
          {/* Pillar 1: Trustworthy Information */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="p-6 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] hover:border-amber-500/30 transition-all"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Trustworthy Information
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Accurate and up-to-date legal and civic data, ensuring that you stay informed with reliable content.
            </p>
          </motion.div>

          {/* Pillar 2: Comprehensive Coverage */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="p-6 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-400/30 transition-all"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-zinc-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Comprehensive Coverage
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Extensive information on laws, rights, and government schemes, all in one place.
            </p>
          </motion.div>

          {/* Pillar 3: Nationwide Reach */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="p-6 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] hover:border-emerald-500/30 transition-all"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Nationwide Reach
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Serving citizens across India with region-specific information tailored to your needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why NAGRIK AI? Section (Exact Match to Screenshot 4) */}
      <section className="py-14 px-4 sm:px-6 bg-slate-50/50 dark:bg-white/[0.01] border-y border-slate-100 dark:border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mb-4 font-display">
            Why NAGRIK AI?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
            Nagrik AI leverages cutting-edge AI technology to bring you the most accurate, personalized, and timely civic information. Whether you need details on legal rights, government policies, or constitutional acts, NAGRIK AI is your go-to resource.
          </p>
          <p className="text-xs font-semibold text-slate-800 dark:text-zinc-300">
            Trusted by thousands of users across India. Join the community and stay informed.
          </p>
        </div>
      </section>

      {/* Testimonials Section (Exact Match to Screenshot 4) */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white text-center mb-10 font-display">
          Testimonials
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="p-5 rounded-2xl bg-white dark:bg-[#10121A] border border-slate-200/90 dark:border-white/[0.08] shadow-sm flex flex-col justify-between"
            >
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-5 font-normal">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {t.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 text-center border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-zinc-500 font-mono">
        <div>NAGRIK AI (नागरिक AI) • Official Civic Knowledge Platform</div>
        <div className="mt-1 text-[11px] text-slate-400 dark:text-zinc-600">
          Grounded in Verified Gazettes, Bylaws, and Constitutional Mandates
        </div>
      </footer>
    </div>
  );
};
