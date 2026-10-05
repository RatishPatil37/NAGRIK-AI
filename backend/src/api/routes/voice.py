"""Voice & Audio Streaming Ingress & Multilingual Text-to-Speech (TTS) Gateway.
Primary TTS: Sarvam AI (Bulbul:v3)
Fallback TTS: Microsoft Edge Neural TTS (edge-tts)
STT: Groq Whisper Large v3
"""

import base64
from pathlib import Path
from typing import Optional
import httpx
import edge_tts
from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from pydantic import BaseModel
from backend.src.config import settings
from backend.src.multilingual.speech_gateway import transcribe_audio_bytes

router = APIRouter(prefix="/voice", tags=["Voice & TTS Gateway"])

# Global in-memory circuit breaker flag: set to True when Sarvam quota/credits are exhausted
_SARVAM_CIRCUIT_BROKEN = False

# Mapping for Sarvam AI target language codes
SARVAM_LANG_MAP = {
    "hi": "hi-IN", "hi-IN": "hi-IN",
    "mr": "mr-IN", "mr-IN": "mr-IN",
    "ta": "ta-IN", "ta-IN": "ta-IN",
    "te": "te-IN", "te-IN": "te-IN",
    "bn": "bn-IN", "bn-IN": "bn-IN",
    "gu": "gu-IN", "gu-IN": "gu-IN",
    "kn": "kn-IN", "kn-IN": "kn-IN",
    "ml": "ml-IN", "ml-IN": "ml-IN",
    "pa": "pa-IN", "pa-IN": "pa-IN",
    "en": "en-IN", "en-IN": "en-IN",
}

# Mapping for Microsoft Edge Neural TTS Indic Voices (100% Free, High Quality)
EDGE_VOICE_MAP = {
    "hi": "hi-IN-SwaraNeural", "hi-IN": "hi-IN-SwaraNeural",
    "mr": "mr-IN-AarohiNeural", "mr-IN": "mr-IN-AarohiNeural",
    "ta": "ta-IN-PallaviNeural", "ta-IN": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural", "te-IN": "te-IN-ShrutiNeural",
    "bn": "bn-IN-TanishaaNeural", "bn-IN": "bn-IN-TanishaaNeural",
    "gu": "gu-IN-DhwaniNeural", "gu-IN": "gu-IN-DhwaniNeural",
    "kn": "kn-IN-SapnaNeural", "kn-IN": "kn-IN-SapnaNeural",
    "en": "en-IN-NeerjaNeural", "en-IN": "en-IN-NeerjaNeural",
}


class SynthesizeRequest(BaseModel):
    text: str
    language_code: str = "en-IN"


async def _synthesize_edge_tts(clean_text: str, lang_code: str) -> bytes:
    voice_name = EDGE_VOICE_MAP.get(lang_code, EDGE_VOICE_MAP.get(lang_code[:2], "en-IN-NeerjaNeural"))
    communicate = edge_tts.Communicate(clean_text, voice_name)
    audio_buffer = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.extend(chunk["data"])
    return bytes(audio_buffer)


@router.post("/synthesize")
async def synthesize_speech(req: SynthesizeRequest):
    """Synthesizes high-fidelity regional speech using Sarvam AI (Primary)
    with automatic sub-50ms fallback to Microsoft Edge Neural TTS.
    """
    global _SARVAM_CIRCUIT_BROKEN

    # Clean markdown, citation markers and truncate to concise audio length
    clean_text = req.text.replace("[S1]", "").replace("[S2]", "").replace("[S3]", "").replace("[S4]", "")
    for ch in ["*", "#", "`", "_", ">"]:
        clean_text = clean_text.replace(ch, "")
    clean_text = clean_text.strip()[:450]

    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    sarvam_key = (settings.SARVAM_API_KEY or "").strip()
    target_lang = SARVAM_LANG_MAP.get(req.language_code, SARVAM_LANG_MAP.get(req.language_code[:2], "hi-IN"))

    # TIER 1: Sarvam AI Bulbul:v1
    if sarvam_key and not _SARVAM_CIRCUIT_BROKEN:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    "https://api.sarvam.ai/text-to-speech",
                    headers={
                        "api-subscription-key": sarvam_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "inputs": [clean_text],
                        "target_language_code": target_lang,
                        "speaker": "shreya",
                        "pitch": 0,
                        "pace": 1.0,
                        "loudness": 1.5,
                        "speech_sample_rate": 8000,
                        "enable_preprocessing": True,
                        "model": "bulbul:v3",
                    },
                )

                if res.status_code == 200:
                    data = res.json()
                    audio_b64 = data.get("audios", [None])[0]
                    if audio_b64:
                        audio_bytes = base64.b64decode(audio_b64)
                        return Response(
                            content=audio_bytes,
                            media_type="audio/wav",
                            headers={"X-TTS-Engine": "Sarvam-AI-Bulbul"}
                        )

                # Check for quota exhaustion or key invalidation
                if res.status_code in [401, 402, 429]:
                    print(f"[VoiceGateway] Sarvam AI returned HTTP {res.status_code}. Latching circuit breaker to Edge-TTS.")
                    _SARVAM_CIRCUIT_BROKEN = True
                else:
                    print(f"[VoiceGateway] Sarvam AI status {res.status_code}, falling back to Edge-TTS.")
        except Exception as e:
            print(f"[VoiceGateway] Sarvam AI request error: {e}. Switching to Edge-TTS.")

    # TIER 2: Microsoft Edge Neural TTS Fallback
    try:
        audio_mp3 = await _synthesize_edge_tts(clean_text, req.language_code)
        return Response(
            content=audio_mp3,
            media_type="audio/mpeg",
            headers={"X-TTS-Engine": "Microsoft-Edge-Neural"}
        )
    except Exception as e:
        print(f"[VoiceGateway] Edge-TTS error: {e}")
        raise HTTPException(status_code=500, detail="Voice synthesis temporarily unavailable.")


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribes citizen voice input via server-side Whisper when Web Speech is unsupported.
    Uses memory-bounded 64KB streaming chunks to prevent container OOM.
    """
    content_type = file.content_type or ""
    if not (content_type.startswith("audio/") or content_type in ["application/octet-stream", "video/webm"]):
        raise HTTPException(status_code=400, detail="Uploaded file must be an audio format.")

    max_audio_bytes = 20 * 1024 * 1024  # 20MB limit
    chunk_size = 64 * 1024
    audio_chunks = []
    total_bytes = 0

    # Stream in bounded 64KB chunks to protect 512MB RAM ceiling
    while chunk := await file.read(chunk_size):
        total_bytes += len(chunk)
        if total_bytes > max_audio_bytes:
            raise HTTPException(status_code=413, detail="Audio file exceeds 20MB limit.")
        audio_chunks.append(chunk)

    audio_bytes = b"".join(audio_chunks)
    safe_name = Path(file.filename or "audio.webm").name
    text = await transcribe_audio_bytes(audio_bytes, filename=safe_name)
    if not text:
        return {
            "success": False,
            "text": "",
            "message": "Transcription unavailable or audio could not be processed. Please use text chat.",
        }

    return {
        "success": True,
        "text": text,
    }
