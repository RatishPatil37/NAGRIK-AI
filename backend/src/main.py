"""Nagrik AI - FastAPI Application Gateway.
Asynchronous REST & Server-Sent Events (SSE) Municipal Service Engine.
"""
import sys
from contextlib import asynccontextmanager

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.src.api.middleware import RateLimitMiddleware
from backend.src.api.routes import admin, chat, documents, grievances, voice, wards
from backend.src.config import settings
from backend.src.database.adapter import db_adapter
from backend.src.retriever.hybrid_search import hybrid_retriever
from backend.src.retriever.indexer import auto_seed_if_empty
from backend.src.retriever.prewarm import ModelPrewarmer


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager:
    1. Pre-warms FastEmbed dense ONNX and sparse BM25 models.
    2. Initializes database schema & seeds default municipal wards/departments.
    3. Ensures Qdrant collection is ready with dense and sparse configs.
    """
    print("=" * 60)
    print("🏛️  Starting Nagrik AI (नागरिक AI) Municipal Engine...")
    print("=" * 60)

    # 1. Database Initialization
    print("[Startup] Initializing Database Adapter...")
    try:
        await db_adapter.initialize()
    except Exception as e:
        print(f"[Startup] WARNING: Non-fatal error during database initialization: {e}")

    # 2. Model Pre-warming
    print("[Startup] Pre-warming FastEmbed Dense & Sparse models...")
    try:
        ModelPrewarmer.load_and_prewarm()
    except Exception as e:
        print(f"[Startup] WARNING: FastEmbed prewarm non-fatal error: {e}")

    # 3. Vector Store Initialization & Auto-Seed
    print("[Startup] Ensuring Qdrant Hybrid Collection...")
    try:
        hybrid_retriever.ensure_collection()
        auto_seed_if_empty()
    except Exception as e:
        print(f"[Startup] WARNING: Non-fatal error during Qdrant collection setup: {e}")

    print("[OK] Nagrik AI Gateway is online and ready for citizen traffic.")
    print("=" * 60)
    yield
    print("[SHUTDOWN] Shutting down Nagrik AI Gateway...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Official AI-Driven Municipal Knowledge Assistant & Executive Decision Support Platform",
    lifespan=lifespan,
)

# -------------------------------------------------------------
# Middleware Configuration
# -------------------------------------------------------------
cors_origins = list(settings.CORS_ORIGINS)
if settings.CORS_URL and settings.CORS_URL not in cors_origins:
    cors_origins.append(settings.CORS_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|[a-z0-9-]+\.vercel\.app|[a-z0-9-]+\.onrender\.com)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

# -------------------------------------------------------------
# Router Registrations under /api/v1
# -------------------------------------------------------------
API_PREFIX = "/api/v1"
app.include_router(chat.router, prefix=API_PREFIX)
app.include_router(grievances.router, prefix=API_PREFIX)
app.include_router(wards.router, prefix=API_PREFIX)
app.include_router(documents.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(voice.router, prefix=API_PREFIX)


@app.get("/health", tags=["Health & Status"])
async def health_check():
    """Health status and runtime telemetry."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "primary_model": settings.PRIMARY_MODEL,
        "secondary_model": settings.SECONDARY_MODEL,
        "fallback_model": settings.FALLBACK_MODEL,
        "vector_store": "qdrant_cloud" if hybrid_retriever.is_cloud_active else "qdrant_local",
        "qdrant_telemetry": {
            "configured": settings.is_qdrant_cloud_configured,
            "cloud_active": hybrid_retriever.is_cloud_active,
            "url": settings.QDRANT_URL,
            "key_present": bool(settings.QDRANT_API_KEY),
            "collection": settings.QDRANT_COLLECTION,
        },
        "database": "supabase" if settings.is_supabase_configured else "sqlite_local",
        "langfuse_tracing": settings.is_langfuse_configured,
    }


@app.get("/api/v1/keep-alive", tags=["Health & Status"])
@app.get("/keep-alive", tags=["Health & Status"])
async def keep_alive():
    """All-in-One Keep-Alive endpoint optimized for cron-job.org.
    Resets inactivity timers for Render (keeps worker awake),
    Supabase (executes 1-row fetch to prevent 7-day auto-pause),
    and Qdrant Cloud (pings vector cluster to prevent cluster dormancy).
    """
    import asyncio
    import time
    start = time.time()
    results = {
        "status": "alive",
        "render": "online",
        "supabase": "skipped",
        "qdrant": "skipped",
    }

    # 1. Ping Supabase to reset 7-day pause timer
    try:
        if db_adapter.is_supabase and db_adapter.supabase:
            await asyncio.to_thread(
                lambda: db_adapter.supabase.table("wards").select("id").limit(1).execute()
            )
            results["supabase"] = "active"
        else:
            results["supabase"] = "local_sqlite_active"
    except Exception as e:
        results["supabase"] = f"error: {str(e)}"

    # 2. Ping Qdrant Cloud to reset cluster suspension timer
    try:
        if hybrid_retriever.qdrant_client:
            await asyncio.to_thread(hybrid_retriever.qdrant_client.get_collections)
            results["qdrant"] = "active"
    except Exception as e:
        results["qdrant"] = f"error: {str(e)}"

    results["latency_ms"] = round((time.time() - start) * 1000, 2)
    return results


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Nagrik AI (नागरिक AI) Municipal Engine API Gateway.",
        "documentation": "/docs",
        "health": "/health",
        "keep_alive": "/api/v1/keep-alive",
        "api_v1": "/api/v1",
    }

