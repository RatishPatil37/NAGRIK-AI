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

  _activeUtterances.clear();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
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

// Active utterance set to prevent Chromium V8 garbage collection
const _activeUtterances = new Set<SpeechSynthesisUtterance>();

let _voicesList: SpeechSynthesisVoice[] = [];
function getVoicesList(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (_voicesList.length === 0) {
    _voicesList = window.speechSynthesis.getVoices() || [];
  }
  return _voicesList;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  _voicesList = window.speechSynthesis.getVoices() || [];
  window.speechSynthesis.onvoiceschanged = () => {
    _voicesList = window.speechSynthesis.getVoices() || [];
  };
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
    .replace(/\n+/g, ' ') // Paragraphs to space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the highest-fidelity voice for the requested language.
 * Prefers natural/neural/Google voices, but gracefully falls back to any available voice
 * so Windows/Chromium users NEVER experience silent failure.
 */
function getBestBrowserVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = getVoicesList();
  if (!voices || voices.length === 0) return null;

  const cleanLang = lang.toLowerCase().replace('_', '-');
  const prefix = cleanLang.split('-')[0];

  // Priority 1: Exact match with neural/natural/online/google voice
  const exactQuality = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();
    return (
      vLang === cleanLang &&
      (n.includes('natural') || n.includes('online') || n.includes('neural') || n.includes('google'))
    );
  });
  if (exactQuality) return exactQuality;

  // Priority 2: Exact language match
  const exactLang = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === cleanLang);
  if (exactLang) return exactLang;

  // Priority 3: Prefix match with quality voice (e.g. natural English voice for en-IN)
  const prefixQuality = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();
    return (
      vLang.startsWith(prefix) &&
      (n.includes('natural') || n.includes('online') || n.includes('neural') || n.includes('google'))
    );
  });
  if (prefixQuality) return prefixQuality;

  // Priority 4: Any prefix match (includes Microsoft David, Zira, etc. — never exclude!)
  const anyPrefix = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
  if (anyPrefix) return anyPrefix;

  // Priority 5: For English, any English voice
  if (prefix === 'en') {
    const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (anyEn) return anyEn;
  }

  // Priority 6: Default or first available voice
  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Chunks text into natural sentences (by punctuation . ! ? । or newlines)
 * so phrases with commas stay intact and sound conversational with natural pauses.
 */
function splitIntoNaturalSentences(text: string): string[] {
  const raw = text.match(/[^.!?।\n]+[.!?।\n]*/g);
  if (!raw || raw.length === 0) {
    return [text.trim()];
  }

  const sentences: string[] = [];
  let buffer = '';

  for (const part of raw) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if ((buffer + ' ' + trimmed).length < 240) {
      buffer = buffer ? `${buffer} ${trimmed}` : trimmed;
    } else {
      if (buffer) sentences.push(buffer);
      buffer = trimmed;
    }
  }
  if (buffer) {
    sentences.push(buffer);
  }

  return sentences.length > 0 ? sentences : [text.trim()];
}

/**
 * Speaks the assistant's response in authentic human-like conversational cadence:
 * 1. Tries Server-Side Neural TTS (Sarvam AI Bulbul:v3 / Edge-TTS) with fast timeout.
 * 2. Seamlessly falls back to humanized Browser Web SpeechSynthesis with:
 *    - Sentence-level natural punctuation pauses
 *    - Memory leak / GC protection in Chromium
 *    - Unsticking paused browser speech synthesis
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

  // ── Tier 1 & 2: Server-Side Neural TTS (Sarvam AI / Edge-TTS) ──
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Server TTS timeout')), 3500)
    );
    const blobPromise = synthesizeSpeech(cleanText, lang);
    const blob = await Promise.race([blobPromise, timeoutPromise]);

    if (myToken !== _speakToken) return;

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (activeAudio === audio) activeAudio = null;
        notifySpeakingState(false);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        if (activeAudio === audio) activeAudio = null;
        reject(e);
      };
      audio.play().catch(reject);
    });
    return; // Success! Studio-quality neural audio playing.
  } catch (err) {
    console.warn('[VoiceGateway] Server TTS unavailable, falling back to browser SpeechSynthesis:', err);
    if (myToken !== _speakToken) return;
  }

  // ── Tier 3: Humanized Browser Web SpeechSynthesis ──
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
    } catch (_) {}

    const sentences = splitIntoNaturalSentences(cleanText);
    if (sentences.length === 0) {
      notifySpeakingState(false);
      return;
    }

    const voice = getBestBrowserVoice(lang);
    let currentIndex = 0;

    function playNextSentence() {
      if (myToken !== _speakToken) {
        notifySpeakingState(false);
        return;
      }

      if (currentIndex >= sentences.length) {
        notifySpeakingState(false);
        return;
      }

      const sentenceText = sentences[currentIndex++];
      const utterance = new SpeechSynthesisUtterance(sentenceText);
      _activeUtterances.add(utterance);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || lang;
      } else {
        utterance.lang = lang;
      }

      // Natural cadence:
      utterance.rate = 0.96;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        _activeUtterances.delete(utterance);
        if (myToken !== _speakToken) {
          notifySpeakingState(false);
          return;
        }
        if (currentIndex >= sentences.length) {
          notifySpeakingState(false);
        } else {
          // Natural sentence breathing pause (120ms)
          _sentenceTimeout = setTimeout(() => {
            playNextSentence();
          }, 120);
        }
      };

      utterance.onerror = (e) => {
        _activeUtterances.delete(utterance);
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[WebSpeech] Utterance warning:', e);
        }
        if (myToken !== _speakToken) {
          notifySpeakingState(false);
          return;
        }
        if (currentIndex >= sentences.length) {
          notifySpeakingState(false);
        } else {
          playNextSentence();
        }
      };

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('[WebSpeech] Speech call failed:', e);
        _activeUtterances.delete(utterance);
        notifySpeakingState(false);
      }
    }

    playNextSentence();
  } else {
    notifySpeakingState(false);
  }
}
