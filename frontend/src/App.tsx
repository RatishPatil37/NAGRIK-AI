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
} from 'lucide-react';
import { WardHUD } from './components/civic/WardHUD';
import { CommandPalette } from './components/civic/CommandPalette';
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
    'Namaste! Welcome to **Nagrik AI (नागरिक AI)** — your official Municipal AI Concierge. ' +
    'I provide verified answers grounded strictly in municipal gazettes, property tax bylaws, water charters, and building permits. ' +
    'How can I assist your ward today?',
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans">
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
        <main className="flex-1">
          <AdminDashboard />
        </main>
      ) : (
        <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 pb-28">
          {/* Quick Municipal Action Chips */}
          <div className="no-print flex items-center gap-2 overflow-x-auto py-2 mb-2 text-xs scrollbar-none">
            <button
              onClick={() => handleSubmit('What is the early bird 10% rebate for Property Tax?')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Property Tax 10% Rebate</span>
            </button>
            <button
              onClick={() => handleSubmit('Report water pipe burst with contaminated water')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Report Water Leakage (4h SLA)</span>
            </button>
            <button
              onClick={() => handleSubmit('What are the penalties for open garbage dumping?')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Waste Segregation Rules</span>
            </button>
            <button
              onClick={() => handleSubmit('What are the setbacks for residential building approval?')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-purple-600" />
              <span>Building Permits (OBPAS)</span>
            </button>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#0B192C] text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold">
                    🏛️
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#0B192C] text-white rounded-tr-xs'
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {/* Status Indicator */}
                  {msg.statusText && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold mb-2 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{msg.statusText}</span>
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="leading-relaxed text-[13.5px]">
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      renderSecureCivicText(msg.content)
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
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                        Verified Evidence:
                      </span>
                      {msg.citations.map((c) => (
                        <CitationChip key={c.index} citation={c} />
                      ))}
                    </div>
                  )}

                  {/* Footer Timestamp & Model */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>
      )}

      {/* Floating Input Dock (Citizen Mode) */}
      {!isAdminMode && (
        <div className="no-print fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex items-center gap-2 p-1.5 sm:p-2 bg-white rounded-2xl shadow-xl border border-slate-300 focus-within:border-[#0B192C] focus-within:ring-2 focus-within:ring-slate-900/10 transition-all"
            >
              {/* Voice Speech Recognition Button */}
              <button
                type="button"
                onClick={startListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Speak in your regional language (English, Hindi, Marathi, etc.)"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Soundwave Pulse Indicator */}
              {isListening && (
                <div className="flex items-center gap-0.5 px-2">
                  <span className="w-1 bg-red-600 rounded-full animate-wave-1" />
                  <span className="w-1 bg-red-600 rounded-full animate-wave-2" />
                  <span className="w-1 bg-red-600 rounded-full animate-wave-3" />
                  <span className="w-1 bg-red-600 rounded-full animate-wave-4" />
                </div>
              )}

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening to citizen speech...'
                    : 'Ask about property tax, water bills, building permits, or report a civic issue...'
                }
                disabled={isStreaming}
                className="flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />

              {/* TTS Speech Synthesis Audio Toggle */}
              <button
                type="button"
                onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isTTSEnabled
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title={isTTSEnabled ? 'Speech Output Enabled' : 'Enable Speech Output'}
              >
                {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-[#0B192C] hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-500">
              <span>Grounding: Official Municipal Gazettes &amp; Citizen Charters</span>
              <span className="hidden sm:inline font-mono">Press ⌘K for Quick Services</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
