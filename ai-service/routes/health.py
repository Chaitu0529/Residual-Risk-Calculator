"""Health check endpoint."""
import os
import logging
from flask import Blueprint, jsonify
import redis

logger = logging.getLogger(__name__)
health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    """Service health check — verifies Groq API key and Redis connectivity."""
    checks = {}

    # Check GROQ API key
    groq_key = os.getenv("GROQ_API_KEY", "")
    checks["groq_api_key"] = "configured" if groq_key else "missing"

    # Check Redis
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(redis_url, socket_timeout=2)
        r.ping()
        checks["redis"] = "healthy"
    except Exception as e:
        checks["redis"] = f"unavailable: {e}"

    overall = (
        "healthy"
        if checks["groq_api_key"] == "configured"
        else "degraded"
    )

    return jsonify({
        "status": overall,
        "service": "tool114-ai-service",
        "model": "llama-3.3-70b-versatile",
        "checks": checks,
    }), 200
