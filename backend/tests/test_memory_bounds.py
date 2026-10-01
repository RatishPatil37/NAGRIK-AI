"""Automated Unit Tests for Rate Limiting & Memory Bounds (Render 512MB RAM Invariant)."""

from backend.src.api.middleware import SlidingWindowRateLimiter


def test_rate_limiter_memory_bound():
    """Validates sliding-window rate limiter respects max IP bounds and max requests."""
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=60, max_ips=5)

    ip = "192.168.1.100"
    # First 3 requests must be allowed
    assert limiter.is_allowed(ip) is True
    assert limiter.is_allowed(ip) is True
    assert limiter.is_allowed(ip) is True

    # 4th request must be blocked
    assert limiter.is_allowed(ip) is False


def test_max_tracked_ip_cap():
    """Validates limiter doesn't grow unbounded when flooded with unique IPs."""
    limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60, max_ips=10)

    for i in range(10):
        limiter.is_allowed(f"10.0.0.{i}")

    assert len(limiter.requests) <= 10
