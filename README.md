# brokerHub Platform

**Your 24/7 AI Admin for Insurance Brokers**

---

## Overview

brokerHub is a multi-tenant SaaS platform that provides AI-powered administrative support to insurance brokerages. Each tenant (broker company) gets an isolated AI agent with credit-based skill entitlements.

### Key Features

- **Tenant Isolation**: Schema-per-tenant PostgreSQL architecture
- **Credit System**: Prepaid credits with real-time deduction
- **Skills Engine**: Entitlement-based capability unlocking
- **Audit Trail**: 7-year compliance logging for insurance/finance
- **White-Label Ready**: Per-tenant branding configuration

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### Development Setup

```bash
# Clone and install
git clone https://github.com/brokerhub/platform.git
cd brokerhub
npm install

# Start development stack
npm run dev

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brokerhub

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# S3 (for document storage)
S3_BUCKET=brokerhub-documents
S3_REGION=ap-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    brokerHub Platform                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Broker A   │  │  Broker B   │  │  Broker C   │     │
│  │   Agent     │  │   Agent     │  │   Agent     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Core Services                        │   │
│  │  Auth │ Credits │ Skills │ Tenant Management     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Data Layer (Schema-per-Tenant)            │   │
│  │  Schema_A │ Schema_B │ Schema_C │ Shared         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
brokerhub/
├── apps/
│   ├── api/              # Node.js + TypeScript API
│   ├── admin/            # React admin dashboard
│   └── agent/            # Tenant agent runtime
├── packages/
│   ├── auth/             # Auth service library
│   ├── credits/          # Credit ledger library
│   └── tenant/           # Tenant management library
├── infra/
│   ├── docker/           # Docker configs
│   ├── migrations/       # DB migrations
│   └── scripts/          # Setup scripts
├── docs/
│   ├── architecture.md   # System architecture
│   ├── brand/            # Brand guidelines
│   └── api/              # API documentation
├── assets/
│   └── brand/            # Logo and brand assets
├── docker-compose.yml
└── package.json
```

---

## API Documentation

See [`docs/api/`](docs/api/) for full API reference.

### Quick Reference

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/tenants` | Create new tenant |
| `POST /api/v1/auth/token` | Request access token |
| `GET /api/v1/tenants/:id/credits` | Get credit balance |
| `POST /api/v1/tenants/:id/skills/:skill` | Execute skill |

---

## Credit System

### Tiers

| Tier | Credits/Month | Price | Skills |
|------|---------------|-------|--------|
| Starter | 1,000 | $99 | Basic Q&A |
| Professional | 5,000 | $399 | + Analytics |
| Enterprise | 25,000 | $1,499 | All Skills |

### Consumption

| Skill | Cost/Use |
|-------|----------|
| Basic Q&A | 1 credit |
| Document Analysis | 5 credits |
| Market Analytics | 10 credits |
| API Integration | 2 credits |

---

## Compliance

- **Audit Logs**: 7-year retention (insurance/finance requirement)
- **Data Isolation**: Complete schema-per-tenant separation
- **Immutable Records**: Credit transactions and audit logs cannot be modified

---

## License

Proprietary - All rights reserved

---

**Built with** ⚡ **by the brokerHub team**
