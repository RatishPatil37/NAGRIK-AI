# 🚀 Master Engineering Prompts: AI Municipal Chatbot & Civic Decision Support System

> **Document Purpose**: An authoritative, battle-tested catalog of phase-by-phase engineering prompts designed for Antigravity IDE (and any advanced AI coding assistant). Built from the hard-won production milestones of **Prakriti AI**, this guide directly solves current project bottlenecks (empty Qdrant collections, ephemeral SQLite, lack of multi-turn chat, Render 512MB RAM constraints) and scaffolds the advanced **Civic Issue Forecasting & GIS Decision Support System**.

---

## 🧭 How to Use These Prompts with the Three Abstraction Layers

When prompting the IDE, always prepend the prompt tag so the agent never confuses architectural intent, project workflow, or test fixtures:

* **`[PM]` (Project-Management)**: Use for specifications, roadmaps, architecture review, and step-by-step plans. Enforces: *"Do not write code until the plan is approved."*
* **`[PS]` (Product-Solution)**: Use for writing production code, algorithms, schemas, FastAPI endpoints, and React components. Enforces: *"Production-grade code only; no mocks or temporary hacks."*
* **`[TA]` (Test-Article)**: Use for synthetic fixtures, mock data, unit tests, and regression suites. Enforces: *"Strictly isolated to tests; zero production leakage."*

---

## 📑 Phased Implementation Roadmap

| Phase | Focus Area | Current Gap Addressed | Abstraction Layer |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Database & Persistence Stabilization** | Supabase `schema.sql` migration, eliminating ephemeral SQLite data loss, conversation persistence. | `[PS]` |
| **Phase 2** | **Production Hybrid RAG & Ingestion Engine** | Empty `nagrik_gazettes` collection, 512MB RAM OOM prevention, batch ingestion, server-side RRF. | `[PS]` |
| **Phase 3** | **Citation Gate & Post-Stream Pruning** | Eliminating unread retrieval candidates; guaranteed 100% citation concordance in Evidence Rail. | `[PS]` |
| **Phase 4** | **Multi-Turn Context & Stream Disconnect Safety** | Preserving conversational context across turns; aborting SSE streams on session switch. | `[PS]` |
| **Phase 5** | **Pentest Hardening & Container Security** | Chunked upload streams, SHA-256 deduplication, injection sanitization, rate-limiter TTL eviction. | `[PS]` |
| **Phase 6** | **Telemetry, Tracing & Performance Profiling** | Replacing no-op tracer with non-blocking Langfuse; sub-second TTFT benchmarking. | `[PS]` |
| **Phase 7** | **Civic Issue Forecasting & GIS Decision Support** | NER location extraction, time-series complaint surge forecasting, spatial ward heatmaps. | `[PS]` |
| **Phase 8** | **High-Density Civic Workstation UI Overhaul** | Working local gazette preview, living Ward HUD, printable grievance dossier, Command Palette. | `[PS]` |
| **Phase 9** | **Automated Test Suite & Render Keep-Alive CI** | 100% test coverage across gates, RAG, and SLAs; 17h/day keep-alive cron for Render free-tier. | `[TA] & [PM]` |
| **Review** | **ERR / CON / GAP & NATO LL Post-Mortem Standard** | Dissecting bad decisions, conflicts with invariants, and formal post-mortem logs. | `[PM]` |

---

## Phase 1: Database & Persistence Stabilization

### Context & Problem
Currently, Supabase PostgreSQL queries fail because `supabase/schema.sql` hasn't been executed. The backend silently falls back to local SQLite (`data/sqlite/nagrik.db`). On Render's ephemeral Linux container, SQLite is wiped clean on every idle restart or deployment, destroying all citizen tickets and conversation history.

