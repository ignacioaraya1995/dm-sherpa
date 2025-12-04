# CLAUDE.md - DM Sherpa Development Guide

## Project Overview

DM Sherpa is a Direct Mail Performance OS for real estate investors and home services companies. It manages direct mail campaigns targeting distressed properties, tracks responses, and measures ROI through deal attribution.

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
│   ├── schema.prisma      # Database schema (40 models)
│   └── seed.ts            # Synthetic data seeder
├── src/
│   ├── common/            # Shared utilities, DTOs, filters
│   ├── config/            # App configuration
│   └── modules/           # Feature modules (accounts, campaigns, etc.)
```

---

## Database Schema Documentation

**Database:** PostgreSQL via Prisma ORM
**Schema Location:** `prisma/schema.prisma`
**Total Tables:** 40

### Schema Design Principles

1. **Proper FK Relationships** - All relationships have explicit foreign keys
2. **No Duplicate Data** - Removed redundant fields (use relations instead)
3. **Flexible Flag System** - Unified PropertyFlag supports distress, motivation, and condition flags
4. **1:Many Owner Support** - Owners can own multiple properties
5. **Task Automation** - Task table supports workflow automation
6. **Historical Tracking** - PropertyValuationHistory tracks value changes over time
7. **isSynthetic Hierarchy** - Account.isSynthetic is the primary flag; child entities inherit

---

## Table Reference

### Section 1: Core Entities

#### Account
Main business entity (wholesaler, flipper, roofer, etc.)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Account name |
| type | AccountType | WHOLESALER, FLIPPER, BUY_AND_HOLD, etc. |
| status | AccountStatus | ACTIVE, PAUSED, SUSPENDED, CLOSED |
| settings | JSON | Account-specific settings |
| isSynthetic | Boolean | **Primary flag** - all child data inherits this |

**Relations:** Users, Markets, Campaigns, Segments, PhoneNumbers, OfferStrategies, DesignTemplates, Deals, TalkTracks, TriggerRules, Buyers, Tasks, DiagnosticSnapshots, CashCycleProfiles

#### User
Users within accounts with role-based permissions.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email |
| name | String | Display name |
| role | UserRole | ADMIN, MARKETING_MANAGER, ANALYST, ACQUISITIONS_MANAGER, AE, AI_AGENT |
| accountId | FK | Account reference |
| isAiAgent | Boolean | Flag for AI-powered users |
| apiKey | String? | API key for integrations |

---

### Section 2: Market & Geographic Data

#### Market
Geographic markets (state/county combinations).

| Field | Type | Description |
|-------|------|-------------|
| state | String | State code |
| county | String | County name |
| medianPrice | Decimal | Median property price |
| avgDom | Int | Average days on market |
| priceAppreciation | Decimal | YoY appreciation % |
| buyerDensityScore | Decimal | 0-1 scale |

**Unique Constraint:** (state, county)

#### AccountMarket
Junction table linking accounts to markets with account-specific settings.

| Field | Type | Description |
|-------|------|-------------|
| avmBiasFactor | Decimal | AVM adjustment factor |
| minSpread | Decimal | Minimum required spread |
| maxArv | Decimal | Maximum ARV to target |

#### ZipCode
Zip code level data within markets.

| Field | Type | Description |
|-------|------|-------------|
| code | String | Zip code (unique) |
| marketId | FK | Parent market |
| investorActivityScore | Decimal | Investor activity 0-1 |

---

### Section 3: Property & Owner Data

#### Property
Individual real estate properties.

| Field | Type | Description |
|-------|------|-------------|
| streetAddress, city, state | String | Address components |
| zipCodeId, marketId | FK | Geographic references |
| propertyType | PropertyType | SINGLE_FAMILY, MULTI_FAMILY, CONDO, etc. |
| beds, baths, sqft | Various | Physical attributes |
| avmValue | Decimal | Automated valuation |
| arvValue | Decimal | After repair value |
| priceBand | PriceBand | Price tier for segmentation |
| estimatedEquity | Decimal | Equity estimate |
| primaryOwnerId | FK | Shortcut to primary owner |
| dispoScore | Decimal | Disposition score 0-1 |
| motivationScore | Decimal | Seller motivation 0-1 |

**Removed Fields:**
- `isVacant` - Use PropertyFlag with type=VACANT instead
- `isAbsenteeOwner` - Use Owner.isAbsentee instead

#### PropertyValuationHistory
Tracks property valuation changes over time.

| Field | Type | Description |
|-------|------|-------------|
| propertyId | FK | Property reference |
| avmValue, arvValue | Decimal | Valuation snapshot |
| valuationSource | ValuationSource | AVM_PROVIDER, MLS_LISTING, APPRAISAL, etc. |
| confidence | Decimal | Confidence score 0-1 |
| valuationDate | DateTime | When valuation was recorded |

#### Owner
Property owners (supports 1:many - one owner can own multiple properties).

| Field | Type | Description |
|-------|------|-------------|
| firstName, lastName | String | Owner name |
| email | String | Unique email for deduplication |
| phone | String | Contact phone |
| mailingStreet, mailingCity, mailingState, mailingZip | String | Mailing address |
| ownershipType | OwnershipType | OWNER_OCCUPIED, ABSENTEE_IN_STATE, CORPORATE, TRUST, etc. |
| isAbsentee | Boolean | Absentee owner flag |
| isCorporate | Boolean | Corporate entity flag |
| corporateName | String | Company name if corporate |

**Removed Fields:**
- `fullName` - Compute as `firstName + ' ' + lastName`
- `propertyId` - Moved to PropertyOwnership junction table

#### PropertyOwnership
Junction table for Property-Owner relationship with ownership details.

| Field | Type | Description |
|-------|------|-------------|
| propertyId | FK | Property reference |
| ownerId | FK | Owner reference |
| ownershipLength | Int | Years owned |
| ownershipPercent | Decimal | Percentage ownership |
| distanceFromProperty | Decimal | Distance in km |
| isPrimaryOwner | Boolean | Primary owner flag |
| acquiredDate | DateTime | When acquired |
| soldDate | DateTime | When sold (if applicable) |
| isActive | Boolean | Current ownership |

---

### Section 4: Property Flags (Unified System)

#### PropertyFlag
Unified flag model supporting three categories of property signals.

| Field | Type | Description |
|-------|------|-------------|
| propertyId | FK | Property reference |
| category | FlagCategory | DISTRESS, MOTIVATION, or CONDITION |
| distressType | DistressType? | Set if category=DISTRESS |
| motivationIndicator | MotivationIndicator? | Set if category=MOTIVATION |
| conditionFlag | PropertyConditionFlag? | Set if category=CONDITION |
| severity | FlagSeverity | LOW, MEDIUM, HIGH, CRITICAL |
| startDate | DateTime | When flag became active |
| endDate | DateTime? | When resolved (null if active) |
| metadata | JSON | Type-specific data |
| source | String | Data source |

**Flag Categories:**

```
FlagCategory.DISTRESS (Legal/Financial):
- PRE_FORECLOSURE, FORECLOSURE, PROBATE, INHERITANCE
- TAX_LIEN, TAX_DELINQUENT, DIVORCE, CODE_VIOLATION
- EVICTION, BANKRUPTCY

