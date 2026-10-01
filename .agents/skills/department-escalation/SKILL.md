---
name: department-escalation
description: >-
  Defines the municipal grievance categorization, departmental routing,
  SLA calculation, and standardized ticket generation engine for civic issues.
---

# Department Escalation Skill

## Overview
Autonomous routing and dispatch system that converts unresolved citizen inquiries and formal grievances into tracked municipal tickets with strict SLA deadlines.

## Department Taxonomy & SLAs

| Department | Code | Scope | Emergency SLA | Standard SLA |
| :--- | :--- | :--- | :--- | :--- |
| Water Supply | `WTR` | Pipeline burst, contamination, no water, billing | 4 Hours | 24 Hours |
| Solid Waste / Sanitation | `SAN` | Open dumping, overflowing bins, dead animals | 6 Hours | 24 Hours |
| Property Tax / Revenue | `REV` | Assessment disputes, payment receipts, rebates | 24 Hours | 7 Days |
| Roads & Engineering | `ENG` | Potholes, road cave-ins, open manholes | 4 Hours | 48 Hours |
| Town Planning | `TNP` | Encroachments, illegal structures, tree falls | 12 Hours | 7 Days |
| Electrical | `ELE` | Streetlight outages, sparking wires, dark spots | 2 Hours | 24 Hours |

## Ticket Generation Implementation
```python
import hashlib
from datetime import datetime, timedelta

def generate_ticket(citizen_id: str, ward_id: int, dept_code: str, priority: str) -> dict:
    now = datetime.utcnow()
    sla_hours = {
        "emergency": 4,
        "high": 24,
        "medium": 48,
        "standard": 168
    }.get(priority, 48)
    
    sla_deadline = now + timedelta(hours=sla_hours)
    raw_hash = hashlib.sha256(f"{citizen_id}-{now.isoformat()}".encode()).hexdigest()[:4].upper()
    ticket_id = f"MNC-{now.year}-W{ward_id:02d}-{dept_code}-{raw_hash}"
    
    return {
        "ticket_id": ticket_id,
        "ward_id": ward_id,
        "dept_code": dept_code,
        "priority": priority,
        "sla_deadline": sla_deadline.isoformat(),
        "status": "submitted"
    }
```

## Workflow
1. Detect grievance intent via LLM function calling or keyword pattern matcher.
2. Verify that `ward_id` and specific issue category are identified (trigger clarification if missing).
3. Generate ticket hash and commit to Supabase `grievances` table.
4. Stream ticket confirmation card to citizen with printable receipt option.
5. Notify Admin Dashboard and dispatch async SMS/Email to Ward Officer.
