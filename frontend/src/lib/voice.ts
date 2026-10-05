/**
 * Multilingual Speech Gateway: Browser Web Speech API + Sarvam AI & Edge-TTS Speech Synthesis.
 * Primary: Sarvam AI Bulbul:v3
 * Secondary: Microsoft Edge Neural TTS
 * Tertiary: Browser Web SpeechSynthesis
 */

import { useState, useCallback } from 'react';
import { synthesizeSpeech } from './api';

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

export async function speakResponse(text: string, lang: string = 'en-IN') {
  // Cancel any ongoing audio or speech synthesis
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Strip markdown formatting before speaking
  const cleanText = text
    .replace(/\[S\d+\]/g, '')
    .replace(/[#*`_]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .slice(0, 350);

  if (!cleanText.trim()) return;

  // Tier 1 & 2: Server-side Neural TTS (Sarvam AI Bulbul:v3 + Edge-TTS Fallback)
  try {
    const blob = await synthesizeSpeech(cleanText, lang);
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    activeAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (activeAudio === audio) activeAudio = null;
    };
    await audio.play();
    return;
  } catch (err) {
    console.warn('[VoiceGateway] Server neural TTS fallback to browser SpeechSynthesis:', err);
  }

  // Tier 3: Browser Web SpeechSynthesis Fallback
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
