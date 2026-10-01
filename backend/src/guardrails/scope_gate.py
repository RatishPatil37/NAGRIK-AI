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

COMPILED_OOS_REGEX = re.compile("|".join(OUT_OF_SCOPE_PATTERNS), re.IGNORECASE)


def check_scope_gate(query: str) -> Optional[Dict]:
    """Checks if query is clearly outside municipal scope.
    Returns polite municipal guidance payload if out of scope, else None.
    """
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
