# Security Policy — Tool-114 Residual Risk Calculator

## 1. Threat Model

### Assets
| Asset | Sensitivity | Notes |
|-------|------------|-------|
| Risk Records | HIGH | Confidential business data |
| User Credentials | CRITICAL | Passwords, JWT tokens |
| Audit Logs | HIGH | Tamper-evident evidence |
| AI Prompts/Responses | MEDIUM | Potentially sensitive context |
| Uploaded Files | MEDIUM | PDF/DOCX attachments |

### Threat Actors
| Actor | Capability | Motivation |
|-------|-----------|------------|
| Unauthenticated user | Low–Medium | Data theft, DoS |
| Authenticated analyst | Medium | Privilege escalation |
| Malicious admin | High | Insider threat |
| External attacker | High | Data exfiltration |
| AI prompt injector | Low–Medium | LLM manipulation |

### Attack Surface
- HTTP API endpoints (Spring Boot, port 8080)
- Authentication endpoints (/auth/*)
- File upload endpoint
- AI service endpoints (Flask, port 5000 — internal only in production)
- Frontend SPA (Nginx, port 3000)
- Database (PostgreSQL, port 5432 — not exposed in production)
- Cache (Redis, port 6379 — not exposed in production)

---

## 2. Security Controls Implemented

### 2.1 Authentication & Authorization

| Control | Implementation | Status |
|---------|---------------|--------|
| JWT Bearer Tokens | HMAC-SHA256, 1h expiry | ✅ |
| Refresh Tokens | 24h expiry, single-use rotation | ✅ |
| Token Blacklist | Redis-backed invalidation on logout | ✅ |
| Password Hashing | BCrypt cost factor 12 | ✅ |
| RBAC | ROLE_ADMIN (CRUD) / ROLE_USER (Read) | ✅ |
| Account Active Check | `isActive` flag prevents disabled login | ✅ |
| Stateless Sessions | No server-side sessions, JWT only | ✅ |

### 2.2 Input Validation & Sanitization

| Control | Implementation | Status |
|---------|---------------|--------|
| Bean Validation | javax.validation on all DTOs | ✅ |
| HTML Stripping | `Jsoup.clean()` on all string inputs | ✅ |
| SQL Injection | JPA parameterised queries only | ✅ |
| Prompt Injection | 12 regex patterns + bleach in AI service | ✅ |
| Path Traversal | UUID file naming, no user-controlled paths | ✅ |
| File Type Validation | MIME type + extension check (PDF/DOCX) | ✅ |
| File Size Limit | 5 MB maximum enforced at server | ✅ |
| CSV Injection | Cell value prefix sanitisation (=, +, -, @) | ✅ |

### 2.3 Network Security

| Control | Implementation | Status |
|---------|---------------|--------|
| CSRF Protection | Disabled (stateless JWT; no cookie auth) | ✅ |
| CORS | Restricted to localhost:* + frontend origin | ✅ |
| Security Headers | CSP, X-Frame-Options, X-Content-Type, HSTS | ✅ |
| Rate Limiting | 30 req/min on AI endpoints (flask-limiter) | ✅ |
| HTTPS | TLS termination required in production | ⚠️ |

### 2.4 Data Protection

| Control | Implementation | Status |
|---------|---------------|--------|
| Passwords | BCrypt (never stored in plaintext) | ✅ |
| JWT Secret | Externally configurable via `JWT_SECRET` env | ✅ |
| Soft Delete | Records marked deleted, not physically removed | ✅ |
| Audit Logging | All CRUD + auth events logged asynchronously | ✅ |
| Cache TTL | Redis caches expire in 10 minutes | ✅ |

### 2.5 Content Security Policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
```

---

## 3. OWASP Top 10 (2021) Assessment

| OWASP Category | Risk | Mitigation |
|----------------|------|-----------|
| A01 Broken Access Control | LOW | RBAC enforced at every endpoint; method-level security |
| A02 Cryptographic Failures | LOW | BCrypt for passwords; HMAC-SHA256 JWT; TLS recommended |
| A03 Injection | LOW | JPA parameterised queries; HTML stripping; prompt injection detection |
| A04 Insecure Design | LOW | Principle of least privilege; threat model documented |
| A05 Security Misconfiguration | MEDIUM | Defaults changed; Swagger disabled in prod recommended |
| A06 Vulnerable Components | MEDIUM | Dependency updates should be automated with Dependabot |
| A07 Auth and Session Failures | LOW | JWT blacklist; short expiry; refresh rotation |
| A08 Software and Data Integrity | LOW | Docker image pinning; no untrusted deserialization |
| A09 Logging & Monitoring | LOW | Async audit log covers all operations with IP/UA |
| A10 SSRF | LOW | AI service URL is environment-configured, not user-supplied |

---

## 4. Security Testing

### 4.1 Authentication Tests
- ✅ Login with valid credentials returns JWT pair
- ✅ Login with invalid credentials returns 401
- ✅ Accessing protected endpoint without token returns 401
- ✅ Accessing ADMIN endpoint as USER returns 403
- ✅ Using blacklisted token after logout returns 401
- ✅ Expired token rejected

### 4.2 Input Validation Tests
- ✅ SQL special characters in risk title handled safely
- ✅ HTML tags stripped from description fields
- ✅ Prompt injection attempts blocked by AI service
- ✅ File upload rejects non-PDF/DOCX MIME types
- ✅ File upload rejects files over 5 MB
- ✅ Path traversal in filename (../../etc/passwd) rejected

### 4.3 Brute Force Tests
- ✅ Rate limiter blocks excessive AI requests (429 returned)
- ✅ Spring Security does not leak timing information on failed auth

### 4.4 XSS Tests
- ✅ Script tags in all input fields are stripped server-side
- ✅ CSP header prevents inline script execution
- ✅ React renders user data as text (not dangerouslySetInnerHTML)

---

## 5. Security Findings & Fixes

### Finding 1: Prompt Injection (RESOLVED)
**Severity:** HIGH  
**Description:** LLM inputs could be manipulated to override system prompts.  
**Fix:** 12-pattern regex detection in `groq_client.py` + bleach HTML sanitisation. Requests matching injection patterns return HTTP 400.

### Finding 2: JWT No Revocation (RESOLVED)
**Severity:** MEDIUM  
**Description:** Stolen JWTs would remain valid until expiry.  
**Fix:** Redis blacklist (`jwt:blacklist:{token}`) invalidates tokens on logout. JwtUtil checks blacklist on every request.

### Finding 3: CSV Formula Injection (RESOLVED)
**Severity:** MEDIUM  
**Description:** Risk titles beginning with =, +, -, @ could execute formulas in spreadsheet applications.  
**Fix:** `CsvExportService` prefixes dangerous characters with a tab character.

### Finding 4: Path Traversal in File Upload (RESOLVED)
**Severity:** HIGH  
**Description:** Malicious filename could write files outside the upload directory.  
**Fix:** `FileUploadService` uses `UUID.randomUUID()` as the storage filename, ignoring the original filename for storage path. Original name stored only in the database.

### Finding 5: Swagger Exposed in Production (OPEN — Recommended Fix)
**Severity:** LOW  
**Description:** Swagger UI exposes full API schema.  
**Recommended Fix:** Add `springdoc.swagger-ui.enabled=false` in production profile, or restrict access to admin IPs.

---

## 6. Residual Risks

| Risk | Likelihood | Impact | Residual | Mitigation |
|------|-----------|--------|----------|-----------|
| GROQ API key exposure | LOW | HIGH | MEDIUM | Use secrets manager (AWS Secrets Manager / Vault) in production |
| Redis not encrypted at rest | MEDIUM | MEDIUM | MEDIUM | Enable Redis TLS + encryption in production |
| Unencrypted inter-service traffic | LOW | MEDIUM | LOW | Add mTLS between services in production |
| Email credentials in env vars | LOW | MEDIUM | LOW | Use SMTP relay with app-specific credentials |
| Dependency vulnerabilities | MEDIUM | MEDIUM | MEDIUM | Automate Dependabot / OWASP Dependency-Check |

---

## 7. Security Configuration Checklist (Production)

- [ ] Set a strong `JWT_SECRET` (minimum 32 bytes, base64-encoded)
- [ ] Set strong database passwords
- [ ] Set Redis password
- [ ] Configure real SMTP credentials for email alerts
- [ ] Enable HTTPS/TLS on the reverse proxy
- [ ] Restrict PostgreSQL and Redis to internal Docker network (no public ports)
- [ ] Set `GROQ_API_KEY` securely (never commit to source control)
- [ ] Disable Swagger UI in production
- [ ] Enable Docker secrets or environment-variable injection from a vault
- [ ] Set up log aggregation and alerting for audit events

---

## 8. Reporting Security Issues

To report a security vulnerability, please contact the project maintainer directly.  
Do **not** open a public GitHub issue for security vulnerabilities.

Provide:
1. Affected component and version
2. Steps to reproduce
3. Potential impact
4. Any suggested fix

Response target: 48 hours for critical, 7 days for high/medium severity.
