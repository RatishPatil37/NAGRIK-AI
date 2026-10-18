/**
 * Multilingual Speech Gateway: Browser Web Speech API + Edge-TTS & Sarvam AI.
 * Tier 1 & 2: Server-Side Neural TTS (Sarvam AI Bulbul:v3 / Microsoft Edge-TTS)
 * Tier 3: Browser Web SpeechSynthesis with Human Cadence, Punctuation Pauses & Neural Voice Selection
 *
 * Full Control: stopSpeaking(), pauseSpeaking(), resumeSpeaking(), subscribeSpeaking()
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { synthesizeSpeech } from './api';

// Module-level sentinel: only one audio stream plays at any given time.
let activeAudio: HTMLAudioElement | null = null;
let _speakToken = 0;
let _isSpeaking = false;
let _sentenceTimeout: any = null;
const _speakingListeners = new Set<(speaking: boolean) => void>();

function notifySpeakingState(speaking: boolean) {
  _isSpeaking = speaking;
  _speakingListeners.forEach((listener) => {
    try {
      listener(speaking);
    } catch (e) {
      console.error('[VoiceGateway] Error in speaking listener:', e);
    }
  });
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

/**
 * Immediately stops all synthetic voice output (both server audio & browser speech).
 * Clears all sentence queues, timeouts, and resets the speaking sentinel.
 */
export function stopSpeaking() {
  _speakToken++; // Invalidate any in-flight async speech requests

  if (_sentenceTimeout) {
    clearTimeout(_sentenceTimeout);
    _sentenceTimeout = null;
  }

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio.src = '';
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('[WebSpeech] Error cancelling speech:', e);
    }
  }

  notifySpeakingState(false);
}

export function pauseSpeaking() {
  if (activeAudio && !activeAudio.paused) {
    activeAudio.pause();
    notifySpeakingState(false);
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    notifySpeakingState(false);
  }
}

export function resumeSpeaking() {
  if (activeAudio && activeAudio.paused) {
    activeAudio.play().catch(() => {});
    notifySpeakingState(true);
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    notifySpeakingState(true);
  }
}

/**
 * ChatGPT-style Speech-to-Text (STT) Hook.
 *
 * Behaviour:
 *  - Continuous listening with live interim text streamed into the input field.
 *  - Browser cutoffs are auto-restarted so recognition keeps going until the
 *    user explicitly presses the square stop button.
 *  - Pressing stop commits whatever has been spoken into the input without
 *    auto-submitting — the user reviews and clicks Send themselves.
 */
export function useVoiceRecognition(
  onInterimResult: (text: string) => void,
  lang: string = 'en-IN',
  onErrorToast?: (msg: string) => void
) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  /**
   * Stop recording and commit whatever has been spoken into the input box.
   * The user can then review the text and click Send themselves.
   */
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop(); // graceful stop so final result fires
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    // The accumulated text is already shown in the input via onInterimResult
    finalTranscriptRef.current = '';
  }, []);

  const startListening = useCallback(() => {
    // Toggle off if already listening
    if (recognitionRef.current || isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg =
        'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
      setError(msg);
      if (onErrorToast) onErrorToast(msg);
      return;
    }

    finalTranscriptRef.current = '';

    const createAndStart = () => {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        // ChatGPT-style: continuous listening, show interim text live
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          // Show combined final + interim live in the input field
          const combined = (finalTranscriptRef.current + interim).trim();
          onInterimResult(combined);
        };

        recognition.onerror = (err: any) => {
          console.warn('[WebSpeech] Recognition error:', err);
          if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
            shouldRestartRef.current = false;
            setIsListening(false);
            recognitionRef.current = null;
            const userMsg =
              'Microphone access denied. Please click the permissions icon in your address bar to allow microphone access.';
            setError(userMsg);
            if (onErrorToast) onErrorToast(userMsg);
          } else if (err.error === 'aborted') {
            // Intentional stop — do nothing
          }
          // no-speech, network, etc. → let onend handle restart
        };

        recognition.onend = () => {
          // Chrome often fires onend every ~60s in continuous mode.
          // Auto-restart to keep listening until user stops explicitly.
          if (shouldRestartRef.current) {
            try {
              // Need a new instance; re-using the same one fails in Chrome
              recognitionRef.current = null;
              createAndStart();
            } catch (e) {
              shouldRestartRef.current = false;
              setIsListening(false);
              recognitionRef.current = null;
            }
          } else {
            setIsListening(false);
            recognitionRef.current = null;
          }
        };

        shouldRestartRef.current = true;
        recognition.start();
      } catch (e: any) {
        console.error('[WebSpeech] Failed to start recognition:', e);
        shouldRestartRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
        const msg = e.message || 'Could not start voice recognition';
        setError(msg);
        if (onErrorToast) onErrorToast(msg);
      }
    };

    createAndStart();
  }, [lang, onInterimResult, onErrorToast, stopListening, isListening]);

  return { isListening, error, startListening, stopListening };
}

/**
 * Strips markdown markup, bracketed citations [S1], URLs, and formatting
 * so the voice reads natural, conversational prose with proper pause preservation.
 */
