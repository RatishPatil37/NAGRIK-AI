"""Municipal Scope Gate (<3ms, Zero-LLM).
Filters out non-civic questions (coding, celebrity trivia, gaming, political propaganda)
and provides polite redirection to municipal services.
"""

import re
from typing import Dict, Optional

# Out-of-scope patterns
OUT_OF_SCOPE_PATTERNS = [
    r"\b(write python code|javascript function|debug my code|c\+\+ program|html css|binary tree)\b",
    r"\b(who won the match|cricket score|cricket match|ipl score|ipl|football world cup|messi vs ronaldo)\b",
    r"\b(bollywood gossip|bollywood|movie review|box office collection|celebrity dating|hero heroine)\b",
    r"\b(play game|minecraft|fortnite|pubg|free fire|gta 6)\b",
    r"\b(who is better bjp or congress|political campaign|vote for party|modi vs rahul|political party)\b",
    r"\b(solve 2\+2|calculus derivative|quantum physics|write a poem about love)\b",
]

# Adversarial prompt injection & jailbreak patterns
JAILBREAK_PATTERNS = [
    r"(ignore\s+(all\s+)?(previous|prior|above)\s+instructions)",
    r"(disregard\s+(all\s+)?(previous|prior|above)\s+instructions)",
    r"(forget\s+(all\s+)?(previous|prior|above)\s+instructions)",
    r"(print|reveal|output|display|show)\s+(your\s+)?(system\s+prompt|initial\s+instructions|system\s+instructions)",
    r"(you\s+are\s+now\s+(in\s+)?(dan|jailbreak|developer|unrestricted)\s+mode)",
    r"(do\s+anything\s+now|bypass\s+safety\s+filters|simulate\s+a\s+(bash|linux)\s+terminal)",
]

COMPILED_OOS_REGEX = re.compile("|".join(OUT_OF_SCOPE_PATTERNS), re.IGNORECASE)
COMPILED_JAILBREAK_REGEX = re.compile("|".join(JAILBREAK_PATTERNS), re.IGNORECASE)


def check_scope_gate(query: str) -> Optional[Dict]:
    """Checks if query is adversarial jailbreak or clearly outside municipal scope.
    Returns polite municipal guidance payload if out of scope, else None.
    """
    if COMPILED_JAILBREAK_REGEX.search(query):
        return {
            "in_scope": False,
            "title": "Municipal Security Guard",
            "message": (
                "Namaste! **Nagrik AI** operates exclusively as an authoritative municipal knowledge assistant. "
                "System instructions, model directives, and operational security boundaries cannot be altered or disclosed. "
                "How may I assist you with official municipal bylaws, tax payments, or civic grievances?"
            ),
            "sources": [],
        }

    if COMPILED_OOS_REGEX.search(query):
        return {
            "in_scope": False,
            "title": "Municipal Scope Guidance",
            "message": (
                "Namaste! I am **Nagrik AI**, dedicated exclusively to official municipal services, "
                "citizen bylaws, property taxes, water tariffs, building permits, sanitation, and civic grievances. "
                "I am unable to answer general programming, sports, entertainment, or political questions.\n\n"
                "How may I assist you with your municipal corporation queries today?"
            ),
            "sources": [],
        }
    return None