```text
[PS] Execute Supabase Migration, Database Healthcheck & Persistent Multi-Turn Schema

CONTEXT:
Our municipal backend currently falls back to ephemeral SQLite because Supabase Postgres is unmigrated. On Render free tier, the container disk is wiped on every restart. We need Supabase PostgreSQL fully active with Row-Level Security (RLS) for multi-turn conversations, messages, and citizen grievances.

OBJECTIVE:
1. Provide the exact, production-ready SQL script for Supabase SQL Editor including:
   - `municipal_wards` (ward_id, ward_name, zone_name, officer_email, contact_phone).
   - `municipal_departments` (dept_code: WTR, SAN, REV, ENG, TNP, ELE; standard_sla_hours).
   - `conversations` (id, user_id, title, ward_id, language_code, is_pinned, created_at, updated_at).
   - `messages` (id, conversation_id, role, content, citations JSONB, metrics JSONB, created_at).
   - `grievances` (ticket_id, conversation_id, user_id, citizen_name, citizen_phone, ward_id, dept_code, category, priority, sla_deadline, status, resolution_notes, created_at).
   - Strict RLS policies allowing authenticated citizens to view their own data, anonymous citizens to create tickets, and municipal admins to view all records.
2. Refactor `backend/src/database/adapter.py`:
   - Implement an automated startup connection probe: verify Supabase Postgres connectivity.
   - If Supabase credentials are missing or connection fails, log a high-priority WARNING, surface `/ready` endpoint status as 503, and only use SQLite if an explicit `ALLOW_SQLITE_FALLBACK=True` setting is declared.
   - Create helper methods: `create_conversation()`, `get_conversation_history(conversation_id, limit=10)`, `save_message()`, and `insert_grievance()`.
3. Provide a test verification script `backend/scripts/test_db_connection.py` that validates insert, read, and RLS behavior.

INVARIANTS:
- Never store raw passwords or unverified user IDs. Extract user_id strictly from verified JWT `sub`.
- Never fail silently to SQLite without logging a clear warning and flagging the system health check.
```

---

## Phase 2: Production Hybrid RAG & Ingestion Engine

### Context & Problem
The Qdrant collection `nagrik_gazettes` is currently empty. The system falls back to simple regex matching on local `.md` files. Furthermore, importing and loading `fastembed` ONNX models during request execution consumes ~200MB RAM, causing Render 512MB RAM free instances to crash with Out-Of-Memory (OOM) errors.

```text
[PS] Implement Production Ingestion Script, FastEmbed Lifespan Pre-Warming & Qdrant RRF

CONTEXT:
Our Qdrant Cloud collection `nagrik_gazettes` is currently unpopulated, causing the app to fall back to basic regex. Loading FastEmbed lazily on citizen requests causes 12-15s timeouts and threatens Render's 512MB RAM ceiling.

OBJECTIVE:
1. Build `backend/scripts/ingest.py`:
   - Recursively parse all markdown and PDF files in `data/corpus/` (Property tax bylaws, Water charter, Sanitation rules, Building regulations).
   - Use recursive text chunking (chunk size: 500 tokens, overlap: 50 tokens) preserving Section headers in metadata.
   - Generate dual embeddings:
     * Dense: FastEmbed ONNX `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional).
     * Sparse: FastEmbed BM25 (`Qdrant/bm25`) for exact circular numbers and ward terms.
   - Ensure the Qdrant collection `nagrik_gazettes` is created with dual vector configurations (`dense` with Cosine distance, `sparse` with modifier).
   - Upload chunks in memory-efficient batches of 64 with exponential backoff on network errors.
   - Output ingestion manifest: total documents, chunks generated, vector upload status.
2. Optimize Server Memory in `backend/src/api/main.py`:
   - In FastAPI `lifespan`, pre-warm both dense and sparse models once on boot with dummy strings so weights are mapped into memory before requests arrive.
   - Store initialized model references in `app.state.dense_model` and `app.state.sparse_model`.
   - Explicitly run `gc.collect()` after startup warmup to free temporary compilation buffers.
3. Update `backend/src/retriever/hybrid_search.py`:
   - Query Qdrant using native server-side Reciprocal Rank Fusion (RRF) via `client.query_points()` with `FusionQuery(fusion=Fusion.RRF)`.
   - Enforce payload filtering by `ward_scope` ("all" OR specific citizen ward).

