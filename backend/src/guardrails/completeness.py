"""Parameter Completeness & Clarification Gate.
Detects operational requests lacking critical parameters (e.g., Ward ID, Consumer No)
and returns an interactive clarification questionnaire before expensive generation.
"""

import re
from typing import Dict, Optional

# Patterns requiring specific ward context
LOCALIZED_ACTION_PATTERNS = [
    r"\b(report water leakage|pipe burst|pani ka pipe|leakage report)\b",
    r"\b(garbage not picked up|kachra nahi uthaya|bin overflow|dead animal)\b",
    r"\b(pothole on road|road damage|open manhole|sadak kharab)\b",
    r"\b(streetlight not working|dark road|light kharab|pole sparking)\b",
]

COMPILED_LOCALIZED_REGEX = re.compile("|".join(LOCALIZED_ACTION_PATTERNS), re.IGNORECASE)


def check_completeness_gate(query: str, current_ward_id: Optional[int] = None) -> Optional[Dict]:
    """Checks whether an operational grievance or service action lacks a Ward parameter."""
    # If the user has already selected a ward in their session HUD, it's complete
    if current_ward_id is not None:
        return None

    # Check if query mentions a specific ward number directly (e.g., "Ward 4", "Ward 02", "Bandra")
    if re.search(r"\b(ward\s*\d+|ward\s*no\b|zone\s*[a-e])", query, re.IGNORECASE):
        return None

    # Check if the query is an operational complaint requiring ward location
    if COMPILED_LOCALIZED_REGEX.search(query):
        return {
            "needs_clarification": True,
            "parameter": "ward_id",
            "prompt": "To register this grievance with the correct Ward Engineering Team, please select your Municipal Ward:",
            "options": [
                {"label": "Ward 01: Colaba & Fort (Zone A)", "value": 1},
                {"label": "Ward 02: Malabar Hill & Tardeo (Zone A)", "value": 2},
                {"label": "Ward 03: Byculla & Mazgaon (Zone B)", "value": 3},
                {"label": "Ward 04: Bandra West & Khar (Zone B)", "value": 4},
                {"label": "Ward 05: Dadar & Matunga (Zone B)", "value": 5},
                {"label": "Ward 06: Andheri East & Marol (Zone C)", "value": 6},
                {"label": "Ward 07: Andheri West & Juhu (Zone C)", "value": 7},
                {"label": "Ward 08: Kurla & Sakinaka (Zone D)", "value": 8},
                {"label": "Ward 09: Borivali West & Gorai (Zone D)", "value": 9},
                {"label": "Ward 10: Ghatkopar & Vikhroli (Zone E)", "value": 10},
            ],
            "sources": [],
        }

    return None
