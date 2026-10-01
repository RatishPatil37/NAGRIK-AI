"""Voice & Audio Streaming Ingress endpoints."""

from fastapi import APIRouter, File, HTTPException, UploadFile
from backend.src.multilingual.speech_gateway import transcribe_audio_bytes

router = APIRouter(prefix="/voice", tags=["Voice & Audio Ingress"])


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribes citizen voice input via server-side Whisper when Web Speech is unsupported."""
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an audio format.")

    audio_bytes = await file.read()
    if len(audio_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file exceeds 20MB limit.")

    text = await transcribe_audio_bytes(audio_bytes, filename=file.filename or "audio.webm")
    if not text:
        return {
            "success": False,
            "text": "",
            "message": "Transcription unavailable or audio could not be processed. Please use client speech recognition or text chat.",
        }

    return {
        "success": True,
        "text": text,
    }
