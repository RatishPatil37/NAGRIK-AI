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
  MapPin,
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
import { ConversationSidebar } from './components/chat/ConversationSidebar';
import { LandingPage } from './components/landing/LandingPage';
import { SettingsView } from './components/account/SettingsView';
import { DEFAULT_USER_PROFILE, type UserProfile } from './components/account/AccountPopover';
import {
  getStoredSessions,
  saveStoredSession,
  deleteStoredSession,
  clearAllStoredSessions,
  generateSessionTitle,
  type StoredSession,
} from './lib/conversation';
import { getTranslation } from './lib/i18n';
import { detectClosestWard } from './lib/geo';
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

export function App() {
  const [activeView, setActiveView] = useState<'landing' | 'conversation' | 'dashboard' | 'settings'>('conversation');
  const [wards, setWards] = useState<MunicipalWard[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(4); // Default: Bandra West
  const [language, setLanguage] = useState<string>('en-IN');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDetectingWard, setIsDetectingWard] = useState<boolean>(false);
  const [wardNotification, setWardNotification] = useState<string | null>(null);

  // Dynamic User Profile (Authentic Google profile photo)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nagrik_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.avatarUrl || parsed.avatarUrl === '') {
          parsed.avatarUrl = '/google-avatar.png';
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }
    return DEFAULT_USER_PROFILE;
  });

  const handleUpdateUserProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem('nagrik_user_profile', JSON.stringify(next));
      return next;
    });
  };

  const handleSignOut = () => {
    handleResetChat();
    setActiveView('landing');
  };

  // Localization Dictionary
  const t = getTranslation(language);

  // Conversation Sessions (Max 20 with FIFO auto-pruning)
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>(() => getStoredSessions());

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

  const [conversationId, setConversationId] = useState<string>(
    () => 'conv_' + Math.random().toString(36).substring(2, 11)
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Update welcome message if language changes on fresh chat
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], content: t.welcomeMessage }];
      }
      return prev;
    });
  }, [language]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(false);
  const [activeReceiptTicket, setActiveReceiptTicket] = useState<EscalationTicket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keyboard shortcut listener (Cmd+O / Ctrl+O for Sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    if (activeView === 'conversation') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, activeView]);

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
    const newId = 'conv_' + Math.random().toString(36).substring(2, 11);
    setConversationId(newId);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputQuery('');
    setIsStreaming(false);
  };

  const handleSelectSession = (session: StoredSession) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setConversationId(session.id);
    setSelectedWardId(session.wardId);
    setLanguage(session.language);
    setMessages(session.messages);
    setIsStreaming(false);
    setIsSidebarOpen(false);
    setActiveView('conversation');
  };

  const handleDeleteSession = (id: string) => {
    const updated = deleteStoredSession(id);
    setStoredSessions(updated);
    if (id === conversationId) {
      handleResetChat();
    }
  };

  const handleClearAllSessions = () => {
    clearAllStoredSessions();
    setStoredSessions([]);
    handleResetChat();
  };

  const handleDetectWard = async () => {
    setIsDetectingWard(true);
    setWardNotification(null);
    try {
      const match = await detectClosestWard();
      if (match) {
        setSelectedWardId(match.wardId);
        setWardNotification(match.wardName);
        setTimeout(() => setWardNotification(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Geolocation error');
    } finally {
      setIsDetectingWard(false);
    }
  };

  const handleSubmit = (overrideQuery?: string) => {
    const query = (overrideQuery || inputQuery).trim();
    if (!query || isStreaming) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsgId = 'usr_' + Date.now();
    const assistantMsgId = 'ast_' + (Date.now() + 1);

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputQuery('');
    setIsStreaming(true);

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome' && m.content.trim().length > 0)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    let fullAnswer = '';

    streamChatQuery(
      query,
      selectedWardId || 4,
      language,
      {
        onToken: (token: string) => {
          fullAnswer += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: fullAnswer } : msg
            )
          );
        },
        onCitations: (citations: CitationItem[]) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, citations } : msg
            )
          );
        },
        onSOS: (emergency: EmergencyPayload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, emergency } : msg
            )
          );
        },
        onClarification: (clarification: ClarificationPayload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, clarification } : msg
            )
          );
        },
        onEscalation: (escalation: EscalationTicket) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, escalation } : msg
            )
          );
        },
        onError: (err: string) => {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content:
                      msg.content ||
                      `⚠️ **Connection Error**: ${err}. Please ensure the backend is running.`,
                  }
                : msg
            )
          );
        },
        onDone: () => {
          setIsStreaming(false);

          const finalMessages = messages.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: fullAnswer } : msg
          );

          const updated = saveStoredSession({
            id: conversationId,
            title: generateSessionTitle(query),
            wardId: selectedWardId || 4,
            language,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: finalMessages,
          });
          setStoredSessions(updated);

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

  // If user navigated to Full Settings Page (Screenshot 1)
  if (activeView === 'settings') {
    return (
      <SettingsView
        user={userProfile}
        onUpdateUser={handleUpdateUserProfile}
        onNavigate={(view) => setActiveView(view)}
        onClose={() => setActiveView('conversation')}
        isTTSEnabled={isTTSEnabled}
        onToggleTTS={() => setIsTTSEnabled(!isTTSEnabled)}
        sessionsCount={storedSessions.length}
        onClearSessions={handleClearAllSessions}
      />
    );
  }

  // If user navigated to Public Landing Page (Screenshot 4)
  if (activeView === 'landing') {
    return (
      <LandingPage
        onStartExploring={() => setActiveView('conversation')}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAccount={() => setActiveView('settings')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#08090D] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Gemini-Style Collapsible Sidebar */}
      <ConversationSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={storedSessions}
        activeSessionId={conversationId}
        onSelectSession={handleSelectSession}
        onNewSession={handleResetChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
        t={t}
      />

      {/* Streamlined, Decluttered Top Bar (Fixing Screenshot 5 Clutter) */}
      <WardHUD
        wards={wards}
        selectedWardId={selectedWardId}
        onSelectWard={(id) => setSelectedWardId(id)}
        language={language}
        onSelectLanguage={(lang) => setLanguage(lang)}
        isAdminMode={activeView === 'dashboard'}
        onToggleAdmin={() =>
          setActiveView(activeView === 'dashboard' ? 'conversation' : 'dashboard')
        }
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessionsCount={storedSessions.length}
        onDetectWard={handleDetectWard}
        isDetectingWard={isDetectingWard}
        user={userProfile}
        onOpenSettings={() => setActiveView('settings')}
        onNavigateHome={() => setActiveView('landing')}
        onSignOut={handleSignOut}
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
      />

      {/* Geolocation Auto-Detection Notification Banner */}
      <AnimatePresence>
        {wardNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-2 shadow-xl backdrop-blur-md"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {t.wardDetected}: <strong>{wardNotification}</strong>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
      {activeView === 'dashboard' ? (
        <main className="flex-1 relative z-10">
          <AdminDashboard />
        </main>
      ) : (
        <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 pt-4 pb-36 relative z-10">
          {/* Hero State (When chat has just started) */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="my-auto"
            >
              <TypewriterHero onSelectQuery={(q) => handleSubmit(q)} />
            </motion.div>
          )}

          {/* Chat Messages Log */}
          {messages.length > 1 && (
            <div className="space-y-4 pt-2">
              {messages
                .filter((m) => m.id !== 'welcome')
                .map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 sm:gap-4 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Assistant Bot Icon */}
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-zinc-200 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}

                    <div
                      className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                          msg.role === 'user'
                            ? 'bg-slate-900 dark:bg-zinc-800 text-white rounded-br-none shadow-sm'
                            : 'bg-slate-50 dark:bg-[#11131C] text-slate-900 dark:text-zinc-100 rounded-bl-none border border-slate-200/90 dark:border-white/10 shadow-sm'
                        }`}
                      >
                        {/* Markdown / Formatted Text Renderer */}
                        <div className="prose dark:prose-invert prose-xs sm:prose-sm max-w-none break-words">
                          {renderSecureCivicText(msg.content)}
                        </div>

                        {/* Streaming Indicator */}
                        {isStreaming && msg.id === messages[messages.length - 1].id && (
                          <span className="inline-block w-1.5 h-3.5 bg-emerald-500 animate-pulse ml-1 align-middle" />
                        )}

                        {/* Statutory Citations Chips */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2 font-bold">
                              Statutory Gazettes & Official Sources
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.citations.map((c, idx) => (
                                <CitationChip key={idx} citation={c} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Emergency Dispatch Card */}
                        {msg.emergency && (
                          <EmergencyCard emergency={msg.emergency} />
                        )}

                        {/* Clarification Dialog Card */}
                        {msg.clarification && (
                          <ClarificationCard
                            clarification={msg.clarification}
                            onSelectOption={(opt) => handleSubmit(opt)}
                          />
                        )}

                        {/* Statutory Escalation Grievance Ticket Card */}
                        {msg.escalation && (
                          <EscalationCard
                            escalation={msg.escalation}
                            wardName={currentWard?.ward_name}
                            onOpenReceipt={(ticket: EscalationTicket) => setActiveReceiptTicket(ticket)}
                          />
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* User Avatar */}
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {userProfile.avatarUrl ? (
                          <img
                            src={userProfile.avatarUrl}
                            alt="User"
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>
      )}

      {/* Floating Bottom Prompt Input Bar (Visible only in Conversation Mode) */}
      {activeView === 'conversation' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-5 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="p-1.5 sm:p-2 rounded-2xl bg-white/95 dark:bg-[#12141C]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-xl shadow-black/10 flex items-center gap-1.5 sm:gap-2"
            >
              {/* Reset Conversation Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleResetChat}
                className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                title={t.clearHistory}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>

              {/* Speech-to-Text Microphone Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={startListening}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-500 dark:text-red-400 animate-pulse border border-red-500/30'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
                title={isListening ? t.listeningVoice : 'Voice Input'}
              >
                {isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
              </motion.button>

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={isListening ? t.listeningVoice : t.inputPlaceholder}
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
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.1] border border-slate-200 dark:border-white/20'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
                title={isTTSEnabled ? t.audioToggleOn : t.audioToggleOff}
              >
                {isTTSEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
              </motion.button>

              {/* Send Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={!inputQuery.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-slate-950 dark:disabled:hover:bg-white text-white dark:text-slate-950 font-semibold shadow-sm transition-all cursor-pointer"
                title={t.sendQuery}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between px-3 pt-2 text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                <span>{t.verifiedGazettes}</span>
              </span>
              <span className="hidden sm:inline font-mono">Press ⌘K for Instant Services • ⌘O for Chat History</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
