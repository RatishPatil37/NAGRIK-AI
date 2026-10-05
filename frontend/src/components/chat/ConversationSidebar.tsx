import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoredSession } from '../../lib/conversation';
import type { TranslationDictionary } from '../../lib/i18n';

interface ConversationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: StoredSession[];
  activeSessionId: string;
  onSelectSession: (session: StoredSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  t: TranslationDictionary;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAll,
  t,
}) => {
  // Chronological grouping
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * ONE_DAY;

  const todaySessions = sessions.filter((s) => now - s.updatedAt < ONE_DAY);
  const weekSessions = sessions.filter(
    (s) => now - s.updatedAt >= ONE_DAY && now - s.updatedAt < SEVEN_DAYS
  );
  const olderSessions = sessions.filter((s) => now - s.updatedAt >= SEVEN_DAYS);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating Obsidian Drawer */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 bottom-0 left-0 z-50 overflow-hidden flex flex-col bg-[#090A0F] border-r border-slate-200/80 dark:border-white/[0.08] shadow-2xl backdrop-blur-2xl ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className="w-[280px] h-full flex flex-col p-3">
          {/* Header & New Chat Button */}
          <div className="flex items-center justify-between gap-2 pb-3 pt-1 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-display">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{t.chatHistoryTitle}</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="py-3">
            <button
              onClick={() => {
                onNewSession();
                if (window.innerWidth < 768) onToggle();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] text-xs font-semibold shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
                <span>{t.newChat}</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/[0.08] text-zinc-300 rounded border border-white/[0.1]">
                ⌘O
              </kbd>
            </button>
          </div>

          {/* Sessions List (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10">
            {sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                <Clock className="w-5 h-5 mx-auto mb-2 opacity-40" />
                <p>{t.noHistory}</p>
              </div>
            ) : (
              <>
                {/* Today */}
                {todaySessions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 font-mono">
                      {t.today}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {todaySessions.map((s) => (
                        <SessionItem
                          key={s.id}
                          session={s}
                          isActive={s.id === activeSessionId}
                          onSelect={() => {
                            onSelectSession(s);
                            if (window.innerWidth < 768) onToggle();
                          }}
                          onDelete={() => onDeleteSession(s.id)}
                          deleteConfirmText={t.deleteSessionConfirm}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Previous 7 Days */}
                {weekSessions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 font-mono">
                      {t.previous7Days}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {weekSessions.map((s) => (
                        <SessionItem
                          key={s.id}
                          session={s}
                          isActive={s.id === activeSessionId}
                          onSelect={() => {
                            onSelectSession(s);
                            if (window.innerWidth < 768) onToggle();
                          }}
                          onDelete={() => onDeleteSession(s.id)}
                          deleteConfirmText={t.deleteSessionConfirm}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Older */}
                {olderSessions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 font-mono">
                      {t.older}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {olderSessions.map((s) => (
                        <SessionItem
                          key={s.id}
                          session={s}
                          isActive={s.id === activeSessionId}
                          onSelect={() => {
                            onSelectSession(s);
                            if (window.innerWidth < 768) onToggle();
                          }}
                          onDelete={() => onDeleteSession(s.id)}
                          deleteConfirmText={t.deleteSessionConfirm}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer with Storage Counter & Clear */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2 font-mono">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>
                  {sessions.length}/20 {t.sessionsCount}
                </span>
              </span>
              {sessions.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-zinc-500 hover:text-red-400 transition-colors text-[10px] cursor-pointer"
                  title="Clear all stored sessions"
                >
                  {t.clearHistory}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

interface SessionItemProps {
  session: StoredSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  deleteConfirmText: string;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete,
  deleteConfirmText,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
        isActive
          ? 'bg-white/[0.1] text-white font-semibold border border-white/[0.12] shadow-xs'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-1">
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'
          }`}
        />
        <span className="truncate">{session.title}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(deleteConfirmText)) {
            onDelete();
          }
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
        title="Delete chat"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};
