"""Integration tests for FastAPI REST API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from backend.src.config import settings
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
        # 1. Unauthenticated request must return 403 Forbidden
        unauth_resp = await client.get("/api/v1/admin/heatmap")
        assert unauth_resp.status_code == 403

        # 2. Authenticated request with X-Admin-Key must succeed
        admin_headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
        heatmap_resp = await client.get("/api/v1/admin/heatmap", headers=admin_headers)
        assert heatmap_resp.status_code == 200
        h_data = heatmap_resp.json()
        assert "wards" in h_data
        assert len(h_data["wards"]) >= 10

        sla_resp = await client.get("/api/v1/admin/sla-status", headers=admin_headers)
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


@pytest.mark.asyncio
async def test_document_upload_and_deduplication():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        sample_doc = b"# Municipal Circular 2026/99\n\nOfficial notice on civic drainage maintenance."
        files = {"file": ("test_circular.md", sample_doc, "text/markdown")}

        # 1. Unauthenticated request must return 403 Forbidden
        unauth_resp = await client.post("/api/v1/documents/upload", files=files)
        assert unauth_resp.status_code == 403

        # 2. Authenticated upload succeeds
        admin_headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
        files1 = {"file": ("test_circular.md", sample_doc, "text/markdown")}
        resp1 = await client.post("/api/v1/documents/upload", files=files1, headers=admin_headers)
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["status"] == "success"
        assert "content_hash" in data1

        # 3. Duplicate upload returns 409 Conflict
        files2 = {"file": ("test_circular.md", sample_doc, "text/markdown")}
        resp2 = await client.post("/api/v1/documents/upload", files=files2, headers=admin_headers)
        assert resp2.status_code == 409
        assert "Conflict" in resp2.json()["detail"]