INVARIANTS:
- Zero Python rank merging in memory. RRF must execute on Qdrant's Rust engine in <20ms.
- Pre-warming must happen in `lifespan`, never lazily on Query 1.
```

---

## Phase 3: Citation Gate & Post-Stream Pruning

### Context & Problem
Standard RAG pipelines retrieve 5 to 10 candidate chunks and immediately push them to the frontend Evidence Rail. However, the LLM may only cite 1 or 2 chunks (or refuse to answer if out-of-scope). Displaying unread, uncited regulations confuses citizens and causes citation hallucinations.

```text
[PS] Implement Post-Stream Citation Pruning & Evidence Gate Truth

CONTEXT:
If 5 candidate chunks are retrieved from Qdrant, but the LLM only references `[S1]`, displaying S2 through S5 in the UI gives citizens the false impression that unread rules apply to their inquiry. Furthermore, greeting queries ("hello") or out-of-scope refusals must NEVER show evidence sources.

OBJECTIVE:
1. In `backend/src/generator/stream.py`:
   - Collect streamed tokens in an in-memory buffer while simultaneously streaming them to the client via SSE.
   - At stream completion, execute `filter_cited_evidence(full_text: str, retrieved_chunks: list[EvidenceChunk]) -> list[EvidenceChunk]`:
     * Scan `full_text` for citation tokens using regex `r"\[S(\d+)\]"`.
     * Extract unique cited indices (e.g., `{"1", "3"}`).
     * Filter `retrieved_chunks` so ONLY chunks whose `chunk_index` was explicitly cited are retained.
     * If the response is a refusal, an emergency SOS redirect, or pleasantry, guarantee `sources: []`.
   - Emit a dedicated SSE event `event: citations` carrying ONLY the pruned, verified evidence list.
2. Implement Confidence Gate (`backend/src/retriever/evidence_gate.py`):
   - Evaluate top RRF fusion score.
   - Classify grounding confidence into: `HIGH` (score >= 0.70), `MODERATE` (0.45 <= score < 0.70), `INSUFFICIENT` (score < 0.45).
   - If `INSUFFICIENT`, inject instructions into the prompt scaffold to acknowledge lack of official municipal circulars and offer automatic escalation to the relevant Ward Officer.

INVARIANTS:
- Retrieved != Displayed. Displayed == Cited.
- No citations permitted on pleasantries or scope refusals.
```

---

## Phase 4: Multi-Turn Context & Stream Disconnect Safety

### Context & Problem
Currently, `/api/v1/chat/stream` only receives the immediate prompt; prior turn history is lost across turns. A citizen asking "What is the tax rate?" followed by "Where do I pay it?" gets a disconnected answer. Additionally, switching conversations while a stream is running causes tokens from Conversation A to bleed into Conversation B.

```text
[PS] Implement Multi-Turn Context Assembly & Client Disconnect Cancellation

CONTEXT:
Citizens expect conversation continuity. However, blindly passing 20 turns of raw chat into Qdrant dilutes retrieval precision with conversational noise ("yes please", "thank you"). Furthermore, when citizens navigate between conversations in the UI, un-cancelled SSE streams create race conditions.

OBJECTIVE:
1. Backend Multi-Turn Handling (`backend/src/api/chat.py` & `backend/src/generator/prompts.py`):
   - Accept `conversation_id: str` and optional `history: list[ChatMessage]` (last 6 turns) in the request payload.
   - Implement Query Contextualization: If history exists and the current query is anaphoric (contains pronouns like "it", "that", "there"), extract the primary civic entity from previous assistant turns before issuing the hybrid Qdrant query.
   - Format prompt with strict conversational history brackets `<chat_history>...</chat_history>` followed by retrieved `<official_evidence>...</official_evidence>`.
2. Stream Disconnect Safety:
   - In the SSE streaming loop, continuously check `if await request.is_disconnected(): break`.
   - On disconnect, immediately abort upstream LLM streaming and cancel the background Langfuse span to prevent wasted compute.
