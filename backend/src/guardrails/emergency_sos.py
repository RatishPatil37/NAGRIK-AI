"""Emergency SOS Gate (<5ms, Zero-LLM).
Immediately detects life-safety threats, fires, gas leaks, collapses, and crimes,
returning statutory emergency dispatch helplines without burning vector or LLM compute.
"""

import re
from typing import Dict, Optional

# Compiled regex patterns for critical emergency detection
EMERGENCY_PATTERNS = [
    r"\b(fire|aag|cylinder blast|gas leak|cylinder phat gaya)\b",
    r"\b(building\s+collaps\w*|pillar\s+crack\w*|wall\s+collaps\w*|chhat\s+gir\w*|gir\s+gayi)\b",
    r"\b(suicide|kill myself|marne ja raha|depression emergency)\b",
    r"\b(severe crime|murder|robbery|loot|chori|dacoity|assault|rape|violence)\b",
    r"\b(cardiac arrest|heart attack|unconscious|heavy bleeding|ambulance|behoshi)\b",
    r"\b(electric shock|live\s+(electrical\s+)?wire|sparking\s+(electric\s+)?pole|sparking|current lag gaya)\b",
    r"\b(flood|drowning|paani me doob|landslide|earthquake)\b",
]

COMPILED_EMERGENCY_REGEX = re.compile("|".join(EMERGENCY_PATTERNS), re.IGNORECASE)

EMERGENCY_CONTACTS = [
    {"service": "National Emergency All-in-One", "number": "112", "action": "General Emergency Dispatch"},
    {"service": "Fire Brigade & Rescue", "number": "101", "action": "Immediate Fire & Collapse Redressal"},
    {"service": "Medical Emergency & Ambulance", "number": "108", "action": "Critical Life Support Transport"},
    {"service": "Police Command Room", "number": "100", "action": "Law Enforcement & Security Intervention"},
    {"service": "Municipal Disaster Management Cell", "number": "1077", "action": "Civic Flood, Collapse & Tree Fall Control"},
    {"service": "Women & Domestic Helpline", "number": "1091", "action": "Immediate Protection & Assistance"},
]


def check_emergency_sos(query: str) -> Optional[Dict]:
    """Evaluates query for emergency markers in <5ms.
    Returns emergency dispatch payload if triggered, else None.
    """
    if COMPILED_EMERGENCY_REGEX.search(query):
        return {
            "is_emergency": True,
            "banner_type": "CRITICAL_SOS",
            "title": "🚨 Statutory Municipal & National Emergency Alert",
            "message": (
                "Your inquiry describes an urgent life-safety or disaster emergency. "
                "Do NOT wait for municipal chat redressal. Please dial the emergency numbers below immediately:"
            ),
            "contacts": EMERGENCY_CONTACTS,
            "sources": [],
        }
    return None
