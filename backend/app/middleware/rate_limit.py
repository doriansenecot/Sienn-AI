"""
Rate limiting middleware using Redis.
"""

import time
from typing import Callable

import redis
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using Redis for distributed rate limiting.

    Configuration via settings:
    - RATE_LIMIT_ENABLED: Enable/disable rate limiting
    - RATE_LIMIT_REQUESTS: Max requests per window
    - RATE_LIMIT_WINDOW: Time window in seconds
    """

    def __init__(self, app, redis_client: redis.Redis = None):
        super().__init__(app)
        self.enabled = getattr(settings, "rate_limit_enabled", False)
        self.max_requests = getattr(settings, "rate_limit_requests", 100)
        self.window_seconds = getattr(settings, "rate_limit_window", 60)

        if self.enabled:
            if redis_client:
                self.redis = redis_client
            else:
                self.redis = redis.from_url(settings.redis_url, decode_responses=True)
            logger.info(f"Rate limiting enabled: {self.max_requests} requests per {self.window_seconds}s")
        else:
            self.redis = None
            logger.info("Rate limiting disabled")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""

        # Skip rate limiting if disabled or for health checks
        if not self.enabled or request.url.path in ["/health", "/api/health"]:
            return await call_next(request)

        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"

        # Generate Redis key
        key = f"rate_limit:{client_ip}:{int(time.time() // self.window_seconds)}"

        try:
            # Increment counter
            current_count = self.redis.incr(key)

            # Set expiration on first request in window
            if current_count == 1:
                self.redis.expire(key, self.window_seconds)

            # Check if limit exceeded
            if current_count > self.max_requests:
                logger.warning(
                    f"Rate limit exceeded for {client_ip}",
                    extra={
                        "client_ip": client_ip,
                        "count": current_count,
                        "limit": self.max_requests,
                    },
                )
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded. Please try again later.",
                        "limit": self.max_requests,
                        "window_seconds": self.window_seconds,
                    },
                )

            # Add rate limit headers
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(self.max_requests)
            response.headers["X-RateLimit-Remaining"] = str(max(0, self.max_requests - current_count))
            response.headers["X-RateLimit-Reset"] = str(
                int(time.time() // self.window_seconds + 1) * self.window_seconds
            )

            return response

        except redis.RedisError as e:
            logger.error(f"Redis error in rate limiting: {e}")
            # If Redis fails, allow the request (fail open)
            return await call_next(request)
