"""Automated Unit Tests for Zero-LLM Deterministic Pre-Gates (<5ms invariants)."""

import time
import pytest
from backend.src.guardrails.completeness import check_completeness_gate
from backend.src.guardrails.emergency_sos import check_emergency_sos
from backend.src.guardrails.intent_gate import check_intent_gate
from backend.src.guardrails.scope_gate import check_scope_gate


def test_emergency_sos_speed_and_accuracy():
    """Validates emergency triage executes in <5ms and catches life-critical keywords."""
    emergency_queries = [
        "Major fire broke out in the commercial market",
        "A cylinder blast just occurred in my building, help!",
        "A pillar cracked and the residential building is collapsing",
        "Live electrical wire has fallen on the street, sparking heavily",
    ]

    for q in emergency_queries:
        t0 = time.time()
        result = check_emergency_sos(q)
        duration_ms = (time.time() - t0) * 1000

        assert result is not None, f"Query '{q}' failed to trigger Emergency SOS."
        assert result["is_emergency"] is True
        assert duration_ms < 5.0, f"Emergency check exceeded 5ms: {duration_ms:.2f}ms"
        assert any(c["number"] in ["101", "108", "112"] for c in result["contacts"])

    # Non-emergency should return None
    assert check_emergency_sos("What is the property tax rate for residential plots?") is None


def test_scope_gate_rejection():
    """Validates that non-civic questions are rejected politely in <3ms."""
    oos_queries = [
        "Can you write python code to reverse a binary tree?",
        "Who will win the IPL cricket match tonight?",
        "Give me the latest Bollywood movie review",
        "Who is a better political party to vote for in upcoming elections?",
    ]

    for q in oos_queries:
        t0 = time.time()
        result = check_scope_gate(q)
        duration_ms = (time.time() - t0) * 1000

        assert result is not None, f"Out of scope query '{q}' bypassed scope gate."
        assert result["in_scope"] is False
        assert duration_ms < 3.0, f"Scope gate exceeded 3ms: {duration_ms:.2f}ms"
        assert result["sources"] == []

    # Civic queries must pass through (return None)
    assert check_scope_gate("How to pay water bill online?") is None


def test_intent_gate_pleasantries():
    """Validates that greetings and identity queries return immediate responses with sources: []."""
    greetings = ["Namaste", "Hello", "Hi", "Good morning", "Who are you?", "Thank you so much", "Dhanyawad"]

    for g in greetings:
        t0 = time.time()
        result = check_intent_gate(g)
        duration_ms = (time.time() - t0) * 1000

        assert result is not None, f"Greeting '{g}' was not handled by intent gate."
        assert duration_ms < 2.0, f"Intent gate exceeded 2ms: {duration_ms:.2f}ms"
        assert result["sources"] == []


def test_completeness_gate():
    """Validates that operational complaints without Ward ID trigger clarification cards."""
    # Lacks ward
    res = check_completeness_gate("A major water pipe burst on the road, please repair")
    assert res is not None
    assert res["needs_clarification"] is True
    assert res["parameter"] == "ward_id"
    assert len(res["options"]) >= 10

    # Has ward in context
    res_with_ward = check_completeness_gate("Water pipe burst", current_ward_id=4)
    assert res_with_ward is None

    # Has ward in query text
    res_text_ward = check_completeness_gate("Water pipe burst in Ward 4")
    assert res_text_ward is None
