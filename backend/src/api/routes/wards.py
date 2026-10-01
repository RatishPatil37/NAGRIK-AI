"""Municipal Wards and Zones API endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException
from backend.src.database.adapter import db_adapter
from backend.src.database.models import MunicipalWard

router = APIRouter(prefix="/wards", tags=["Wards & Geography"])


@router.get("/", response_model=List[MunicipalWard])
async def list_wards():
    """Lists all municipal wards, zones, and ward officer contacts."""
    return await db_adapter.list_wards()


@router.get("/{ward_id}", response_model=MunicipalWard)
async def get_ward(ward_id: int):
    """Retrieves specific ward details by ward ID."""
    ward = await db_adapter.get_ward(ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail=f"Ward ID {ward_id} not found.")
    return ward
