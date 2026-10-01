/**
 * Multilingual Speech Gateway: Browser Web Speech API + SpeechSynthesis TTS.
 * Zero-latency, zero-cloud-cost speech interaction.
 */

import { useState, useCallback } from 'react';

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

export function speakResponse(text: string, lang: string = 'en-IN') {
  if (!('speechSynthesis' in window)) {
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown formatting before speaking
  const cleanText = text
    .replace(/\[S\d+\]/g, '')
    .replace(/[#*`_]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .slice(0, 350); // limit length for concise voice summary

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}
