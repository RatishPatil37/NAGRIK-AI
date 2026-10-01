"""Data models and schemas for Municipal Wards, Departments, Conversations, and Grievances."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MunicipalWard(BaseModel):
    ward_id: int
    ward_name: str
    zone_name: str
    ward_officer_name: Optional[str] = None
    ward_office_address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    created_at: Optional[datetime] = None


class MunicipalDepartment(BaseModel):
    dept_code: str  # WTR, SAN, REV, ENG, TNP, ELE, HLT
    dept_name: str
    head_officer_email: Optional[str] = None
    escalation_email: Optional[str] = None
    standard_sla_hours: int = 48


class Conversation(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str = "New Inquiry"
    ward_id: Optional[int] = None
    language_code: str = "en"
    is_pinned: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Message(BaseModel):
    id: str
    conversation_id: str
    role: str  # user, assistant, system
    content: str
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None


class Grievance(BaseModel):
    ticket_id: str  # e.g., MNC-2026-W04-WTR-3891
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_email: Optional[str] = None
    ward_id: int
    dept_code: str
    category: str
    priority: str = "standard"  # emergency, high, medium, standard
    sla_deadline: datetime
    status: str = "submitted"  # submitted, in_progress, resolved, escalated
    resolution_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
