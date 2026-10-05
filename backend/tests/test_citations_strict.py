"""Tests for strict citation pruning rules."""

from backend.src.retriever.pruner import filter_cited_evidence


def test_zero_citation_pruning():
    """Verifies that an LLM response containing ZERO [Sx] citation markers

    strictly yields an empty list (no dummy fallback).
    """
    sample_retrieved = [
        {"index": 1, "doc_id": "MNC-REV-001", "title": "Tax Rules", "text": "Pay by June 30."},
        {"index": 2, "doc_id": "MNC-WTR-002", "title": "Water Norms", "text": "135 lpcd norm."},
    ]

    llm_response = "I cannot find specific rules regarding pet registration fees."
    cited = filter_cited_evidence(llm_response, sample_retrieved)
    assert cited == [], "Expected empty citations list when no [Sx] marker is present."


def test_selective_citation_pruning():
    """Verifies that only explicitly cited markers [S2] are returned, discarding un-cited [S1]."""
    sample_retrieved = [
        {"index": 1, "doc_id": "MNC-REV-001", "title": "Tax Rules", "text": "Pay by June 30."},
        {"index": 2, "doc_id": "MNC-WTR-002", "title": "Water Norms", "text": "135 lpcd norm."},
    ]

    llm_response = "According to official municipal standards, domestic water supply is 135 lpcd [S2]."
    cited = filter_cited_evidence(llm_response, sample_retrieved)
    assert len(cited) == 1
    assert cited[0]["index"] == 2
    assert cited[0]["doc_id"] == "MNC-WTR-002"
