"""Grievance triage engine for categorizing municipal issues and auto-dispatching tickets."""

import re
from typing import Dict, Optional, Tuple
from backend.src.database.models import Grievance
from backend.src.escalation.sla import calculate_sla
from backend.src.escalation.ticket import generate_ticket_id

# Keyword mappings to department and category
GRIEVANCE_KEYWORDS = [
    # Water Supply
    (r"\b(pipe burst|pipeline burst|water contamination|ganda pani|no water supply|sewage overflow|sewer leak|nal me pani nahi)\b", "WTR", "Pipeline Burst & Contamination", "emergency"),
    (r"\b(water meter fault|low water pressure|meter kharab|water bill wrong)\b", "WTR", "Water Metering & Supply", "medium"),

    # Solid Waste
    (r"\b(dead animal|animal carcass|rotting animal)\b", "SAN", "Dead Animal Removal", "emergency"),
    (r"\b(garbage dumping|kachra overflow|dustbin full|open dumping|kachra nahi uthaya|bin overflow)\b", "SAN", "Garbage & Sanitation", "high"),

    # Roads & Civil
    (r"\b(road cave in|open manhole|deep pothole|gutter khula|gaddha|culvert broken)\b", "ENG", "Open Manhole & Road Cave-in", "emergency"),
    (r"\b(potholes|broken footpath|damaged road|road resurfacing)\b", "ENG", "Roads & Footpaths", "high"),

    # Electrical
    (r"\b(live wire fallen|sparking electric pole|wire broken|exposed cable|current shock)\b", "ELE", "Hazardous Live Wire", "emergency"),
    (r"\b(streetlight not working|dark spot|street light off|light kharab)\b", "ELE", "Streetlight Outage", "standard"),

    # Property Tax / Revenue
    (r"\b(double tax assessment|receipt not generated|tax payment dispute|tax slab wrong|name change in tax)\b", "REV", "Property Tax Dispute", "standard"),

    # Town Planning
    (r"\b(illegal construction|footpath encroachment|unauthorized building|tree fallen|ped gir gaya)\b", "TNP", "Encroachment & Tree Fall", "high"),
]


def triage_grievance(query: str, ward_id: int = 1, citizen_id: str = "anon") -> Optional[Grievance]:
    """Inspects query text for grievance intent. If an issue is identified,
    returns a formal Grievance object with computed SLA and unique ticket ID.
    """
    for pattern, dept_code, category, priority in GRIEVANCE_KEYWORDS:
        if re.search(pattern, query, re.IGNORECASE):
            sla_hours, deadline = calculate_sla(dept_code, priority)
            ticket_id = generate_ticket_id(ward_id=ward_id, dept_code=dept_code, citizen_identifier=citizen_id)

            return Grievance(
                ticket_id=ticket_id,
                ward_id=ward_id,
                dept_code=dept_code,
                category=category,
                priority=priority,
                sla_deadline=deadline,
                status="submitted",
                resolution_notes=f"Auto-escalated by Nagrik AI triage engine. Statutory SLA: {sla_hours} hours.",
            )

    return None