3. Frontend Stream Race-Condition Shield (`frontend/src/App.tsx` & `frontend/src/lib/api.ts`):
   - Maintain an active `AbortController` reference for in-flight streams.
   - When switching conversations (`loadConversation()`) or starting a new conversation (`handleNewConversation()`), call `activeAbortController.abort()` immediately before updating state.
   - Flush the incoming token buffer so no stale tokens render in the newly loaded session.

INVARIANTS:
- Multi-turn history must be capped to the last 6 turns to conserve context window and prevent token bloat.
- Upstream LLM generation must abort within 50ms of client tab closure or conversation switch.
```

---

## Phase 5: Red-Team Pentest Hardening & Container Security

### Context & Problem
Production municipal portals face malicious inputs: large file uploads intended to crash memory (OOM DoS), duplicate file spamming, prompt injection via uploaded citizen bills containing `</untrusted_document>`, unsigned JWT token forgery, and memory leaks from bot scrapers rotating IP addresses.

```text
[PS] Implement Complete Red-Team Pentest Hardening & Memory DoS Shield

CONTEXT:
Following our comprehensive security audit, we must harden the municipal API gateway against memory exhaustion, unauthorized token forgery, prompt injections, and XSS link vectors.

OBJECTIVE:
1. Memory-Bounded Upload Shield (`backend/src/api/uploads.py`):
   - Check incoming `Content-Length` header before allocating buffers. Reject requests > `MAX_UPLOAD_SIZE_MB` (default 20MB) with `413 Payload Too Large`.
   - Stream file bytes in 64KB chunks (`while chunk := await file.read(65536):`). Terminate and return 413 immediately if accumulated size exceeds limit. Never call `await file.read()` on unbounded streams.
   - Enforce strict extension whitelist: `.pdf`, `.txt`, `.md`. Validate byte magic numbers (e.g., `%PDF-`). Reject executables with `400 Bad Request`.
   - Calculate SHA-256 `content_hash`. Check database for existing `(user_id, content_hash)`. Return `409 Conflict` on duplicates to prevent vector space bloat.
2. Prompt Injection & Delimiter Neutralization:
   - In `backend/src/ingestion/parser.py`, strip null bytes (`\x00`) and escape tags (`<untrusted_document>`, `</untrusted_document>`).
   - In `backend/src/generator/prompts.py`, defensively escape closing tags inside chunk text before LLM compilation.
3. Unsigned JWT Lockdown (`backend/src/api/auth.py`):
   - Cryptographically verify Supabase JWTs via Asymmetric JWKS (RS256/ES256) or HS256 secret.
   - Restrict development unsigned token decoding STRICTLY to `if getattr(settings, "TESTING", False):`. In all deployed environments, invalid or unsigned tokens must return `401 Unauthorized`.
4. Sliding-Window Rate Limiter TTL Pruning (`backend/src/api/rate_limit.py`):
   - Implement `_maybe_prune()`: evict IP keys whose timestamp queues are empty or older than the 60-second window.
   - Bound total tracked IPs to 10,000 max. If exceeded under DDoS, evict the oldest inactive keys to prevent Render RAM exhaustion.
5. Client-Side Safe Markdown Link Whitelist (`frontend/src/components/chat/ChatPanel.tsx`):
   - Implement URL transformer function for React Markdown.
   - Allow strictly: `http:`, `https:`, `mailto:`, `tel:`, and `#cite-`. Block `javascript:` and arbitrary data schemes to eliminate stored XSS.

INVARIANTS:
- All uploads must be bounded in 64KB streaming chunks.
- Unsigned JWT bypass is non-negotiable: prohibited outside automated pytest (`TESTING=True`).
```

---

## Phase 6: Telemetry, Tracing & Sub-Second TTFT Benchmarking

### Context & Problem
Currently, `tracer.py` is a silent mock. In production, administrators need visibility into Time-To-First-Token (TTFT), Qdrant retrieval latency, model fallback triggers, token consumption, and guardrail interception rates without slowing down the SSE stream.

```text
[PS] Implement Non-Blocking Langfuse Telemetry & TTFT Performance Profiler

