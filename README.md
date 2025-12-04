# DM Sherpa - Direct Mail Performance OS

A world-class platform for managing direct mail campaigns targeting distressed real estate properties.

## Tech Stack

- **Framework:** NestJS 10 with TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Queue:** Redis + BullMQ for background jobs
- **API:** RESTful with Swagger/OpenAPI documentation

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL 14+
- Redis 6+
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database and Redis credentials:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/dm_sherpa?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# App
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate
```

### 4. Seed Demo Data

Populate the database with synthetic data:

```bash
npm run prisma:seed
```

This creates:
- 3 demo accounts (Apex Property Solutions, Texas Home Buyers, Sunshine State Investors)
- Multiple users per account
- 2-4 markets per account with zip codes
- 500-1500 properties with distress flags
- Campaigns with variants, batches, and mail pieces
- Call events and deals with attribution
- Trigger rules and diagnostic snapshots

### 5. Run the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Access the API

- **API Base URL:** http://localhost:3000/api/v1
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/v1/health

## API Endpoints

### Core Resources

| Resource | Endpoint | Description |
|----------|----------|-------------|
| Accounts | `/api/v1/accounts` | Account management |
| Users | `/api/v1/users` | User management |
| Markets | `/api/v1/markets` | Market & zip code management |
| Properties | `/api/v1/properties` | Property CRUD with distress flags |
| Segments | `/api/v1/segments` | Audience segmentation |
| Campaigns | `/api/v1/campaigns` | Multi-touch campaign orchestration |
| Experiments | `/api/v1/experiments` | A/B testing |
| Telephony | `/api/v1/telephony` | Phone number health |
| Offers | `/api/v1/offers` | Dynamic offer calculation |
| Sales | `/api/v1/sales` | Talk tracks |
| Deals | `/api/v1/deals` | Deal pipeline |
| Analytics | `/api/v1/analytics` | Performance dashboards |
| Diagnostics | `/api/v1/diagnostics` | "What Changed?" analysis |
| Triggers | `/api/v1/triggers` | Automation rules |

### Example API Calls

```bash
# Get all accounts
curl http://localhost:3000/api/v1/accounts

# Get properties with pagination
curl "http://localhost:3000/api/v1/properties?accountId=<uuid>&page=1&limit=20"

# Calculate dynamic offer for a property
curl "http://localhost:3000/api/v1/offers/calculate/<propertyId>?strategyId=<strategyId>"

# Run "What Changed?" diagnostics
curl "http://localhost:3000/api/v1/diagnostics/what-changed?accountId=<uuid>&startDate=2024-10-01&endDate=2024-11-01"

# Get campaign performance dashboard
curl "http://localhost:3000/api/v1/analytics/dashboard?accountId=<uuid>&startDate=2024-01-01&endDate=2024-12-01"
```

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## Development Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (drops all data, re-runs migrations and seed)
npm run db:reset
```

## Project Structure

```
dm-sherpa/
├── prisma/
│   ├── schema.prisma      # Database schema (40 models)
│   └── seed.ts            # Synthetic data seeder
├── src/
│   ├── common/
│   │   ├── dto/           # Shared DTOs (pagination, responses)
│   │   ├── filters/       # Exception filters
│   │   ├── health/        # Health check module
│   │   ├── prisma/        # Prisma service
│   │   └── utils/         # Statistics utilities
│   ├── config/            # App configuration
│   ├── modules/
│   │   ├── accounts/      # Account & user management
│   │   ├── analytics/     # Dashboards & reporting
│   │   ├── campaigns/     # Campaign orchestration
│   │   ├── deals/         # Deal pipeline
│   │   ├── diagnostics/   # "What Changed?" engine
│   │   ├── experiments/   # A/B testing
│   │   ├── markets/       # Market management
│   │   ├── offers/        # Dynamic offer engine
│   │   ├── properties/    # Property & distress management
│   │   ├── sales/         # Talk tracks
│   │   ├── segments/      # Audience builder
│   │   ├── telephony/     # Phone health monitoring
│   │   └── triggers/      # Automation rules
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry
├── CLAUDE.md              # Database schema documentation
├── package.json
└── tsconfig.json
```

---

## What's Missing (Future Enhancements)

### Authentication & Authorization
- [ ] JWT-based authentication
- [ ] Role-based access control (RBAC) middleware
- [ ] API key management for external integrations
- [ ] OAuth2/SSO integration

### External Integrations
- [ ] Print vendor API integration (for actual mail sending)
- [ ] Telephony provider integration (Twilio, Bandwidth, Telnyx)
- [ ] Data provider APIs (PropertyRadar, PropStream, BatchLeads)
- [ ] CRM integrations (Salesforce, HubSpot, Podio)
- [ ] Zapier/webhook outbound events

### Real-time Features
- [ ] WebSocket support for live dashboard updates
- [ ] Real-time call event streaming
- [ ] Live campaign performance updates

### File Management
- [ ] Design template file uploads (S3/CloudStorage)
- [ ] Call recording storage and playback
- [ ] Export functionality (CSV, PDF reports)

### Advanced Analytics
- [ ] Machine learning for motivation scoring
- [ ] Predictive analytics for campaign performance
- [ ] Cohort analysis
- [ ] Custom report builder

### Testing
- [ ] Unit tests for all services
- [ ] Integration tests for API endpoints
- [ ] E2E test suite
- [ ] Load/performance testing

### DevOps & Infrastructure
- [ ] Docker & docker-compose configuration
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database backup automation
- [ ] Monitoring & alerting (Prometheus, Grafana)
- [ ] Log aggregation (ELK stack)

### UI/Frontend
- [ ] React/Next.js dashboard application
- [ ] Campaign builder UI
- [ ] Segment builder with drag-and-drop
- [ ] Real-time analytics dashboards
- [ ] Mobile-responsive design

### Documentation
- [ ] API documentation improvements
- [ ] Architecture decision records (ADRs)
- [ ] Deployment guides
- [ ] User guides

### Compliance & Security
- [ ] TCPA compliance checks for telephony
- [ ] USPS address verification
- [ ] Data encryption at rest
- [ ] Audit logging enhancements
- [ ] GDPR/CCPA data handling

---

## License

UNLICENSED - Proprietary
