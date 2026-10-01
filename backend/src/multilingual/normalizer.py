"""Multilingual query normalizer and transliteration helper.
Maps colloquial Hinglish, Marathi, and Tamil phrasing to official municipal gazette terminology
to boost sparse lexical (BM25) and dense vector recall.
"""

import re
from typing import Dict

MUNICIPAL_TERM_MAPPING = {
    r"\bpani\b|\bpaani\b|\bjal\b|\bthanneer\b": "water supply",
    r"\bkachra\b|\bkooda\b|\bkachara\b|\bswachhata\b": "solid waste sanitation",
    r"\bgaddha\b|\bgaddhe\b|\bsadak\b|\bkhadda\b": "pothole road repair",
    r"\bkar\b|\btax barna\b|\bpatta\b|\bmakan tax\b": "property tax assessment",
    r"\bbatti\b|\blight band\b|\bandhera\b": "streetlight outage",
    r"\bmakaan permission\b|\bplot pass\b|\bnaksha pass\b": "building plan approval OBPAS",
    r"\bchhat\b|\bdeewar\b|\bimarat\b": "building structure",
}


def normalize_query_for_retrieval(query: str) -> str:
    """Augments colloquial or regional phrasing with official statutory keywords."""
    augmented = query
    for pattern, statutory_terms in MUNICIPAL_TERM_MAPPING.items():
        if re.search(pattern, query, re.IGNORECASE):
            augmented += f" {statutory_terms}"
    return augmented.strip()
