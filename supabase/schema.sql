-- ==============================================================================
-- 🏛️ NAGRIK AI (नागरिक AI) - PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Execute this script in the Supabase Dashboard -> SQL Editor -> New Query
-- SAFE TO RE-RUN: All statements use IF NOT EXISTS / OR REPLACE / ON CONFLICT
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Municipal Wards & Administrative Zones
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_wards (
    ward_id INT PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    ward_officer_name VARCHAR(150),
    ward_office_address TEXT,
    contact_email VARCHAR(150),
    contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Municipal Wards (safe: ON CONFLICT DO NOTHING)
INSERT INTO municipal_wards (ward_id, ward_name, zone_name, ward_officer_name, contact_phone)
VALUES
    (1, 'Ward 01: Colaba & Fort', 'Zone A', 'R. K. Sharma', '+91-22-22661234'),
    (2, 'Ward 02: Malabar Hill & Tardeo', 'Zone A', 'A. S. Deshmukh', '+91-22-23661235'),
    (3, 'Ward 03: Byculla & Mazgaon', 'Zone B', 'V. M. Patil', '+91-22-23761236'),
    (4, 'Ward 04: Bandra West & Khar', 'Zone B', 'P. N. Kulkarni', '+91-22-26461237'),
    (5, 'Ward 05: Dadar & Matunga', 'Zone B', 'S. G. Shinde', '+91-22-24361238'),
    (6, 'Ward 06: Andheri East & Marol', 'Zone C', 'M. T. Pawar', '+91-22-28361239'),
    (7, 'Ward 07: Andheri West & Juhu', 'Zone C', 'N. B. Joshi', '+91-22-26261240'),
    (8, 'Ward 08: Kurla & Sakinaka', 'Zone D', 'K. R. Yadav', '+91-22-25061241'),
    (9, 'Ward 09: Borivali West & Gorai', 'Zone D', 'D. H. Mehta', '+91-22-28961242'),
    (10, 'Ward 10: Ghatkopar & Vikhroli', 'Zone E', 'T. J. Solanki', '+91-22-25161243')
ON CONFLICT (ward_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Municipal Departments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_departments (
    dept_code VARCHAR(10) PRIMARY KEY, -- WTR, SAN, REV, ENG, TNP, ELE
    dept_name VARCHAR(150) NOT NULL,
    head_officer_email VARCHAR(150),
    escalation_email VARCHAR(150),
    standard_sla_hours INT DEFAULT 48
);

-- Seed Municipal Departments (safe: ON CONFLICT DO NOTHING)
INSERT INTO municipal_departments (dept_code, dept_name, standard_sla_hours, head_officer_email)
VALUES
    ('WTR', 'Water Supply & Sewerage', 24, 'chief.water@municipal.gov.in'),
    ('SAN', 'Solid Waste Management', 24, 'chief.sanitation@municipal.gov.in'),
    ('REV', 'Property Tax & Revenue', 168, 'chief.revenue@municipal.gov.in'),
    ('ENG', 'Roads & Civil Engineering', 48, 'chief.engineering@municipal.gov.in'),
    ('TNP', 'Town Planning & Encroachment', 168, 'chief.townplanning@municipal.gov.in'),
    ('ELE', 'Electrical & Streetlighting', 24, 'chief.electrical@municipal.gov.in')
ON CONFLICT (dept_code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Citizen Conversations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Inquiry',
    ward_id INT REFERENCES municipal_wards(ward_id),
    language_code VARCHAR(10) DEFAULT 'en',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. Conversation Messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Grievances & Service Escalations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grievances (
    ticket_id VARCHAR(50) PRIMARY KEY, -- Example: MNC-2026-W04-WTR-8942
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    citizen_name VARCHAR(150),
    citizen_phone VARCHAR(20),
    citizen_email VARCHAR(150),
    ward_id INT REFERENCES municipal_wards(ward_id),
    dept_code VARCHAR(10) REFERENCES municipal_departments(dept_code),
    category VARCHAR(100) NOT NULL, -- Water Leakage, Pothole, Garbage, Tax Dispute
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('emergency', 'high', 'medium', 'standard')),
    sla_deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_progress', 'resolved', 'escalated')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. Performance Indexes (IF NOT EXISTS prevents re-run errors)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_grievances_ward ON grievances(ward_id);
CREATE INDEX IF NOT EXISTS idx_grievances_dept ON grievances(dept_code);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_sla ON grievances(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

-- ------------------------------------------------------------------------------
-- 7. Row-Level Security (RLS) Policies
-- NOTE: DROP POLICY IF EXISTS before CREATE POLICY makes this idempotent.
--       Without this, re-running the script produces "policy already exists".
-- ------------------------------------------------------------------------------
ALTER TABLE municipal_wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;

-- Wards: public read
DROP POLICY IF EXISTS "Public read municipal_wards" ON municipal_wards;
CREATE POLICY "Public read municipal_wards" ON municipal_wards FOR SELECT USING (true);

-- Departments: public read
DROP POLICY IF EXISTS "Public read municipal_departments" ON municipal_departments;
CREATE POLICY "Public read municipal_departments" ON municipal_departments FOR SELECT USING (true);

-- Conversations: citizens manage their own (anonymous users allowed)
DROP POLICY IF EXISTS "Citizens manage conversations" ON conversations;
CREATE POLICY "Citizens manage conversations" ON conversations FOR ALL USING (
    auth.uid() = user_id OR auth.uid() IS NULL
);

-- Messages: unrestricted for MVP (tighten post-launch with auth.uid())
DROP POLICY IF EXISTS "Citizens access messages" ON messages;
CREATE POLICY "Citizens access messages" ON messages FOR ALL USING (true);

-- Grievances: fully public for MVP civic filing
DROP POLICY IF EXISTS "Public insert grievances" ON grievances;
DROP POLICY IF EXISTS "Public select grievances" ON grievances;
DROP POLICY IF EXISTS "Public update grievances" ON grievances;
CREATE POLICY "Public insert grievances" ON grievances FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select grievances" ON grievances FOR SELECT USING (true);
CREATE POLICY "Public update grievances" ON grievances FOR UPDATE USING (true);