CONTEXT:
We need full production observability into TTFT, retrieval speed, and guardrail hits using Langfuse Open-Source SDK, with a strict guarantee that telemetry failures never delay or crash the citizen's response.

OBJECTIVE:
1. Refactor `backend/src/telemetry/tracer.py`:
   - Initialize `Langfuse()` asynchronously if `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are present.
   - If keys are missing, return a thread-safe `NoOpObservation` mock with identical method signatures (`span()`, `event()`, `update()`, `end()`).
   - Wrap trace creation and span updates in non-blocking background workers (`asyncio.create_task()` or background threads).
   - Ensure telemetry network partitions or timeouts fail silently without affecting the active SSE stream.
2. Instrument Core Pipeline Spans:
   - Root trace: `citizen_inquiry` (tagged with ward_id, language, is_emergency, is_authenticated).
   - Child span 1: `deterministic_guardrails` (records SOS, scope, or intent matches in <5ms).
   - Child span 2: `hybrid_retrieval` (records dense embed time, sparse embed time, Qdrant RRF fusion latency).
   - Child span 3: `llm_generation` (records TTFT, total tokens, output tokens, fallback tier used).
   - Child span 4: `citation_audit` (records retrieved count vs. cited count).
3. Build Benchmark Suite `backend/tests/test_ttft_profiling.py`:
   - Assert embedding model pre-warming latency < 25ms after startup.
   - Assert Qdrant hybrid retrieval latency < 35ms.
   - Assert end-to-end TTFT for Gemini Flash Lite < 950ms.

INVARIANTS:
- Telemetry must be completely non-blocking. Never `await` network flushes inside the token streaming loop.
```

---

## Phase 7: Civic Issue Forecasting & GIS Decision Support

### Context & Problem
The expanded system requirements mandate moving beyond reactive Q&A into proactive governance: Named Entity Recognition (NER) for locations/wards, time-series forecasting of complaint surges, and spatial GIS heatmaps for Municipal Commissioners.

```text
[PS] Implement Civic Issue Trend Forecasting, NER Extraction & GIS Heatmap Engine

CONTEXT:
Our municipal platform must empower administrators to forecast service failures before they escalate. We need an automated pipeline that extracts locations/categories from citizen complaints, forecasts complaint volumes across time, and generates spatial ward heatmaps.

OBJECTIVE:
1. Civic NER & Categorization Engine (`backend/src/forecasting/ner_classifier.py`):
   - Ingest citizen complaints and civic social media texts.
   - Extract Named Entities: Location/Landmark, Ward Number, and Department Category (`WTR`, `SAN`, `ENG`, `REV`, `ELE`).
   - Output structured schema: `{ "ward_id": 4, "landmark": "Station Road", "category": "Water Contamination", "severity": 0.85 }`.
2. Time-Series Trend Forecaster (`backend/src/forecasting/time_series.py`):
   - Aggregate historical grievances by Ward and Department on a daily/weekly cadence.
   - Implement rolling time-series forecasting (using statsmodels Exponential Smoothing / Holt-Winters or lightweight moving average trend analysis).
   - Detect seasonal surge anomalies (e.g., Ward 4 Water contamination forecast to spike by +65% ahead of monsoon season).
   - Generate proactive administrative alerts when forecasted volume exceeds the standard department SLA handling capacity.
3. Administrative Decision-Support API (`backend/src/api/admin.py`):
   - Endpoint `/api/v1/admin/analytics/ward-heatmap`: Returns GeoJSON / Ward-wise complaint counts, SLA breach rates, and severity indices.
   - Endpoint `/api/v1/admin/analytics/faq-clusters`: Groups citizen queries into top-10 trending civic pain points using TF-IDF / K-Means clustering.
   - Endpoint `/api/v1/admin/analytics/knowledge-gaps`: Returns queries where RAG confidence was `INSUFFICIENT`, flagging missing circulars for administrators.
4. Decision Support Dashboard Component (`frontend/src/components/admin/GISHeatmapDashboard.tsx`):
   - Render interactive choropleth map or SVG ward grid showing color-coded severity (Green = Normal, Amber = Elevated, Red = Critical Surge).
   - Display SLA Countdown Monitor with real-time countdown to breach.
   - Display "Top Emerging Civic Issues" chart with 7-day trend projection.

INVARIANTS:
- All forecasting computations must be cached in memory or Supabase with a 15-minute TTL to avoid continuous CPU recalculation.
```

