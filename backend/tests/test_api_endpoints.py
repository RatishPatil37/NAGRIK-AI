"""Integration tests for FastAPI REST API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from backend.src.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["app"] == "Nagrik AI"
        assert data["primary_model"] == "gemini-3.7-flash"


@pytest.mark.asyncio
async def test_wards_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/wards/")
        assert resp.status_code == 200
        wards = resp.json()
        assert len(wards) >= 10
        assert wards[0]["ward_id"] == 1


@pytest.mark.asyncio
async def test_admin_heatmap_and_sla():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        heatmap_resp = await client.get("/api/v1/admin/heatmap")
        assert heatmap_resp.status_code == 200
        h_data = heatmap_resp.json()
        assert "wards" in h_data
        assert len(h_data["wards"]) >= 10

        sla_resp = await client.get("/api/v1/admin/sla-status")
        assert sla_resp.status_code == 200
        s_data = sla_resp.json()
        assert "summary" in s_data


@pytest.mark.asyncio
async def test_document_download():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/documents/MNC-REV-2026-001/download")
        assert resp.status_code == 200
        assert "Property Tax" in resp.text
