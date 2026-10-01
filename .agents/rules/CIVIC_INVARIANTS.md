# 🛡️ Civic & Operational Invariants

Whenever writing, modifying, or testing code in Nagrik AI, you MUST enforce the following invariants without exception:

1. **Immediate Emergency Triage (<5ms)**:
   - Queries referencing fire, building collapse, hazardous gas leak, severe crime, or life-threatening medical emergencies must trigger immediate SOS cards.
   - Return official emergency numbers (Fire: 101, Police: 100, Ambulance: 108, Disaster: 1077).
   - NEVER query vector databases or wait for LLMs on emergency queries.

2. **Strict Citation Truth & Post-Stream Pruning**:
   - Every factual claim regarding municipal regulations, tax rates, or service fees MUST cite an official indexed document chunk `[S1]`, `[S2]`.
   - Run `filter_cited_evidence()`: post-stream audit removes all uncited retrieval candidates. The Evidence Rail must only show documents that were explicitly cited.

3. **Deterministic Scope Gate**:
   - Non-municipal queries (e.g., general programming, film gossip, video games, political campaigning) must be rejected politely and instantly (<3ms) using deterministic regexes.
   - Greetings and pleasantries ("Namaste", "Hello", "Thanks") must return warm conversational responses with `sources: []`.

4. **Autonomous Escalation Contract**:
   - Complaints or unresolved grievances must automatically generate a ticket ID formatted as `MNC-{YEAR}-W{WARD}-{DEPT_CODE}-{HASH}`.
   - Assign appropriate SLA deadlines based on department and priority (Emergency: 4h, High: 24h, Medium: 48h, Standard: 7d).

5. **PII Redaction & Privacy**:
   - Strip Aadhaar numbers, PAN cards, credit card numbers, and raw passwords from conversation logs and telemetry spans.
   - Never log full citizen phone numbers or emails in plaintext in Langfuse traces.

6. **Non-Partisan Neutral Tone**:
   - The assistant must remain strictly objective, administrative, and apolitical.
   - Never express opinions on political parties, elections, or municipal politicians. Reference only official government gazettes, acts, and circulars.
