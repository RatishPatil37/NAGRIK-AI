/**
 * Multilingual Speech Gateway: Browser Web Speech API + Edge-TTS & Sarvam AI.
 * Tier 1 & 2: Server-Side Neural TTS (Microsoft Edge-TTS / Sarvam AI)
 * Tier 3: Browser Web SpeechSynthesis with Sentence-Level Chunking & Natural Voice Selection
 *
 * Full Control: stopSpeaking(), pauseSpeaking(), resumeSpeaking(), subscribeSpeaking()
 */

import { useState, useCallback } from 'react';
import { synthesizeSpeech } from './api';

// Module-level sentinel: only one audio stream plays at any given time.
let activeAudio: HTMLAudioElement | null = null;
let _speakToken = 0;
let _isSpeaking = false;
const _speakingListeners = new Set<(speaking: boolean) => void>();

function notifySpeakingState(speaking: boolean) {
  _isSpeaking = speaking;
  _speakingListeners.forEach((listener) => listener(speaking));
}

export function subscribeSpeaking(callback: (speaking: boolean) => void) {
  _speakingListeners.add(callback);
  callback(_isSpeaking);
  return () => {
    _speakingListeners.delete(callback);
  };
}

export function isCurrentlySpeaking(): boolean {
  return _isSpeaking;
}

export function stopSpeaking() {
  _speakToken++; // Invalidate any in-flight async speech requests
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  notifySpeakingState(false);
}

export function pauseSpeaking() {
  if (activeAudio && !activeAudio.paused) {
    activeAudio.pause();
    notifySpeakingState(false);
  } else if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    notifySpeakingState(false);
  }
}

export function resumeSpeaking() {
  if (activeAudio && activeAudio.paused) {
    activeAudio.play().catch(() => {});
    notifySpeakingState(true);
  } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    notifySpeakingState(true);
  }
}

export function useVoiceRecognition(onResult: (text: string) => void, lang: string = 'en-IN') {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Web Speech API is not supported in this browser. Please type your query.');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript) {
          onResult(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.warn('[WebSpeech] Recognition error:', err);
        setIsListening(false);
        if (err.error !== 'no-speech') {
          setError(`Voice input error: ${err.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      return true;
    } catch (e: any) {
      console.error('[WebSpeech] Failed to start recognition:', e);
      setIsListening(false);
      setError(e.message);
      return false;
    }
  }, [lang, onResult]);

  return { isListening, error, startListening };
}

/**
 * Strips markdown markup, bracketed citations [S1], URLs, and extraneous symbols
 * so the synthetic voice reads natural, conversational prose.
 */
function cleanCivicMarkdown(raw: string): string {
  return raw
    .replace(/\[S\d+\]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/[*_~`>]/g, '')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the most natural, human-like voice available in the client browser.
 * Prioritizes natural neural voices (Google, Microsoft, Natural).
 */
function getBestBrowserVoice(lang: string): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const prefix = lang.slice(0, 2).toLowerCase();
  const langVoices = voices.filter(
    (v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(prefix)
  );

  if (langVoices.length === 0) return null;

  // Prefer natural / neural quality voices
  const preferred = langVoices.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('natural') ||
      name.includes('google') ||
      name.includes('online') ||
      name.includes('neural')
    );
  });

  return preferred || langVoices[0];
}

/**
 * Speaks the assistant's response.
 * Uses Server-Side Neural TTS (Edge-TTS) first for studio quality.
 * Falls back to Browser Web SpeechSynthesis with sentence-level chunking
 * to prevent Chrome's 15-second speech garbage-collection cutoff bug.
 */
export async function speakResponse(text: string, lang: string = 'en-IN'): Promise<void> {
  const myToken = ++_speakToken;

  // Stop any active audio immediately
  stopSpeaking();
  // Restore our token after stopSpeaking invalidated previous ones
  _speakToken = myToken;

  const cleanText = cleanCivicMarkdown(text);
  if (!cleanText) return;

  notifySpeakingState(true);

  // ── Tier 1 & 2: Server-side Neural TTS (Edge-TTS / Sarvam AI) ──
  try {
    const blob = await synthesizeSpeech(cleanText, lang);

    // If another speak request arrived while we were downloading, abort
    if (myToken !== _speakToken) return;

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    const cleanup = () => {
      URL.revokeObjectURL(audioUrl);
      if (activeAudio === audio) {
        activeAudio = null;
        notifySpeakingState(false);
      }
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;

    await audio.play();
    return; // Success!
  } catch (err) {
    console.warn('[VoiceGateway] Server TTS unavailable, falling back to browser SpeechSynthesis:', err);
    if (myToken !== _speakToken) return;
  }

  // ── Tier 3: Browser Web SpeechSynthesis with Sentence-Level Chunking ──
  if ('speechSynthesis' in window) {
    // Split into natural sentence chunks to eliminate Chrome's 15-second limit
    const sentences = cleanText.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g) || [cleanText];
    let currentIndex = 0;

    const voice = getBestBrowserVoice(lang);

    function speakNextSentence() {
      if (myToken !== _speakToken) {
        notifySpeakingState(false);
        return;
      }

      if (currentIndex >= sentences.length) {
        notifySpeakingState(false);
        return;
      }

      const segment = sentences[currentIndex++].trim();
      if (!segment) {
        speakNextSentence();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(segment);
      utterance.lang = lang;
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        speakNextSentence();
      };

      utterance.onerror = (e) => {
        console.warn('[WebSpeech] Utterance error:', e);
        notifySpeakingState(false);
      };

      window.speechSynthesis.speak(utterance);
    }

    speakNextSentence();
  } else {
    notifySpeakingState(false);
  }
}
