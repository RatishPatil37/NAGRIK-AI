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

    # 3. Vector Store Initialization
    print("[Startup] Ensuring Qdrant Hybrid Collection...")
    try:
        hybrid_retriever.ensure_collection()
    except Exception as e:
        print(f"[Startup] WARNING: Non-fatal error during Qdrant collection setup: {e}")

    print("✅ Nagrik AI Gateway is online and ready for citizen traffic.")
    print("=" * 60)
    yield
    print("🛑 Shutting down Nagrik AI Gateway...")


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
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?",
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
        "vector_store": "qdrant_cloud" if settings.is_qdrant_cloud_configured else "qdrant_local",
        "database": "supabase" if settings.is_supabase_configured else "sqlite_local",
        "langfuse_tracing": settings.is_langfuse_configured,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Nagrik AI (नागरिक AI) Municipal Engine API Gateway.",
        "documentation": "/docs",
        "health": "/health",
        "api_v1": "/api/v1",
    }
