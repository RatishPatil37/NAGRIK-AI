"""Lifespan model pre-warming for FastEmbed dense ONNX and sparse BM25 models.
Prevents cold-start delays on initial citizen queries.
"""

from typing import Tuple
from fastembed import SparseTextEmbedding, TextEmbedding


class ModelPrewarmer:
    _dense_model: TextEmbedding = None
    _sparse_model: SparseTextEmbedding = None

    @classmethod
    def load_and_prewarm(cls) -> Tuple[TextEmbedding, SparseTextEmbedding]:
        if cls._dense_model is None or cls._sparse_model is None:
            print("[Lifespan] Pre-warming FastEmbed Dense Model (all-MiniLM-L6-v2)...")
            cls._dense_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
            # Synthetic warmup
            list(cls._dense_model.embed(["Municipal administration pre-warm query"]))

            print("[Lifespan] Pre-warming FastEmbed Sparse BM25 Model (Qdrant/bm25)...")
            cls._sparse_model = SparseTextEmbedding(model_name="Qdrant/bm25")
            # Synthetic warmup
            list(cls._sparse_model.embed(["Property tax water supply pre-warm query"]))
            print("[Lifespan] Both models successfully pre-warmed into memory.")

        return cls._dense_model, cls._sparse_model

    @classmethod
    def get_models(cls) -> Tuple[TextEmbedding, SparseTextEmbedding]:
        if cls._dense_model is None or cls._sparse_model is None:
            return cls.load_and_prewarm()
        return cls._dense_model, cls._sparse_model
