# 🏛️ Nagrik AI (नागरिक AI)

### Enterprise Municipal RAG & Executive Decision Support Operating System

<p align="center">
  <a href="https://nagrik-ai.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-nagrik--ai.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="https://nagrik-ai-wvuw.onrender.com/health"><img src="https://img.shields.io/badge/API%20Gateway-Render%20Live-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="API Gateway" /></a>
  <img src="https://img.shields.io/badge/Qdrant%20Cloud-Hybrid%20Dense%2BSparse%20RRF-DC2626?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant Cloud" />
  <img src="https://img.shields.io/badge/Primary%20LLM-Gemini%203.7%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini 3.7 Flash" />
  <img src="https://img.shields.io/badge/License-MIT-gray?style=for-the-badge" alt="License MIT" />
</p>

---

## ⚡ Overview

**Nagrik AI (नागरिक AI)** is a production-hardened municipal intelligence engine and civic decision support platform built for Urban Local Bodies (Municipal Corporations). Grounded strictly in official Ministry of Housing and Urban Affairs (**MoHUA**) gazettes, **CPHEEO** water/sanitation manuals, and state municipal corporation bylaws, it provides instant, non-hallucinatory civic advisory and autonomous grievance resolution.

### 🌐 Live Cloud Deployments
* **Citizen Portal & Administrative Workstation**: [https://nagrik-ai.vercel.app](https://nagrik-ai.vercel.app)
* **Backend API Gateway**: [https://nagrik-ai-wvuw.onrender.com](https://nagrik-ai-wvuw.onrender.com)
* **Runtime Health & Telemetry**: [https://nagrik-ai-wvuw.onrender.com/health](https://nagrik-ai-wvuw.onrender.com/health)
* **All-in-One Keep-Alive Route**: [https://nagrik-ai-wvuw.onrender.com/api/v1/keep-alive](https://nagrik-ai-wvuw.onrender.com/api/v1/keep-alive)

---

## 🚀 Key Features

### 1. Zero-Hallucination Conversational RAG
* **Statutory Grounding**: Every answer is verified against 2026 Municipal Gazettes with strict bracketed citation markers `[S1]`, `[S2]`.
* **Devanagari Cross-Script Normalizer**: Citizen queries in Hindi or Marathi (e.g. *बांधकाम परवानगी*, *पाणीपुरवठा*, *कचरा*) seamlessly retrieve authoritative English gazettes via statutory semantic bridges.
* **Civic Reranker Stage**: Pulls top 8 candidates and reranks down to the top 5 highest-density statutory sections.
* **Strict Rule 2 Enforcement**: If a regulation is absent from the knowledge base, the model explicitly refuses to guess, directing the citizen to the physical Ward Office.

### 2. Google Gemini-Style Conversation Sidebar
* **Obsidian Floating Drawer**: Toggleable via `⌘O` / `Ctrl+O`.
* **Chronological Grouping**: Organizes chats into **Today**, **Previous 7 Days**, and **Older**.
* **Strict 20-Chat FIFO Auto-Pruning**: Automatically prunes sessions beyond 20 directly in browser `localStorage`. Zero memory overhead on Render or Vercel.

### 3. Studio Neural Speech & Continuous Chunking
* **Dual TTS Engines**: Microsoft Edge Neural TTS (`hi-IN-SwaraNeural`, `mr-IN-AarohiNeural`, `en-IN-NeerjaNeural`) with instant fallback to browser Web Speech API.
* **Sentence-Level Chunking**: Splits responses by sentence punctuation (`.`, `?`, `!`, `।`), queueing them sequentially to overcome Chrome's 15-second speech synthesis garbage collection timeout.
* **Full Audio Control**: User auto-play toggle (Speaker ON/OFF), animated soundwave playback indicator, and instant "Stop Audio" button.

### 4. Living Ward Profile HUD & Geolocation
* **GPS Auto-Detection**: Uses Haversine distance calculations to pinpoint the citizen's exact municipal ward (Wards 1–10 across Zones A–E) in under 50ms.
* **Live Ward Bylaws**: Instant access to Ward Officer contacts, helpline numbers, and local solid waste pickup schedules.

### 5. Ward Admin Decision Support Center
* **Spatial Grievance Heatmap**: Real-time distribution across wards with $2\sigma$ statistical anomaly detection.
* **SLA Countdown Engine**: Real-time tracking of open tickets by department (Water, Sanitation, Roads, Electrical, Revenue, Town Planning) with critical countdown alerts.

### 6. The "All-in-One" Zero-Cost Keep-Alive Engine
* Designed for [cron-job.org](https://cron-job.org/) to ping `/api/v1/keep-alive` every 14 minutes.
* **Render**: Keeps the web service awake and pre-warmed.
* **Supabase**: Executes a 1-row fetch (`wards.select('id').limit(1)`), resetting the **7-day inactivity pause timer**.
* **Qdrant Cloud**: Calls `get_collections()`, resetting the **free vector cluster dormancy counter**.

---

## 🏛️ System Architecture

```text
[Citizen Voice / Text / GPS]
          │
          ▼
[Vercel Edge React 19 Frontend] (⌘O Gemini Sidebar, Edge Neural Audio)
          │  SSE Stream
          ▼
[FastAPI Gateway on Render]
    ├── 1. Sliding-Window Rate Limiter (15 RPM, 10K IPs)
    ├── 2. Jailbreak & Prompt-Injection Filter (<1ms)
    ├── 3. Emergency SOS Filter (<2ms, Fire 101, Police 100, Med 108)
    ├── 4. Municipal Scope Pre-Gate (<3ms)
    └── 5. Devanagari Cross-Script Normalizer (<3ms)
          │
          ▼
[Qdrant Cloud Hybrid Search] ── Server-Side Reciprocal Rank Fusion (RRF)
    ├── Dense Vectors: 384d FastEmbed ONNX (all-MiniLM-L6-v2)
    └── Sparse Lexical: FastEmbed BM25 (Qdrant/bm25)
          │  (Top 8 Candidates)
          ▼
[Civic Statutory Reranker] ──── Filters & Reranks to Top 5 High-Density Chunks
          │
          ▼
[3-Tier Resilient Generation Pipeline]
    ├── Tier 1: Google Gemini 3.7 Flash (Primary, 600ms transient retry)
    ├── Tier 2: Google Gemini 3.5 Flash-Lite (Surge Escalation)
    └── Tier 3: Groq Llama 3.3 70B (Emergency Provider Redundancy)
          │
          ▼
[Post-Stream Verification & Observability]
    ├── Strict Citation Pruner (Ensures [Sx] grounding)
    ├── Autonomous Grievance Triage (MCGM-2026-WXX-DEPT-XXXX)
    └── Supabase PostgreSQL / Local SQLite (WAL Mode)
```

---

## 📚 Statutory Knowledge Base Corpus

Nagrik AI is grounded in official national and state municipal statutes:
1. **MoHUA Model Building Bye-Laws & OBPAS Regulations 2026**: Setbacks, floor space indices (FSI), height restrictions, and 15-day online building approval statutory SLAs.
2. **CPHEEO Manual on Water Supply and Treatment**: Per capita water supply norms (135 LPCD), residual pressure requirements, contamination thresholds, and pipeline leak repair SLAs.
3. **Solid Waste Management Rules & Plastic Waste Management Bylaws**: Source segregation requirements, commercial dumping penalties, and door-to-door collection schedules.
4. **Municipal Property Tax & Revenue Bylaws**: Capital value assessment formulas, general tax percentages, early payment rebates (5%), and penalty charges.
5. **URDPFI Guidelines (Urban & Regional Development Plans Formulation & Implementation)**.

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
* Python 3.11+
* Node.js 20+ & `npm`
* Modern Package Manager: `uv` (recommended) or `pip`

### Step 1: Clone Repository
```bash
git clone https://github.com/RatishPatil37/NAGRIK-AI.git
cd "NAGRIK-AI"
```

### Step 2: Backend Setup
```bash
# Create virtual environment & install dependencies
uv sync

# Configure environment variables
cp .env.example .env
# Add your GEMINI_API_KEY and QDRANT credentials in .env

# Start FastAPI Gateway
uv run uvicorn backend.src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Security & Pentesting Compliance

| Protection Layer | Threat Vector | Production Defense |
| :--- | :--- | :--- |
| **Prompt Injection Defense** | Jailbreak & system prompt extraction | Deterministic regex filter in `scope_gate.py` intercepts jailbreak patterns with zero LLM consumption. |
| **Path Traversal Guard** | Directory traversal on document downloads | Strict `target_path.resolve().is_relative_to(corpus_dir)` validation. |
| **Memory Exhaustion (OOM)** | Large file upload flooding | `asyncio.Semaphore(2)` concurrency limit and 10MB ceiling for Render 512MB RAM survival. |
| **Database Concurrency** | SQLite file lock contention | Initialized with `PRAGMA journal_mode=WAL;` and `PRAGMA busy_timeout=5000;`. |
| **Zombie SSE Tasks** | Disconnected client token wastage | `request.is_disconnected()` checked on every stream token iteration. |

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
