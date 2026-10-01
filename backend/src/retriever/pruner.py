"""Post-stream citation pruning auditor.
Ensures the Evidence Rail displays strictly and exclusively official municipal documents
that were cited as [S1], [S2] in the LLM response text.
"""

import re
from typing import Any, Dict, List


def filter_cited_evidence(full_text: str, retrieved_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extracts all [S1], [S2], etc. citation markers from generated text and returns

    only the corresponding chunks from retrieved_chunks. If no citation markers
    are found, returns an empty list.
    """
    cited_numbers = set(re.findall(r"\[S(\d+)\]", full_text))
    if not cited_numbers:
        return []

    pruned = []
    for chunk in retrieved_chunks:
        # Check both 1-based index and chunk_id mapping
        idx = str(chunk.get("index", ""))
        chunk_id = str(chunk.get("chunk_id", ""))
        if idx in cited_numbers or chunk_id in cited_numbers:
            pruned.append(chunk)

    return pruned