FlagCategory.MOTIVATION (Opportunity Signals):
- VACANT, ABSENTEE_OWNER, HIGH_EQUITY, TIRED_LANDLORD
- LONG_OWNERSHIP, FAILED_LISTING, EXPIRED_LISTING

FlagCategory.CONDITION (Physical Issues):
- ROOF_DAMAGE, STORM_DAMAGE, FOUNDATION_ISSUES
- FIRE_DAMAGE, WATER_DAMAGE, DEFERRED_MAINTENANCE
- MAJOR_REPAIRS_NEEDED
```

---

### Section 5: Disposition Data

#### MarketDispoData
Market-level disposition metrics by price band.

| Field | Type | Description |
|-------|------|-------------|
| marketId | FK | Market reference |
| priceBand | PriceBand | Price tier |
| avgDom, medianDom | Int | Days on market metrics |
| listToSaleRatio | Decimal | List-to-sale ratio |
| avgSpread, medianSpread | Decimal | Spread metrics |
| buyerDensity | Decimal | Buyer density score |
| investorExitMix | JSON | Exit strategy mix |
| dispoScore | Decimal | Overall dispo score |
| periodStart, periodEnd | DateTime | Analysis period |

---

### Section 6: Segments

#### Segment
Target audience segments for campaigns.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| name | String | Segment name |
| filters | JSON | Complex filter definition |
| memberCount | Int | Property count |
| avgDispoScore | Decimal | Average dispo score |
| avgMotivation | Decimal | Average motivation |
| maxMailsPerProperty | Int | Max mail pieces per property |
| minDaysBetweenMails | Int | Minimum days between mailings |
| excludeRecentDeals | Boolean | Exclude recent deal properties |

#### SegmentMember
Properties in segments with point-in-time snapshots.

| Field | Type | Description |
|-------|------|-------------|
| segmentId | FK | Segment reference |
| propertyId | FK | Property reference |
| dispoScoreSnapshot | Decimal | Score at time of addition |
| motivationSnapshot | Decimal | Motivation at addition |
| distressFlagsSnapshot | JSON | Flags at addition |

---

### Section 7: Campaigns & Variants

#### Campaign
Direct mail campaigns.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| createdById | FK | User who created |
| name | String | Campaign name |
| type | CampaignType | WHOLESALER, FLIPPER, ROOFER, etc. |
| goal | CampaignGoal | CONTRACTS, APPOINTMENTS, LEADS, BRAND_AWARENESS |
| status | CampaignStatus | DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, CANCELLED |
| totalBudget, spentBudget | Decimal | Budget tracking |
| isMultiTouch | Boolean | Multi-touch campaign flag |
| touchCount | Int | Number of touches |
| isExperiment | Boolean | A/B test flag |
| experimentType | ExperimentType | A_B_TEST, MULTI_ARM_BANDIT, SEQUENTIAL |
| totalMailed, totalDelivered | Int | Volume metrics |
| totalCalls, totalContracts | Int | Response metrics |
| responseRate, contractRate | Decimal | Computed rates |
| grossProfit, roi | Decimal | Financial metrics |

#### CampaignStep
Steps/waves in multi-touch campaigns.

| Field | Type | Description |
|-------|------|-------------|
| campaignId | FK | Campaign reference |
| stepNumber | Int | Step order |
| daysSincePrevious | Int | Days after previous step |
| designTemplateId | FK | Design for this step |
| offerStrategyId | FK | Offer strategy for this step |

#### Variant
A/B test variants within campaigns.

| Field | Type | Description |
|-------|------|-------------|
| campaignId | FK | Campaign reference |
| stepId | FK | Campaign step reference |
| designVersionId | FK | Design version used |
| offerStrategyId | FK | Offer strategy used |
| allocationPercent | Decimal | Traffic allocation |
| piecesMailed, calls, contracts | Int | Performance metrics |
| isControl | Boolean | Control variant flag |
| isWinner | Boolean | Winner flag |
| pValue | Decimal | Statistical significance |
| liftVsControl | Decimal | Lift percentage |

#### Batch
Mail batches for printing/mailing.

| Field | Type | Description |
|-------|------|-------------|
| campaignId | FK | Campaign reference |
| batchNumber | Int | Batch order |
| status | BatchStatus | PENDING, SCHEDULED, PRINTING, MAILED, etc. |
| targetQuantity, actualQuantity | Int | Volume |
| printJobId | String | Print vendor job ID |

#### BatchVariant
Junction table linking batches to variants with quantity.

---

### Section 8: Design & Creative

#### DesignTemplate
Reusable mail design templates.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| name | String | Template name |
| format | MailFormat | CHECK_LETTER, POSTCARD, YELLOW_LETTER, etc. |
| supportsOffer | Boolean | Can include offer |
| offerPlacement | String | Where offer appears |

#### DesignVersion
Versions of design templates for A/B testing.

| Field | Type | Description |
|-------|------|-------------|
| templateId | FK | Template reference |
| versionNumber | Int | Version number |
| headline, bodyContent, callToAction | String | Creative content |
| imageUrl | String | Image URL |
| testElements | JSON | What's different in this version |

---

### Section 9: Offer Strategies

#### OfferStrategy
Pricing and offer calculation strategies.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| name | String | Strategy name |
| baseOffers | JSON | Base offer % by price band |
| distressAdjustments | JSON | Adjustments by distress type |
| dispoAdjustments | JSON | Adjustments by dispo score |
| minOfferPercent, maxOfferPercent | Decimal | Offer constraints |
| useOfferRange | Boolean | Range vs fixed offer |
| rangeWidth | Decimal | Range width (e.g., 0.05 = ±5%) |

---

### Section 10: Mail Tracking

#### MailPiece
Individual mail pieces sent to properties.

| Field | Type | Description |
|-------|------|-------------|
| batchId | FK | Batch reference |
| variantId | FK | Variant reference |
| propertyId | FK | Property reference |
| designVersionId | FK | Design used |
| offerStrategyId | FK | Offer strategy used |
| offerAmount | Decimal | Offer dollar amount |
| offerPercent | Decimal | Offer as % of AVM |
| trackingNumber | String | USPS tracking |
| phoneNumberId | FK | Tracking phone number |
| status | MailStatus | CREATED, MAILED, DELIVERED, RETURNED, etc. |
| printCost, postageCost, totalCost | Decimal | Cost tracking |

#### MailEvent
USPS tracking events for mail pieces.

| Field | Type | Description |
|-------|------|-------------|
| mailPieceId | FK | Mail piece reference |
| eventType | MailEventType | MAILED, IN_TRANSIT, DELIVERED, RETURNED, etc. |
| timestamp | DateTime | Event time |
| location | String | USPS location |

---

### Section 11: Telephony

#### PhoneNumber
Tracking phone numbers for inbound calls.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| number | String | Phone number (unique) |
| type | PhoneNumberType | LOCAL, TOLL_FREE, TRACKING |
| status | PhoneStatus | ACTIVE, SPAM_FLAGGED, BLOCKED, etc. |
| spamScore | Decimal | Spam risk score 0-1 |
| providerSid | String | Twilio/provider SID |

#### PhoneNumberAssignment
Assigns phone numbers to campaigns/variants/markets (proper FK relationships).

| Field | Type | Description |
|-------|------|-------------|
| phoneNumberId | FK | Phone number reference |
| campaignId | FK | Campaign reference |
| variantId | FK | Variant reference |
| marketId | FK | Market reference |
| routingType | RoutingType | DIRECT_TO_USER, ROUND_ROBIN, IVR, etc. |
| routingTarget | String | Routing destination |

#### PhoneHealthLog
Health check logs for phone numbers.

---

### Section 12: Calls & Leads

#### CallEvent
Inbound calls from prospects.

| Field | Type | Description |
|-------|------|-------------|
| phoneNumberId | FK | Phone that received call |
| mailPieceId | FK | Attributed mail piece |
| assigneeId | FK | User assigned |
| callerNumber | String | Caller's phone |
| startTime, endTime | DateTime | Call timing |
| duration | Int | Seconds |
| status | CallStatus | COMPLETED, MISSED, VOICEMAIL, etc. |
| outcome | CallOutcome | INTERESTED, NOT_INTERESTED, APPOINTMENT_SET, etc. |
| talkTrackId | FK | Talk track used |
| isQualified | Boolean | Qualified lead flag |
| qualificationScore | Decimal | Lead quality 0-1 |
| recordingUrl | String | Call recording URL |

---

### Section 13: Buyers & Investors

#### Buyer
Buyers/investors for disposition.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| name | String | Buyer name |
| companyName | String | Company name |
| email, phone | String | Contact info |
| type | BuyerType | CASH_BUYER, FIX_AND_FLIPPER, HEDGE_FUND, etc. |
| targetMarkets | JSON | Target market IDs |
| targetPriceBands | JSON | Target price bands |
| targetPropertyTypes | JSON | Target property types |
| maxPurchasePrice | Decimal | Max purchase price |
| proofOfFundsOnFile | Boolean | POF verified |
| totalDeals | Int | Completed deals |
| avgDaysToClose | Int | Average close time |
| reliabilityScore | Decimal | Reliability 0-1 |

---

### Section 14: Conversions & Deals

#### ConversionEvent
Conversion events from calls.

| Field | Type | Description |
|-------|------|-------------|
| callId | FK | Call reference (unique) |
| type | ConversionType | APPOINTMENT, OFFER_MADE, CONTRACT_SIGNED, DEAL_CLOSED |
| attributionWindow | Int | Days from mail to conversion |
| dealId | FK | Deal reference (unique) |

#### Deal
Deals resulting from campaigns.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| createdById | FK | User who created |
| propertyId | FK | Property reference |
| status | DealStatus | PENDING, UNDER_CONTRACT, CLOSED, FELL_THROUGH, etc. |
| type | DealType | WHOLESALE, FIX_AND_FLIP, BUY_AND_HOLD, etc. |
| mailedOffer | Decimal | Original mailed offer |
| negotiatedPrice | Decimal | Negotiated price |
| contractPrice | Decimal | Final contract price |
| assignmentFee | Decimal | Wholesale assignment fee |
| grossProfit, netProfit | Decimal | Profit metrics |
| buyerId | FK | Buyer reference |
| dispoType | DispoType | WHOLESALE_ASSIGNMENT, RETAIL_SALE, etc. |
| daysToClose | Int | Days to close |
| attributedCampaignId | FK | Campaign attribution |
| attributedVariantId | FK | Variant attribution |
| attributionType | AttributionType | FIRST_TOUCH, LAST_TOUCH, LINEAR, TIME_DECAY |

---

### Section 15: Sales Enablement

#### TalkTrack
Call scripts and objection handlers.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| name | String | Talk track name |
| type | TalkTrackType | INITIAL_CONTACT, FOLLOW_UP, PROBATE_SPECIALIST, etc. |
| openingScript | String | Opening script |
| qualifyingQuestions | JSON | Qualifying questions |
| objectionHandlers | JSON | Objection handling scripts |
| closingScript | String | Closing script |
| maxDiscount | Decimal | Maximum discount allowed |
| distressTypes | JSON | Optimized for which distress types |

---

### Section 16: Seasonality & Cash Cycle (Cached Analytics)

#### SeasonalityProfile
Seasonal trends by market (cached for performance).

| Field | Type | Description |
|-------|------|-------------|
| marketId | FK | Market reference |
| year | Int | Year |
| monthlyIndices | JSON | Monthly performance indices |
| peakMonths | JSON | Best months |
| troughMonths | JSON | Worst months |
| taxSeasonImpact | Decimal | Tax season effect |

#### CashCycleProfile
Deal cycle timing by deal type (cached for performance).

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| dealType | DealType | Deal type |
| avgSpendToLead | Int | Days from spend to lead |
| avgLeadToContract | Int | Days from lead to contract |
| avgContractToClose | Int | Days from contract to close |
| avgTotalCycleDays | Int | Total cycle days |

---

### Section 17: Diagnostics & Analytics

#### DiagnosticSnapshot
Performance analysis snapshots.

| Field | Type | Description |
|-------|------|-------------|
| campaignId | FK | Campaign reference (optional) |
| accountId | FK | Account reference (optional) |
| createdById | FK | User who created |
| snapshotType | SnapshotType | CAMPAIGN_PERFORMANCE, RESPONSE_CHANGE, etc. |
| periodStart, periodEnd | DateTime | Analysis period |
| metrics | JSON | All metrics for this period |
| dimensionBreakdowns | JSON | Breakdowns by segment, variant, etc. |
| status | DiagnosticStatus | PENDING, ANALYZING, COMPLETED, FAILED |

#### DiagnosticHypothesis
AI-generated hypotheses for performance changes.

| Field | Type | Description |
|-------|------|-------------|
| snapshotId | FK | Snapshot reference |
| category | HypothesisCategory | LIST_SHIFT, OFFER_CHANGE, TELEPHONY_ISSUE, etc. |
| title | String | Hypothesis title |
| description | String | Detailed description |
| confidence | Decimal | Confidence 0-1 |
| impactScore | Decimal | Impact 0-1 |
| recommendations | JSON | Recommended actions |
| rank | Int | Order by impact |

---

### Section 18: Tasks & Automation

#### TriggerRule
Automation rules for triggering actions.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| name | String | Rule name |
| triggerType | TriggerType | NEW_DISTRESS_FLAG, MAIL_DELIVERED, CALL_OUTCOME, etc. |
| conditions | JSON | Trigger conditions |
| actionType | TriggerActionType | ADD_TO_CAMPAIGN, SEND_MAIL_PIECE, CREATE_TASK, etc. |
| actionConfig | JSON | Action configuration |
| maxLatencyHours | Int | Max delay |
| cooldownDays | Int | Cooldown period |

#### TriggerExecution
Records of trigger rule executions.

#### Task
Tasks for workflow automation.

| Field | Type | Description |
|-------|------|-------------|
| accountId | FK | Account reference |
| title | String | Task title |
| description | String | Task description |
| type | TaskType | FOLLOW_UP_CALL, SEND_MAIL, REVIEW_DEAL, etc. |
| priority | TaskPriority | LOW, MEDIUM, HIGH, URGENT |
| status | TaskStatus | PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED |
| assigneeId | FK | Assigned user |
| propertyId | FK | Related property |
| dealId | FK | Related deal |
| callEventId | FK | Related call |
| triggerRuleId | FK | Created by trigger |
| dueDate | DateTime | Due date |
| completedAt | DateTime | Completion time |

---

### Section 19: Audit & Events

#### AuditLog
Audit trail for all data changes.

| Field | Type | Description |
|-------|------|-------------|
| accountId | String | Account (not FK for flexibility) |
| userId | String | User who made change |
| entityType | String | Table/entity name |
| entityId | String | Entity ID |
| action | String | CREATE, UPDATE, DELETE |
| previousData | JSON | Before state |
| newData | JSON | After state |
| ipAddress | String | Client IP |

#### SystemEvent
System-wide events for monitoring.

| Field | Type | Description |
|-------|------|-------------|
| eventType | String | Event type |
| eventData | JSON | Event payload |
| source | String | Module/service that emitted |
| correlationId | String | For tracing |

---

## Key Enums Reference

```typescript
// Account & User
AccountType: WHOLESALER, FLIPPER, BUY_AND_HOLD, TURNKEY_OPERATOR, HEDGE_FUND, ROOFER, HOME_SERVICES, PORTFOLIO_BUYER
UserRole: ADMIN, MARKETING_MANAGER, ANALYST, ACQUISITIONS_MANAGER, AE, AI_AGENT

