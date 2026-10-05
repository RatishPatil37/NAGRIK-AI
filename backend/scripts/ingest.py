"""Government Knowledge Base Ingestion Script for Nagrik AI.
Extracts text from official Government of India PDFs, Municipal Bylaws,
and Circulars using PyPDF streaming, generates ONNX Dense + BM25 Sparse
embeddings via FastEmbed, and upserts them to Qdrant Cloud in batches.
"""

import json
import logging
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List

# Suppress pypdf font dictionary noise
logging.getLogger("pypdf").setLevel(logging.ERROR)

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pypdf
from qdrant_client import models
from backend.src.config import settings
from backend.src.retriever.hybrid_search import hybrid_retriever
from backend.src.retriever.prewarm import ModelPrewarmer

PDF_METADATA = {
    "Registration of Births and Deaths Act (Citizen Charter).pdf": {
        "doc_id": "DOC-GOV-RBD-ACT",
        "title": "Registration of Births and Deaths Act (Citizen Charter)",
        "department": "HMN",
        "document_type": "act",
        "official_portal_ref": "https://crsorgi.gov.in",
    },
    "RTI-Act_English.pdf": {
        "doc_id": "DOC-GOV-RTI-2005",
        "title": "Right to Information Act 2005",
        "department": "GEN",
        "document_type": "act",
        "official_portal_ref": "https://rti.gov.in",
    },
    "mohua_street_vendors_act.pdf": {
        "doc_id": "DOC-GOV-STREET-VENDORS",
        "title": "Street Vendors (Protection of Livelihood and Regulation) Act",
        "department": "REV",
        "document_type": "act",
        "official_portal_ref": "https://mohua.gov.in",
    },
    "cpcb_plastic_waste_rules.pdf": {
        "doc_id": "DOC-GOV-PLASTIC-WASTE",
        "title": "Plastic Waste Management Rules & Guidelines (CPCB)",
        "department": "SAN",
        "document_type": "rule",
        "official_portal_ref": "https://cpcb.nic.in",
    },
    "solid_waste_management_rules.pdf": {
        "doc_id": "DOC-GOV-SOLID-WASTE",
        "title": "Solid Waste Management Rules (MoEFCC & CPCB)",
        "department": "SAN",
        "document_type": "rule",
        "official_portal_ref": "https://cpcb.nic.in",
    },
    "Manual on Water Supply and Treatment (CPHEEO).pdf": {
        "doc_id": "DOC-GOV-CPHEEO-WATER",
        "title": "CPHEEO Manual on Water Supply and Treatment",
        "department": "WTR",
        "document_type": "guideline",
        "official_portal_ref": "https://cpheeo.gov.in",
    },
    "Urban & Regional Development Plans Formulation (URDPFI Guidelines).pdf": {
        "doc_id": "DOC-GOV-URDPFI-TNP",
        "title": "URDPFI Urban & Regional Development Guidelines",
        "department": "TNP",
        "document_type": "guideline",
        "official_portal_ref": "https://mohua.gov.in",
    },
}


