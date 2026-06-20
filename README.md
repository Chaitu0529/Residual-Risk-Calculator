# Tool-114 — Residual Risk Calculator

An AI-powered enterprise risk management platform that calculates inherent and residual risk scores, generates AI-driven descriptions, recommendations, and board-level reports.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Network                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │     Backend      │    │  AI Service  │  │
│  │  React 18    │───▶│  Spring Boot 3   │───▶│  Flask 3 /   │  │
│  │  Nginx 1.25  │    │  Java 17 / 8080  │    │  Python 3.11 │  │
│  │  Port: 3000  │    │                  │    │  Port: 5000  │  │
│  └──────────────┘    └────────┬─────────┘    └──────────────┘  │
│                               │                                 │
│              ┌────────────────┴──────────────┐                  │
│              ▼                               ▼                  │
│  ┌────────────────────┐      ┌───────────────────────────┐      │
│  │    PostgreSQL 15   │      │        Redis 7            │      │
│  │  Risk DB / Port    │      │  Cache + JWT Blacklist     │      │
│  │  5432              │      │  Port 6379                │      │
│  └────────────────────┘      └───────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Component Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts | SPA dashboard, risk management UI |
| Backend | Spring Boot 3.2, Java 17, Spring Security | REST API, JWT auth, business logic |
| AI Service | Flask 3, Python 3.11, Groq API | LLM-powered risk analysis |
| Database | PostgreSQL 15 | Persistent data store |
| Cache | Redis 7 | API caching, JWT blacklist, rate limiting |

---

## Features

- **Risk Records** — Create, read, update, soft-delete with full audit trail
- **Risk Calculations** — Inherent Risk = L × I; Residual Risk = IR × (100-CE)/100
- **Risk Levels** — LOW (0-20), MEDIUM (21-50), HIGH (51-80), CRITICAL (81-100)
- **AI Descriptions** — Professional risk descriptions via Llama-3.3-70B
- **AI Recommendations** — SMART mitigation recommendations with priority/type
- **AI Reports** — Board-level executive risk reports
- **Dashboard** — KPI cards + pie/bar/line charts via Recharts
- **Analytics** — Heat maps, radar charts, scatter plots, category breakdowns
- **Search & Filter** — Keyword, category, status, level, date range + pagination
- **Audit Log** — Every action logged with user, IP, before/after values
- **JWT Auth** — Access + refresh tokens, Redis blacklist on logout
- **RBAC** — ADMIN (full CRUD) / USER (read-only)
- **Email Notifications** — HTML alerts for critical risks, daily summaries
- **CSV Export** — Full risk register download
- **File Upload** — PDF/DOCX attachments (5 MB max)
- **Swagger UI** — Full API documentation at `/swagger-ui.html`
- **Docker Deployment** — Single `docker-compose up --build` to run everything

---

## Quick Start (Docker)

### Prerequisites
- Docker Desktop 4.x+
- Docker Compose 2.x+
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone and configure

```bash
git clone <repo-url> tool114
cd tool114
cp .env.example .env
```

Edit `.env` and set your `GROQ_API_KEY`:

```env
GROQ_API_KEY=your_actual_groq_api_key
```

### 2. Start all services

```bash
docker-compose up --build
```

First build takes 3–5 minutes (Maven download + npm install). Subsequent starts are faster.

### 3. Open the application

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | Main application |
| Swagger UI | http://localhost:8080/swagger-ui.html | API docs |
| AI Health | http://localhost:5000/health | AI service status |
| Actuator | http://localhost:8080/actuator/health | Backend health |

### 4. Default credentials

| Username | Password | Role |
|----------|---------|------|
| `admin` | `Admin@123456` | ADMINISTRATOR |
| `analyst` | `User@123456` | ANALYST (read-only) |

---

## Local Development

### Backend

**Prerequisites:** Java 17, Maven 3.9+, PostgreSQL 15, Redis 7

