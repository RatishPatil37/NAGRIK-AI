"""Knowledge Base Ingestion script.
Chunks municipal markdown circulars, gazettes, and seed bylaws,
computes dense and sparse embeddings via FastEmbed, and indexes points into Qdrant.
"""

import json
import uuid
from pathlib import Path
from typing import Any, Dict, List
from qdrant_client import models
from backend.src.retriever.hybrid_search import hybrid_retriever
from backend.src.retriever.prewarm import ModelPrewarmer


def load_seed_documents() -> List[Dict[str, Any]]:
    """Loads seed knowledge from JSON and Markdown corpus files."""
    docs = []
    
    # 1. Load data/seed_municipal_knowledge.json
    seed_json = Path("data/seed_municipal_knowledge.json")
    if seed_json.exists():
        with open(seed_json, "r", encoding="utf-8") as f:
            items = json.load(f)
            for item in items:
                item["scope"] = "public"
                docs.append(item)

    # 2. Load data/corpus markdown files if available
    corpus_dir = Path("data/corpus")
    if corpus_dir.exists():
        for md_file in corpus_dir.glob("*.md"):
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Split into sections by heading
            sections = content.split("## ")
            title = sections[0].strip("# \n")
            doc_id = f"MNC-CORPUS-{md_file.stem.upper()[:12]}"
            dept = "GEN"
            if "tax" in md_file.name.lower():
                dept = "REV"
            elif "water" in md_file.name.lower():
                dept = "WTR"
            elif "waste" in md_file.name.lower():
                dept = "SAN"
            elif "building" in md_file.name.lower():
                dept = "TNP"

            for sec in sections[1:]:
                lines = sec.strip().split("\n")
                sec_title = lines[0].strip()
                sec_body = "\n".join(lines[1:]).strip()
                if len(sec_body) > 30:
                    docs.append({
                        "doc_id": doc_id,
                        "title": f"{title} - {sec_title}",
                        "department": dept,
                        "document_type": "bylaw",
                        "ward_scope": "all",
                        "section_ref": sec_title,
                        "text": sec_body,
                        "source_path": str(md_file.as_posix()),
                        "source_url": f"/api/v1/documents/{doc_id}/download",
                        "official_portal_ref": "https://mohua.gov.in",
                        "scope": "public",
                    })

    return docs


def ingest_knowledge():
    """Ingests all municipal documents into Qdrant hybrid collection."""
    print("[Indexer] Initializing hybrid collection...")
    hybrid_retriever.ensure_collection()
    client = hybrid_retriever.get_client()

    docs = load_seed_documents()
    print(f"[Indexer] Loaded {len(docs)} document chunks for ingestion.")

    dense_model, sparse_model = ModelPrewarmer.get_models()

    texts = [d["text"] for d in docs]
    print("[Indexer] Generating dense ONNX embeddings...")
    dense_embeddings = list(dense_model.embed(texts))
    print("[Indexer] Generating sparse BM25 embeddings...")
    sparse_embeddings = list(sparse_model.embed(texts))

    points = []
    for i, doc in enumerate(docs):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{doc['doc_id']}-{i}"))
        dense_vec = dense_embeddings[i].tolist()
        sparse_obj = sparse_embeddings[i]

        sparse_vec = models.SparseVector(
            indices=sparse_obj.indices.tolist(),
            values=sparse_obj.values.tolist(),
        )

        points.append(
            models.PointStruct(
                id=point_id,
                vector={
                    "dense": dense_vec,
                    "sparse": sparse_vec,
                },
                payload=doc,
            )
        )

    print(f"[Indexer] Uploading {len(points)} points to '{hybrid_retriever.collection_name}'...")
    client.upsert(collection_name=hybrid_retriever.collection_name, points=points)
    print(f"[Indexer] Ingestion complete! Total points: {len(points)}")


def auto_seed_if_empty():
    """Checks if active collection has points; if empty, automatically ingests seed gazettes."""
    try:
        client = hybrid_retriever.get_client()
        info = client.get_collection(hybrid_retriever.collection_name)
        if (info.points_count or 0) > 0:
            print(f"[Indexer] Collection '{hybrid_retriever.collection_name}' already contains {info.points_count} points. Skipping auto-seed.")
            return
    except Exception as e:
        print(f"[Indexer] Collection check error: {e}. Ensuring collection and seeding...")

    print("[Indexer] Collection is empty or uninitialized. Auto-seeding 2026 municipal gazettes...")
    try:
        ingest_knowledge()
    except Exception as err:
        print(f"[Indexer] Auto-seed non-fatal error: {err}")


if __name__ == "__main__":
    ingest_knowledge()