def clean_text(text: str) -> str:
    """Removes null bytes, excess whitespace, and hyphenated line breaks."""
    text = text.replace("\x00", " ")
    text = re.sub(r"-\n\s*", "", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def chunk_text(text: str, max_chars: int = 800, overlap: int = 100) -> List[str]:
    """Splits a long block of text into bounded chunks with sentence-aware boundaries."""
    if len(text) <= max_chars:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + max_chars
        if end >= len(text):
            chunks.append(text[start:].strip())
            break

        # Look for sentence boundary near the end
        boundary = text.rfind(". ", start, end)
        if boundary != -1 and boundary > start + (max_chars // 2):
            end = boundary + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap

    return chunks


def load_pdf_documents() -> List[Dict[str, Any]]:
    """Streams and extracts text from official Government of India PDFs."""
    corpus_dir = Path("data/corpus")
    if not corpus_dir.exists():
        print(f"[Ingest] Corpus dir not found: {corpus_dir}")
        return []

    pdf_docs = []
    pdf_files = list(corpus_dir.glob("*.pdf"))
    print(f"[Ingest] Found {len(pdf_files)} PDF files in data/corpus/.")

    for pdf_path in pdf_files:
        meta = PDF_METADATA.get(pdf_path.name, {
            "doc_id": f"DOC-{pdf_path.stem[:12].upper()}",
            "title": pdf_path.stem.replace("_", " ").title(),
            "department": "GEN",
            "document_type": "gazette",
            "official_portal_ref": "https://mohua.gov.in",
        })

        print(f"[Ingest] Reading PDF: '{pdf_path.name}'...")
        try:
            reader = pypdf.PdfReader(str(pdf_path))
            total_pages = len(reader.pages)
            extracted_chunks = 0

            # Cap massive multi-hundred page reference manuals to first 50 core pages for speed & balance
            max_pages = 50 if total_pages > 80 else total_pages

            for page_num in range(1, max_pages + 1):
                try:
                    page = reader.pages[page_num - 1]
                    raw_text = page.extract_text() or ""
                    cleaned = clean_text(raw_text)

                    if len(cleaned) < 60:
                        continue

                    # Chunk page text
                    page_chunks = chunk_text(cleaned, max_chars=800, overlap=100)
                    for c_idx, chunk in enumerate(page_chunks, start=1):
                        if len(chunk) < 50:
                            continue
                        chunk_id = f"{meta['doc_id']}-P{page_num}-{c_idx}"
                        pdf_docs.append({
                            "doc_id": chunk_id,
                            "title": f"{meta['title']} (Page {page_num})",
                            "department": meta["department"],
                            "document_type": meta["document_type"],
                            "ward_scope": "all",
                            "section_ref": f"Page {page_num}",
                            "text": chunk,
                            "source_path": str(pdf_path.as_posix()),
                            "source_url": f"/api/v1/documents/{pdf_path.name}/download",
                            "official_portal_ref": meta["official_portal_ref"],
                            "scope": "public",
                        })
                        extracted_chunks += 1
                except Exception as page_err:
                    print(f"  [Warning] Failed to extract page {page_num} of {pdf_path.name}: {page_err}")

            print(f"  Extracted {extracted_chunks} chunks from '{pdf_path.name}' (pages indexed: {max_pages}/{total_pages}).")

        except Exception as e:
            print(f"[Ingest] Error opening {pdf_path.name}: {e}")

    return pdf_docs


def load_markdown_documents() -> List[Dict[str, Any]]:
    """Loads municipal markdown bylaws and charters from data/corpus."""
    corpus_dir = Path("data/corpus")
    docs = []
    for md_file in corpus_dir.glob("*.md"):
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()

            sections = content.split("## ")
            title = sections[0].strip("# \n")
            doc_id = f"MNC-{md_file.stem.upper()[:14]}"
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
                        "source_url": f"/api/v1/documents/{md_file.name}/download",
                        "official_portal_ref": "https://mohua.gov.in",
                        "scope": "public",
                    })
        except Exception as e:
            print(f"[Ingest] Error reading markdown {md_file.name}: {e}")

    return docs


def load_seed_json() -> List[Dict[str, Any]]:
    """Loads baseline municipal knowledge seed points."""
    seed_json = Path("data/seed_municipal_knowledge.json")
    if not seed_json.exists():
        return []
    with open(seed_json, "r", encoding="utf-8") as f:
        items = json.load(f)
        for item in items:
            item["scope"] = "public"
            item["source_url"] = f"/api/v1/documents/{item.get('doc_id')}/download"
        return items


def main():
    print("=" * 60)
    print("[START] Ingesting Municipal Knowledge into Qdrant Cloud...")
    print(f"Target Collection: {settings.QDRANT_COLLECTION}")
    print(f"Qdrant Endpoint: {settings.QDRANT_URL}")
    print("=" * 60)

    # 1. Initialize and ensure hybrid collection exists
    hybrid_retriever.ensure_collection()
    client = hybrid_retriever.get_client()

    # 2. Gather all documents
    pdf_docs = load_pdf_documents()
    md_docs = load_markdown_documents()
    seed_docs = load_seed_json()

    all_docs = seed_docs + md_docs + pdf_docs
    total_docs = len(all_docs)
    print(f"\n[Ingest] Gathered {total_docs} total chunks:")
    print(f"  - Seed JSON items: {len(seed_docs)}")
    print(f"  - Markdown bylaw chunks: {len(md_docs)}")
    print(f"  - Official Govt. PDF chunks: {len(pdf_docs)}")

    if total_docs == 0:
        print("[Ingest] No documents found to ingest!")
        return

    # 3. Generate Embeddings & Upsert in Batches
    dense_model, sparse_model = ModelPrewarmer.get_models()
    batch_size = 64
    total_uploaded = 0

    print(f"\n[Ingest] Beginning batch embedding and upsert (Batch Size: {batch_size})...")

    for i in range(0, total_docs, batch_size):
        batch = all_docs[i : i + batch_size]
        texts = [d["text"] for d in batch]

        # Embed batch
        dense_embs = list(dense_model.embed(texts))
        sparse_embs = list(sparse_model.embed(texts))

        points = []
        for j, doc in enumerate(batch):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{doc['doc_id']}-{i+j}"))
            dense_vec = dense_embs[j].tolist()
            sparse_obj = sparse_embs[j]

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

        client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=points,
            wait=True,
        )
        total_uploaded += len(points)
        print(f"  [Progress] Upserted batch {i // batch_size + 1} ({total_uploaded}/{total_docs} points)...")

    # 4. Verification Check
    col_info = client.get_collection(settings.QDRANT_COLLECTION)
    print("\n" + "=" * 60)
    print(f"[SUCCESS] Ingestion completed successfully!")
    print(f"Collection: {settings.QDRANT_COLLECTION}")
    print(f"Total points in collection: {col_info.points_count}")
    print("=" * 60)


if __name__ == "__main__":
    main()
