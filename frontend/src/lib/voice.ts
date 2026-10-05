/**
 * Multilingual Speech Gateway: Browser Web Speech API + Sarvam AI & Edge-TTS Speech Synthesis.
 * Primary: Sarvam AI Bulbul:v3
 * Secondary: Microsoft Edge Neural TTS
 * Tertiary: Browser Web SpeechSynthesis
 *
 * Echo Fix: activeAudio sentinel prevents concurrent playback. After the async
 * synthesizeSpeech() fetch we re-check the sentinel — if another speakResponse()
 * call has already started (and reset the sentinel to null then back), we abort
 * so we never play two audio streams simultaneously.
 */

import { useState, useCallback } from 'react';
import { synthesizeSpeech } from './api';

// Module-level sentinel: only one audio element plays at a time.
let activeAudio: HTMLAudioElement | null = null;

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
        const transcript = event.results[0][0].transcript;
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

// Unique token for each speakResponse() call: lets us detect if a newer call
// has already taken ownership while we were awaiting the network fetch.
let _speakToken = 0;

export async function speakResponse(text: string, lang: string = 'en-IN') {
  // Grab a unique token for this invocation BEFORE any async work.
  const myToken = ++_speakToken;

  // Immediately stop any ongoing playback.
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = ''; // force Safari / mobile to release the media session
    activeAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Strip markdown formatting before speaking.
  const cleanText = text
    .replace(/\[S\d+\]/g, '')
    .replace(/[#*`_]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 350);

  if (!cleanText) return;

  // ── Tier 1 & 2: Server-side Neural TTS ───────────────────────────────────
  try {
    const blob = await synthesizeSpeech(cleanText, lang);

    // After the await, check if a newer speakResponse() call has already started.
    // If so, our audio would create an echo — bail out silently.
    if (myToken !== _speakToken) return;

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    const cleanup = () => {
      URL.revokeObjectURL(audioUrl);
      if (activeAudio === audio) activeAudio = null;
    };
    audio.onended = cleanup;
    audio.onerror = cleanup;

    await audio.play();
    return; // Success — do NOT fall through to Tier 3.
  } catch (err) {
    console.warn('[VoiceGateway] Server TTS failed, falling back to browser SpeechSynthesis:', err);
    // If we were superseded while fetching, don't start Tier 3 either.
    if (myToken !== _speakToken) return;
  }

  // ── Tier 3: Browser Web SpeechSynthesis (only on genuine server failure) ──
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
