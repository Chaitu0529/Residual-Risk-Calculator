"""
Tool-114 AI Service — Flask Application Entry Point
"""
import os
import logging
from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

from routes.describe import describe_bp
from routes.recommend import recommend_bp
from routes.report import report_bp
from routes.health import health_bp

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    # ── Rate Limiting ──────────────────────────────────────────────────────────
    redis_host     = os.getenv("REDIS_HOST", "localhost")
    redis_port     = os.getenv("REDIS_PORT", "6379")
    redis_password = os.getenv("REDIS_PASSWORD", "")
    if redis_password:
        redis_url = f"redis://:{redis_password}@{redis_host}:{redis_port}/0"
    else:
        redis_url = f"redis://{redis_host}:{redis_port}/0"
    # Allow override with a full URL
    redis_url = os.getenv("REDIS_URL", redis_url)
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["30 per minute"],
        storage_uri=redis_url,
        strategy="fixed-window",
    )

    # ── Security Headers ───────────────────────────────────────────────────────
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
        return response

    # ── Register Blueprints ────────────────────────────────────────────────────
    app.register_blueprint(health_bp)
    app.register_blueprint(describe_bp)
    app.register_blueprint(recommend_bp)
    app.register_blueprint(report_bp)

    # ── Error Handlers ─────────────────────────────────────────────────────────
    @app.errorhandler(429)
    def rate_limit_handler(e):
        return {
            "error": "Rate limit exceeded",
            "message": "Too many requests. Limit is 30 per minute.",
        }, 429

    @app.errorhandler(400)
    def bad_request(e):
        return {"error": "Bad Request", "message": str(e)}, 400

    @app.errorhandler(500)
    def server_error(e):
        logger.error("Internal server error: %s", e)
        return {"error": "Internal Server Error", "message": "AI service error"}, 500

    logger.info("Tool-114 AI Service started successfully")
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
