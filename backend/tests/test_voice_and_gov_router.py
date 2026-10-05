"""Integration and unit tests for Voice Gateway, Gov API Router, and Civic NER."""

import pytest
from httpx import ASGITransport, AsyncClient
from backend.src.forecasting.ner_classifier import extract_civic_entities
from backend.src.main import app
from backend.src.retriever.gov_api_router import gov_api_router


def test_gov_api_router_classification():
    """Verifies that GovApiRouter deterministically classifies live civic inquiries."""
    assert gov_api_router.classify_intent("What is the current AQI in Bandra?") == "cpcb_aqi"
    assert gov_api_router.classify_intent("Is there a heavy rainfall weather warning today?") == "imd_weather"
    assert gov_api_router.classify_intent("Check the stormwater drain level sensor") == "iudx_telemetry"
    assert gov_api_router.classify_intent("Where can I find municipal budget allocation dataset?") == "ogd_data"
    assert gov_api_router.classify_intent("What is the property tax rebate rule?") is None


@pytest.mark.asyncio
async def test_gov_api_router_telemetry_generation():
    """Verifies that live civic telemetry formatting conforms to GoI schema."""
    telemetry_block = await gov_api_router.route_and_fetch("What is the AQI level today?", ward_id=4)
    assert telemetry_block is not None
    assert "<live_civic_telemetry>" in telemetry_block
    assert "CPCB" in telemetry_block
    assert "AQI Index" in telemetry_block


def test_civic_ner_classifier():
    """Verifies entity, landmark, and department extraction."""
    res = extract_civic_entities(
        "There is a major pipeline burst near City Hospital on MG Road in Ward 4!",
        default_ward_id=1,
    )
    assert res.ward_id == 4
    assert res.department == "WTR"
    assert res.urgency == "emergency"
    assert res.actionable_intent is True
    assert "near City Hospital" in (res.landmark or "")


@pytest.mark.asyncio
async def test_voice_synthesis_endpoint():
    """Tests the /api/v1/voice/synthesize endpoint (testing Sarvam AI / Edge-TTS fallback)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/voice/synthesize",
            json={
                "text": "Property tax early bird rebate is available until June 30th [S1].",
                "language_code": "en-IN",
            },
        )
        assert resp.status_code == 200
        assert resp.headers.get("X-TTS-Engine") in ["Sarvam-AI-Bulbul", "Microsoft-Edge-Neural"]
        assert len(resp.content) > 500