// Property
PropertyType: SINGLE_FAMILY, MULTI_FAMILY, CONDO, TOWNHOUSE, MANUFACTURED, LAND, COMMERCIAL
PriceBand: BAND_0_100K, BAND_100_200K, BAND_200_300K, BAND_300_500K, BAND_500K_PLUS
OwnershipType: OWNER_OCCUPIED, ABSENTEE_IN_STATE, ABSENTEE_OUT_OF_STATE, CORPORATE, TRUST, ESTATE

// Flags
FlagCategory: DISTRESS, MOTIVATION, CONDITION
FlagSeverity: LOW, MEDIUM, HIGH, CRITICAL
DistressType: PRE_FORECLOSURE, FORECLOSURE, PROBATE, INHERITANCE, TAX_LIEN, TAX_DELINQUENT, DIVORCE, CODE_VIOLATION, EVICTION, BANKRUPTCY
MotivationIndicator: VACANT, ABSENTEE_OWNER, HIGH_EQUITY, TIRED_LANDLORD, LONG_OWNERSHIP, FAILED_LISTING, EXPIRED_LISTING
PropertyConditionFlag: ROOF_DAMAGE, STORM_DAMAGE, FOUNDATION_ISSUES, FIRE_DAMAGE, WATER_DAMAGE, DEFERRED_MAINTENANCE, MAJOR_REPAIRS_NEEDED

