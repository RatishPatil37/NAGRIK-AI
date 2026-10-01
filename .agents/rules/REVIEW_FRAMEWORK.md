# 🎯 Engineering Review & Post-Mortem Framework

When bugs, logical contradictions, or architectural defects occur in Nagrik AI, do not apply superficial patches. Apply the following formal engineering review protocols:

---

## 1. ERR / CON / GAP Triage Taxonomy

Every reported defect or failed verification must be triaged into one of three categories:

| Tag | Category | Meaning & Remediation Strategy |
| :--- | :--- | :--- |
| **`[ERR]`** | **Error** | Concrete code bug, runtime exception, syntax failure, or broken test. Requires pinpoint bug isolation and a regression unit test. |
| **`[CON]`** | **Conflict / Contradiction** | An implementation decision that clashing with an existing invariant, established schema, or earlier requirement (e.g., using lazy loading after agreeing to lifespan pre-warming). Requires refactoring back to architectural compliance. |
| **`[GAP]`** | **Gap** | Missing requirements, unhandled edge cases, or false assumptions glossed over during planning (e.g., forgetting to handle broken source links or missing phone numbers). Requires updating specifications and adding explicit handlers. |

---

## 2. NATO Lessons Learned (LL) Post-Mortem Protocol

For critical bugs (security bypasses, citation hallucinations, memory leaks, stream race conditions), document a post-mortem using the 4-phase NATO LL structure:

```markdown
### 🎖️ NATO Lessons Learned (LL) Report: [Issue Title]
1. **Observation (What Happened?)**:
   - Exact symptom, error output, or user-reported defect.
2. **Context & Impact (Why Did It Matter?)**:
   - Technical environment, affected layer (PS/PM/TA), and operational risk.
3. **Root Cause Analysis (Why Did It Happen?)**:
   - Trace underlying flaw to the root (code, config, or false assumption).
4. **Remedial Action & Preventive Measure (How Is It Fixed & Prevented?)**:
   - Specific code diff applied.
   - New automated test case added to regression suite.
   - Invariant rule updated in `.agents/rules/` to prevent recurrence.
```

---

## 3. Architecture Decision Records (ADRs)

All significant technical decisions (database engine, vector retrieval strategy, speech pipeline, auth mechanism) must be recorded in `docs/adr/` using the standard format:
- `docs/adr/XXXX-title.md`
- Status: Proposed / Accepted / Deprecated / Superseded.
- Context, Decision, Alternatives Considered, and Consequences.
