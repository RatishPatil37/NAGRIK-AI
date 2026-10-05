"""Grievances and Service Escalation Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from backend.src.database.adapter import db_adapter
from backend.src.database.models import Grievance
from backend.src.escalation.sla import calculate_sla
from backend.src.escalation.ticket import generate_ticket_id

router = APIRouter(prefix="/grievances", tags=["Grievances & Escalation"])


class CreateGrievanceRequest(BaseModel):
    ward_id: int
    dept_code: str
    category: str
    priority: str = "standard"
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_email: Optional[str] = None
    resolution_notes: Optional[str] = None


@router.post("/", response_model=Grievance)
async def create_grievance(req: CreateGrievanceRequest):
    """Creates a new tracked municipal grievance ticket with statutory SLA."""
    sla_hours, deadline = calculate_sla(req.dept_code, req.priority)
    ticket_id = generate_ticket_id(
        ward_id=req.ward_id,
        dept_code=req.dept_code,
        citizen_identifier=req.citizen_phone or "web",
    )

    grievance = Grievance(
        ticket_id=ticket_id,
        ward_id=req.ward_id,
        dept_code=req.dept_code.upper(),
        category=req.category,
        priority=req.priority,
        citizen_name=req.citizen_name,
        citizen_phone=req.citizen_phone,
        citizen_email=req.citizen_email,
        sla_deadline=deadline,
        status="submitted",
        resolution_notes=req.resolution_notes or f"Registered via Nagrik AI Citizen Portal. Statutory SLA: {sla_hours}h.",
    )

    return await db_adapter.create_grievance(grievance)


@router.get("/{ticket_id}", response_model=Grievance)
async def get_grievance(ticket_id: str):
    """Retrieves grievance status and SLA countdown by Ticket ID."""
    grievance = await db_adapter.get_grievance(ticket_id.upper())
    if not grievance:
        raise HTTPException(status_code=404, detail=f"Grievance ticket '{ticket_id}' not found.")
    return grievance


from fastapi import APIRouter, Depends, HTTPException, Query
from backend.src.api.dependencies import require_admin_role

@router.get("/", response_model=List[Grievance])
async def list_grievances(
    ward_id: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    admin_user: str = Depends(require_admin_role),
):
    """Lists grievances filtered by municipal ward (Administrative access required)."""
    return await db_adapter.list_grievances(ward_id=ward_id, limit=limit)
