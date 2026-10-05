"""Database adapter providing seamless dual-mode persistence:
Supabase PostgreSQL in production or embedded SQLite for local/offline execution.
"""

import asyncio
import json
import os
import sqlite3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from backend.src.config import settings
from backend.src.database.models import Conversation, Grievance, Message, MunicipalDepartment, MunicipalWard

# Default Municipal Wards Seed
DEFAULT_WARDS = [
    {"ward_id": 1, "ward_name": "Ward 01: Colaba & Fort", "zone_name": "Zone A", "ward_officer_name": "R. K. Sharma", "contact_phone": "+91-22-22661234"},
    {"ward_id": 2, "ward_name": "Ward 02: Malabar Hill & Tardeo", "zone_name": "Zone A", "ward_officer_name": "A. S. Deshmukh", "contact_phone": "+91-22-23661235"},
    {"ward_id": 3, "ward_name": "Ward 03: Byculla & Mazgaon", "zone_name": "Zone B", "ward_officer_name": "V. M. Patil", "contact_phone": "+91-22-23761236"},
    {"ward_id": 4, "ward_name": "Ward 04: Bandra West & Khar", "zone_name": "Zone B", "ward_officer_name": "P. N. Kulkarni", "contact_phone": "+91-22-26461237"},
    {"ward_id": 5, "ward_name": "Ward 05: Dadar & Matunga", "zone_name": "Zone B", "ward_officer_name": "S. G. Shinde", "contact_phone": "+91-22-24361238"},
    {"ward_id": 6, "ward_name": "Ward 06: Andheri East & Marol", "zone_name": "Zone C", "ward_officer_name": "M. T. Pawar", "contact_phone": "+91-22-28361239"},
    {"ward_id": 7, "ward_name": "Ward 07: Andheri West & Juhu", "zone_name": "Zone C", "ward_officer_name": "N. B. Joshi", "contact_phone": "+91-22-26261240"},
    {"ward_id": 8, "ward_name": "Ward 08: Kurla & Sakinaka", "zone_name": "Zone D", "ward_officer_name": "K. R. Yadav", "contact_phone": "+91-22-25061241"},
    {"ward_id": 9, "ward_name": "Ward 09: Borivali West & Gorai", "zone_name": "Zone D", "ward_officer_name": "D. H. Mehta", "contact_phone": "+91-22-28961242"},
    {"ward_id": 10, "ward_name": "Ward 10: Ghatkopar & Vikhroli", "zone_name": "Zone E", "ward_officer_name": "T. J. Solanki", "contact_phone": "+91-22-25161243"},
]

DEFAULT_DEPARTMENTS = [
    {"dept_code": "WTR", "dept_name": "Water Supply & Sewerage", "standard_sla_hours": 24, "head_officer_email": "chief.water@municipal.gov.in"},
    {"dept_code": "SAN", "dept_name": "Solid Waste Management", "standard_sla_hours": 24, "head_officer_email": "chief.sanitation@municipal.gov.in"},
    {"dept_code": "REV", "dept_name": "Property Tax & Revenue", "standard_sla_hours": 168, "head_officer_email": "chief.revenue@municipal.gov.in"},
    {"dept_code": "ENG", "dept_name": "Roads & Civil Engineering", "standard_sla_hours": 48, "head_officer_email": "chief.engineering@municipal.gov.in"},
    {"dept_code": "TNP", "dept_name": "Town Planning & Encroachment", "standard_sla_hours": 168, "head_officer_email": "chief.townplanning@municipal.gov.in"},
    {"dept_code": "ELE", "dept_name": "Electrical & Streetlighting", "standard_sla_hours": 24, "head_officer_email": "chief.electrical@municipal.gov.in"},
]

