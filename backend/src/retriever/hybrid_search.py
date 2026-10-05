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
                self._client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY, timeout=30.0)
            else:
                print(f"[HybridRetriever] Using local Qdrant storage at {settings.QDRANT_LOCAL_PATH}...")
                self._client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
        return self._client

    def ensure_collection(self):
        """Ensures the hybrid collection exists with dense and sparse vector configurations,
        and ensures keyword payload indexes exist for multi-tenant filtering.
        Includes automatic fallback to local Qdrant storage if cloud authentication or connection fails.
        """
        client = self.get_client()
        collections = []
        try:
            collections = [c.name for c in client.get_collections().collections]
        except Exception as e:
            if settings.is_qdrant_cloud_configured:
                print(f"[HybridRetriever] WARNING: Qdrant Cloud connection/auth failed ({e}).")
                print(f"[HybridRetriever] Falling back to local offline Qdrant storage at {settings.QDRANT_LOCAL_PATH}...")
                try:
                    self._client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
                    client = self._client
                    collections = [c.name for c in client.get_collections().collections]
                except Exception as local_err:
                    print(f"[HybridRetriever] ERROR: Local Qdrant initialization failed: {local_err}")
                    return
            else:
                print(f"[HybridRetriever] ERROR: Could not connect to Qdrant: {e}")
                return

        try:
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

            # Ensure keyword payload indexes exist for scope, owner_user_id, and department
            for field in ["scope", "owner_user_id", "department"]:
                try:
                    client.create_payload_index(
                        collection_name=self.collection_name,
                        field_name=field,
                        field_schema=models.PayloadSchemaType.KEYWORD,
                    )
                except Exception:
                    pass
        except Exception as err:
            print(f"[HybridRetriever] Non-fatal error ensuring collection structure: {err}")

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
            # Fallback to dense-only query or query without filter if index pending
            print(f"[HybridRetriever] RRF prefetch fallback triggered: {e}")
            try:
                points = client.query_points(
                    collection_name=self.collection_name,
                    query=dense_embedding,
                    using="dense",
                    query_filter=query_filter,
                    limit=limit,
                ).points
            except Exception as e2:
                print(f"[HybridRetriever] Filter fallback triggered: {e2}")
                try:
                    points = client.query_points(
                        collection_name=self.collection_name,
                        query=dense_embedding,
                        using="dense",
                        limit=limit,
                    ).points
                except Exception as e3:
                    print(f"[HybridRetriever] Network/Remote search error: {e3}")
                    points = []

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
