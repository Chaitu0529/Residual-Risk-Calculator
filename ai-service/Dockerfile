# =============================================
# Tool-114 AI Service — Dockerfile
# =============================================
FROM python:3.11-slim

WORKDIR /app

# Security: create non-root user
RUN addgroup --system aigroup && adduser --system --ingroup aigroup aiuser

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set ownership
RUN chown -R aiuser:aigroup /app

USER aiuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", \
     "--timeout", "120", "--log-level", "info", "app:app"]
