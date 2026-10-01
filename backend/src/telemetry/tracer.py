"""Langfuse non-blocking async telemetry tracer with PII redaction."""

import re
from typing import Any, Dict, Optional
from backend.src.config import settings

# Regex for PII masking
AADHAAR_REGEX = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
PAN_REGEX = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
PHONE_REGEX = re.compile(r"\b(\+91[\-\s]?)?[6789]\d{9}\b")


def mask_pii(text: str) -> str:
    """Masks Aadhaar, PAN, and Citizen Phone Numbers before sending telemetry."""
    if not text:
        return ""
    text = AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", text)
    text = PAN_REGEX.sub("[REDACTED_PAN]", text)
    text = PHONE_REGEX.sub("[REDACTED_PHONE]", text)
    return text


class TelemetryTracer:
    def __init__(self):
        self._langfuse = None
        if settings.is_langfuse_configured:
            try:
                from langfuse import Langfuse
                self._langfuse = Langfuse(
                    public_key=settings.LANGFUSE_PUBLIC_KEY,
                    secret_key=settings.LANGFUSE_SECRET_KEY,
                    host=settings.LANGFUSE_HOST,
                )
                print("[TelemetryTracer] Langfuse initialized successfully.")
            except Exception as e:
                print(f"[TelemetryTracer] Langfuse initialization failed: {e}")

    def log_trace(
        self,
        trace_name: str,
        input_query: str,
        output_text: str,
        metadata: Optional[Dict[str, Any]] = None,
        latency_ms: Optional[float] = None,
        model_name: Optional[str] = None,
    ):
        """Asynchronously records trace in Langfuse without blocking SSE streams."""
        if not self._langfuse:
            return

        try:
            clean_input = mask_pii(input_query)
            clean_output = mask_pii(output_text)
            self._langfuse.trace(
                name=trace_name,
                input=clean_input,
                output=clean_output,
                metadata={
                    **(metadata or {}),
                    "model": model_name,
                    "latency_ms": latency_ms,
                },
            )
        except Exception as e:
            # Telemetry errors must never crash the user request
            print(f"[TelemetryTracer] Error logging trace: {e}")


tracer = TelemetryTracer()
