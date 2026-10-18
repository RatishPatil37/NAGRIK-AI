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
import { useVoiceRecognition, speakResponse, stopSpeaking, subscribeSpeaking } from './lib/voice';
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
        // Migration guard: wipe old hardcoded profile that leaked across users
        const isStaleDefault =
          parsed.email === 'patilratish369@gmail.com' &&
          typeof window !== 'undefined' &&
          !window.location.hostname.includes('localhost');
        if (isStaleDefault) {
          // Don't delete — keep the profile if the person is Ratish logged in on prod.
          // But if they've never explicitly set it, treat as anonymous.
          // We distinguish by checking a flag set only during explicit onboarding.
          const wasExplicitlySet = localStorage.getItem('nagrik_profile_set') === '1';
          if (!wasExplicitlySet) {
            localStorage.removeItem('nagrik_user_profile');
            return DEFAULT_USER_PROFILE;
          }
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
      // Mark that this profile was explicitly set by a real user (not a stale default)
      localStorage.setItem('nagrik_profile_set', '1');
      return next;
    });
  };

  const handleSignOut = () => {
    // Clear user-specific profile on sign out
    localStorage.removeItem('nagrik_user_profile');
    localStorage.removeItem('nagrik_profile_set');
    setUserProfile(DEFAULT_USER_PROFILE);
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

  // Voice Speaking State Sentinel & Error Reporting
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSpeaking((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // ChatGPT-style Voice Recognition: live interim text → input field, no auto-submit
  const { isListening, startListening, stopListening } = useVoiceRecognition(
    (transcript: string) => {
      // Live-stream the interim + final text into the input box as user speaks
      setInputQuery(transcript);
    },
    language,
    (errorMsg: string) => {
      setVoiceToast(errorMsg);
      setTimeout(() => setVoiceToast(null), 5000);
    }
  );

  const handleResetChat = () => {
    stopSpeaking();
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
        onNavigate={(view) => {
          stopSpeaking();
          setActiveView(view);
        }}
        onClose={() => {
          stopSpeaking();
          setActiveView('conversation');
        }}
        onSignOut={handleSignOut}
        isTTSEnabled={isTTSEnabled}
        onToggleTTS={() => {
          if (isSpeaking || isTTSEnabled) {
            stopSpeaking();
            setIsTTSEnabled(false);
          } else {
            setIsTTSEnabled(true);
          }
        }}
        sessionsCount={storedSessions.length}
        onClearSessions={handleClearAllSessions}
      />
    );
  }

  // If user navigated to Public Landing Page (Screenshot 4)
  if (activeView === 'landing') {
    return (
      <LandingPage
        onStartExploring={() => {
          stopSpeaking();
          setActiveView('conversation');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAccount={() => {
          stopSpeaking();
          setActiveView('settings');
        }}
        userProfile={userProfile}
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
            {/* Active Speech Playing Pill with 1-Click Stop Button */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="flex justify-center mb-2"
                >
                  <button
                    type="button"
                    onClick={() => stopSpeaking()}
                    className="px-4 py-1.5 rounded-full bg-slate-950/95 dark:bg-white text-white dark:text-slate-950 text-xs font-bold backdrop-blur-md shadow-xl flex items-center gap-2 hover:scale-105 transition-all cursor-pointer border border-white/20"
                    title="Stop speaking"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Speaking response...</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] uppercase font-mono tracking-wider ml-1">
                      Stop ⏹
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Error Notification Toast */}
            <AnimatePresence>
              {voiceToast && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mb-2 p-2.5 rounded-xl bg-slate-900/90 dark:bg-zinc-900/95 border border-slate-700 dark:border-white/20 text-slate-200 dark:text-zinc-200 text-xs flex items-center justify-between gap-2 shadow-lg backdrop-blur-md"
                >
                  <div className="flex items-center gap-2">
                    <MicOff className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{voiceToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceToast(null)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

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
                    ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
                title={isListening ? 'Listening…' : 'Voice Input'}
              >
                <Mic className="w-4 h-4" />
              </motion.button>

              {/* Text Input + Voice Waveform Animation */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={isListening ? '' : t.inputPlaceholder}
                  disabled={isStreaming}
                  className="w-full bg-transparent px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none font-medium"
                />
                {/* ChatGPT-style waveform animation while listening */}
                {isListening && !inputQuery && (
                  <div className="absolute left-3 flex items-center gap-[3px] pointer-events-none">
                    {[0.4, 0.7, 1.0, 0.7, 0.4, 0.6, 0.9, 0.6].map((h, i) => (
                      <span
                        key={i}
                        className="block w-[3px] rounded-full bg-red-500/80 dark:bg-red-400/80 origin-center"
                        style={{
                          height: `${Math.round(h * 16)}px`,
                          animation: `voiceWave 0.9s ease-in-out ${i * 0.1}s infinite alternate`,
                        }}
                      />
                    ))}
                    <span className="ml-2 text-xs text-red-500 dark:text-red-400 font-medium animate-pulse">
                      {t.listeningVoice || 'Listening…'}
                    </span>
                  </div>
                )}
              </div>

              {/* TTS Speech Synthesis Audio & Mute Toggle */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else if (isTTSEnabled) {
                    stopSpeaking();
                    setIsTTSEnabled(false);
                  } else {
                    setIsTTSEnabled(true);
                  }
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isSpeaking
                    ? 'text-white dark:text-slate-950 bg-slate-950 dark:bg-white animate-pulse border border-slate-700 dark:border-white/30 shadow-md'
                    : isTTSEnabled
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.1] border border-slate-200 dark:border-white/20'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
                title={
                  isSpeaking
                    ? 'Stop speaking (Mute)'
                    : isTTSEnabled
                    ? t.audioToggleOn
                    : t.audioToggleOff
                }
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-white animate-bounce" />
                ) : isTTSEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </motion.button>

              {/* Send Button — or Square Stop Button while recording */}
              {isListening ? (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={stopListening}
                  className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-sm transition-all cursor-pointer"
                  title="Stop recording and commit text"
                >
                  {/* Square stop icon — exactly like ChatGPT */}
                  <span className="block w-4 h-4 rounded-sm bg-white" />
                </motion.button>
              ) : (
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
              )}
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
