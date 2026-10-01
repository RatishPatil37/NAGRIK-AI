"""Server-Sent Events (SSE) Chat Streaming endpoint with pre-gates,
hybrid vector retrieval, multi-tier LLM generation, citation pruning, and autonomous escalation.
"""

import asyncio
import json
import time
from typing import Optional
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from backend.src.api.dependencies import get_current_user_id
from backend.src.database.adapter import db_adapter
from backend.src.escalation.triage import triage_grievance
from backend.src.generator.llm_client import llm_client
from backend.src.guardrails.completeness import check_completeness_gate
from backend.src.guardrails.emergency_sos import check_emergency_sos
from backend.src.guardrails.intent_gate import check_intent_gate
from backend.src.guardrails.scope_gate import check_scope_gate
from backend.src.multilingual.normalizer import normalize_query_for_retrieval
from backend.src.retriever.hybrid_search import hybrid_retriever
from backend.src.retriever.pruner import filter_cited_evidence
from backend.src.telemetry.tracer import tracer

router = APIRouter(prefix="/chat", tags=["Chat & Streaming"])


class ChatStreamRequest(BaseModel):
    query: str
    ward_id: Optional[int] = None
    language_code: str = "en"
    conversation_id: Optional[str] = None


@router.post("/stream")
async def stream_chat(
    req: ChatStreamRequest,
    request: Request,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Streams conversational tokens and civic metadata over Server-Sent Events (SSE)."""

    async def event_generator():
        start_time = time.time()
        query = req.query.strip()
        ward_id = req.ward_id
        lang = req.language_code

        # =========================================================
        # 1. Emergency SOS Pre-Gate (<5ms)
        # =========================================================
        sos_result = check_emergency_sos(query)
        if sos_result:
            yield {
                "event": "sos",
                "data": json.dumps(sos_result),
            }
            yield {"event": "done", "data": "[DONE]"}
            return

        # =========================================================
        # 2. Municipal Scope Gate (<3ms)
        # =========================================================
        scope_result = check_scope_gate(query)
        if scope_result:
            yield {
                "event": "token",
                "data": json.dumps({"token": scope_result["message"], "model": "scope-gate"}),
            }
            yield {
                "event": "citations",
                "data": json.dumps({"citations": []}),
            }
            yield {"event": "done", "data": "[DONE]"}
            return

        # =========================================================
        # 3. Conversational Intent Gate (<2ms)
        # =========================================================
        intent_result = check_intent_gate(query)
        if intent_result:
            yield {
                "event": "token",
                "data": json.dumps({"token": intent_result["message"], "model": "intent-gate"}),
            }
            yield {
                "event": "citations",
                "data": json.dumps({"citations": []}),
            }
            yield {"event": "done", "data": "[DONE]"}
            return

        # =========================================================
        # 4. Parameter Completeness & Clarification Gate
        # =========================================================
        clarification = check_completeness_gate(query, current_ward_id=ward_id)
        if clarification:
            yield {
                "event": "clarification",
                "data": json.dumps(clarification),
            }
            yield {"event": "done", "data": "[DONE]"}
            return

        # =========================================================
        # 5. Multilingual Query Normalizer & Hybrid Retrieval
        # =========================================================
        yield {
            "event": "status",
            "data": json.dumps({"status": "Verifying municipal regulations & bylaws..."}),
        }

        normalized_query = normalize_query_for_retrieval(query)
        retrieved_chunks = await asyncio.to_thread(
            hybrid_retriever.search,
            query_text=normalized_query,
            limit=5,
            user_id=user_id,
            ward_id=ward_id,
        )

        # =========================================================
        # 6. Multi-Tier LLM Token Stream
        # =========================================================
        yield {
            "event": "status",
            "data": json.dumps({"status": "Synthesizing verified civic response..."}),
        }

        full_text = ""
        model_used = "unknown"

        try:
            async for chunk in llm_client.stream_generate(
                query=query,
                evidence_chunks=retrieved_chunks,
                language_code=lang,
            ):
                if await request.is_disconnected():
                    print("[SSE] Client disconnected, aborting generation.")
                    break

                token = chunk.get("token", "")
                model_used = chunk.get("model", model_used)
                full_text += token

                yield {
                    "event": "token",
                    "data": json.dumps({"token": token, "model": model_used}),
                }
        except Exception as e:
            print(f"[SSE] Generation streaming error: {e}")
            yield {
                "event": "token",
                "data": json.dumps({"token": f"\n\n[System Notice: Error during token generation: {e}]"}),
            }

        # =========================================================
        # 7. Post-Stream Citation Pruning
        # =========================================================
        cited_evidence = filter_cited_evidence(full_text, retrieved_chunks)
        # If no explicit [S1] citations were found in the text but chunks were used, provide top chunk as verified reference
        if not cited_evidence and retrieved_chunks:
            cited_evidence = [retrieved_chunks[0]]

        yield {
            "event": "citations",
            "data": json.dumps({"citations": cited_evidence}),
        }

        # =========================================================
        # 8. Grievance Auto-Escalation Engine
        # =========================================================
        grievance = triage_grievance(
            query=query,
            ward_id=ward_id or 1,
            citizen_id=user_id or "anon",
        )
        if grievance:
            saved_grievance = await db_adapter.create_grievance(grievance)
            yield {
                "event": "escalation",
                "data": json.dumps({
                    "ticket_id": saved_grievance.ticket_id,
                    "dept_code": saved_grievance.dept_code,
                    "category": saved_grievance.category,
                    "priority": saved_grievance.priority,
                    "sla_deadline": saved_grievance.sla_deadline.isoformat(),
                    "status": saved_grievance.status,
                    "receipt_url": f"/api/v1/grievances/{saved_grievance.ticket_id}",
                }),
            }

        # =========================================================
        # 9. Non-blocking Async Telemetry & Done Event
        # =========================================================
        latency_ms = (time.time() - start_time) * 1000
        tracer.log_trace(
            trace_name="chat_interaction",
            input_query=query,
            output_text=full_text,
            metadata={"ward_id": ward_id, "lang": lang, "citations_count": len(cited_evidence)},
            latency_ms=latency_ms,
            model_name=model_used,
        )

        yield {"event": "done", "data": "[DONE]"}

    return EventSourceResponse(event_generator())
