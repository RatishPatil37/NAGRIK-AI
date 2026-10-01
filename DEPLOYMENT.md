# 🏛️ Nagrik AI (नागरिक AI) - Production Deployment Guide

> **Zero-Cost Free-Tier Cloud Architecture**: 100% operational on permanent free tiers (Render + Vercel + Supabase + Qdrant Cloud + Google AI Studio + Groq).

---

## 1. Architecture Topology

```
┌──────────────────────────────────────────────┐
│          Citizen & Admin Devices             │
│        (Browser Web Speech & Audio)          │
└──────────────────────┬───────────────────────┘
                       │ HTTPS / WSS / SSE
                       ▼
┌──────────────────────────────────────────────┐
│       Frontend: Vercel Edge Network          │
│       https://nagrik-ai.vercel.app           │
│   • React 19 + TypeScript + Vite + Tailwind  │
│   • Living Ward Profile HUD & Cmd+K Palette  │
│   • Nature-Style Evidence Popovers           │
│   • Printable Administrative Receipts        │
└──────────────────────┬───────────────────────┘
                       │ REST & SSE Stream
                       │ (VITE_API_BASE_URL)
                       ▼
┌──────────────────────────────────────────────┐
│          Backend: Render Free Tier           │
│       https://nagrik-ai.onrender.com         │
│   • FastAPI Asynchronous ASGI Engine         │
│   • Pre-warmed FastEmbed Models (~240MB)     │
│   • Deterministic Zero-LLM Pre-Gates (<5ms)  │
│   • Autonomous Department Escalation Engine  │
└──────┬───────────────────────┬───────────────┘
       │                       │
       ▼                       ▼
┌──────────────────┐   ┌─────────────────────────┐
│   Qdrant Cloud   │   │  Supabase PostgreSQL    │
│ (Hybrid Vectors) │   │ (RLS, Wards, Grievance) │
└──────────────────┘   └─────────────────────────┘
```

---

## 2. Step 1: Supabase Database Migration (10 Seconds)

1. Open your **[Supabase Project SQL Editor](https://supabase.com/dashboard/project/fjoxcsegplocwubqldzd/sql/new)**.
2. Open [`supabase/schema.sql`](file:///c:/Users/patil/OneDrive%20-%20South%20Indian%20Education%20Society/Desktop/AI%20Municipal%20Chatbot/supabase/schema.sql) in this repository.
3. Copy and paste the entire script into the query editor.
4. Click **Run** (`Ctrl+Enter`).
5. Verify in **Table Editor** that the 5 tables are created:
   * `municipal_wards` (10 seeded wards)
   * `municipal_departments` (6 seeded departments)
   * `conversations`
   * `messages`
   * `grievances`

---

## 3. Step 2: Backend Deployment on Render

### Option A: Using the Render Blueprint (`render.yaml`)
1. In the **Render Dashboard**, click **New +** -> **Blueprint**.
2. Select your `RatishPatil37/NAGRIK-AI` repository.
3. Render will auto-detect [`render.yaml`](file:///c:/Users/patil/OneDrive%20-%20South%20Indian%20Education%20Society/Desktop/AI%20Municipal%20Chatbot/render.yaml) and prompt you for the required secret keys.

### Option B: Manual Web Service Setup
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository: `RatishPatil37/NAGRIK-AI`.
3. Configure the following fields:
   * **Name**: `nagrik-ai-backend`
   * **Region**: `Oregon (US West)` or nearest
   * **Branch**: `main`
   * **Root Directory**: *(Leave blank)*
   * **Runtime**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn backend.src.main:app --host 0.0.0.0 --port $PORT`
   * **Plan**: `Free`
4. In **Environment Variables**, add:
   * `PYTHON_VERSION`: `3.13.0`
   * `GEMINI_API_KEY`: *(Your Google AI Studio API Key)*
   * `PRIMARY_MODEL`: `gemini-3.7-flash`
   * `SECONDARY_MODEL`: `gemini-3.5-flash-lite`
   * `GROQ_API_KEY`: *(Your Groq Console API Key)*
   * `FALLBACK_MODEL`: `llama-3.3-70b-versatile`
   * `QDRANT_URL`: `https://784c9220-a929-47bf-94fc-d26a0798ccec.australia-southeast1-0.gcp.cloud.qdrant.io`
   * `QDRANT_API_KEY`: *(Your Qdrant Cluster API Key)*
   * `QDRANT_COLLECTION`: `municipal_knowledge`
   * `SUPABASE_URL`: `https://fjoxcsegplocwubqldzd.supabase.co`
   * `SUPABASE_ANON_KEY`: *(Your Supabase anon public key)*
   * `SUPABASE_SERVICE_ROLE_KEY`: *(Your Supabase service_role key)*
   * `SUPABASE_JWT_SECRET`: *(Your Supabase JWT secret)*
   * `CORS_URL`: `https://<your-vercel-app>.vercel.app`
5. Click **Deploy Web Service**.
6. When deployment finishes, test: `https://<your-render-app>.onrender.com/health`.

---

## 4. Step 3: Frontend Deployment on Vercel

1. Open the **[Vercel Dashboard](https://vercel.com/new)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `RatishPatil37/NAGRIK-AI`.
4. Configure Project Settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click *Edit* and select **`frontend`**
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Under **Environment Variables**, add **ONE** variable:
   * **Key**: `VITE_API_BASE_URL`
   * **Value**: `https://<your-render-app>.onrender.com` *(without trailing slash)*
6. Click **Deploy**.
7. Copy your deployed Vercel domain (e.g., `https://nagrik-ai.vercel.app`) and update the `CORS_URL` variable in Render.

---

## 5. End-to-End Operational Verification Checklist

- [ ] **Health Endpoint**: `GET https://<render-url>/health` returns `{"status":"healthy","app":"Nagrik AI"}`.
- [ ] **Wards API**: `GET https://<render-url>/api/v1/wards/` returns all 10 municipal wards.
- [ ] **Admin Heatmap**: `GET https://<render-url>/api/v1/admin/heatmap` returns spatial grievance statistics.
- [ ] **Emergency SOS Gate (<5ms)**: Type *"Fire in building"* -> Instantly displays Emergency SOS Card with 101/100/108 hotlines with zero LLM consumption.
- [ ] **Hybrid RAG Chat Stream**: Type *"How is property tax calculated in Ward 4?"* -> Streams answer with `[S1]`, `[S2]` citation badges and post-stream pruned evidence cards.
- [ ] **Grievance Docket**: Type *"There is a major water pipe leakage in Bandra West near Station Road"* -> Automatically registers docket with standardized ID format (e.g. `MNC-2026-W04-WTR-3891`) and SLA deadline.
- [ ] **Official Receipt**: Click **"Print Administrative Receipt"** on the ticket card -> Opens high-density printable government receipt.
- [ ] **Command Palette**: Press `Cmd+K` (or `Ctrl+K`) -> Quick navigation opens instantly.