```bash
# Start infrastructure only
docker-compose up postgres redis -d

# Run backend
cd backend
./mvnw spring-boot:run
```

Backend starts on port 8080. Flyway runs migrations automatically.

### Frontend

**Prerequisites:** Node.js 20+

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on http://localhost:3000 and proxies API calls to backend:8080.

### AI Service

**Prerequisites:** Python 3.11+, pip

```bash
cd ai-service
pip install -r requirements.txt
export GROQ_API_KEY=your_key
export REDIS_HOST=localhost
export REDIS_PORT=6379
python app.py
```

AI service starts on port 5000.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `POSTGRES_DB` | `riskdb` | No | Database name |
| `POSTGRES_USER` | `riskuser` | No | Database user |
| `POSTGRES_PASSWORD` | `riskpassword` | **Yes** | Database password |
| `REDIS_PASSWORD` | `redispassword` | **Yes** | Redis auth password |
| `JWT_SECRET` | (base64 default) | **Yes** | JWT signing secret (min 32 bytes) |
| `JWT_EXPIRATION_MS` | `3600000` | No | Access token TTL (1 hour) |
| `JWT_REFRESH_EXPIRATION_MS` | `86400000` | No | Refresh token TTL (24 hours) |
| `GROQ_API_KEY` | — | **Yes** | Groq LLM API key |
| `MAIL_HOST` | `smtp.gmail.com` | No | SMTP server |
| `MAIL_PORT` | `587` | No | SMTP port |
| `MAIL_USERNAME` | — | No | SMTP username |
| `MAIL_PASSWORD` | — | No | SMTP password |
| `MAIL_FROM` | `noreply@tool114.local` | No | From email address |

---

## API Documentation

Full interactive docs at http://localhost:8080/swagger-ui.html when running.

### Authentication
```
POST /auth/register     Register new user
POST /auth/login        Login → returns accessToken + refreshToken
POST /auth/refresh      Refresh access token
POST /auth/logout       Invalidate token (blacklisted in Redis)
```

### Risk Records
```
GET    /api/risks           List all (paginated)
GET    /api/risks/{id}      Get single record
POST   /api/risks           Create (ADMIN only)
PUT    /api/risks/{id}      Update (ADMIN only)
DELETE /api/risks/{id}      Soft delete (ADMIN only)
GET    /api/risks/search    Search + filter
POST   /api/risks/{id}/ai/describe      Generate AI description
POST   /api/risks/{id}/ai/recommend     Generate AI recommendations
POST   /api/risks/{id}/ai/report        Generate AI report
POST   /api/risks/{id}/upload           Upload PDF/DOCX attachment
```

### Dashboard
```
GET /api/stats          Dashboard KPIs and metrics
```

### Export
```
GET /export/csv         Download all risk records as CSV
```

### Audit Log (Admin only)
```
GET /api/audit                  Paginated audit log
GET /api/audit/recent           Last 50 entries
GET /api/audit/user/{username}  Entries by user
```

---

## Risk Calculation

```
Inherent Risk  = Likelihood × Impact
Residual Risk  = Inherent Risk × (100 − Control Effectiveness) / 100

Risk Level:
  0  – 20  →  LOW
  21 – 50  →  MEDIUM
  51 – 80  →  HIGH
  81 – 100 →  CRITICAL
```

---

## Testing

### Backend Tests
```bash
cd backend
./mvnw test
./mvnw test -Dspring.profiles.active=test
./mvnw jacoco:report   # Coverage report at target/site/jacoco/index.html
```

10+ unit and integration tests covering:
- JWT token generation/validation
- Risk formula calculations
- CRUD service operations
- Controller authentication/authorization
- CSV export correctness