---

## Phase 8: High-Density Civic Workstation UI Overhaul

### Context & Problem
Modern civic interfaces often suffer from generic "AI slop": giant text bubbles, unverified links, broken external PDF redirects, and lack of keyboard navigation. The workstation must look like an authoritative municipal mission-control center.

```text
[PS] Implement High-Density Civic Workstation: Local Gazette Previews, Living Ward HUD & Printable Receipts

CONTEXT:
We must deliver an authoritative, zero-slop civic workstation. Citations must never 404, the citizen's active ward must be persistently visible, and grievances must generate audit-ready printable slips.

OBJECTIVE:
1. Working Local Gazette Preview (`frontend/src/components/chat/GazettePreviewModal.tsx`):
   - Replace external dummy links with a dual-action citation modal:
     * "Read Gazette Excerpt": Opens an in-app drawer rendering the verified local markdown/PDF from `data/corpus/` with highlighted citation sections.
     * "Open MoHUA Portal": Opens verified official government portal.
   - Guarantee ZERO 404s when citizens click `[S1]`, `[S2]`.
2. Living Ward Profile HUD (`frontend/src/components/layout/WardHUD.tsx`):
   - Persistent top-bar status chip displaying: Active Ward number, Zone name, Citizen category (Resident/Commercial/Senior), and active language badge.
   - Quick-switch dropdown allowing citizens or ward officers to toggle ward context dynamically.
3. Printable Administrative Receipt / Dossier (`frontend/src/components/escalation/GrievanceReceiptModal.tsx`):
   - Formats registered tickets into official municipal acknowledgment whitepapers:
     * Municipal Corporation Emblem & Header.
     * Unique Ticket ID (`MNC-2026-W04-WTR-3891`) with verification barcode/QR code placeholder.
     * Issue Category, Geo-Location, Ward Officer in Charge, and SLA Target Resolution Date.
   - Strict `@media print` CSS: pure white background, crisp serif typography, page-break safeguards, and elimination of navigation chrome on print/PDF export.
4. Spotlight Walkthrough Tour & Command Palette (`Cmd+K`):
   - 4-step pure CSS/SVG spotlight tour highlighting: (1) Voice Mic HUD, (2) Ward HUD, (3) Service Command Palette, (4) Grievance Status Tracker.
   - Global `Cmd+K` navigator providing immediate jump to services (*Pay Property Tax*, *Report Water Contamination*, *Apply Trade License*).

INVARIANTS:
- Zero external broken links. Every citation must preview locally.
- Print stylesheets must produce clean, single-page official whitepaper slips.
```

---

## Phase 9: Automated Test Suite & Render Keep-Alive CI

### Context & Problem
Every security invariant, guardrail, and SLA deadline must be validated continuously in CI/CD. Furthermore, Render free-tier instances fall asleep after 15 minutes of inactivity, causing 45-second cold-start delays.

