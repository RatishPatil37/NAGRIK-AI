"""Qdrant Hybrid Vector Retrieval with server-side Reciprocal Rank Fusion (RRF).
Supports both Qdrant Cloud and local persistent storage fallback.
"""

from typing import Any, Dict, List, Optional
from qdrant_client import QdrantClient, models
from backend.src.config import settings
from backend.src.retriever.prewarm import ModelPrewarmer


class HybridRetriever:
    def __init__(self):
        self._client: Optional[QdrantClient] = None
        self.collection_name = settings.QDRANT_COLLECTION

    def get_client(self) -> QdrantClient:
        if self._client is None:
            if settings.is_qdrant_cloud_configured:
                print(f"[HybridRetriever] Connecting to Qdrant Cloud at {settings.QDRANT_URL}...")
                self._client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
            else:
                print(f"[HybridRetriever] Using local Qdrant storage at {settings.QDRANT_LOCAL_PATH}...")
                self._client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
        return self._client

    def ensure_collection(self):
        """Ensures the hybrid collection exists with dense and sparse vector configurations."""
        client = self.get_client()
        collections = [c.name for c in client.get_collections().collections]
        if self.collection_name not in collections:
            print(f"[HybridRetriever] Creating hybrid collection '{self.collection_name}'...")
            client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": models.VectorParams(size=384, distance=models.Distance.COSINE)
                },
                sparse_vectors_config={
                    "sparse": models.SparseVectorParams(modifier=models.Modifier.IDF)
                },
            )
            print(f"[HybridRetriever] Collection '{self.collection_name}' created successfully.")

    def search(
        self,
        query_text: str,
        limit: int = 5,
        user_id: Optional[str] = None,
        ward_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Executes server-side Reciprocal Rank Fusion (RRF) across Dense and Sparse vectors."""
        client = self.get_client()
        dense_model, sparse_model = ModelPrewarmer.get_models()

        # Compute query embeddings
        dense_embedding = list(dense_model.embed([query_text]))[0].tolist()
        sparse_embedding_obj = list(sparse_model.embed([query_text]))[0]

        sparse_vector = models.SparseVector(
            indices=sparse_embedding_obj.indices.tolist(),
            values=sparse_embedding_obj.values.tolist(),
        )

        # Build Scope & Multi-Tenant Security Filter
        # Public documents are always visible; citizen-scoped documents require matching user_id
        conditions = [
            models.FieldCondition(key="scope", match=models.MatchValue(value="public"))
        ]
        if user_id:
            conditions.append(
                models.Filter(
                    must=[
                        models.FieldCondition(key="scope", match=models.MatchValue(value="citizen")),
                        models.FieldCondition(key="owner_user_id", match=models.MatchValue(value=user_id)),
                    ]
                )
            )

        query_filter = models.Filter(should=conditions)

        try:
            results = client.query_points(
                collection_name=self.collection_name,
                prefetch=[
                    models.Prefetch(query=dense_embedding, using="dense", limit=10),
                    models.Prefetch(query=sparse_vector, using="sparse", limit=10),
                ],
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                query_filter=query_filter,
                limit=limit,
            )
            points = results.points
        except Exception as e:
            # Fallback to dense-only query if RRF is not supported in a particular embedded client version
            print(f"[HybridRetriever] RRF prefetch fallback triggered: {e}")
            points = client.search(
                collection_name=self.collection_name,
                query_vector=("dense", dense_embedding),
                query_filter=query_filter,
                limit=limit,
            )

        output_chunks = []
        for i, point in enumerate(points, start=1):
            payload = point.payload or {}
            output_chunks.append({
                "index": i,
                "score": getattr(point, "score", 0.0),
                "doc_id": payload.get("doc_id", f"DOC-{i}"),
                "title": payload.get("title", "Official Gazette"),
                "department": payload.get("department", "GEN"),
                "document_type": payload.get("document_type", "bylaw"),
                "section_ref": payload.get("section_ref", "General"),
                "text": payload.get("text", ""),
                "source_path": payload.get("source_path", ""),
                "source_url": payload.get("source_url", f"/api/v1/documents/{payload.get('doc_id')}/download"),
                "official_portal_ref": payload.get("official_portal_ref", "https://mohua.gov.in"),
            })

        return output_chunks


hybrid_retriever = HybridRetriever()
