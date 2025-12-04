# CLAUDE.md - DM Sherpa Development Guide

## Project Overview

DM Sherpa is a **Direct Mail Management & Recommendations Platform** for real estate investors and home services companies. It focuses on:

1. **Managing Direct Mail Campaigns** - Create, schedule, and track multi-touch mail campaigns
2. **AI-Powered Recommendations** - Get intelligent suggestions on WHO to target, WHAT to send, and HOW to structure campaigns

## Tech Stack

- **Framework:** NestJS 10 with TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Queue:** Redis + BullMQ for background jobs
- **API:** RESTful with Swagger/OpenAPI documentation

## Quick Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed demo data
npm run prisma:studio      # Open database GUI
npm run db:reset           # Reset database completely

# Testing
npm run test               # Unit tests
npm run test:cov           # Tests with coverage
npm run test:e2e           # End-to-end tests

# Code Quality
npm run lint               # Lint code
npm run format             # Format code
```

## Project Structure

```
dm-sherpa/
├── prisma/
│   ├── schema.prisma      # Database schema (24 models)
│   └── seed.ts            # Synthetic data seeder
├── src/
│   ├── app.module.ts      # Root module
│   ├── main.ts            # Application entry point
│   ├── config/            # App configuration
│   ├── common/            # Shared utilities, DTOs, filters
│   │   ├── prisma/        # Prisma service
│   │   ├── health/        # Health check
│   │   └── dto/           # Shared DTOs
│   └── modules/           # Feature modules
│       ├── accounts/      # Account & user management
│       ├── markets/       # Geographic targeting
│       ├── properties/    # Property & owner data
│       ├── segments/      # Audience segmentation
│       ├── campaigns/     # Campaign orchestration
│       ├── offers/        # Offer strategies
│       └── recommendations/ # AI-powered recommendations
```

---

## Core Modules

### 1. Accounts Module
User and account management with role-based permissions.

**Endpoints:** `/api/v1/accounts`, `/api/v1/users`

### 2. Markets Module
Geographic markets (state/county) with market-level metrics.

**Endpoints:** `/api/v1/markets`

### 3. Properties Module
Property data, owner information, and distress/motivation flags.

**Endpoints:** `/api/v1/properties`

### 4. Segments Module
Audience segmentation with complex filtering for targeting.

**Endpoints:** `/api/v1/segments`

### 5. Campaigns Module
Campaign creation, multi-touch flows, batching, and mail tracking.

**Endpoints:** `/api/v1/campaigns`

### 6. Offers Module
Dynamic offer calculation based on property and market data.

**Endpoints:** `/api/v1/offers`

### 7. Recommendations Module (NEW)
AI-powered recommendations for campaign optimization.

**Endpoints:** `/api/v1/recommendations`

---

## Database Schema (24 Models)

### Core Entities

| Model | Description |
|-------|-------------|
| **Account** | Business entity (wholesaler, flipper, roofer, etc.) |
| **User** | Users with role-based permissions |

### Geographic Data

| Model | Description |
|-------|-------------|
| **Market** | State/county markets with metrics |
| **AccountMarket** | Account-specific market settings |
| **ZipCode** | Zip-level data |

### Property Data

| Model | Description |
|-------|-------------|
| **Property** | Real estate properties with valuations |
| **PropertyValuationHistory** | Historical valuations |
| **Owner** | Property owners (1:many support) |
| **PropertyOwnership** | Property-owner junction |
| **PropertyFlag** | Unified distress/motivation/condition flags |
| **MarketDispoData** | Market disposition metrics |

### Segments

| Model | Description |
|-------|-------------|
| **Segment** | Target audience definitions |
| **SegmentMember** | Properties in segments |

### Campaigns

| Model | Description |
|-------|-------------|
| **Campaign** | Campaign configuration and metrics |
| **CampaignSegment** | Campaign-segment junction |
| **CampaignStep** | Multi-touch steps |
| **Variant** | A/B test variants |
| **Batch** | Mail batches |
| **BatchVariant** | Batch-variant junction |

### Creative & Offers

| Model | Description |
|-------|-------------|
| **DesignTemplate** | Mail design templates |
| **DesignVersion** | Template versions for testing |
| **OfferStrategy** | Offer calculation strategies |

### Mail Tracking

| Model | Description |
|-------|-------------|
| **MailPiece** | Individual mail pieces |
| **MailEvent** | USPS/Lob tracking events |

### Recommendations

| Model | Description |
|-------|-------------|
| **Recommendation** | AI-generated recommendations |
| **RecommendationFeedback** | User feedback for ML improvement |

---

## Recommendations System

The recommendations module provides AI-powered suggestions in three categories:

### WHO Recommendations
Target audience suggestions based on:
- High-equity absentee owners
- Distress type concentrations
- Hot markets with high motivation scores
- Underserved segments (not recently mailed)

### WHAT Recommendations
Creative and offer suggestions based on:
- Best performing mail formats
- Optimal offer percentage ranges
- Winning creative elements (headlines, CTAs)
- Template variety recommendations

### HOW Recommendations
Campaign structure suggestions based on:
- Optimal touch count
- Ideal timing between touches
- Batch size optimization
- A/B testing frequency
- Budget allocation

### API Endpoints

```
POST   /recommendations/generate     - Generate recommendations
GET    /recommendations              - List recommendations
GET    /recommendations/:id          - Get recommendation details
PATCH  /recommendations/:id/status   - Update status (applied/dismissed)
POST   /recommendations/:id/feedback - Add feedback
POST   /recommendations/:id/apply    - Quick apply recommendation
```

---

## Key Enums

```typescript
// Account Types
AccountType: WHOLESALER, FLIPPER, BUY_AND_HOLD, TURNKEY_OPERATOR,
             HEDGE_FUND, ROOFER, HOME_SERVICES, PORTFOLIO_BUYER

