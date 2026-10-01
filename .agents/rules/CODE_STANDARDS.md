# 💻 Engineering & Code Standards

Follow these coding conventions across the Nagrik AI codebase:

1. **FastAPI Asynchronous Backend**:
   - Use `async def` for all I/O-bound endpoints (database calls, Qdrant queries, SSE token streams).
   - Pre-warm all FastEmbed models (dense and sparse) during startup inside the FastAPI `lifespan` handler.
   - Handle client disconnects gracefully by checking `await request.is_disconnected()` in streaming loops to abort upstream LLM calls.

2. **Memory Bounded Ingress (Render 512MB RAM)**:
   - File uploads must be read in 64KB chunks up to `MAX_UPLOAD_SIZE_MB` (20MB). Never call `await file.read()` on unbounded streams.
   - Check `Content-Length` headers before streaming.
   - Digest files with SHA-256 (`content_hash`) and reject duplicates with `409 Conflict`.
   - Rate limiters must bound tracking dictionaries to 10,000 active IPs and execute periodic TTL cleanup.

3. **Multi-Tenant Security & Auth**:
   - Validate Supabase JWTs cryptographically using Asymmetric JWKS (RS256/ES256).
   - Extract `user_id` strictly from token `sub`.
   - Guard development auth bypass strictly with `if getattr(settings, "TESTING", False):`. Never permit bypass in production or staging.
   - Filter Qdrant queries with `(scope == "public") OR (scope == "citizen" AND owner_user_id == verified_user_id)`.

4. **Frontend Architecture**:
   - React 18 with TypeScript, Vite, and Tailwind CSS.
   - Use `@microsoft/fetch-event-source` for SSE streams.
   - Implement "Zero AI Slop" UI: crisp typography, high contrast, persistent Ward HUD, Command Palette (`Cmd+K`), and `@media print` printable whitepaper dossier styling.
   - Sanitize all markdown link protocols: allow only `http:`, `https:`, `mailto:`, `tel:`, and `#cite-`.
