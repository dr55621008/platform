# brokerHub System Architecture

**Version:** 1.0  
**Date:** 2026-03-28  
**Status:** Phase 1 Complete

---

## Overview

See parent document: `/data/.openclaw/workspace/brokerhub-architecture.md`

This document provides technical implementation details.

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Runtime** | Node.js | 20.x |
| **Language** | TypeScript | 5.3+ |
| **Framework** | Express.js | 4.18+ |
| **Database** | PostgreSQL | 15+ |
| **Cache** | Redis | 7+ |
| **Storage** | S3-compatible | - |
| **Frontend** | React + Vite | 18.x |
| **UI Library** | Mantine | 7.x |
| **Container** | Docker | 24+ |
| **Orchestration** | Docker Compose | 2.x |

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                         (nginx)                              │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │   Admin App     │             │     API         │
    │   (React/SPA)   │             │   (Express)     │
    │   Port 3001     │             │   Port 3000     │
    └─────────────────┘             └─────────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
                │   PostgreSQL    │ │    Redis    │ │      S3         │
                │   (Multi-schema)│ │  (Sessions) │ │   (Documents)   │
                │   Port 5432     │ │  Port 6379  │ │                 │
                └─────────────────┘ └─────────────┘ └─────────────────┘
```

---

## Database Schema

### Shared Schema (Public)

| Table | Purpose | Retention |
|-------|---------|-----------|
| `tenants` | Tenant registry | Permanent |
| `credit_ledger` | Credit transactions | 7 years |
| `audit_logs` | Compliance audit | 7 years |
| `skills_registry` | Available skills | Permanent |
| `tenant_skill_entitlements` | Skill grants | Permanent |
| `refresh_tokens` | Auth tokens | Until expiry |

### Per-Tenant Schema (`tenant_{id}`)

| Table | Purpose |
|-------|---------|
| `conversations` | Chat history |
| `documents` | Document metadata |
| `configs` | Tenant settings |
| `skill_executions` | Skill execution log |

---

## API Design

### Authentication Flow

```
1. Client → POST /api/v1/auth/token (tenant_id, user_id)
2. API → Validate tenant status, generate JWT + refresh token
3. API → Return { access_token, refresh_token, expires_in }
4. Client → Store tokens (secure storage)
5. Client → Include access_token in Authorization header
6. API → Validate token on each request
7. Client → Refresh token when expired (using refresh_token)
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/token` | 10 | 1 minute |
| `/skills/*/execute` | 100 | 1 hour |
| Default | 100 | 1 hour |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `TENANT_SUSPENDED` | 403 | Tenant account suspended |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many requests |

---

## Security

### Authentication
- JWT with 15-minute expiry
- Refresh tokens (30-day expiry, single-use)
- Token revocation on logout

### Authorization
- Scope-based access control
- Tenant isolation (schema-level)
- Admin-only endpoints for tenant management

### Data Protection
- Encrypted connections (TLS 1.3)
- S3 server-side encryption
- Password hashing (bcrypt, if implemented)

### Audit
- All writes logged to `audit_logs`
- Immutable audit records
- 7-year retention (compliance)

---

## Deployment

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost | Local development |
| Staging | staging.brokerhub.com | Pre-production testing |
| Production | api.brokerhub.com | Live service |

### Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:15-alpine | 5432 | Database |
| `redis` | redis:7-alpine | 6379 | Cache/sessions |
| `api` | Custom (Node.js) | 3000 | API service |
| `admin` | Custom (nginx) | 3001 | Admin dashboard |
| `pgadmin` | dpage/pgadmin4 | 5050 | DB admin (dev only) |

---

## Monitoring

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health (HTTP 200 = healthy) |
| Database | `pg_isready` check |
| Redis | `redis-cli ping` check |

### Metrics to Collect

- Request rate (requests/second)
- Error rate (4xx, 5xx)
- Response time (p50, p95, p99)
- Credit transaction volume
- Active tenants
- Skill execution count

### Logging

- Structured JSON logs
- Correlation IDs for request tracing
- Log levels: debug, info, warn, error

---

## Scalability

### Horizontal Scaling

- API service: Stateless, can scale horizontally
- Redis: Single instance (upgrade to cluster for HA)
- PostgreSQL: Read replicas for read-heavy workloads

### Bottlenecks

| Component | Current Limit | Scaling Strategy |
|-----------|---------------|------------------|
| PostgreSQL | Single writer | Read replicas, connection pooling |
| Redis | Single instance | Redis Cluster |
| S3 | None (managed) | N/A |

---

## Phase 1 Deliverables Status

| Component | Status | Location |
|-----------|--------|----------|
| Repository Structure | ✅ Complete | `/brokerhub/` |
| Docker Compose | ✅ Complete | `docker-compose.yml` |
| Database Migrations | ✅ Complete | `infra/migrations/` |
| API Service | ✅ Complete | `apps/api/` |
| Auth Service | ✅ Complete | `apps/api/src/services/authService.ts` |
| Tenant Service | ✅ Complete | `apps/api/src/services/tenantService.ts` |
| Credit Service | ✅ Complete | `apps/api/src/services/creditService.ts` |
| Skills Service | ✅ Complete | `apps/api/src/services/skillsService.ts` |
| CI/CD Pipeline | ✅ Complete | `.github/workflows/ci.yml` |
| Brand Assets | ✅ Complete | `assets/brand/` |
| Documentation | ✅ Complete | `docs/` |

---

## Next Steps (Phase 2)

1. **Admin Dashboard UI** - React implementation
2. **OAuth 2.0 Integration** - Company SSO
3. **Webhook System** - Async skill execution callbacks
4. **Advanced Rate Limiting** - Redis-based sliding window
5. **Monitoring Dashboard** - Grafana + Prometheus

---

**Maintained by:** Engineering Team  
**Contact:** engineering@brokerhub.com