// Property Flags
FlagCategory: DISTRESS, MOTIVATION, CONDITION

DistressType: PRE_FORECLOSURE, FORECLOSURE, PROBATE, INHERITANCE,
              TAX_LIEN, TAX_DELINQUENT, DIVORCE, CODE_VIOLATION,
              EVICTION, BANKRUPTCY

MotivationIndicator: VACANT, ABSENTEE_OWNER, HIGH_EQUITY, TIRED_LANDLORD,
                     LONG_OWNERSHIP, FAILED_LISTING, EXPIRED_LISTING

// Campaign
CampaignStatus: DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, CANCELLED
CampaignGoal: CONTRACTS, APPOINTMENTS, LEADS, BRAND_AWARENESS

// Mail
MailFormat: CHECK_LETTER, GENERIC_LETTER, STANDARD_POSTCARD,
            OVERSIZED_POSTCARD, HANDWRITTEN_POSTCARD, SNAP_PACK,
            SORRY_WE_MISSED_YOU, YELLOW_LETTER

MailStatus: CREATED, QUEUED, PRINTING, MAILED, IN_TRANSIT,
            DELIVERED, RETURNED, UNDELIVERABLE

// Recommendations
RecommendationCategory: WHO, WHAT, HOW, TIMING, BUDGET
RecommendationStatus: PENDING, VIEWED, APPLIED, DISMISSED, EXPIRED
RecommendationPriority: LOW, MEDIUM, HIGH, URGENT
```

---

## Data Flow

```
1. Account → owns → Markets, Campaigns, Segments

2. Property → has:
   - Owner (via primaryOwnerId or PropertyOwnership)
   - PropertyFlags (distress, motivation, condition)
   - PropertyValuationHistory
   - belongs to Market and ZipCode

3. Segment → defines:
   - Filter criteria for targeting
   - Links to Properties via SegmentMember

4. Campaign → uses:
   - Segments (via CampaignSegment)
   - Has Variants, Batches, Steps
   - Uses DesignTemplates and OfferStrategies

5. MailPiece → tracks:
   - Individual mail sent
   - Links to Property, Variant, Batch
   - MailEvents for USPS tracking
   - Response tracking (hasResponded)

6. Recommendation → provides:
   - AI suggestions for WHO/WHAT/HOW
   - Links to Account
   - Feedback for ML improvement
```

---

## External API Integration: Lob (Print & Mail)

Lob is the print vendor API used for sending physical mail pieces.

### Authentication

```
Authorization: Basic <base64(api_key + ":")>
Base URL: https://api.lob.com/v1/
```

### Key Types

| Key Type | Prefix | Usage |
|----------|--------|-------|
| Test Secret | `test_...` | Development |
| Live Secret | `live_...` | Production |

### Environment Configuration

```env
LOB_API_KEY=test_XXXXXXXXXXXXXXXXXXXX
LOB_PUBLISHABLE_KEY=test_pub_XXXXXXXXXXXX
```

### Mapping to Schema

| Lob Concept | DM Sherpa Table |
|-------------|-----------------|
| Postcard/Letter | MailPiece |
| Tracking events | MailEvent |
| Job ID | Batch.printJobId |

---

## API Endpoints Summary

| Endpoint | Description |
|----------|-------------|
| `/api/v1/accounts` | Account management |
| `/api/v1/users` | User management |
| `/api/v1/markets` | Market data |
| `/api/v1/properties` | Property CRUD with flags |
| `/api/v1/segments` | Audience segmentation |
| `/api/v1/campaigns` | Campaign orchestration |
| `/api/v1/offers` | Offer calculation |
| `/api/v1/recommendations` | AI recommendations |
| `/health` | Health check |

---

## What Was Removed

The following modules were removed to focus on core direct mail management:

- **Telephony** - Call tracking (moved to post-mail CRM)
- **Deals** - Deal pipeline (moved to CRM)
- **Sales** - Talk tracks (moved to CRM)
- **Diagnostics** - "What Changed?" analysis
- **Triggers** - Automation workflows
- **Experiments** - Simplified into Campaigns (A/B testing)
- **Analytics** - Simplified into Campaigns (metrics)

---

## Development Guidelines

1. **Focus on Mail** - All features should support direct mail management
2. **Recommendations First** - Use AI to guide users on best practices
3. **Simple Over Complex** - Prefer straightforward solutions
4. **Data-Driven** - Base recommendations on historical performance
5. **Lob Integration** - All mail goes through Lob API