```text
[TA] & [PM] Implement Complete Automated Pytest Suite & Render Keep-Alive Cron

CONTEXT:
We need automated verification covering 100% of our security boundaries, deterministic gates, and SLA formulas, plus a GitHub Actions keep-alive cron that prevents Render sleep while respecting the 750 free-tier monthly hours constraint.

OBJECTIVE:
1. Automated Test Suite (`backend/tests/`):
   - `test_guardrails.py`: Assert SOS keywords trigger <5ms emergency cards; assert out-of-scope math/trivia is rejected; assert pleasantries return warm greeting with `sources: []`.
   - `test_security_isolation.py`: Assert unsigned JWTs are rejected when `TESTING=False`; assert upload size limits reject >20MB streams; assert duplicate hashes return 409 Conflict; assert parser strips `<untrusted_document>` tags.
   - `test_escalation.py`: Assert complaints route to correct department code (`WTR`, `SAN`, `REV`, `ENG`, `TNP`, `ELE`); assert SLA deadlines match emergency (4h) vs standard (24-48h); assert ticket IDs follow `MNC-{YEAR}-W{WARD}-{DEPT}-{HASH}` format.
   - `test_citations.py`: Assert `filter_cited_evidence()` eliminates uncited retrieval candidates.
   - `test_ttft_profiling.py`: Assert lifespan pre-warming keeps Query 1 TTFT under 1 second.
2. Render Keep-Alive Workflow (`.github/workflows/keep_alive.yml`):
   - Run automated curl ping against `https://your-nagrik-api.onrender.com/health`.
   - Frequency: Every 10 minutes (`*/10 * * * *`).
   - Active Window: 08:00 AM to 01:00 AM IST (17 hours/day = ~552 hours/month, safely below Render's 750 free hours cap).
3. Continuous Integration (`.github/workflows/ci.yml`):
   - Frontend job: `cd frontend && npm install && npm run build` (assert 0 TS errors).
   - Backend job: `cd backend && pip install -r requirements.txt && python -m pytest tests/ -v` (assert 100% pass).
```

---

## 🛠️ Review & Post-Mortem Standards: Dissecting Bad Decisions

When an agent generates flawed code, introduces regressions, or contradicts an established invariant, do not simply say "fix this." Enforce the following engineering review protocols:

### 1. ERR / CON / GAP Triage Prompt
```text
[PM] Triage Defect via ERR / CON / GAP Taxonomy

Please analyze the recent code change using the standard triage framework:
- [ERR] (Code Bug): What runtime error, unhandled exception, or broken test occurred?
- [CON] (Contradiction): Which architectural invariant or convention was violated (e.g., using lazy-loaded embeddings instead of lifespan pre-warming, or returning unverified JWT tokens)?
- [GAP] (Missing Requirement): What edge case or assumption was glossed over (e.g., forgetting to check Content-Length before allocating buffers)?

Provide a clean code fix that resolves the issue while adding a permanent regression test case.
```

### 2. NATO Lessons Learned (LL) Post-Mortem Prompt
```text
[PM] Conduct NATO Lessons Learned (LL) Post-Mortem

For the recent defect [INSERT ISSUE, e.g., Render OOM Crash during upload], produce a formal NATO LL incident post-mortem:
1. Observation: What was the exact failure symptom and error log?
2. Context & Impact: Which layer (PS/PM/TA) was affected, and what was the operational risk to the municipal platform?
3. Root Cause Analysis: Trace the underlying flaw to the source (e.g., calling `await file.read()` loaded a 50MB payload directly into container memory).
4. Remedial Action & Prevention:
   - What specific defensive code pattern is implemented to fix it?
   - What new unit test has been added to `backend/tests/`?
   - What invariant has been added to `.agents/rules/` to ensure this mistake is never repeated?
```

### 3. Architecture Decision Record (ADR) Creation Prompt
```text
[PM] Create Architecture Decision Record (ADR) in docs/adr/

Document the architectural decision for [INSERT DECISION, e.g., Server-Side Qdrant RRF vs. In-Memory Search]:
- ADR Number & Title: `docs/adr/XXXX-[short-title].md`
- Status: Accepted
- Context & Problem Statement: What problem does this solve under municipal scale and Render 512MB RAM constraints?
- Decision: What approach and library were selected?
- Alternatives Considered: List at least 2 alternatives with explicit reasons for rejection.
- Consequences & Trade-offs: Positive benefits and acceptable operational trade-offs.
- Compliance & Verification: Which automated pytest validates this decision?
```
