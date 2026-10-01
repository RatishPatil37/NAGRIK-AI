"""Automated Unit Tests for RAG Hybrid Retrieval and Citation Pruning."""

from backend.src.retriever.pruner import filter_cited_evidence


def test_post_stream_citation_pruning():
    """Validates that filter_cited_evidence strictly discards uncited retrieval items."""
    candidates = [
        {"index": 1, "title": "Property Tax Bylaws", "doc_id": "DOC-1"},
        {"index": 2, "title": "Water Tariff Rules", "doc_id": "DOC-2"},
        {"index": 3, "title": "Sanitation Guidelines", "doc_id": "DOC-3"},
        {"index": 4, "title": "OBPAS Building Rules", "doc_id": "DOC-4"},
    ]

    # Case 1: Generated text cites only [S2] and [S4]
    response_text = "According to [S2], domestic water rates are subsidized, and under [S4], setbacks must be 3 meters."
    pruned = filter_cited_evidence(response_text, candidates)

    assert len(pruned) == 2
    assert [c["index"] for c in pruned] == [2, 4]
    assert "DOC-1" not in [c["doc_id"] for c in pruned]
    assert "DOC-3" not in [c["doc_id"] for c in pruned]

    # Case 2: Generated text contains no citations
    no_cite_text = "This is a general response without citations."
    assert filter_cited_evidence(no_cite_text, candidates) == []