DEFAULT_SEED_GRIEVANCES = [
    {"ticket_id": "MCGM-2026-W04-7492", "ward_id": 4, "dept_code": "WTR", "category": "Water Supply Contamination & Pipe Burst", "priority": "emergency", "sla_hours": -2, "status": "submitted"},
    {"ticket_id": "MCGM-2026-W04-8114", "ward_id": 4, "dept_code": "ENG", "category": "Deep Road Pothole near Station", "priority": "high", "sla_hours": 3, "status": "in_progress"},
    {"ticket_id": "MCGM-2026-W04-9201", "ward_id": 4, "dept_code": "SAN", "category": "Commercial Garbage Dumping on Sidewalk", "priority": "medium", "sla_hours": 8, "status": "submitted"},
    {"ticket_id": "MCGM-2026-W08-3310", "ward_id": 8, "dept_code": "WTR", "category": "Main Pipeline Burst at Junction", "priority": "emergency", "sla_hours": -1, "status": "submitted"},
    {"ticket_id": "MCGM-2026-W08-3311", "ward_id": 8, "dept_code": "WTR", "category": "Low Water Pressure in Sector 3", "priority": "medium", "sla_hours": 14, "status": "in_progress"},
    {"ticket_id": "MCGM-2026-W08-3312", "ward_id": 8, "dept_code": "SAN", "category": "Overflowing Public Dustbins", "priority": "high", "sla_hours": 2, "status": "submitted"},
    {"ticket_id": "MCGM-2026-W08-3313", "ward_id": 8, "dept_code": "ELE", "category": "Streetlight Phase Short-Circuit", "priority": "high", "sla_hours": 5, "status": "submitted"},
    {"ticket_id": "MCGM-2026-W08-3314", "ward_id": 8, "dept_code": "ENG", "category": "Stormwater Drain Choked", "priority": "medium", "sla_hours": 20, "status": "in_progress"},
    {"ticket_id": "MCGM-2026-W01-1042", "ward_id": 1, "dept_code": "REV", "category": "Commercial Property Tax Surcharge Appeal", "priority": "standard", "sla_hours": 96, "status": "submitted"},
    {"ticket_id": "MCGM-2026-W02-2190", "ward_id": 2, "dept_code": "TNP", "category": "Unauthorized Compound Wall Construction", "priority": "medium", "sla_hours": 48, "status": "submitted"},
    {"ticket_id": "MCGM-2026-W06-5502", "ward_id": 6, "dept_code": "ELE", "category": "Traffic Light & Feeder Failure", "priority": "high", "sla_hours": 3, "status": "in_progress"},
    {"ticket_id": "MCGM-2026-W07-6621", "ward_id": 7, "dept_code": "SAN", "category": "Plastic Waste Burning in Open Ground", "priority": "high", "sla_hours": 7, "status": "submitted"},
]


