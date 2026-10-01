---
name: multilingual-voice-gateway
description: >-
  Guides the integration of browser Web Speech API, Whisper STT fallback,
  multilingual translation, and SpeechSynthesis/TTS audio playback with real-time visualizers.
---

# Multilingual Voice Gateway Skill

## Overview
Enables citizens to converse naturally via speech or text in major regional languages (Hindi, Marathi, Tamil, Telugu, English). Handles client-side speech recognition with server-side fallbacks.

## Dual-Path Speech Architecture

1. **Path A: Client-Side Web Speech API (Default)**
   - Instant speech-to-text directly in Chrome/Safari/Edge.
   - Zero server latency, zero cloud speech API costs.
   - Dispatches transcribed text directly to the FastAPI SSE chat endpoint.

2. **Path B: Server-Side Whisper Endpoint (Fallback)**
   - For browsers without Web Speech support or low-quality local models.
   - Streams audio chunks (`audio/webm;codecs=opus`) to `/api/v1/voice/transcribe`.
   - Runs lightweight Whisper / Groq Whisper API for high accuracy.

## Web Speech Hook Pattern (React TypeScript)
```typescript
export function useVoiceRecognition(onResult: (text: string) => void, lang: string = "hi-IN") {
  const [isListening, setIsListening] = useState(false);
  
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported; falling back to audio recorder");
      return false;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
    setIsListening(true);
    return true;
  };
  
  return { isListening, startListening };
}
```

## TTS Audio Wave Visualizer
Always render an animated sound wave pulse when voice mode is active so citizens have visual feedback that their microphone is listening.