// Campaign
CampaignType: WHOLESALER, FLIPPER, BUY_AND_HOLD, ROOFER, HOME_SERVICES, MIXED
CampaignGoal: CONTRACTS, APPOINTMENTS, LEADS, BRAND_AWARENESS
CampaignStatus: DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, CANCELLED

// Mail
MailFormat: CHECK_LETTER, GENERIC_LETTER, STANDARD_POSTCARD, OVERSIZED_POSTCARD, HANDWRITTEN_POSTCARD, SNAP_PACK, SORRY_WE_MISSED_YOU, YELLOW_LETTER
MailStatus: CREATED, QUEUED, PRINTING, MAILED, IN_TRANSIT, DELIVERED, RETURNED, UNDELIVERABLE

// Telephony
PhoneNumberType: LOCAL, TOLL_FREE, TRACKING
PhoneStatus: ACTIVE, INACTIVE, SPAM_FLAGGED, BLOCKED, PENDING_REGISTRATION
CallStatus: RINGING, IN_PROGRESS, COMPLETED, MISSED, VOICEMAIL, FAILED, BUSY
CallOutcome: INTERESTED, NOT_INTERESTED, CALLBACK_REQUESTED, WRONG_NUMBER, NO_ANSWER, LEFT_VOICEMAIL, DO_NOT_CALL, APPOINTMENT_SET, CONTRACT_DISCUSSED

