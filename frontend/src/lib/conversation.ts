/**
 * Client-Side Conversation Persistence Engine with Strict FIFO Auto-Pruning.
 * Enforces a strict maximum of 20 stored chat sessions in localStorage
 * to prevent browser storage exhaustion and eliminate payload bloat.
 */

import type { ChatMessage } from '../types';

export interface StoredSession {
  id: string;
  title: string;
  wardId: number;
  language: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'nagrik_chat_sessions';
const MAX_SESSIONS = 20;

export function getStoredSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as StoredSession[];
    return Array.isArray(sessions) ? sessions : [];
  } catch (e) {
    console.error('[ConversationStorage] Error loading sessions:', e);
    return [];
  }
}

export function saveStoredSession(session: StoredSession): StoredSession[] {
  try {
    const existing = getStoredSessions();
    const index = existing.findIndex((s) => s.id === session.id);

    let updated: StoredSession[];
    if (index >= 0) {
      // Update existing session and move to top
      const updatedItem = { ...existing[index], ...session, updatedAt: Date.now() };
      const without = existing.filter((s) => s.id !== session.id);
      updated = [updatedItem, ...without];
    } else {
      // Prepend new session
      updated = [{ ...session, updatedAt: Date.now() }, ...existing];
    }

    // Strict FIFO Auto-Pruning: keep maximum 20 sessions
    if (updated.length > MAX_SESSIONS) {
      updated = updated.slice(0, MAX_SESSIONS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('[ConversationStorage] Error saving session:', e);
    return [];
  }
}

export function deleteStoredSession(sessionId: string): StoredSession[] {
  try {
    const existing = getStoredSessions();
    const updated = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('[ConversationStorage] Error deleting session:', e);
    return [];
  }
}

export function clearAllStoredSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[ConversationStorage] Error clearing sessions:', e);
  }
}

export function generateSessionTitle(query: string): string {
  if (!query) return 'New Civic Inquiry';
  const clean = query.replace(/[^\w\s\u0900-\u097F]/g, '').trim();
  const words = clean.split(/\s+/).slice(0, 6).join(' ');
  return words.length > 36 ? words.substring(0, 36) + '...' : words || 'Civic Inquiry';
}
