"""Server-side audio transcription fallback using Groq Whisper-large-v3.
Used when client browser lacks native Web Speech API support.
"""

import asyncio
from typing import Optional
from backend.src.config import settings


async def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.webm") -> Optional[str]:
    """Transcribes audio using Groq Whisper-large-v3."""
    if not settings.GROQ_API_KEY:
        print("[SpeechGateway] Groq API key not set. Audio transcription unavailable.")
        return None

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        def _transcribe():
            return client.audio.transcriptions.create(
                file=(filename, audio_bytes),
                model=settings.GROQ_WHISPER_MODEL,
                temperature=0.0,
            )

        transcription = await asyncio.to_thread(_transcribe)
        return transcription.text
    except Exception as e:
        print(f"[SpeechGateway] Groq Whisper transcription error: {e}")
        return None
