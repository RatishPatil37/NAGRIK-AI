---
name: municipal-rag-orchestration
description: >-
  Guides the implementation, tuning, and debugging of Qdrant Cloud hybrid
  vector retrieval (Dense FastEmbed + Sparse BM25 via server-side RRF),
  lifespan model pre-warming, and post-stream citation pruning for municipal documents.
---

# Municipal RAG Orchestration Skill

## Overview
This skill governs the core retrieval-augmented generation pipeline in Nagrik AI. It ensures sub-second TTFT, high recall on alphanumeric municipal circulars, and zero citation hallucinations.

## Dependencies
- `qdrant-client` (Fast vector DB client supporting server-side RRF)
- `fastembed` (Lightweight ONNX runtime for dense & sparse embeddings)
- `google-genai` (Gemini 2.5 Flash Lite SDK)
- `groq` (Groq Llama 3.3 70B SDK)

## Key Technical Patterns

### 1. Lifespan Pre-Warming in FastAPI
Always pre-warm dense and sparse models during startup to prevent 12-second cold-start spikes on Query 1:
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastembed import TextEmbedding, SparseTextEmbedding

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm Dense ONNX
    dense = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    list(dense.embed(["Municipal administration pre-warm query"]))
    app.state.dense_model = dense
    
    # Pre-warm Sparse BM25
    sparse = SparseTextEmbedding(model_name="Qdrant/bm25")
    list(sparse.embed(["Property tax water supply pre-warm query"]))
    app.state.sparse_model = sparse
    yield
```

### 2. Server-Side Reciprocal Rank Fusion (RRF)
Query Qdrant using native server-side RRF:
```python
from qdrant_client import models

results = client.query_points(
    collection_name="municipal_knowledge",
    prefetch=[
        models.Prefetch(query=dense_vector, using="dense", limit=10),
        models.Prefetch(query=sparse_vector, using="sparse", limit=10),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    query_filter=models.Filter(
        must=[models.FieldCondition(key="scope", match=models.MatchValue(value="public"))]
    ),
    limit=5,
)
```

### 3. Post-Stream Citation Pruning
```python
import re

def filter_cited_evidence(full_text: str, retrieved_chunks: list) -> list:
    cited_keys = set(re.findall(r"\[S(\d+)\]", full_text))
    if not cited_keys:
        return []
    return [chunk for chunk in retrieved_chunks if str(chunk.chunk_index) in cited_keys]
```

## Common Mistakes
1. **Lazy Loading**: Initializing `TextEmbedding` inside the request handler. This will cause Query 1 to timeout.
2. **Displaying All Retrieved Chunks**: Streaming uncited evidence to the UI. Always run `filter_cited_evidence` before rendering the final Evidence Rail.
3. **Omitting BM25**: Pure dense search misses circular numbers like `492/B-2026`. Always fuse with BM25.
