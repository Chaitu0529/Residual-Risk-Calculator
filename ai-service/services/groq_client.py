"""
GroqClient — Llama-3.3-70B with retry logic, timeout, and security validation.
"""
import os
import time
import logging
import hashlib
import json
import re

import bleach
import redis
from groq import Groq, APITimeoutError, APIConnectionError, RateLimitError

logger = logging.getLogger(__name__)

# ── Redis Cache ──────────────────────────────────────────────────────────────
def _get_redis_client():
    try:
        # Support both a full REDIS_URL and separate host/port/password vars
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            host = os.getenv("REDIS_HOST", "localhost")
            port = os.getenv("REDIS_PORT", "6379")
            password = os.getenv("REDIS_PASSWORD", "")
            if password:
                redis_url = f"redis://:{password}@{host}:{port}/0"
            else:
                redis_url = f"redis://{host}:{port}/0"
        client = redis.from_url(redis_url, decode_responses=True, socket_timeout=2)
        client.ping()
        return client
    except Exception as e:
        logger.warning("Redis unavailable: %s", e)
        return None


_redis = _get_redis_client()
CACHE_TTL = 600  # 10 minutes

# ── Prompt Injection Patterns ────────────────────────────────────────────────
_INJECTION_PATTERNS = [
    r"ignore\s+(previous|all|above)\s+instructions?",
    r"you\s+are\s+now\s+(a|an)",
    r"forget\s+(everything|all|previous)",
    r"act\s+as\s+(a|an|if)",
    r"jailbreak",
    r"(bypass|override)\s+(safety|security|restrictions?|guidelines?)",
    r"<\s*script\s*>",
    r"(system|user|assistant)\s*prompt",
    r"prompt\s*(leak|injection|hijack)",
    r"reveal\s+(your|the)\s+(instructions?|system|prompt)",
    r"do\s+anything\s+now",
    r"DAN\s+mode",
]

_INJECTION_RE = [re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS]


def _detect_prompt_injection(text: str) -> bool:
    """Returns True if potential prompt injection is detected."""
    if not text:
        return False
    for pattern in _INJECTION_RE:
        if pattern.search(text):
            return True
    return False


def _sanitize_input(value) -> str:
    """Strip HTML, truncate, and sanitize string input."""
    if value is None:
        return ""
    text = str(value)
    # Strip HTML tags
    text = bleach.clean(text, tags=[], strip=True)
    # Remove null bytes and control characters
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Truncate to safe length
    return text[:2000].strip()


def _make_cache_key(endpoint: str, payload: dict) -> str:
    """SHA256-based cache key from endpoint + sorted payload."""
    serialized = json.dumps(payload, sort_keys=True, default=str)
    raw = f"{endpoint}:{serialized}"
    return "ai_cache:" + hashlib.sha256(raw.encode()).hexdigest()


class GroqClient:
    """
    Wraps the Groq API for Llama-3.3-70B with:
    - Retry logic (3 attempts, exponential backoff)
    - Timeout handling (30 s per request)
    - Prompt injection detection
    - Input sanitization
    - Redis response caching (SHA256 keys, 10-min TTL)
    """

    MODEL = "llama-3.3-70b-versatile"
    MAX_RETRIES = 3
    TIMEOUT = 30
    BACKOFF_BASE = 2

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY environment variable is not set")
        self._client = Groq(api_key=api_key, timeout=self.TIMEOUT)

    def complete(self, system_prompt: str, user_message: str,
                 cache_key_payload: dict | None = None,
                 endpoint: str = "generic") -> str:
        """
        Send a completion request with retry, caching, and injection detection.

        Args:
            system_prompt: The system-level prompt string.
            user_message:  The user-facing content (sanitized before use).
            cache_key_payload: Dict used to build the SHA256 cache key.
            endpoint: Logical name for cache key namespace.

        Returns:
            AI-generated response string.
        """
        # ── Sanitize inputs ────────────────────────────────────────────────
        clean_message = _sanitize_input(user_message)
        clean_system = _sanitize_input(system_prompt)

        # ── Injection detection ────────────────────────────────────────────
        for field_name, field_value in [("user_message", clean_message),
                                         ("system_prompt", clean_system)]:
            if _detect_prompt_injection(field_value):
                logger.warning("Prompt injection detected in %s", field_name)
                raise ValueError(f"Input rejected: potential prompt injection in {field_name}")

        # ── Cache lookup ───────────────────────────────────────────────────
        cache_payload = cache_key_payload or {"sys": clean_system, "usr": clean_message}
        cache_key = _make_cache_key(endpoint, cache_payload)

        if _redis:
            try:
                cached = _redis.get(cache_key)
                if cached:
                    logger.debug("Cache HIT for key %s", cache_key[:16])
                    return cached
            except Exception as e:
                logger.warning("Redis get failed: %s", e)

        # ── API call with retry ────────────────────────────────────────────
        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info("Groq request attempt %d/%d [%s]",
                            attempt, self.MAX_RETRIES, endpoint)
                response = self._client.chat.completions.create(
                    model=self.MODEL,
                    messages=[
                        {"role": "system", "content": clean_system},
                        {"role": "user",   "content": clean_message},
                    ],
                    temperature=0.4,
                    max_tokens=2048,
                )
                result = response.choices[0].message.content.strip()

                # ── Cache the result ───────────────────────────────────────
                if _redis and result:
                    try:
                        _redis.setex(cache_key, CACHE_TTL, result)
                    except Exception as e:
                        logger.warning("Redis set failed: %s", e)

                return result

            except RateLimitError as e:
                logger.warning("Groq rate limit hit: %s", e)
                last_error = e
                time.sleep(self.BACKOFF_BASE ** attempt)

            except APITimeoutError as e:
                logger.warning("Groq timeout on attempt %d: %s", attempt, e)
                last_error = e
                time.sleep(self.BACKOFF_BASE ** (attempt - 1))

            except APIConnectionError as e:
                logger.error("Groq connection error: %s", e)
                last_error = e
                break

            except Exception as e:
                logger.error("Unexpected Groq error: %s", e)
                last_error = e
                break

        raise RuntimeError(f"Groq API failed after {self.MAX_RETRIES} attempts: {last_error}")
