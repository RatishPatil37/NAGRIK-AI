"""Fast, high-fidelity Reranker stage for Nagrik AI RAG pipeline.
Takes candidate evidence chunks from Hybrid RRF and re-scores them
based on cross-attention lexical matching, statutory section prominence,
and query intent alignment.
"""

import re
from typing import Any, Dict, List


class CivicReranker:
    """Reranks candidate evidence chunks to optimize position for context-window attention."""

    @staticmethod
    def _compute_relevance_score(query: str, chunk: Dict[str, Any], initial_rrf_score: float) -> float:
        """Computes a multi-factor relevance score."""
        text = chunk.get("text", "").lower()
        title = chunk.get("title", "").lower()
        section = chunk.get("section_ref", "").lower()
        query_lower = query.lower()

        # Tokenize query into meaningful keywords (excluding common stopwords)
        stopwords = {
            "what", "is", "the", "are", "for", "in", "and", "of", "to", "a", "an",
            "how", "can", "i", "do", "does", "by", "on", "at", "from", "with",
            "about", "please", "tell", "me", "any", "this", "that"
        }
        tokens = [t for t in re.findall(r"\w+", query_lower) if len(t) > 2 and t not in stopwords]

        if not tokens:
            return initial_rrf_score

        # Factor 1: Query token match in text
        token_matches = sum(1 for t in tokens if t in text)
        token_ratio = token_matches / len(tokens)

        # Factor 2: Query token match in title or section (structural weight)
        title_matches = sum(1 for t in tokens if t in title or t in section)
        title_boost = 0.3 * (title_matches / len(tokens))

        # Factor 3: Exact phrase match bonus
        phrase_boost = 0.0
        # Check for 2-word n-grams
        words = query_lower.split()
        for i in range(len(words) - 1):
            ngram = f"{words[i]} {words[i+1]}"
            if len(ngram) > 6 and ngram in text:
                phrase_boost += 0.15

        # Factor 4: Numeric / Statutory token match (e.g. "15", "10%", "3.0", "500", "sla", "rebate", "obpas")
        statutory_tokens = {"sla", "obpas", "rebate", "penalty", "fine", "tariff", "meter", "bylaw", "rule", "section"}
        statutory_boost = 0.0
        for st in statutory_tokens:
            if st in query_lower and (st in text or st in section or st in title):
                statutory_boost += 0.1

        # Combine with initial RRF score
        final_score = (initial_rrf_score * 0.4) + (token_ratio * 0.3) + title_boost + phrase_boost + statutory_boost
        return round(final_score, 4)

    def rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """Reranks candidate evidence chunks and returns the top_k most pertinent chunks."""
        if not candidates:
            return []

        scored = []
        for chunk in candidates:
            initial_score = chunk.get("score", 0.0)
            rerank_score = self._compute_relevance_score(query, chunk, initial_score)
            chunk_copy = dict(chunk)
            chunk_copy["rerank_score"] = rerank_score
            scored.append(chunk_copy)

        # Sort descending by rerank_score
        scored.sort(key=lambda x: x["rerank_score"], reverse=True)

        # Re-assign 1-based indices for LLM citation referencing ([S1], [S2]...)
        top_candidates = scored[:top_k]
        for i, c in enumerate(top_candidates, start=1):
            c["index"] = i

        return top_candidates


civic_reranker = CivicReranker()
