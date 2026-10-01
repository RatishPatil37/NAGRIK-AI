# ADR-0003: Autonomous Department Escalation Engine and SLA Hash Generation

## Status
Accepted

## Date
2026-10-01

## Context & Problem Statement
Citizen inquiries often reveal actionable complaints (e.g., "Water pipe burst on 5th cross road", "Garbage hasn't been picked up for 4 days"). An AI chatbot that merely explains the law without taking action frustrates citizens. The system must autonomously triage the complaint to the right municipal department and generate a formal, verifiable ticket.

## Decision
Implement an autonomous department escalation engine:
- Department taxonomy: `WTR` (Water), `SAN` (Sanitation), `REV` (Revenue/Tax), `ENG` (Roads), `TNP` (Town Planning), `ELE` (Electrical).
- SLA deadlines computed automatically based on priority (Emergency: 4h, High: 24h, Medium: 48h, Standard: 7d).
- Unique tracking hash: `MNC-{YEAR}-W{WARD}-{DEPT_CODE}-{HASH}`.
- Persisted to Supabase PostgreSQL `grievances` table with RLS.

## Alternatives Considered
1. **Redirecting citizens to external phone numbers**: High citizen drop-off, zero administrative accountability.
2. **Single generic ticket queue**: Overwhelms central desk and delays departmental action.

## Consequences & Trade-offs
- **Positive**: Seamless transition from AI answer to formal government ticket; administrative accountability.
- **Negative**: Requires ward and department officer email/SMS dispatch configurations.

## Compliance & Verification
Verified via automated tests in `backend/tests/test_escalation.py`.
