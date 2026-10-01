"""Conversational Intent Gate (<2ms, Zero-LLM).
Handles greetings, pleasantries, identity queries, and gratitude instantly with sources: [].
"""

import re
from typing import Dict, Optional

GREETING_PATTERNS = [
    r"^(hi|hello|hey|namaste|namaskar|pranam|vanakkam|adaab|sas|sat sri akaal)[\s!.]*$",
    r"^(good morning|good afternoon|good evening|shubh prabhat|shubh sandhya)[\s!.]*$",
    r"^(who are you|what is nagrik ai|aap kaun ho|tum kaun ho|who made you)[\s?.]*$",
    r"^(thanks|thank you|dhanyawad|shukriya|bahut dhanyavad|thx)\b.*$",
    r"^(bye|goodbye|alvida|phir milenge)[\s!.]*$",
]

COMPILED_GREETING_REGEX = re.compile("|".join(GREETING_PATTERNS), re.IGNORECASE)


def check_intent_gate(query: str) -> Optional[Dict]:
    """Detects small-talk / greeting / gratitude queries in <2ms.
    Returns immediate conversational response with sources: [] if matched, else None.
    """
    clean_q = query.strip()
    if COMPILED_GREETING_REGEX.match(clean_q):
        lower = clean_q.lower()

        if any(w in lower for w in ["who are you", "what is nagrik ai", "aap kaun", "tum kaun"]):
            message = (
                "Namaste! I am **Nagrik AI (नागरिक AI)**, your official AI-driven Municipal Knowledge "
                "& Civic Concierge. I assist citizens with property tax assessments, water supply tariffs, "
                "building plan approvals, trade licenses, and formal grievance registration with trackable SLA tickets.\n\n"
                "How can I help your municipal ward today?"
            )
        elif any(w in lower for w in ["thank", "dhanyawad", "shukriya"]):
            message = (
                "You are very welcome! It is our duty to ensure transparent, responsive civic governance. "
                "Feel free to ask any other questions or track your service requests anytime."
            )
        elif any(w in lower for w in ["bye", "alvida", "goodbye"]):
            message = "Goodbye! Wishing you a great day ahead. Always here for your civic services."
        else:
            message = (
                "Namaste! Welcome to **Nagrik AI**. How can I assist you with municipal bylaws, "
                "property taxes, water tariffs, or civic grievance registration today?"
            )

        return {
            "is_greeting": True,
            "message": message,
            "sources": [],
        }

    return None
