"""Resilient multi-tier LLM generation client.
Tier 1: Google Gemini 3.7 Flash (Primary)
Tier 2: Google Gemini 3.5 Flash Lite (Secondary failover)
Tier 3: Groq Llama 3.3 70B Versatile (Tertiary failover)
Tier 4: Offline Deterministic Municipal Fallback
"""

import asyncio
from typing import AsyncGenerator, Dict, List, Optional
from backend.src.config import settings
from backend.src.generator.prompts import CIVIC_SYSTEM_PROMPT, build_context_block


class ResilientLLMClient:
    def __init__(self):
        self._gemini_client = None
        self._groq_client = None

    def _get_gemini_client(self):
        if self._gemini_client is None and settings.GEMINI_API_KEY:
            try:
                from google import genai
                self._gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                print(f"[LLMClient] Failed to initialize google-genai: {e}")
        return self._gemini_client

    def _get_groq_client(self):
        if self._groq_client is None and settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                print(f"[LLMClient] Failed to initialize groq: {e}")
        return self._groq_client

    async def stream_generate(
        self,
        query: str,
        evidence_chunks: List[Dict],
        language_code: str = "en",
        conversation_history: Optional[List[Dict]] = None,
    ) -> AsyncGenerator[Dict, None]:
        """Streams generated tokens from the highest available tier in the resiliency chain.
        Yields dicts with: {"token": str, "model": str, "tier": int}
        """
        context_str = build_context_block(evidence_chunks)
        user_prompt = (
            f"Citizen Query (Respond in Language: {language_code}):\n{query}\n\n"
            f"{context_str}\n\n"
            f"Provide an authoritative, clear answer citing official sources using [S1], [S2] where applicable."
        )

        # ---------------------------------------------------------
        # TIER 1: Gemini 3.7 Flash
        # ---------------------------------------------------------
        gemini_client = self._get_gemini_client()
        if gemini_client:
            try:
                print(f"[LLMClient] Tier 1: Invoking {settings.PRIMARY_MODEL}...")
                response_stream = await asyncio.to_thread(
                    gemini_client.models.generate_content_stream,
                    model=settings.PRIMARY_MODEL,
                    contents=user_prompt,
                    config={
                        "system_instruction": CIVIC_SYSTEM_PROMPT,
                        "temperature": 0.2,
                    },
                )
                for chunk in response_stream:
                    if chunk.text:
                        yield {"token": chunk.text, "model": settings.PRIMARY_MODEL, "tier": 1}
                return
            except Exception as e:
                print(f"[LLMClient] Tier 1 ({settings.PRIMARY_MODEL}) failed: {e}. Escalating to Tier 2...")

            # ---------------------------------------------------------
            # TIER 2: Gemini 3.5 Flash Lite
            # ---------------------------------------------------------
            try:
                print(f"[LLMClient] Tier 2: Invoking {settings.SECONDARY_MODEL}...")
                response_stream = await asyncio.to_thread(
                    gemini_client.models.generate_content_stream,
                    model=settings.SECONDARY_MODEL,
                    contents=user_prompt,
                    config={
                        "system_instruction": CIVIC_SYSTEM_PROMPT,
                        "temperature": 0.2,
                    },
                )
                for chunk in response_stream:
                    if chunk.text:
                        yield {"token": chunk.text, "model": settings.SECONDARY_MODEL, "tier": 2}
                return
            except Exception as e:
                print(f"[LLMClient] Tier 2 ({settings.SECONDARY_MODEL}) failed: {e}. Escalating to Tier 3...")

        # ---------------------------------------------------------
        # TIER 3: Groq Llama 3.3 70B Versatile
        # ---------------------------------------------------------
        groq_client = self._get_groq_client()
        if groq_client:
            try:
                print(f"[LLMClient] Tier 3: Invoking Groq {settings.FALLBACK_MODEL}...")
                messages = [
                    {"role": "system", "content": CIVIC_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ]
                completion = await asyncio.to_thread(
                    groq_client.chat.completions.create,
                    model=settings.FALLBACK_MODEL,
                    messages=messages,
                    temperature=0.2,
                    stream=True,
                )
                for chunk in completion:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield {"token": delta, "model": settings.FALLBACK_MODEL, "tier": 3}
                return
            except Exception as e:
                print(f"[LLMClient] Tier 3 ({settings.FALLBACK_MODEL}) failed: {e}. Falling back to Tier 4...")

        # ---------------------------------------------------------
        # TIER 4: Deterministic Municipal Fallback
        # ---------------------------------------------------------
        print("[LLMClient] Tier 4: Executing Deterministic Municipal Fallback...")
        if evidence_chunks:
            top_chunk = evidence_chunks[0]
            fallback_text = (
                f"**According to verified municipal bylaws [S1] ({top_chunk.get('title')}, {top_chunk.get('section_ref')}):**\n\n"
                f"{top_chunk.get('text')}\n\n"
                f"*Official Reference: {top_chunk.get('official_portal_ref', 'https://mohua.gov.in')}*"
            )
        else:
            fallback_text = (
                "Official municipal records for this specific query could not be retrieved from the active gazette index. "
                "Please verify directly with your Ward Administrative Office or consult the national municipal portal at https://mohua.gov.in."
            )

        # Simulate streaming chunks
        words = fallback_text.split(" ")
        for i in range(0, len(words), 3):
            token_slice = " ".join(words[i:i+3]) + " "
            yield {"token": token_slice, "model": "deterministic-offline-cache", "tier": 4}
            await asyncio.sleep(0.02)


llm_client = ResilientLLMClient()
