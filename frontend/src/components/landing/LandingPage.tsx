import React, { useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  Globe,
  Sun,
  Moon,
  X,
  CheckCircle2,
  Mail,
  Send,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NagrikLogo } from '../brand/NagrikLogo';
import type { UserProfile } from '../account/AccountPopover';

interface LandingPageProps {
  onStartExploring: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAccount?: () => void;
  userProfile?: UserProfile;
}

const TESTIMONIALS = [
  {
    name: 'Ravi Kumar',
    role: 'Government Employee',
    image: '/1.png',
    quote:
      'As a government employee, I often need to stay updated on new regulations and procedures. This application has been invaluable in providing accurate and timely information. The user-friendly interface and comprehensive coverage of laws and regulations have made it easier for me to perform my duties efficiently.',
  },
  {
    name: 'Aarti Sharma',
    role: 'Small Business Owner',
    image: '/2.png',
    quote:
      'Running a small business comes with numerous legal and regulatory challenges. This application has simplified compliance by offering clear and accessible information on various business regulations. The guidance provided has helped me ensure that my business adheres to all legal requirements, which has saved me time and reduced the risk of non-compliance.',
  },
  {
    name: 'Rajesh Patel',
    role: 'College Student',
    image: '/3.png',
    quote:
      'As a college student, I often need to understand my rights and responsibilities, especially when it comes to student-related issues. This application has been a great resource for learning about my rights and accessing relevant information quickly. The detailed explanations and examples have helped me make informed decisions and better understand my position in various situations.',
  },
  {
    name: 'Sneha Iyer',
    role: 'Social Activist',
    image: '/4.png',
    quote:
      'In my work as a social activist, having access to accurate and detailed information on laws and regulations is crucial. This application has provided me with essential insights into legal frameworks and social justice issues. Its comprehensive resources have supported my advocacy efforts and enabled me to educate others effectively about their rights and legal options.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartExploring,
  theme,
  onToggleTheme,
  onOpenAccount,
  userProfile,
}) => {
  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  // Footer Modals
  const [activeModal, setActiveModal] = useState<'feedback' | 'faq' | 'privacy' | 'terms' | 'contact' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setIsNewsletterOpen(false);
      setNewsletterSubscribed(false);
      setNewsletterEmail('');
    }, 2500);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setActiveModal(null);
      setFeedbackSent(false);
      setFeedbackText('');
    }, 2000);
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) return;
    setContactSent(true);
    setTimeout(() => {
      setActiveModal(null);
      setContactSent(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#08090D] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar (Screenshot 4) */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#08090D] border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo (Authentic Image Asset) */}
          <NagrikLogo size="md" />

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-slate-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={onStartExploring}
              className="px-5 py-2 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs sm:text-sm font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
            >
              Get Started
            </button>

            {/* Quick Account Profile Trigger */}
            {onOpenAccount && (
              <button
                type="button"
                onClick={onOpenAccount}
                className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 hover:ring-2 hover:ring-slate-300 dark:hover:ring-white/20 transition-all cursor-pointer ml-1"
                title={userProfile?.name ? `${userProfile.name} - Account Settings` : 'Account Settings'}
              >
                <img
                  src={userProfile?.avatarUrl || '/google-avatar.png'}
                  alt={userProfile?.name || 'Account'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/google-avatar.png';
                  }}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (Clean, Authoritative, Editorial Typography - Zero Neon Slop) */}
      <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 text-center max-w-5xl mx-auto">
        <div>
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12] mb-6 font-display">
            Empowering Indian Citizens with <br className="hidden sm:inline" />
            <span className="text-slate-900 dark:text-white">AI-Generated Answers</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Nagrik AI - AI-Powered Insights on Laws, Rights, and Regulations in India
          </p>

          {/* Primary CTA Button: Clean, Solid High-Contrast Pill (No Glow / No Multi-Color Slop) */}
          <button
            type="button"
            onClick={onStartExploring}
            className="px-8 py-3.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-slate-950 font-semibold text-sm sm:text-base transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
          >
            <span>Start Exploring for Free</span>
          </button>
        </div>

        {/* 3 Pillar Feature Cards (Unified, Editorial Civic Quality) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto text-center">
          {/* Pillar 1: Trustworthy Information */}
          <div className="p-7 rounded-2xl bg-white dark:bg-[#11131C] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-800 dark:text-zinc-200 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">
              Trustworthy Information
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Accurate and up-to-date legal and civic data, ensuring that you stay informed with reliable content.
            </p>
          </div>

          {/* Pillar 2: Comprehensive Coverage */}
          <div className="p-7 rounded-2xl bg-white dark:bg-[#11131C] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-800 dark:text-zinc-200 mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">
              Comprehensive Coverage
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Extensive information on laws, rights, and government schemes, all in one place.
            </p>
          </div>

          {/* Pillar 3: Nationwide Reach */}
          <div className="p-7 rounded-2xl bg-white dark:bg-[#11131C] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-800 dark:text-zinc-200 mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">
              Nationwide Reach
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Serving citizens across India with region-specific information tailored to your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Why NAGRIK AI? Section (Exact Match to Screenshot 4) */}
      <section id="why-nagrik" className="py-14 px-4 sm:px-6 bg-slate-50/60 dark:bg-white/[0.02] border-y border-slate-200/80 dark:border-white/[0.06]">
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
              className="p-5 rounded-xl bg-white dark:bg-[#10121A] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
            >
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-5 font-normal">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                />
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

      {/* ========================================================
          Nagrik Newsletter Section (Clean Monochrome, No Multi-Color AI Slop)
         ======================================================== */}
      <section id="newsletter" className="py-16 px-4 text-center border-t border-slate-200/80 dark:border-white/[0.06]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mb-6 font-display">
            Nagrik Newsletter
          </h2>

          {isNewsletterOpen ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                autoFocus
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shrink-0 shadow-sm"
              >
                {newsletterSubscribed ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsNewsletterOpen(true)}
                className="px-8 py-3 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-slate-950 font-bold text-sm transition-all cursor-pointer shadow-sm"
              >
                Subscribe to Our Newsletter
              </button>
              <a
                href="https://nagrik-ai-newsletter.beehiiv.com/subscribe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white underline underline-offset-4 transition-colors"
              >
                Open in Beehiiv →
              </a>
            </div>
          )}

          {newsletterSubscribed && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-3 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Thank you! You are now subscribed to the Nagrik Civic Gazette.</span>
            </p>
          )}
        </div>
      </section>

      {/* ========================================================
          Footer (Exact 4 Columns & Styling from User's Uploaded Image 2)
         ======================================================== */}
      <footer className="mt-auto bg-[#F9F8F6] dark:bg-[#0D0E15] border-t border-slate-200 dark:border-white/[0.08] pt-12 pb-8 px-4 sm:px-8 text-xs text-slate-600 dark:text-zinc-400 font-sans">
        <div className="max-w-6xl mx-auto">
          {/* 4 Column Navigation Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: NAGRIK AI */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 text-[11px]">
                NAGRIK AI
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('why-nagrik')}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('feedback')}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Feedback
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('faq')}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: HELP CENTER */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 text-[11px]">
                HELP CENTER
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://discord.gg"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Discord Server
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('contact')}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: LEGAL */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 text-[11px]">
                LEGAL
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: SERVICES */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 text-[11px]">
                SERVICES
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={onStartExploring}
                    className="hover:text-[#F97316] font-semibold transition-colors"
                  >
                    Nagrik Chat
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('newsletter')}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors"
                  >
                    Subscribe Us
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Social Icons Row (Exact Match to Image 2) */}
          <div className="pt-8 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-slate-500 dark:text-zinc-500 text-[11px]">
              © 2024 Nagrik AI™. All Rights Reserved.
            </div>

            {/* Social Icons (Facebook, Discord, Twitter, GitHub, Instagram) */}
            <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400">
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z" />
                </svg>
              </a>

              {/* Discord */}
              <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* GitHub */}
              <a href="https://github.com/RatishPatil37/NAGRIK-AI" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>

              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================
          Interactive Modals for Working Footer Buttons
         ======================================================== */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#11131C] border border-slate-200 dark:border-white/10 shadow-2xl p-6 text-slate-800 dark:text-zinc-200 text-xs sm:text-sm"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08] mb-4">
                <div className="font-bold text-base text-slate-900 dark:text-white capitalize flex items-center gap-2">
                  {activeModal === 'privacy' && <FileText className="w-4 h-4 text-emerald-500" />}
                  {activeModal === 'terms' && <FileText className="w-4 h-4 text-slate-500" />}
                  {activeModal === 'faq' && <HelpCircle className="w-4 h-4 text-[#F97316]" />}
                  {activeModal === 'feedback' && <Send className="w-4 h-4 text-emerald-500" />}
                  {activeModal === 'contact' && <Mail className="w-4 h-4 text-emerald-500" />}
                  <span>
                    {activeModal === 'privacy' && 'Statutory Privacy Policy'}
                    {activeModal === 'terms' && 'Terms & Conditions'}
                    {activeModal === 'faq' && 'Frequently Asked Questions'}
                    {activeModal === 'feedback' && 'Citizen Feedback'}
                    {activeModal === 'contact' && 'Contact Municipal Support'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              {activeModal === 'privacy' && (
                <div className="space-y-3 leading-relaxed text-xs">
                  <p>
                    Nagrik AI complies strictly with the Digital Personal Data Protection Act (DPDP Act 2023) and municipal transparency guidelines.
                  </p>
                  <p>
                    • No personal citizen queries are retained on public vector indices without tokenization.
                  </p>
                  <p>
                    • All escalation tickets generate cryptographically hashed docket receipts for statutory tracking with municipal authorities.
                  </p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-3 leading-relaxed text-xs">
                  <p>
                    Nagrik AI is an autonomous civic intelligence decision-support platform designed to assist Indian citizens with verified municipal regulations, property tax schedules, and statutory SLAs.
                  </p>
                  <p>
                    Official decisions remain subject to gazette verification and municipal executive authority.
                  </p>
                </div>
              )}

              {activeModal === 'faq' && (
                <div className="space-y-3 text-xs leading-relaxed max-h-72 overflow-y-auto pr-1">
                  <div>
                    <strong>Q: Which models power Nagrik AI?</strong>
                    <p className="text-slate-600 dark:text-zinc-400 mt-0.5">
                      Gemini 3.7 Flash is our primary RAG generation engine, backed by Gemini 3.5 Flash-Lite surge routing and Groq Llama 3.3 70B failover.
                    </p>
                  </div>
                  <div>
                    <strong>Q: How are bylaws and circulars kept accurate?</strong>
                    <p className="text-slate-600 dark:text-zinc-400 mt-0.5">
                      Our Hybrid RAG pipeline uses BGE-M3 dense embeddings, BM25 sparse keyword indices, and cross-encoder reranking over official 2026 gazettes.
                    </p>
                  </div>
                </div>
              )}

              {activeModal === 'feedback' && (
                <form onSubmit={handleSendFeedback} className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Help us improve Nagrik AI for citizens across India.
                  </p>
                  <textarea
                    rows={4}
                    placeholder="Enter your feedback, suggestions, or issues..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      {feedbackSent ? 'Submitted ✓' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'contact' && (
                <form onSubmit={handleSendContact} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Ratish Patil"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="citizen@nagrik.in"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe your inquiry..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      {contactSent ? 'Message Sent ✓' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
