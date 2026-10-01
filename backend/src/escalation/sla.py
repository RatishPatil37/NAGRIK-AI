"""Departmental SLA calculation and mapping matrix."""

from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple

# Mapping of Department Codes to SLA hours by priority
DEPARTMENT_SLA_HOURS: Dict[str, Dict[str, int]] = {
    "WTR": {"emergency": 4, "high": 12, "medium": 24, "standard": 24},
    "SAN": {"emergency": 6, "high": 12, "medium": 24, "standard": 24},
    "REV": {"emergency": 24, "high": 48, "medium": 72, "standard": 168},
    "ENG": {"emergency": 4, "high": 24, "medium": 48, "standard": 48},
    "TNP": {"emergency": 12, "high": 48, "medium": 72, "standard": 168},
    "ELE": {"emergency": 2, "high": 8, "medium": 12, "standard": 24},
}

DEFAULT_SLA = {"emergency": 4, "high": 24, "medium": 48, "standard": 48}


def calculate_sla(dept_code: str, priority: str = "standard") -> Tuple[int, datetime]:
    """Calculates SLA duration in hours and computes the target UTC deadline."""
    dept_map = DEPARTMENT_SLA_HOURS.get(dept_code.upper(), DEFAULT_SLA)
    sla_hours = dept_map.get(priority.lower(), 48)
    
    now = datetime.now(timezone.utc)
    deadline = now + timedelta(hours=sla_hours)
    return sla_hours, deadline
