"""Security middleware: Sliding-window rate limiter with bounded memory (max 10K IPs)
and streaming upload guard.
"""

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from backend.src.config import settings


class SlidingWindowRateLimiter:
    """Sliding-window in-memory rate limiter with maximum 10,000 tracked IPs
    and periodic TTL pruning to prevent memory exhaustion on Render free tier.
    """
    def __init__(self, max_requests: int = 15, window_seconds: int = 60, max_ips: int = 10000):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.max_ips = max_ips
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.last_cleanup = time.time()

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()

        # Periodic cleanup of expired IPs every 60 seconds
        if now - self.last_cleanup > 60:
            self._prune_expired(now)
            self.last_cleanup = now

        # Prevent unbounded dictionary growth
        if len(self.requests) > self.max_ips and client_ip not in self.requests:
            # Force prune
            self._prune_expired(now)
            if len(self.requests) > self.max_ips:
                return False

        # Filter timestamps within current window
        cutoff = now - self.window_seconds
        valid_timestamps = [ts for ts in self.requests[client_ip] if ts > cutoff]
        self.requests[client_ip] = valid_timestamps

        if len(valid_timestamps) >= self.max_requests:
            return False

        self.requests[client_ip].append(now)
        return True

    def _prune_expired(self, now: float):
        cutoff = now - self.window_seconds
        expired_ips = [ip for ip, timestamps in self.requests.items() if not timestamps or timestamps[-1] <= cutoff]
        for ip in expired_ips:
            del self.requests[ip]


rate_limiter = SlidingWindowRateLimiter(
    max_requests=settings.RATE_LIMIT_ANON_RPM,
    window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
    max_ips=settings.RATE_LIMIT_MAX_TRACKED_IPS,
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude static assets or health checks
        if request.url.path in ["/health", "/", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        # Extract real client IP from X-Forwarded-For (set by Render/Vercel proxies).
        # request.client.host is always the internal load balancer behind reverse proxies.
        # Validate that the XFF header looks like an IP to prevent header-injection attacks.
        xff = request.headers.get("X-Forwarded-For", "")
        if xff:
            # XFF may be a comma-separated list; take the leftmost (original client).
            candidate = xff.split(",")[0].strip()
            # Basic validation: allow IPv4 and IPv6 characters only.
            import re as _re
            if _re.match(r'^[\d\.a-fA-F:]{3,45}$', candidate):
                client_ip = candidate
            else:
                client_ip = request.client.host if request.client else "127.0.0.1"
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        if not rate_limiter.is_allowed(client_ip):
            return Response(
                content="Rate limit exceeded. Please wait a minute before making more requests.",
                status_code=429,
                media_type="text/plain",
            )

        return await call_next(request)
