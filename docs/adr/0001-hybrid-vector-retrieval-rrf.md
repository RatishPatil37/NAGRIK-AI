# ADR-0001: Server-Side Qdrant Hybrid RRF over In-Memory or Pure Dense Search

## Status
Accepted

## Date
2026-10-01

## Context & Problem Statement
Municipal documents contain precise alphanumeric terms (e.g., "Ward 12", "Section 14(b)", "Form 3B", "Circular 104/UDD/2026") alongside colloquial citizen descriptions ("gutter overflowing near my gate"). Pure semantic dense embeddings miss exact circular IDs; pure BM25 misses semantic synonyms. Performing hybrid fusion in Python memory requires transmitting full candidate lists over the network and serializing inverted indexes on every boot.

## Decision
Adopt **Qdrant Cloud** with dual vectors (FastEmbed ONNX `all-MiniLM-L6-v2` 384d dense + native sparse BM25 `Qdrant/bm25`) combined via native **Server-Side Reciprocal Rank Fusion (RRF)**. Pre-warm both models in FastAPI's startup `lifespan`.

## Alternatives Considered
1. **Pinecone**: Lacked native server-side sparse-dense RRF in standard tier; significantly higher cost.
2. **In-Memory `rank-bm25`**: Consumes 200MB+ RAM in Python and adds 150ms rank-merging CPU latency.
3. **Chroma / FAISS**: Lacked managed cloud persistence and first-class metadata payload filtering for tenant isolation.

## Consequences & Trade-offs
- **Positive**: Retrieval latency < 20ms, 100% recall on alphanumeric circular numbers, zero Python CPU bottleneck.
- **Negative**: Requires maintaining dual vector configurations in Qdrant collections.

## Compliance & Verification
Verified via `backend/tests/test_citations.py` and `backend/tests/test_ttft_profiling.py`.
