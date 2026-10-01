import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Droplets,
  Home,
  Trash2,
  Building,
  RotateCcw,
  Bot,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Zap,
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
  EscalationTicket,
  MunicipalWard,
} from './types';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Namaste! Welcome to **Nagrik AI (नागरिक AI)** — your official Municipal AI Concierge.\n\n' +
    'I provide verified statutory answers grounded strictly in **2026 Municipal Gazettes**, **Property Tax Bylaws**, **Water Charters**, and **Building Regulations** with zero hallucination.\n\n' +
    'Select a quick service below or ask any municipal question in English, Hindi, or Marathi.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function App() {
  const [wards, setWards] = useState<MunicipalWard[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(4); // Default: Bandra West
  const [language, setLanguage] = useState<string>('en-IN');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
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

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Voice Recognition Handler
  const handleVoiceInput = (transcribedText: string) => {
    setInputQuery(transcribedText);
    handleSubmit(transcribedText);
  };

  const { isListening, startListening } = useVoiceRecognition(handleVoiceInput, language);

  const currentWard = wards.find((w) => w.ward_id === selectedWardId);

  const handleResetChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  const handleSubmit = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isStreaming) return;

    setInputQuery('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Add empty assistant placeholder
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      statusText: 'Connecting to municipal gazette index...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsStreaming(true);

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    let accumulatedContent = '';

    await streamChatQuery(
      q,
      selectedWardId,
      language,
      {
        onStatus(status) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, statusText: status } : m))
          );
        },
        onToken(token, model) {
          accumulatedContent += token;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulatedContent, modelUsed: model, statusText: undefined }
                : m
            )
          );
        },
        onCitations(citations) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, citations } : m))
          );
        },
        onSOS(sos) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: sos.message,
                    emergency: sos,
                    statusText: undefined,
                  }
                : m
            )
          );
        },
        onClarification(clarification) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    clarification,
                    statusText: undefined,
                  }
                : m
            )
          );
        },
        onEscalation(escalation) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, escalation } : m))
          );
        },
        onDone() {
          setIsStreaming(false);
          if (isTTSEnabled && accumulatedContent) {
            speakResponse(accumulatedContent, language);
          }
        },
        onError(err) {
          console.error('[Stream Error]', err);
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      accumulatedContent ||
                      'Sorry, an error occurred while connecting to the municipal engine. Please retry.',
                    statusText: undefined,
                  }
                : m
            )
          );
        },
      },
      abortCtrl
    );
  };

  const handleClarificationSelect = (wardId: number, label: string) => {
    setSelectedWardId(wardId);
    handleSubmit(`Selected Ward: ${label}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090E17] text-slate-100 font-sans bg-grid-pattern relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Lighting Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Living Ward Profile HUD Top Bar */}
      <WardHUD
        wards={wards}
        selectedWardId={selectedWardId}
        onSelectWard={setSelectedWardId}
        language={language}
        onSelectLanguage={setLanguage}
        isAdminMode={isAdminMode}
        onToggleAdmin={() => setIsAdminMode(!isAdminMode)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Command Palette Keyboard Navigator */}
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
        <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 pt-4 pb-36 relative z-10">
          {/* Hero State (When chat has just started) */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="my-auto py-4"
            >
              <TypewriterHero onSelectQuery={(q) => handleSubmit(q)} />

              {/* 4 Feature Service Cards with Scroll Fade/Appear */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto my-6 px-2">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSubmit('What is the early bird 10% rebate for Property Tax in Ward 4?')}
                  className="glass-card-interactive p-4 rounded-2xl cursor-pointer group border border-slate-800 hover:border-emerald-500/40 relative overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors font-display">
                        Property Tax & 10% Rebate
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Official calculation formula, early bird deadlines, and online receipt verification.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSubmit('Report water pipe burst with contaminated water')}
                  className="glass-card-interactive p-4 rounded-2xl cursor-pointer group border border-slate-800 hover:border-cyan-500/40 relative overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                        Water Supply & 4h SLA Dispatch
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Direct pipeline burst reporting with emergency docket generation and field escalation.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.25 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSubmit('What are the penalties for open garbage dumping under 2026 rules?')}
                  className="glass-card-interactive p-4 rounded-2xl cursor-pointer group border border-slate-800 hover:border-amber-500/40 relative overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors font-display">
                        Sanitation & Waste Bylaws
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Source segregation guidelines, commercial bulk penalties, and ward collection timings.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.35 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSubmit('What are the setbacks and approval SLAs for building plan permission?')}
                  className="glass-card-interactive p-4 rounded-2xl cursor-pointer group border border-slate-800 hover:border-purple-500/40 relative overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors font-display">
                        Building Plan Approvals (OBPAS)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Section 14(b) statutory setback standards, auto-DCR fees, and occupancy clearances.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Municipal Operational Guarantee on Scroll */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl mx-auto my-6 px-2"
              >
                <div className="glass-card rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                        Municipal Verification Architecture
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                      100% Deterministic Grounding
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Statutory Gazettes</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Retrieves exclusively from indexed municipal acts with real-time statutory section citations.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>&lt;5ms Emergency Gate</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Deterministic safety pre-gates intercept life hazards immediately before running vector retrieval.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Free-Tier Resilience</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Autonomous multi-model failover from Gemini 3.7 to Gemini 3.5 Lite and Llama 3.3 for 100% uptime.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Quick Municipal Action Pills (Sticky Scroll Bar) */}
          {messages.length > 1 && (
            <div className="no-print flex items-center justify-between gap-2 py-2 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none py-1">
                <button
                  onClick={() => handleSubmit('What is the early bird 10% rebate for Property Tax?')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <Home className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tax 10% Rebate</span>
                </button>
                <button
                  onClick={() => handleSubmit('Report water pipe burst with contaminated water')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Report Water Burst</span>
                </button>
                <button
                  onClick={() => handleSubmit('What are the penalties for open garbage dumping?')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card hover:border-amber-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Waste Penalties</span>
                </button>
                <button
                  onClick={() => handleSubmit('What are the setbacks for residential building approval?')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card hover:border-purple-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  <span>Building Permits</span>
                </button>
              </div>

              {/* Reset Chat Button */}
              <button
                onClick={handleResetChat}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs shrink-0 cursor-pointer"
                title="Clear current session"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            </div>
          )}

          {/* Conversation Stream with Framer Motion on Appear */}
          <div className="flex-1 space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex gap-3 text-sm ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 text-xs font-bold border border-emerald-400/30">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-emerald-950/40 border border-emerald-400/20'
                        : 'glass-card border border-slate-700/70 text-slate-100 rounded-tl-xs shadow-2xl backdrop-blur-2xl'
                    }`}
                  >
                    {/* Status Indicator */}
                    {msg.statusText && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-2.5 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{msg.statusText}</span>
                      </div>
                    )}

                    {/* Text Content with Secure Markdown Renderer */}
                    <div className="leading-relaxed">
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                      ) : (
                        <div>
                          {renderSecureCivicText(msg.content)}
                          {isStreaming && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id && (
                            <span className="inline-block w-2 h-4 ml-1.5 bg-emerald-400 animate-pulse rounded-xs align-middle shadow-[0_0_8px_#34d399]" />
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
                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 font-mono tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Verified Sources:
                        </span>
                        {msg.citations.map((c) => (
                          <CitationChip key={c.index} citation={c} />
                        ))}
                      </div>
                    )}

                    {/* Footer Timestamp & Model Badge */}
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && (
                        <span className="text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md border border-slate-700">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </main>
      )}

      {/* Floating Futuristic Input Dock (Citizen Mode) */}
      {!isAdminMode && (
        <div className="no-print fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#090E17] via-[#090E17]/95 to-transparent z-40">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex items-center gap-2 p-2 glass-card rounded-2xl shadow-2xl border border-slate-700/80 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all backdrop-blur-2xl"
            >
              {/* Voice Speech Recognition Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={startListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Speak in your regional language (English, Hindi, Marathi, etc.)"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </motion.button>

              {/* Soundwave Pulse Indicator */}
              {isListening && (
                <div className="flex items-center gap-0.5 px-2">
                  <span className="w-1 bg-red-500 rounded-full animate-wave-1" />
                  <span className="w-1 bg-red-500 rounded-full animate-wave-2" />
                  <span className="w-1 bg-red-500 rounded-full animate-wave-3" />
                  <span className="w-1 bg-red-500 rounded-full animate-wave-4" />
                  <span className="w-1 bg-red-500 rounded-full animate-wave-5" />
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
                className="flex-1 bg-transparent px-3 text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
              />

              {/* TTS Speech Synthesis Audio Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isTTSEnabled
                    ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isTTSEnabled ? 'Audio Response Enabled' : 'Enable Audio Response'}
              >
                {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </motion.button>

              {/* Send Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputQuery.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between px-3 pt-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
