# ADR-0002: Zero-LLM Deterministic Pre-Gates for Emergency SOS and Scope Validation

## Status
Accepted

## Date
2026-10-01

## Context & Problem Statement
Citizens frequently use municipal chatbots during life-threatening crises (fire, gas leaks, building collapses) or for casual greetings and out-of-scope trivia. Calling an LLM or vector database for an emergency introduces 1-3 seconds of critical delay. Calling an LLM for "Namaste" or "What is 2+2" wastes GPU tokens and causes citation hallucinations.

## Decision
Implement a 4-Tier zero-LLM deterministic pre-filter chain in pure Python before invoking Qdrant or LLMs:
1. `SOSGate` (<2ms): Matches emergency keywords -> immediate hotline cards (101, 100, 108).
2. `ScopeGate` (<3ms): Matches out-of-scope topics -> polite guidance.
3. `IntentGate` (<2ms): Matches greetings -> warm reply with `sources: []`.
4. `CompletenessGate` (<5ms): Prompts for missing Ward / Assessment IDs before querying.

## Alternatives Considered
1. **LLM Function Calling / Router Model**: Adds 300–600ms TTFT latency and recurring API cost.
2. **Post-Generation Filtering**: Wastes tokens and risks streaming partial hallucinations before cancelling.

## Consequences & Trade-offs
- **Positive**: Sub-5ms response for emergencies and greetings, zero API cost, elimination of bogus citations.
- **Negative**: Requires careful keyword boundary matching to avoid false-positive scope rejections on legitimate mixed civic questions.

## Compliance & Verification
Verified via `backend/tests/test_guardrails.py` with 100% test coverage.