// Deals
DealStatus: PENDING, UNDER_CONTRACT, DUE_DILIGENCE, ASSIGNED, CLOSED, FELL_THROUGH, CANCELLED
DealType: WHOLESALE, FIX_AND_FLIP, BUY_AND_HOLD, TURNKEY, CREATIVE_FINANCE
DispoType: WHOLESALE_ASSIGNMENT, RETAIL_SALE, RENTAL_HOLD, SOLD_TO_HEDGE_FUND, CREATIVE_EXIT
BuyerType: CASH_BUYER, FIX_AND_FLIPPER, BUY_AND_HOLD_INVESTOR, HEDGE_FUND, TURNKEY_OPERATOR, RETAIL_BUYER, WHOLESALER

// Tasks
TaskType: FOLLOW_UP_CALL, SEND_MAIL, REVIEW_DEAL, PROPERTY_INSPECTION, NEGOTIATE_OFFER, COLLECT_DOCUMENTS, CLOSE_DEAL, CUSTOM
TaskPriority: LOW, MEDIUM, HIGH, URGENT
TaskStatus: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED

// Triggers
TriggerType: NEW_DISTRESS_FLAG, DISTRESS_ESCALATION, PROPERTY_ENTERED_MARKET, DOM_THRESHOLD_EXCEEDED, PRICE_DROP, MAIL_DELIVERED, NO_RESPONSE_AFTER_DAYS, CALL_OUTCOME
TriggerActionType: ADD_TO_CAMPAIGN, SEND_MAIL_PIECE, CREATE_TASK, SEND_WEBHOOK, UPDATE_SEGMENT
```

---

## Data Flow

```
1. Account → owns → Markets, Campaigns, Segments, Users, Buyers

