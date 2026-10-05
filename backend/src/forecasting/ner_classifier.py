"""Civic Location, Department & Urgency Named Entity Recognition (NER) Classifier.
Extracts ward references, civic landmarks, geographic entities, and departments
from citizen queries without heavy Spacy or external NLP overhead.
"""

import re
from typing import Dict, List, Optional
from pydantic import BaseModel


class CivicEntityResult(BaseModel):
    location: Optional[str] = None
    ward_id: Optional[int] = None
    landmark: Optional[str] = None
    department: str = "GEN"
    department_name: str = "General Administration"
    urgency: str = "standard"
    confidence: float = 0.5
    actionable_intent: bool = False


# Ward extraction pattern (e.g. Ward 4, Prabhag 12, Ward-3)
WARD_REGEX = re.compile(r"\b(?:ward|prabhag|zone)\s*[-#:]?\s*(\d+)\b", re.IGNORECASE)

# Prominent Indian civic landmark patterns
LANDMARK_REGEX = re.compile(
    r"\b(near\s+[\w\s]+(?:hospital|school|college|railway station|metro|bus stand|chowk|circle|temple|masjid|market|bazaar|garden|flyover|bridge|junction))\b",
    re.IGNORECASE,
)

# Geographic street/locality patterns (e.g., MG Road, Shivaji Nagar, Sector 15)
LOCATION_REGEX = re.compile(
    r"\b([A-Z][a-zA-Z\s]+(?:Road|Marg|Nagar|Colony|Street|Chowk|Sector\s*\d+|Block\s*[A-Z]|Pura|Ganj))\b"
)

# Department indicator rules
DEPARTMENT_RULES = [
    ("WTR", "Water Supply & Sewerage", [r"\b(water|pipe|leak|drain|sewer|ganda pani|meter|tap|pipeline)\b"], 0.9),
    ("SAN", "Solid Waste Management", [r"\b(garbage|kachra|waste|dustbin|dump|dead animal|sweep|cleanliness)\b"], 0.9),
    ("ENG", "Roads & Civil Works", [r"\b(pothole|road|footpath|manhole|cave in|gaddha|culvert|bridge)\b"], 0.9),
    ("ELE", "Electrical & Streetlights", [r"\b(streetlight|light|electric|pole|wire|spark|current|feeder)\b"], 0.95),
    ("REV", "Revenue & Property Tax", [r"\b(property tax|house tax|rebate|assessment|tax bill|receipt)\b"], 0.92),
    ("TNP", "Town Planning & Building", [r"\b(building plan|encroachment|unauthorized|construction|obpas|permit)\b"], 0.88),
    ("HMN", "Vital Statistics & Health", [r"\b(birth certificate|death certificate|hospital|vaccine|epidemic)\b"], 0.92),
]


def extract_civic_entities(text: str, default_ward_id: Optional[int] = None) -> CivicEntityResult:
    """Parses civic query and returns extracted location, ward, department, and urgency."""
    clean_text = text.strip()

    # 1. Ward Extraction
    ward_id = default_ward_id
    ward_match = WARD_REGEX.search(clean_text)
    if ward_match:
        try:
            ward_id = int(ward_match.group(1))
        except ValueError:
            pass

    # 2. Landmark & Location Extraction
    landmark = None
    landmark_match = LANDMARK_REGEX.search(clean_text)
    if landmark_match:
        landmark = landmark_match.group(1).strip()

    location = landmark
    if not location:
        loc_match = LOCATION_REGEX.search(clean_text)
        if loc_match:
            location = loc_match.group(1).strip()

    # 3. Department Classification
    best_dept = "GEN"
    best_dept_name = "General Administration"
    best_conf = 0.5
    for dept_code, dept_name, patterns, conf in DEPARTMENT_RULES:
        for p in patterns:
            if re.search(p, clean_text, re.IGNORECASE):
                best_dept = dept_code
                best_dept_name = dept_name
                best_conf = conf
                break
        if best_dept != "GEN":
            break

    # 4. Urgency Detection
    urgency = "standard"
    if re.search(r"\b(emergency|urgent|danger|sparking|collapsed|burst|severe|immediately|dead animal)\b", clean_text, re.IGNORECASE):
        urgency = "emergency"
    elif re.search(r"\b(overflow|broken|blocked|cave in|leak)\b", clean_text, re.IGNORECASE):
        urgency = "high"

    # Actionable intent if it mentions a location or problem
    is_actionable = bool(location or ward_match or urgency in ["emergency", "high"])

    return CivicEntityResult(
        location=location,
        ward_id=ward_id,
        landmark=landmark,
        department=best_dept,
        department_name=best_dept_name,
        urgency=urgency,
        confidence=best_conf,
        actionable_intent=is_actionable,
    )
