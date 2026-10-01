# 🧠 Nagrik AI: Architectural Knowledge Base & Trade-Off Analyses

> **Purpose**: Internal engineering record documenting why specific architectural patterns, frameworks, models, and security protocols were chosen over alternatives. Built on the learnings of Prakriti AI.

---

## 1. Core Architectural Decisions

### 1.1 Hybrid Retrieval: Qdrant Server-Side RRF vs. Vector-Only vs. Dense+Sparse In-Memory
* **Decision**: Qdrant Cloud with server-side Reciprocal Rank Fusion (RRF) combining FastEmbed ONNX dense (`all-MiniLM-L6-v2`) and native sparse BM25 (`Qdrant/bm25`).
* **Why?**: Municipal governance queries frequently contain exact alphanumeric IDs (e.g., `Ward 14`, `Notice No. 492/B`, `Section 128(A)`, `Form 3B`). Dense semantic embeddings often fail on exact alphanumeric codes. Conversely, pure BM25 fails when citizens describe issues in colloquial terms (e.g., "gutter water coming out" vs. "stormwater drainage backflow").
* **Why Server-Side RRF?**: Executing RRF in Qdrant's Rust core avoids transferring raw dense and sparse candidate lists over the network, cutting retrieval latency to under 20ms and eliminating 150ms of Python rank-merging CPU overhead.

### 1.2 Deterministic Pre-Filtering vs. Pure LLM Intent Routing
* **Decision**: 4-Tier zero-LLM deterministic pre-gates implemented in pure Python regex and dictionary lookups:
  1. *Emergency SOS Gate* (<2ms): Matches critical keywords (`fire`, `gas leak`, `cylinder blast`, `collapsed`, `drowning`). Immediately returns official helpline numbers without LLM or vector calls.
  2. *Municipal Scope Gate* (<3ms): Checks against out-of-scope taxonomy (coding, Bollywood, politics, sports). Instant polite refusal.
  3. *Conversational Intent Gate* (<2ms): Recognizes pleasantries and greetings, emitting warm responses with `sources: []`.
  4. *Completeness & Ward Gate* (<5ms): Detects when operational queries require specific parameters before issuing a search.
* **Why not an LLM Intent Classifier?**: Using an LLM (even small models like GPT-4o-mini or Gemini Flash) adds 250–500ms of TTFT latency and consumes tokens for trivial queries. Deterministic pre-filtering guarantees <5ms decision speed and absolute zero cost.

### 1.3 Post-Stream Citation Pruning (`filter_cited_evidence`)
* **Decision**: Do not display all retrieved candidate chunks in the UI. Instead, wait for stream completion, parse generated markdown tokens for citation references `[S1]`, `[S2]`, and prune uncited chunks.
* **Why?**: In typical RAG pipelines, 5 to 10 chunks are retrieved, but the LLM may only cite 2. Displaying all 10 candidates confuses citizens and misleads them into thinking unread regulations apply to their case. Post-stream pruning guarantees 100% concordance between what the assistant says and what the Evidence Rail displays.

### 1.4 FastEmbed Lifespan Pre-Warming
* **Decision**: Pre-warm FastEmbed ONNX dense and BM25 sparse models during FastAPI startup inside the `lifespan` context manager.
* **Why?**: The initial ONNX runtime compilation and model weight loading takes 12–15 seconds. If performed lazily on the first citizen request, the citizen experiences an unacceptable delay or timeout. Pre-warming shifts this cost to server startup, ensuring Query 1 achieves <500ms TTFT.

### 1.5 Render 512MB RAM Survival Invariants
* **Decision**:
  1. Chunked multipart upload reading (64KB chunks) with `Content-Length` headers pre-checked against `MAX_UPLOAD_SIZE_MB` (20MB).
  2. SHA-256 upload deduplication returning `409 Conflict`.
  3. Sliding-window rate limiter bounded to 10,000 active IPs with periodic TTL pruning.
* **Why?**: Cloud container free tiers (such as Render) enforce strict 512MB RAM limits. Calling `await file.read()` on a 50MB PDF loads the entire payload into RAM, instantly triggering Linux OOM killers. Chunked streaming buffers only 64KB at a time.

### 1.6 Multilingual Strategy: Client Web Speech API + Server Fallback
* **Decision**: Leverage browser Web Speech API for desktop/mobile browsers that natively support Hindi/English/Tamil speech recognition; fallback to server-side Whisper endpoints for unsupported clients.
* **Why?**: Browser-side Web Speech recognition operates locally on client hardware, producing zero server CPU load and instantaneous token streaming. Server-side Whisper acts as a high-fidelity backup for noisy recordings or complex regional accents.

---

## 2. Invariant Checklist for Developers

1. **Emergency First**: Never allow an emergency query to proceed to an LLM.
2. **Never Trust Client User IDs**: Extract `user_id` strictly from cryptographically verified Supabase JWTs.
3. **No Uncited Claims**: Always ground factual claims in official documents and verify citations via `filter_cited_evidence()`.
4. **SLA Accountability**: Every grievance must produce a unique hash and an automated SLA deadline.
5. **Zero AI Slop**: Clean, authoritative, accessible, keyboard-friendly civic workstation UI.