2. Property → has:
   - Owner (via primaryOwnerId or PropertyOwnership)
   - PropertyFlags (distress, motivation, condition)
   - PropertyValuationHistory
   - belongs to Market and ZipCode

3. Campaign → uses:
   - Segments (via CampaignSegment)
   - has Variants, Batches, Steps
   - PhoneNumberAssignments for tracking

4. MailPiece → tracks:
   - Individual mail sent
   - Links to Property, Variant, Batch
   - MailEvents for USPS tracking

5. CallEvent → triggered by:
   - MailPiece (attribution)
   - Can create ConversionEvent
   - ConversionEvent links to Deal

6. Deal → tracks:
   - Property disposition
   - Buyer assignment
   - Campaign/Variant attribution
   - Profit calculation
```

---

## API Endpoints

| Resource | Endpoint | Description |
|----------|----------|-------------|
| Accounts | `/api/v1/accounts` | Account management |
| Users | `/api/v1/users` | User management |
| Markets | `/api/v1/markets` | Market & zip code management |
| Properties | `/api/v1/properties` | Property CRUD with flags |
| Segments | `/api/v1/segments` | Audience segmentation |
| Campaigns | `/api/v1/campaigns` | Campaign orchestration |
| Experiments | `/api/v1/experiments` | A/B testing |
| Telephony | `/api/v1/telephony` | Phone number health |
| Offers | `/api/v1/offers` | Dynamic offer calculation |
| Sales | `/api/v1/sales` | Talk tracks |
| Deals | `/api/v1/deals` | Deal pipeline |
| Analytics | `/api/v1/analytics` | Performance dashboards |
| Diagnostics | `/api/v1/diagnostics` | "What Changed?" analysis |
| Triggers | `/api/v1/triggers` | Automation rules |

---

## Recent Schema Changes (v2.0)

1. **Added Buyer table** - Proper buyer/investor tracking with criteria and performance
2. **Added Task table** - Workflow automation support
3. **Added PropertyValuationHistory** - Historical valuation tracking
4. **Added PropertyOwnership** - Junction table for 1:many Owner→Property
5. **Renamed DistressFlag to PropertyFlag** - Unified flag system with categories
6. **Split DistressType enum** - Separated into DistressType, MotivationIndicator, PropertyConditionFlag
7. **Fixed FK relationships** - TriggerRule→Account, DiagnosticSnapshot→Account, PhoneNumberAssignment→Campaign/Variant/Market, Deal→Campaign/Variant
8. **Removed duplicate fields** - Property.isAbsenteeOwner, Property.isVacant, Owner.fullName
9. **Added missing indexes** - MailPiece.createdAt, Deal.createdAt, CallEvent.isQualified