function cleanCivicMarkdown(raw: string): string {
  return raw
    .replace(/\[S\d+\]/g, '') // Remove [S1], [S2]
    .replace(/https?:\/\/\S+/g, '') // Remove raw links
    .replace(/#{1,6}\s*/g, '') // Remove markdown headers
    .replace(/[*_~`>]/g, '') // Remove asterisks, backticks, quotes
    .replace(/^\s*[-+*]\s+/gm, '') // Remove bullet points
    .replace(/\|/g, ', ') // Tables to commas
    .replace(/\n+/g, '. ') // Paragraphs to full-stop pauses
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filters out all mechanical/robotic Windows desktop voices (Microsoft David, Zira, Desktop)
 * and selects the highest-fidelity natural, human-sounding voice available.
 */
function getBestBrowserVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const prefix = lang.slice(0, 2).toLowerCase();

  // Filter out all robotic legacy desktop voices
  const isRobotic = (name: string) => {
    const n = name.toLowerCase();
    return (
      n.includes('desktop') ||
      n.includes('david') ||
      n.includes('zira') ||
      n.includes('hazel') ||
      n.includes('george')
    );
  };

  // 1. Language-matched voices
  const langVoices = voices.filter(
    (v) =>
      (v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase().replace('_', '-') ||
        v.lang.toLowerCase().startsWith(prefix)) &&
      !isRobotic(v.name)
  );

  // Search priority among language-matched voices:
  // Priority 1: Microsoft Natural / Online Neural
  const msNatural = langVoices.find((v) => {
    const n = v.name.toLowerCase();
    return n.includes('natural') || n.includes('online');
  });
  if (msNatural) return msNatural;

  // Priority 2: Google Natural Neural voices (Chrome / Android)
  const googleVoice = langVoices.find((v) => v.name.toLowerCase().includes('google'));
  if (googleVoice) return googleVoice;

  // Priority 3: Apple Siri / Enhanced
  const appleVoice = langVoices.find(
    (v) => v.name.toLowerCase().includes('enhanced') || v.name.toLowerCase().includes('siri')
  );
  if (appleVoice) return appleVoice;

  if (langVoices.length > 0) return langVoices[0];

  // 2. High-quality English fallbacks (Google UK Female / Google US)
  const nonRoboticVoices = voices.filter((v) => !isRobotic(v.name));
  const googleFemale = nonRoboticVoices.find(
    (v) => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')
  );
  if (googleFemale) return googleFemale;

  const anyGoogle = nonRoboticVoices.find((v) => v.name.toLowerCase().includes('google'));
  if (anyGoogle) return anyGoogle;

  const anyNatural = nonRoboticVoices.find(
    (v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online')
  );
  if (anyNatural) return anyNatural;

  return nonRoboticVoices[0] || voices[0];
}

/**
 * Chunks speech into natural human breath clauses (pausing at commas, colons, and periods)
 */
interface SpeechClause {
  text: string;
  pauseMs: number;
}

function parseHumanClauses(text: string): SpeechClause[] {
  // Regex to split on major punctuation: commas, semicolons, colons, periods, questions, exclamations, danda
  const parts = text.split(/([,;:|•]+|[.!?।\n]+)/g);
  const clauses: SpeechClause[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    const phrase = (parts[i] || '').trim();
    const punct = (parts[i + 1] || '').trim();

    if (!phrase && !punct) continue;

    const fullClause = `${phrase}${punct}`.trim();
    if (!fullClause) continue;

    // Determine breathing pause duration based on punctuation type:
    let pauseMs = 180; // Standard breathing pause at commas (,) and semicolons (;)
    if (/[!?।]$/.test(punct)) {
      pauseMs = 400; // Emphatic pause for questions and exclamations
    } else if (/[.]/.test(punct) || /\n/.test(punct)) {
      pauseMs = 300; // Natural sentence full-stop breath pause
    } else if (/[,;:]/.test(punct)) {
      pauseMs = 180; // Commas and clauses pause
    }

    clauses.push({ text: fullClause, pauseMs });
  }

  return clauses.length > 0 ? clauses : [{ text, pauseMs: 300 }];
}

/**
 * Speaks the assistant's response in authentic human-like conversational cadence:
 * 1. Tries Server-Side Neural TTS (Sarvam AI Bulbul:v3 / Edge-TTS) for studio fidelity.
 * 2. Falls back to Browser Web Speech with punctuation-aware sentence chunking,
 *    inserting human breath pauses at commas, colons, and periods.
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

  // ── Tier 1 & 2: Server-side Neural TTS (Sarvam AI Bulbul:v3 / Edge-TTS) ──
  try {
    const blob = await synthesizeSpeech(cleanText, lang);

    // If another speak or stop request arrived while downloading, abort
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
    return; // Success! Studio-quality neural audio playing.
  } catch (err) {
    console.warn('[VoiceGateway] Server TTS unavailable, falling back to humanized browser SpeechSynthesis:', err);
    if (myToken !== _speakToken) return;
  }

  // ── Tier 3: Humanized Browser Web SpeechSynthesis ──
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const clauses = parseHumanClauses(cleanText);
    let currentIndex = 0;
    const voice = getBestBrowserVoice(lang);

    function speakNextClause() {
      if (myToken !== _speakToken) {
        notifySpeakingState(false);
        return;
      }

      if (currentIndex >= clauses.length) {
        notifySpeakingState(false);
        return;
      }

      const item = clauses[currentIndex++];
      if (!item || !item.text.trim()) {
        speakNextClause();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = lang;

      // Human-like Cadence & Intonation:
      // Rate = 0.92 gives relaxed conversational cadence (not rushed or monotonous)
      // Pitch = 1.0 gives a natural warm human register
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (myToken !== _speakToken) {
          notifySpeakingState(false);
          return;
        }

        // Insert breathing pause between clauses / sentences
        _sentenceTimeout = setTimeout(() => {
          speakNextClause();
        }, item.pauseMs);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[WebSpeech] Utterance error:', e);
        }
        notifySpeakingState(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('[WebSpeech] Speech call failed:', e);
        notifySpeakingState(false);
      }
    }

    speakNextClause();
  } else {
    notifySpeakingState(false);
  }
}
