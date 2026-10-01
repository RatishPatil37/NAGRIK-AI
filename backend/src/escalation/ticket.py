"""Standardized Municipal Ticket ID generation and verification."""

import hashlib
from datetime import datetime, timezone


def generate_ticket_id(ward_id: int, dept_code: str, citizen_identifier: str = "anon") -> str:
    """Generates standardized municipal ticket hash:
    MNC-{YEAR}-W{WARD:02d}-{DEPT_CODE}-{SHA256(identifier + timestamp)[:4].upper()}
    Example: MNC-2026-W04-WTR-8942
    """
    now = datetime.now(timezone.utc)
    raw = f"{citizen_identifier}-{now.isoformat()}-{ward_id}-{dept_code}"
    salt_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:4].upper()
    return f"MNC-{now.year}-W{ward_id:02d}-{dept_code.upper()}-{salt_hash}"