### Frontend Tests
```bash
cd frontend
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Tests cover utility functions (risk calculations, badge classes, formatters).

### AI Service Tests
```bash
cd ai-service
pip install pytest pytest-mock
pytest tests/ -v
```

8+ tests covering:
- Prompt injection detection
- Input sanitisation
- Cache key generation
- Route validation (valid/invalid inputs)
- Fallback behaviour

---

## Seed Data

The database is pre-seeded with:
- 2 users (admin + analyst)
- 30 realistic risk records across 10 categories including:
  - Banking Fraud, Phishing Attacks, Data Breaches
  - Cloud Outages, Compliance Failures, Insider Threats
  - Ransomware, DDoS Attacks, Supply Chain Attacks, Credential Theft

---

## Deployment Notes

### Production Checklist
- Set strong, unique passwords in `.env`
- Use a proper `JWT_SECRET` (minimum 256-bit random value)
- Enable TLS via a reverse proxy (Nginx/Traefik/Caddy)
- Keep PostgreSQL and Redis ports unexposed (`ports:` removed from compose)
- Set up log aggregation (ELK, Loki, CloudWatch)
- Configure alerting for CRITICAL risks via email

### Docker Build

```bash
# Build all services
docker-compose build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down

# Full reset (deletes volumes)
docker-compose down -v
```

---

## Security

See [SECURITY.md](./SECURITY.md) for the full threat model, OWASP Top 10 assessment, findings, and residual risks.

Key security features:
- JWT with Redis blacklist (token revocation on logout)
- BCrypt password hashing (cost 12)
- RBAC with two roles (ADMIN/USER)
- Prompt injection protection on AI endpoints
- SQL injection prevention via JPA
- XSS prevention via server-side HTML stripping + CSP
- Full audit log with IP tracking
- Rate limiting (30 req/min) on AI service

---

## Project Structure

```
tool114/
├── backend/                    Spring Boot application
│   ├── src/main/java/          Java source code
│   │   └── com/tool114/riskmanager/
│   │       ├── config/         Security, Redis, OpenAPI config
│   │       ├── controller/     REST controllers
│   │       ├── dto/            Request/Response DTOs
│   │       ├── entity/         JPA entities
│   │       ├── exception/      Global exception handling
│   │       ├── repository/     Spring Data repositories
│   │       └── service/        Business logic
│   ├── src/main/resources/
│   │   ├── application.yml     Application configuration
│   │   ├── db/migration/       Flyway SQL migrations (V1–V4)
│   │   └── templates/          Thymeleaf email templates
│   └── Dockerfile
│
├── frontend/                   React SPA
│   ├── src/
│   │   ├── components/         Reusable components
│   │   ├── context/            Auth context
│   │   ├── hooks/              Custom hooks (useDebounce)
│   │   ├── lib/                Axios client
│   │   ├── pages/              Route pages
│   │   ├── services/           API service layer
│   │   ├── test/               Test files
│   │   └── utils/              Risk calculation utilities
│   ├── Dockerfile
│   └── nginx.conf
│
├── ai-service/                 Flask AI service
│   ├── routes/                 API route handlers
│   ├── services/               GroqClient + AI service
│   ├── prompts/                LLM prompt templates
│   ├── tests/                  Pytest test suite
│   └── Dockerfile
│
├── docker-compose.yml          Full stack orchestration
├── .env.example                Environment variable template
├── README.md                   This file
└── SECURITY.md                 Security documentation
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18 |
| Frontend Bundler | Vite | 5 |
| Frontend Styling | Tailwind CSS | 3 |
| Charts | Recharts | 2 |
| Backend Framework | Spring Boot | 3.2 |
| Backend Language | Java | 17 |
| Security | Spring Security + JWT | 6.x |
| ORM | Spring Data JPA / Hibernate | 6.x |
| Database | PostgreSQL | 15 |
| Migrations | Flyway | 9.x |
| Cache | Redis (Spring Cache) | 7 |
| API Docs | SpringDoc OpenAPI | 2.x |
| AI Framework | Flask | 3.0 |
| AI Language | Python | 3.11 |
| LLM | Llama-3.3-70B via Groq | latest |
| Rate Limiting | flask-limiter | 3.7 |
| Containers | Docker + Compose | 25+ / 2.x |
