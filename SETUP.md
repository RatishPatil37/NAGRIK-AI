# 🏛️ Nagrik AI: Production Setup & Deployment Guide (100% Free Tier)

This guide walks you step-by-step through setting up all free-tier cloud services and deploying **Nagrik AI (नागरिक AI)** to production at **$0 hosting cost**.

---

## ⚡ Zero-Setup Local Development (Runs Out-of-the-Box)

Nagrik AI is engineered with an **Autonomous Dual-Mode Persistence Architecture**. You can run the entire system locally **immediately**, even before configuring external cloud accounts:
* **Vector Store**: Uses local embedded Qdrant storage in `data/qdrant_local/`.
* **Database**: Uses local embedded SQLite database in `data/nagrik_local.db` with all 10 wards and 6 municipal departments pre-seeded.
* **LLM Fallback**: Includes deterministic municipal guideline cache.

### How to Run Locally Right Now:

1. **Start the FastAPI Backend**:
   ```bash
   uv run uvicorn backend.src.main:app --reload --port 8000
   ```
   *Health Check*: Open [http://localhost:8000/health](http://localhost:8000/health) or Interactive API Docs at [http://localhost:8000/docs](http://localhost:8000/docs).

2. **Start the React Frontend Workstation**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Citizen Portal & Workstation*: Open [http://localhost:5173](http://localhost:5173).

---

## 🔑 1. Free-Tier Cloud Credentials Setup

To connect production cloud services, create accounts on the following free-tier platforms and populate your `.env` file:

### 1.1 Google AI Studio (Gemini 3.7 Flash & Gemini 3.5 Flash Lite)
* **Website**: [https://aistudio.google.com/](https://aistudio.google.com/)
* **Free Quota**: 15 Requests Per Minute (RPM), 1,500 Requests Per Day (RPD), 1M Tokens Per Minute (TPM).
* **Steps**:
  1. Sign in with your Google account.
  2. Click **"Get API key"** $\to$ **"Create API key in new project"**.
  3. Copy the key and set in `.env`:
     ```env
     GEMINI_API_KEY=AIzaSy...
     PRIMARY_MODEL=gemini-3.7-flash
     SECONDARY_MODEL=gemini-3.5-flash-lite
     ```

### 1.2 Groq Cloud (Llama 3.3 70B & Whisper Audio)
* **Website**: [https://console.groq.com/](https://console.groq.com/)
* **Free Quota**: 30 RPM, 14,400 RPD, ultra-fast 300+ tokens/sec.
* **Steps**:
  1. Sign up for a free Groq Cloud account.
  2. Navigate to **API Keys** $\to$ Click **"Create API Key"**.
  3. Copy the key and set in `.env`:
     ```env
     GROQ_API_KEY=gsk_...
     FALLBACK_MODEL=llama-3.3-70b-versatile
     GROQ_WHISPER_MODEL=whisper-large-v3
     ```

### 1.3 Qdrant Cloud (Managed Hybrid Vector DB)
* **Website**: [https://cloud.qdrant.io/](https://cloud.qdrant.io/)
* **Free Quota**: 1 Free Forever Cluster with 1GB RAM (~1,000,000 vectors).
* **Steps**:
  1. Register for a free Qdrant Cloud account.
  2. Click **"Create Cluster"** $\to$ Select **"Free Tier (1GB RAM)"** in your preferred region.
  3. Under **Access Keys**, click **"Generate API Key"**.
  4. Copy your Cluster Endpoint URL and API Key into `.env`:
     ```env
     QDRANT_URL=https://your-cluster-id.region.qdrant.io:6333
     QDRANT_API_KEY=your_qdrant_api_key_here
     QDRANT_COLLECTION=municipal_knowledge
     ```
  5. Run the cloud knowledge ingestion script to upload gazettes:
     ```bash
     uv run python -m backend.src.retriever.indexer
     ```

### 1.4 Supabase (PostgreSQL & Row-Level Security)
* **Website**: [https://supabase.com/](https://supabase.com/)
* **Free Quota**: 500MB PostgreSQL Database, 50,000 Monthly Active Users (MAU), 1GB Storage.
* **Steps**:
  1. Create a free organization & new project (e.g., `nagrik-ai`).
  2. Go to **Project Settings** $\to$ **API**:
     - Copy `Project URL` $\to$ `SUPABASE_URL`
     - Copy `anon public key` $\to$ `SUPABASE_ANON_KEY`
     - Copy `service_role secret` $\to$ `SUPABASE_SERVICE_ROLE_KEY`
     - Under **JWT Settings**, copy `JWT Secret` $\to$ `SUPABASE_JWT_SECRET`
  3. Go to **SQL Editor** and run the database migration schema from `ARCHITECTURE.md` (tables for `municipal_wards`, `municipal_departments`, `conversations`, `messages`, `grievances` with RLS).

### 1.5 Langfuse Cloud (Observability & Tracing)
* **Website**: [https://cloud.langfuse.com/](https://cloud.langfuse.com/)
* **Free Quota**: 50,000 free observations/month.
* **Steps**:
  1. Create a free project named `Nagrik AI`.
  2. Under **Settings** $\to$ **API Keys**, create a new key pair:
     ```env
     LANGFUSE_PUBLIC_KEY=pk-lf-...
     LANGFUSE_SECRET_KEY=sk-lf-...
     LANGFUSE_HOST=https://cloud.langfuse.com
     ```

---

## 🌐 2. Production Deployment Guide ($0 Hosting)

### 2.1 Backend Deployment on Render (Free Web Service)
1. Push your repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **"New +"** $\to$ **"Web Service"**.
3. Select your GitHub repository (`RatishPatil37/NAGRIK-AI`).
4. Configure the Web Service:
   - **Name**: `nagrik-ai-backend`
   - **Region**: Singapore or Frankfurt (closest to users)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install uv && uv sync --frozen
     ```
   - **Start Command**:
     ```bash
     uv run uvicorn backend.src.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: **Free** (512MB RAM, 0.1 CPU).
5. Under **Environment Variables**, paste the keys from your `.env` file (`GEMINI_API_KEY`, `GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `SUPABASE_URL`, etc.).
6. Click **"Deploy Web Service"**. Render will deploy your service at `https://nagrik-ai-backend.onrender.com`.

### 2.2 Frontend Deployment on Vercel
1. Log into [Vercel](https://vercel.com/) and click **"Add New..."** $\to$ **"Project"**.
2. Select your repository (`RatishPatil37/NAGRIK-AI`).
3. In the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and choose `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy! Vercel will provide an SSL-secured URL (e.g., `https://nagrik-ai.vercel.app`).
5. In your backend `.env` on Render, ensure `CORS_ORIGINS` includes your Vercel URL!

---

## 🧪 3. Verification & Acceptance Testing

Run the full automated test suite to ensure all invariants, latency limits, and escalation workflows pass:

```bash
uv run python -m pytest backend/tests/ -v
```

All 14 tests will verify:
* ✅ Emergency SOS triggers in $<5\text{ms}$ with zero-LLM hotline banner (101, 108, 112).
* ✅ Municipal Scope Gate rejects non-civic trivia in $<3\text{ms}$.
* ✅ Conversational Intent Gate handles pleasantries in $<2\text{ms}$ with zero citations.
* ✅ Parameter Completeness Gate returns Ward clarification cards for localized issues.
* ✅ RRF Hybrid Vector Retrieval and Post-Stream Citation Pruning eliminate hallucinated sources.
* ✅ Autonomous Escalation Engine generates `MNC-2026-WXX-DEPT-XXXX` tickets with enforceable statutory SLAs.
* ✅ Memory bounds remain strictly within Render's 512MB RAM limit.