class DatabaseAdapter:
    def __init__(self):
        self._supabase_client = None
        self._use_supabase = settings.is_supabase_configured
        self._sqlite_path = Path(settings.SQLITE_DB_PATH)
        self._initialized = False

    async def initialize(self):
        """Initializes database connection and seeds initial records if missing."""
        if self._initialized:
            return

        if self._use_supabase:
            try:
                from supabase import create_client
                client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY)
                # Verify that tables are created in Supabase
                client.table("municipal_wards").select("ward_id").limit(1).execute()
                # Check grievances count in Supabase; if empty, auto-seed
                try:
                    g_res = client.table("grievances").select("ticket_id").limit(1).execute()
                    if not g_res.data:
                        now = datetime.now(timezone.utc)
                        now_str = now.isoformat()
                        seed_records = []
                        for g in DEFAULT_SEED_GRIEVANCES:
                            deadline = (now + timedelta(hours=g["sla_hours"])).isoformat()
                            seed_records.append({
                                "ticket_id": g["ticket_id"],
                                "ward_id": g["ward_id"],
                                "dept_code": g["dept_code"],
                                "category": g["category"],
                                "priority": g["priority"],
                                "sla_deadline": deadline,
                                "status": g["status"],
                                "created_at": now_str,
                                "updated_at": now_str,
                            })
                        client.table("grievances").insert(seed_records).execute()
                except Exception as seed_err:
                    print(f"[DatabaseAdapter] Supabase auto-seed notice: {seed_err}")

                self._supabase_client = client
                self._initialized = True
                print("[DatabaseAdapter] Supabase PostgreSQL connected and verified.")
                return
            except Exception as e:
                # Log and fallback to SQLite
                print(f"[DatabaseAdapter] Supabase table check failed ({e}). Falling back to local SQLite.")
                self._use_supabase = False

        # SQLite Initialization
        self._sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(self._init_sqlite_schema)
        self._initialized = True

    def _ensure_sqlite_ready(self):
        if not self._initialized and not self._use_supabase:
            self._sqlite_path.parent.mkdir(parents=True, exist_ok=True)
            self._init_sqlite_schema()
            self._initialized = True

    def _init_sqlite_schema(self):
        with sqlite3.connect(self._sqlite_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS municipal_wards (
                ward_id INTEGER PRIMARY KEY,
                ward_name TEXT NOT NULL,
                zone_name TEXT NOT NULL,
                ward_officer_name TEXT,
                ward_office_address TEXT,
                contact_email TEXT,
                contact_phone TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS municipal_departments (
                dept_code TEXT PRIMARY KEY,
                dept_name TEXT NOT NULL,
                head_officer_email TEXT,
                escalation_email TEXT,
                standard_sla_hours INTEGER DEFAULT 48
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT DEFAULT 'New Inquiry',
                ward_id INTEGER,
                language_code TEXT DEFAULT 'en',
                is_pinned INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ward_id) REFERENCES municipal_wards(ward_id)
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                citations TEXT DEFAULT '[]',
                metrics TEXT DEFAULT '{}',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS grievances (
                ticket_id TEXT PRIMARY KEY,
                conversation_id TEXT,
                user_id TEXT,
                citizen_name TEXT,
                citizen_phone TEXT,
                citizen_email TEXT,
                ward_id INTEGER,
                dept_code TEXT,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                sla_deadline TEXT NOT NULL,
                status TEXT DEFAULT 'submitted',
                resolution_notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ward_id) REFERENCES municipal_wards(ward_id),
                FOREIGN KEY (dept_code) REFERENCES municipal_departments(dept_code)
            );
            """)

            # Seed Wards
            for ward in DEFAULT_WARDS:
                cursor.execute("""
                INSERT OR IGNORE INTO municipal_wards (ward_id, ward_name, zone_name, ward_officer_name, contact_phone)
                VALUES (?, ?, ?, ?, ?)
                """, (ward["ward_id"], ward["ward_name"], ward["zone_name"], ward["ward_officer_name"], ward["contact_phone"]))

            # Seed Departments
            for dept in DEFAULT_DEPARTMENTS:
                cursor.execute("""
                INSERT OR IGNORE INTO municipal_departments (dept_code, dept_name, standard_sla_hours, head_officer_email)
                VALUES (?, ?, ?, ?)
                """, (dept["dept_code"], dept["dept_name"], dept["standard_sla_hours"], dept["head_officer_email"]))

            # Seed Default Grievances if empty
            cursor.execute("SELECT COUNT(*) FROM grievances")
            if cursor.fetchone()[0] == 0:
                now = datetime.now(timezone.utc)
                for g in DEFAULT_SEED_GRIEVANCES:
                    deadline = (now + timedelta(hours=g["sla_hours"])).isoformat()
                    now_str = now.isoformat()
                    cursor.execute("""
                    INSERT INTO grievances (
                        ticket_id, ward_id, dept_code, category, priority, sla_deadline, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        g["ticket_id"], g["ward_id"], g["dept_code"], g["category"],
                        g["priority"], deadline, g["status"], now_str, now_str
                    ))

            conn.commit()

    # --- Ward Operations ---
    async def list_wards(self) -> List[MunicipalWard]:
        if self._use_supabase and self._supabase_client:
            res = self._supabase_client.table("municipal_wards").select("*").order("ward_id").execute()
            return [MunicipalWard(**w) for w in res.data]

        def _get():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM municipal_wards ORDER BY ward_id")
                return [MunicipalWard(**dict(row)) for row in cursor.fetchall()]

        return await asyncio.to_thread(_get)

    async def get_ward(self, ward_id: int) -> Optional[MunicipalWard]:
        if self._use_supabase and self._supabase_client:
            res = self._supabase_client.table("municipal_wards").select("*").eq("ward_id", ward_id).execute()
            return MunicipalWard(**res.data[0]) if res.data else None

        def _get():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM municipal_wards WHERE ward_id = ?", (ward_id,))
                row = cursor.fetchone()
                return MunicipalWard(**dict(row)) if row else None

        return await asyncio.to_thread(_get)

    # --- Grievance Operations ---
    async def create_grievance(self, grievance: Grievance) -> Grievance:
        data = grievance.model_dump()
        data["sla_deadline"] = grievance.sla_deadline.isoformat()
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        data["updated_at"] = datetime.now(timezone.utc).isoformat()

        if self._use_supabase and self._supabase_client:
            self._supabase_client.table("grievances").insert(data).execute()
            return grievance

        def _insert():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO grievances (
                    ticket_id, conversation_id, user_id, citizen_name, citizen_phone, citizen_email,
                    ward_id, dept_code, category, priority, sla_deadline, status, resolution_notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data["ticket_id"], data["conversation_id"], data["user_id"], data["citizen_name"],
                    data["citizen_phone"], data["citizen_email"], data["ward_id"], data["dept_code"],
                    data["category"], data["priority"], data["sla_deadline"], data["status"],
                    data["resolution_notes"], data["created_at"], data["updated_at"]
                ))
                conn.commit()

        await asyncio.to_thread(_insert)
        return grievance

    async def get_grievance(self, ticket_id: str) -> Optional[Grievance]:
        if self._use_supabase and self._supabase_client:
            res = self._supabase_client.table("grievances").select("*").eq("ticket_id", ticket_id).execute()
            if res.data:
                item = res.data[0]
                item["sla_deadline"] = datetime.fromisoformat(item["sla_deadline"])
                return Grievance(**item)
            return None

        def _get():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM grievances WHERE ticket_id = ?", (ticket_id,))
                row = cursor.fetchone()
                if row:
                    item = dict(row)
                    item["sla_deadline"] = datetime.fromisoformat(item["sla_deadline"])
                    return Grievance(**item)
                return None

        return await asyncio.to_thread(_get)

    async def list_grievances(self, ward_id: Optional[int] = None, limit: int = 50) -> List[Grievance]:
        if self._use_supabase and self._supabase_client:
            query = self._supabase_client.table("grievances").select("*").order("created_at", desc=True).limit(limit)
            if ward_id is not None:
                query = query.eq("ward_id", ward_id)
            res = query.execute()
            result = []
            for item in res.data:
                item["sla_deadline"] = datetime.fromisoformat(item["sla_deadline"])
                result.append(Grievance(**item))
            return result

        def _list():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                if ward_id is not None:
                    cursor.execute("SELECT * FROM grievances WHERE ward_id = ? ORDER BY created_at DESC LIMIT ?", (ward_id, limit))
                else:
                    cursor.execute("SELECT * FROM grievances ORDER BY created_at DESC LIMIT ?", (limit,))
                result = []
                for row in cursor.fetchall():
                    item = dict(row)
                    item["sla_deadline"] = datetime.fromisoformat(item["sla_deadline"])
                    result.append(Grievance(**item))
                return result

        return await asyncio.to_thread(_list)

    # --- Conversation & Message Operations ---
    async def create_conversation(
        self,
        user_id: Optional[str] = None,
        ward_id: Optional[int] = 4,
        language_code: str = "en",
        title: str = "New Inquiry"
    ) -> str:
        import uuid
        conv_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        if self._use_supabase and self._supabase_client:
            try:
                self._supabase_client.table("conversations").insert({
                    "id": conv_id,
                    "user_id": user_id,
                    "title": title,
                    "ward_id": ward_id,
                    "language_code": language_code,
                    "created_at": now,
                    "updated_at": now,
                }).execute()
                return conv_id
            except Exception as e:
                print(f"[DatabaseAdapter] Supabase create_conversation error: {e}. Falling back to SQLite.")

        def _insert():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                conn.cursor().execute(
                    "INSERT INTO conversations (id, user_id, title, ward_id, language_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (conv_id, user_id, title, ward_id, language_code, now, now)
                )
                conn.commit()

        await asyncio.to_thread(_insert)
        return conv_id

    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        citations: Optional[List[Dict[str, Any]]] = None,
        metrics: Optional[Dict[str, Any]] = None
    ) -> str:
        import uuid
        msg_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        citations_json = json.dumps(citations or [])
        metrics_json = json.dumps(metrics or {})

        if self._use_supabase and self._supabase_client:
            try:
                self._supabase_client.table("messages").insert({
                    "id": msg_id,
                    "conversation_id": conversation_id,
                    "role": role,
                    "content": content,
                    "citations": citations or [],
                    "metrics": metrics or {},
                    "created_at": now,
                }).execute()
                return msg_id
            except Exception as e:
                print(f"[DatabaseAdapter] Supabase save_message error: {e}. Falling back to SQLite.")

        def _insert():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                conn.cursor().execute(
                    "INSERT INTO messages (id, conversation_id, role, content, citations, metrics, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (msg_id, conversation_id, role, content, citations_json, metrics_json, now)
                )
                conn.commit()

        await asyncio.to_thread(_insert)
        return msg_id

    async def get_conversation_history(self, conversation_id: str, limit: int = 6) -> List[Dict[str, Any]]:
        if self._use_supabase and self._supabase_client:
            try:
                res = self._supabase_client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(limit).execute()
                if res.data:
                    return [{"role": m["role"], "content": m["content"]} for m in res.data]
            except Exception as e:
                print(f"[DatabaseAdapter] Supabase get_conversation_history error: {e}. Falling back to SQLite.")

        def _get():
            self._ensure_sqlite_ready()
            with sqlite3.connect(self._sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?",
                    (conversation_id, limit)
                )
                return [{"role": row["role"], "content": row["content"]} for row in cursor.fetchall()]

        return await asyncio.to_thread(_get)

    async def is_healthy(self) -> bool:
        if self._use_supabase and self._supabase_client:
            try:
                res = self._supabase_client.table("municipal_wards").select("ward_id").limit(1).execute()
                return bool(res.data)
            except Exception:
                return False
        return self._initialized


db_adapter = DatabaseAdapter()

