import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  User,
  RotateCcw,
  Bot,
  CheckCircle2,
  Scale,
  FileCheck2,
  ShieldAlert,
  Building2,
  ArrowRight,
  Clock,
  Hash,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WardHUD } from './components/civic/WardHUD';
import { CommandPalette } from './components/civic/CommandPalette';
import { TypewriterHero } from './components/civic/TypewriterHero';
import { CitationChip } from './components/chat/CitationCard';
import { EmergencyCard } from './components/chat/EmergencyCard';
import { ClarificationCard } from './components/chat/ClarificationCard';
import { EscalationCard } from './components/chat/EscalationCard';
import { ReceiptModal } from './components/chat/ReceiptModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { fetchWards, streamChatQuery } from './lib/api';
import { useVoiceRecognition, speakResponse } from './lib/voice';
import { renderSecureCivicText } from './lib/sanitize';
import type {
  ChatMessage,
  CitationItem,
  EmergencyPayload,
  ClarificationPayload,
  EscalationTicket,
  MunicipalWard,
} from './types';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Welcome to **Nagrik AI (नागरिक AI)** — your official Municipal Operating System & Concierge.\n\n' +
    'All intelligence is grounded deterministically in **2026 Municipal Gazettes**, **Property Tax Bylaws**, **Water Supply Charters**, and **Building Regulations** with zero hallucination.\n\n' +
    'Ask any municipal inquiry below or select a statutory service to begin.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function App() {
  const [wards, setWards] = useState<MunicipalWard[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(4); // Default: Bandra West
  const [language, setLanguage] = useState<string>('en-IN');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Dark / Light Theme Management
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('nagrik_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // default to dark obsidian
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('nagrik_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [conversationId, setConversationId] = useState<string>(() => 'conv_' + Math.random().toString(36).substring(2, 11));
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(false);
  const [activeReceiptTicket, setActiveReceiptTicket] = useState<EscalationTicket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Wards on startup
  useEffect(() => {
    fetchWards()
      .then((data) => {
        setWards(data);
        if (data.length > 0 && !selectedWardId) {
          setSelectedWardId(data[0].ward_id);
        }
      })
      .catch((e) => console.error('Failed to load wards:', e));
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Voice Recognition Handler
  const { isListening, startListening } = useVoiceRecognition(
    (transcript: string) => {
      setInputQuery(transcript);
      handleSubmit(transcript);
    },
    language
  );

  const handleResetChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setConversationId('conv_' + Math.random().toString(36).substring(2, 11));
    setMessages([
      {
        ...INITIAL_WELCOME_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsStreaming(false);
  };

  const handleClarificationSelect = (value: any, label: string) => {
    handleSubmit(`Selected: ${label} (${value})`);
  };

  const handleSubmit = async (overrideQuery?: string) => {
    const query = overrideQuery || inputQuery;
    if (!query.trim() || isStreaming) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessagePlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      statusText: 'Consulting 2026 Municipal Gazettes...',
    };

    setMessages((prev) => [...prev, userMessage, assistantMessagePlaceholder]);
    setInputQuery('');
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let fullAnswer = '';

    const historyPayload = messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    await streamChatQuery(
      query,
      selectedWardId,
      language,
      {
        onStatus: (status: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, statusText: status } : msg
            )
          );
        },
        onToken: (token: string, model: string) => {
          fullAnswer += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullAnswer, statusText: undefined, modelUsed: model }
                : msg
            )
          );
        },
        onCitations: (citations: CitationItem[]) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, citations } : msg
            )
          );
        },
        onSOS: (sos: EmergencyPayload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, emergency: sos } : msg
            )
          );
        },
        onClarification: (clarification: ClarificationPayload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, clarification } : msg
            )
          );
        },
        onEscalation: (escalation: EscalationTicket) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, escalation } : msg
            )
          );
        },
        onError: (errMsg: any) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `Service Notice: ${errMsg}`,
                    statusText: undefined,
                  }
                : msg
            )
          );
          setIsStreaming(false);
        },
        onDone: () => {
          setIsStreaming(false);
          if (isTTSEnabled && fullAnswer) {
            speakResponse(fullAnswer, language);
          }
        },
      },
      abortController,
      conversationId,
      historyPayload
    );
  };

  const currentWard = wards.find((w) => w.ward_id === selectedWardId);

  return (
    <div className="min-h-screen bg-grid-pattern text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-slate-300 dark:selection:bg-white/20 transition-colors duration-200">
      {/* Living Ward & Mode Navigation HUD with Theme Toggle */}
      <WardHUD
        wards={wards}
        selectedWardId={selectedWardId}
        onSelectWard={(id) => setSelectedWardId(id)}
        language={language}
        onSelectLanguage={(lang) => setLanguage(lang)}
        isAdminMode={isAdminMode}
        onToggleAdmin={() => setIsAdminMode(!isAdminMode)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={(q) => handleSubmit(q)}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        ticket={activeReceiptTicket}
        wardName={currentWard?.ward_name}
        onClose={() => setActiveReceiptTicket(null)}
      />

      {/* MAIN VIEW: Admin Dashboard vs Citizen Concierge */}
      {isAdminMode ? (
        <main className="flex-1 relative z-10">
          <AdminDashboard />
        </main>
      ) : (
        <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 pt-4 pb-36 relative z-10">
          {/* Hero State (When chat has just started) */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="my-auto py-2"
            >
              <TypewriterHero onSelectQuery={(q) => handleSubmit(q)} />

              {/* 21st.dev-Inspired Liquid Glass Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto my-6 px-2">
                {/* Bento Card 1: Wide (Span 2) - Automated Statutory Triage */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSubmit('Report water pipe burst with contaminated water')}
                  className="md:col-span-2 liquid-glass p-5 rounded-2xl cursor-pointer group border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Statutory SLA Triage Engine
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors font-display mb-1.5">
                      Automated Grievance Classification & Docketing
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-lg mb-4">
                      Categorizes complaints across 10 municipal departments, computes statutory SLA countdowns (4h emergency to 48h civil), and generates official verifiable dockets.
                    </p>
                  </div>

                  {/* Simulated Docket Capsule */}
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-black/10 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-300">
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      <span>MCGM-2026-W04-7492</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>SLA: 4h Dispatch</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/[0.05] text-slate-800 dark:text-zinc-300 border border-black/10 dark:border-white/10 text-[10px]">
                      Water Supply & Sewerage
                    </span>
                  </div>
                </motion.div>

                {/* Bento Card 2: Deterministic Hybrid RRF Gazette Grounding */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSubmit('What is the early bird 10% rebate for Property Tax in Ward 4?')}
                  className="liquid-glass p-5 rounded-2xl cursor-pointer group border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Deterministic Core
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors font-display mb-1.5">
                      Property Tax & 10% Rebate Formula
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
                      Section 128 calculations, early bird payment deadlines, and verified statutory receipt procedures.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-200 flex items-center gap-1 transition-colors">
                    <span>Inspect Section 128 Rules</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>

                {/* Bento Card 3: Disaster & Life-Safety Interceptor */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.25 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSubmit('Emergency: Building wall collapsed with live wires on street')}
                  className="liquid-glass p-5 rounded-2xl cursor-pointer group border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500/90">
                          &lt;5ms Pre-Gate
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors font-display mb-1.5">
                      Life-Safety Emergency Interceptor
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
                      Deterministic gates intercept building collapses, gas leaks, and live wire snaps before running vector search.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 group-hover:text-rose-500 flex items-center gap-1 transition-colors">
                    <span>Simulate Safety Trigger</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>

                {/* Bento Card 4: Wide (Span 2) - Urban Planning & OBPAS */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.35 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSubmit('What are the setbacks and approval SLAs for building plan permission?')}
                  className="md:col-span-2 liquid-glass p-5 rounded-2xl cursor-pointer group border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Town Planning & Permissions
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors font-display mb-1.5">
                      Building Plan Approvals (OBPAS) & Section 14(b) Standards
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-lg mb-4">
                      Official statutory setback standards, auto-DCR scrutinies, occupancy certificates, and 30-day clearance SLAs for residential plots.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-black/5 dark:border-white/[0.06] font-mono">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                      <span>Verified Against 2026 Building Bylaws</span>
                    </span>
                    <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center gap-1">
                      <span>Query Setback Rules</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Quick Municipal Action Pills (Sticky Scroll Bar) */}
          {messages.length > 1 && (
            <div className="no-print flex items-center justify-between gap-2 py-2 mb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none py-1">
                <button
                  onClick={() => handleSubmit('What is the early bird 10% rebate for Property Tax in Ward 4?')}
                  className="liquid-glass-pill px-3 py-1.5 rounded-full text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  Property Tax 10% Rebate
                </button>
                <button
                  onClick={() => handleSubmit('Report water pipe burst with contaminated water')}
                  className="liquid-glass-pill px-3 py-1.5 rounded-full text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  Report Water Burst (4h SLA)
                </button>
                <button
                  onClick={() => handleSubmit('What are the penalties for open garbage dumping under 2026 rules?')}
                  className="liquid-glass-pill px-3 py-1.5 rounded-full text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  Sanitation Bylaw Fines
                </button>
                <button
                  onClick={() => handleSubmit('What are the setbacks and approval SLAs for building plan permission?')}
                  className="liquid-glass-pill px-3 py-1.5 rounded-full text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  Building Plan Permits (OBPAS)
                </button>
              </div>

              {/* Reset Chat Button */}
              <button
                onClick={handleResetChat}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors text-xs shrink-0 cursor-pointer"
                title="Clear current session"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            </div>
          )}

          {/* Conversation Stream with Liquid Glass Styling */}
          <div className="flex-1 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex gap-3 text-sm ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0 shadow-sm text-xs font-mono">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-tr-xs border border-slate-300/80 dark:border-white/10 shadow-md'
                        : 'liquid-glass border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 rounded-tl-xs shadow-xl backdrop-blur-2xl'
                    }`}
                  >
                    {/* Status Indicator */}
                    {msg.statusText && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-mono mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-300 animate-pulse" />
                        <span>{msg.statusText}</span>
                      </div>
                    )}

                    {/* Text Content with Secure Markdown Renderer */}
                    <div className="leading-relaxed text-slate-800 dark:text-zinc-200">
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                      ) : (
                        <div>
                          {renderSecureCivicText(msg.content)}
                          {isStreaming && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id && (
                            <span className="inline-block w-1.5 h-3.5 ml-1.5 bg-slate-900 dark:bg-zinc-200 animate-pulse rounded-xs align-middle" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Emergency SOS Alert Card */}
                    {msg.emergency && <EmergencyCard emergency={msg.emergency} />}

                    {/* Clarification Questionnaire Card */}
                    {msg.clarification && (
                      <ClarificationCard
                        clarification={msg.clarification}
                        onSelectOption={handleClarificationSelect}
                      />
                    )}

                    {/* Grievance Escalation Docket Card */}
                    {msg.escalation && (
                      <EscalationCard
                        escalation={msg.escalation}
                        wardName={currentWard?.ward_name}
                        onOpenReceipt={setActiveReceiptTicket}
                      />
                    )}

                    {/* Official Verified Evidence Rail */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/[0.06] flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 mr-1 font-mono tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-slate-600 dark:text-zinc-400" />
                          Verified Citations:
                        </span>
                        {msg.citations.map((c) => (
                          <CitationChip key={c.index} citation={c} />
                        ))}
                      </div>
                    )}

                    {/* Footer Timestamp & Model Badge */}
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-400 font-mono">
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && (
                        <span className="text-slate-600 dark:text-zinc-400 bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.08] px-2 py-0.5 rounded font-mono text-[10px]">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-black/10 dark:border-white/[0.08]">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </main>
      )}

      {/* Floating Liquid Glass Input Dock (Citizen Mode) */}
      {!isAdminMode && (
        <div className="no-print fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent dark:from-[#08090D] dark:via-[#08090D]/90 z-40 transition-colors">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex items-center gap-2 p-2 liquid-glass rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 focus-within:border-slate-400 dark:focus-within:border-white/20 transition-all backdrop-blur-2xl"
            >
              {/* Voice Speech Recognition Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={startListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-semibold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06]'
                }`}
                title="Speak in your regional language (English, Hindi, Marathi, etc.)"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </motion.button>

              {/* Minimalist Soundwave Indicator (No Neon) */}
              {isListening && (
                <div className="flex items-center gap-0.5 px-2">
                  <span className="w-0.5 bg-slate-600 dark:bg-zinc-300 rounded-full animate-wave-1" />
                  <span className="w-0.5 bg-slate-600 dark:bg-zinc-300 rounded-full animate-wave-2" />
                  <span className="w-0.5 bg-slate-600 dark:bg-zinc-300 rounded-full animate-wave-3" />
                  <span className="w-0.5 bg-slate-600 dark:bg-zinc-300 rounded-full animate-wave-4" />
                  <span className="w-0.5 bg-slate-600 dark:bg-zinc-300 rounded-full animate-wave-5" />
                </div>
              )}

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening to regional citizen speech...'
                    : 'Ask about property tax, water bills, building permits, or report a civic issue...'
                }
                disabled={isStreaming}
                className="flex-1 bg-transparent px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none font-medium"
              />

              {/* TTS Speech Synthesis Audio Toggle */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isTTSEnabled
                    ? 'text-slate-900 dark:text-white bg-black/5 dark:bg-white/[0.1] border border-black/10 dark:border-white/20'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06]'
                }`}
                title={isTTSEnabled ? 'Audio Response Enabled' : 'Enable Audio Response'}
              >
                {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </motion.button>

              {/* Send Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={!inputQuery.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-slate-950 dark:disabled:hover:bg-white text-white dark:text-zinc-950 font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between px-3 pt-2 text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                <span>2026 Municipal Gazettes Verified</span>
              </span>
              <span className="hidden sm:inline font-mono">Press ⌘K for Instant Services</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
