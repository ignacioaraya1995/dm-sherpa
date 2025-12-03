import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Data generators
const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const STREET_NAMES = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm Blvd', 'Washington St', 'Park Ave'];

function generateFirstName(): string {
  return randomElement(FIRST_NAMES);
}

function generateLastName(): string {
  return randomElement(LAST_NAMES);
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
}

function generatePhone(): string {
  return `+1${randomBetween(200, 999)}${randomBetween(100, 999)}${randomBetween(1000, 9999)}`;
}

function generateStreetAddress(): string {
  return `${randomBetween(100, 9999)} ${randomElement(STREET_NAMES)}`;
}

// Enum values from schema
const ACCOUNT_TYPES = ['WHOLESALER', 'FLIPPER', 'BUY_AND_HOLD', 'ROOFER', 'HOME_SERVICES'] as const;
const USER_ROLES = ['ADMIN', 'MARKETING_MANAGER', 'ANALYST', 'ACQUISITIONS_MANAGER', 'AE'] as const;
const PROPERTY_TYPES = ['SINGLE_FAMILY', 'MULTI_FAMILY', 'CONDO', 'TOWNHOUSE', 'MANUFACTURED'] as const;
const PRICE_BANDS = ['BAND_0_100K', 'BAND_100_200K', 'BAND_200_300K', 'BAND_300_500K', 'BAND_500K_PLUS'] as const;
const OWNERSHIP_TYPES = ['OWNER_OCCUPIED', 'ABSENTEE_IN_STATE', 'ABSENTEE_OUT_OF_STATE', 'CORPORATE', 'TRUST', 'ESTATE'] as const;
const DISTRESS_TYPES = ['PRE_FORECLOSURE', 'FORECLOSURE', 'PROBATE', 'TAX_LIEN', 'DIVORCE', 'CODE_VIOLATION', 'EVICTION', 'BANKRUPTCY', 'VACANT', 'ABSENTEE', 'HIGH_EQUITY', 'TIRED_LANDLORD'] as const;
const DISTRESS_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const CAMPAIGN_TYPES = ['WHOLESALER', 'FLIPPER', 'BUY_AND_HOLD', 'ROOFER', 'HOME_SERVICES'] as const;
const CAMPAIGN_GOALS = ['CONTRACTS', 'APPOINTMENTS', 'LEADS'] as const;
const CAMPAIGN_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;
const BATCH_STATUSES = ['PENDING', 'SCHEDULED', 'PRINTING', 'MAILED', 'DELIVERED', 'COMPLETED'] as const;
const MAIL_FORMATS = ['CHECK_LETTER', 'GENERIC_LETTER', 'STANDARD_POSTCARD', 'OVERSIZED_POSTCARD', 'YELLOW_LETTER'] as const;
const MAIL_STATUSES = ['CREATED', 'QUEUED', 'PRINTING', 'MAILED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'] as const;
const PHONE_TYPES = ['LOCAL', 'TOLL_FREE', 'TRACKING'] as const;
const PHONE_STATUSES = ['ACTIVE', 'INACTIVE', 'SPAM_FLAGGED', 'PENDING_REGISTRATION'] as const;
const HEALTH_CHECK_TYPES = ['AUTOMATED_TEST_CALL', 'SPAM_CHECK', 'REGISTRATION_CHECK'] as const;
const CALL_STATUSES = ['COMPLETED', 'MISSED', 'VOICEMAIL', 'FAILED'] as const;
const CALL_OUTCOMES = ['INTERESTED', 'NOT_INTERESTED', 'CALLBACK_REQUESTED', 'WRONG_NUMBER', 'NO_ANSWER', 'APPOINTMENT_SET'] as const;
const DEAL_TYPES = ['WHOLESALE', 'FIX_AND_FLIP', 'BUY_AND_HOLD', 'TURNKEY'] as const;
const DEAL_STATUSES = ['PENDING', 'UNDER_CONTRACT', 'DUE_DILIGENCE', 'ASSIGNED', 'CLOSED', 'FELL_THROUGH'] as const;
const TALK_TRACK_TYPES = ['INITIAL_CONTACT', 'FOLLOW_UP', 'RENEGOTIATION', 'PROBATE_SPECIALIST', 'PRE_FORECLOSURE_URGENT'] as const;
const TRIGGER_TYPES = ['NEW_DISTRESS_FLAG', 'DISTRESS_ESCALATION', 'PRICE_DROP', 'NO_RESPONSE_AFTER_DAYS'] as const;
const TRIGGER_ACTION_TYPES = ['ADD_TO_CAMPAIGN', 'SEND_MAIL_PIECE', 'CREATE_TASK', 'SEND_WEBHOOK'] as const;
const SNAPSHOT_TYPES = ['CAMPAIGN_PERFORMANCE', 'RESPONSE_CHANGE', 'TELEPHONY_HEALTH', 'LIST_COMPOSITION'] as const;
const HYPOTHESIS_CATEGORIES = ['LIST_SHIFT', 'OFFER_CHANGE', 'TELEPHONY_ISSUE', 'CREATIVE_FATIGUE', 'SEASONAL_PATTERN', 'MARKET_CONDITION'] as const;

// Market data
const MARKETS_DATA = [
  { name: 'Phoenix Metro', state: 'AZ', county: 'Maricopa', city: 'Phoenix' },
  { name: 'Dallas-Fort Worth', state: 'TX', county: 'Dallas', city: 'Dallas' },
  { name: 'Houston Metro', state: 'TX', county: 'Harris', city: 'Houston' },
  { name: 'Tampa Bay', state: 'FL', county: 'Hillsborough', city: 'Tampa' },
  { name: 'Atlanta Metro', state: 'GA', county: 'Fulton', city: 'Atlanta' },
  { name: 'Orlando', state: 'FL', county: 'Orange', city: 'Orlando' },
  { name: 'Charlotte', state: 'NC', county: 'Mecklenburg', city: 'Charlotte' },
  { name: 'Nashville', state: 'TN', county: 'Davidson', city: 'Nashville' },
];

async function main() {
  console.log('Seeding database with synthetic data...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.triggerExecution.deleteMany();
  await prisma.triggerRule.deleteMany();
  await prisma.diagnosticHypothesis.deleteMany();
  await prisma.diagnosticSnapshot.deleteMany();
  await prisma.conversionEvent.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.callEvent.deleteMany();
  await prisma.mailEvent.deleteMany();
  await prisma.mailPiece.deleteMany();
  await prisma.batchVariant.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.campaignStep.deleteMany();
  await prisma.campaignSegment.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segmentMember.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.phoneHealthLog.deleteMany();
  await prisma.phoneNumberAssignment.deleteMany();
  await prisma.phoneNumber.deleteMany();
  await prisma.designVersion.deleteMany();
  await prisma.designTemplate.deleteMany();
  await prisma.offerStrategy.deleteMany();
  await prisma.talkTrack.deleteMany();
  await prisma.cashCycleProfile.deleteMany();
  await prisma.seasonalityProfile.deleteMany();
  await prisma.marketDispoData.deleteMany();
  await prisma.distressFlag.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.property.deleteMany();
  await prisma.zipCode.deleteMany();
  await prisma.accountMarket.deleteMany();
  await prisma.market.deleteMany();
  await prisma.user.deleteMany();
  await prisma.account.deleteMany();

  // Create accounts
  console.log('Creating accounts...');
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        name: 'Apex Property Solutions',
        type: 'WHOLESALER',
        status: 'ACTIVE',
        settings: {},
        isSynthetic: true,
      },
    }),
    prisma.account.create({
      data: {
        name: 'Texas Home Buyers',
        type: 'FLIPPER',
        status: 'ACTIVE',
        settings: {},
        isSynthetic: true,
      },
    }),
    prisma.account.create({
      data: {
        name: 'Sunshine State Investors',
        type: 'BUY_AND_HOLD',
        status: 'ACTIVE',
        settings: {},
        isSynthetic: true,
      },
    }),
  ]);

  // Create users for each account
  console.log('Creating users...');
  const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const account of accounts) {
    const adminFirst = generateFirstName();
    const adminLast = generateLastName();
    const admin = await prisma.user.create({
      data: {
        accountId: account.id,
        email: generateEmail(adminFirst, adminLast),
        name: `${adminFirst} ${adminLast}`,
        role: 'ADMIN',
        settings: {},
      },
    });
    users.push(admin);

    for (let i = 0; i < randomBetween(2, 4); i++) {
      const firstName = generateFirstName();
      const lastName = generateLastName();
      const member = await prisma.user.create({
        data: {
          accountId: account.id,
          email: generateEmail(firstName, lastName) + i,
          name: `${firstName} ${lastName}`,
          role: randomElement(USER_ROLES),
          settings: {},
        },
      });
      users.push(member);
    }
  }

  // Create markets
  console.log('Creating markets...');
  const markets: Awaited<ReturnType<typeof prisma.market.create>>[] = [];
  for (const md of MARKETS_DATA) {
    const market = await prisma.market.create({
      data: {
        name: md.name,
        state: md.state,
        county: md.county,
        city: md.city,
        medianPrice: randomBetween(200000, 450000),
        avgDom: randomBetween(15, 60),
        priceAppreciation: randomFloat(2, 12),
        buyerDensityScore: randomFloat(0.3, 0.9),
        spreadHistory: [],
        isSynthetic: true,
      },
    });
    markets.push(market);
  }

  // Create account-market associations
  console.log('Creating account-market associations...');
  for (const account of accounts) {
    const assignedMarkets = randomElements(markets, randomBetween(2, 4));
    for (const market of assignedMarkets) {
      await prisma.accountMarket.create({
        data: {
          accountId: account.id,
          marketId: market.id,
          avmBiasFactor: randomFloat(0.95, 1.05),
          minSpread: randomBetween(15000, 30000),
          maxArv: randomBetween(400000, 600000),
          isActive: true,
        },
      });
    }
  }

  // Create zip codes for markets
  console.log('Creating zip codes...');
  const zipCodes: Awaited<ReturnType<typeof prisma.zipCode.create>>[] = [];
  for (const market of markets) {
    const zipCount = randomBetween(5, 10);
    for (let i = 0; i < zipCount; i++) {
      const zipCode = await prisma.zipCode.create({
        data: {
          code: `${randomBetween(10000, 99999)}`,
          marketId: market.id,
          avgDom: randomBetween(15, 60),
          medianPrice: Number(market.medianPrice) + randomBetween(-50000, 50000),
          buyerDensityScore: randomFloat(0.3, 0.9),
          investorActivityScore: randomFloat(0.2, 0.8),
          isSynthetic: true,
        },
      });
      zipCodes.push(zipCode);
    }
  }

  // Create properties with distress flags
  console.log('Creating properties...');
  const properties: Awaited<ReturnType<typeof prisma.property.create>>[] = [];

  for (const market of markets) {
    const marketZips = zipCodes.filter((z) => z.marketId === market.id);
    const propertyCount = randomBetween(50, 100);

    for (let i = 0; i < propertyCount; i++) {
      const zipCode = randomElement(marketZips);
      const avmValue = Number(market.medianPrice) + randomBetween(-100000, 100000);
      const arvValue = avmValue * randomFloat(1.1, 1.4);

      const property = await prisma.property.create({
        data: {
          streetAddress: generateStreetAddress(),
          city: market.city || market.name,
          state: market.state,
          zipCodeId: zipCode.id,
          marketId: market.id,
          propertyType: randomElement(PROPERTY_TYPES),
          beds: randomBetween(2, 5),
          baths: randomBetween(1, 3),
          sqft: randomBetween(1000, 3500),
          lotSqft: randomBetween(3000, 15000),
          yearBuilt: randomBetween(1960, 2015),
          avmValue: avmValue,
          arvValue: arvValue,
          priceBand: getPriceBand(avmValue),
          estimatedEquity: avmValue * randomFloat(0.2, 0.6),
          equityPercent: randomFloat(20, 60),
          isVacant: Math.random() < 0.1,
          isAbsenteeOwner: Math.random() < 0.3,
          dispoScore: randomFloat(0.4, 0.95),
          motivationScore: randomFloat(0.3, 0.95),
          isSynthetic: true,
        },
      });
      properties.push(property);

      // Add owner
      const ownerFirst = generateFirstName();
      const ownerLast = generateLastName();
      await prisma.owner.create({
        data: {
          propertyId: property.id,
          firstName: ownerFirst,
          lastName: ownerLast,
          fullName: `${ownerFirst} ${ownerLast}`,
          mailingStreet: Math.random() < 0.7 ? property.streetAddress : generateStreetAddress(),
          mailingCity: property.city,
          mailingState: property.state,
          mailingZip: zipCode.code,
          phone: Math.random() < 0.4 ? generatePhone() : null,
          email: Math.random() < 0.2 ? generateEmail(ownerFirst, ownerLast) : null,
          ownershipType: randomElement(OWNERSHIP_TYPES),
          ownershipLength: randomBetween(1, 20),
          isAbsentee: property.isAbsenteeOwner,
          isSynthetic: true,
        },
      });

      // Add 1-3 distress flags per property
      const flagCount = randomBetween(1, 3);
      const selectedTypes = randomElements([...DISTRESS_TYPES], flagCount);
      for (const dtype of selectedTypes) {
        await prisma.distressFlag.create({
          data: {
            propertyId: property.id,
            type: dtype,
            severity: randomElement(DISTRESS_SEVERITIES),
            startDate: randomDate(new Date('2023-01-01'), new Date('2024-06-01')),
            daysActive: randomBetween(30, 365),
            metadata: {},
            source: randomElement(['CountyRecords', 'CourtSystem', 'TaxOffice', 'DataProvider']),
            isActive: Math.random() < 0.85,
            isSynthetic: true,
          },
        });
      }
    }
  }

  // Create segments
  console.log('Creating segments...');
  const segments: Awaited<ReturnType<typeof prisma.segment.create>>[] = [];
  const segmentTemplates = [
    { name: 'High Motivation Pre-Foreclosure', filters: { distressTypes: ['PRE_FORECLOSURE'], motivationMin: 0.7 } },
    { name: 'Probate + Tax Lien Combo', filters: { distressTypes: ['PROBATE', 'TAX_LIEN'], motivationMin: 0.5 } },
    { name: 'Absentee Owners High Equity', filters: { isAbsentee: true, equityMin: 50 } },
    { name: 'Code Violations Quick Flip', filters: { distressTypes: ['CODE_VIOLATION'], dispoMin: 0.7 } },
  ];

  for (const account of accounts) {
    for (const template of segmentTemplates) {
      const segment = await prisma.segment.create({
        data: {
          accountId: account.id,
          name: template.name,
          description: `Auto-generated segment for ${template.name}`,
          filters: template.filters as Prisma.InputJsonValue,
          memberCount: randomBetween(50, 500),
          avgDispoScore: randomFloat(0.5, 0.9),
          avgMotivation: randomFloat(0.5, 0.9),
          distressMix: {},
          maxMailsPerProperty: 6,
          minDaysBetweenMails: 21,
          isActive: true,
          isSynthetic: true,
        },
      });
      segments.push(segment);
    }
  }

  // Create phone numbers
  console.log('Creating phone numbers...');
  const phoneNumbers: Awaited<ReturnType<typeof prisma.phoneNumber.create>>[] = [];
  for (const account of accounts) {
    const phoneCount = randomBetween(5, 10);
    for (let i = 0; i < phoneCount; i++) {
      const phone = await prisma.phoneNumber.create({
        data: {
          accountId: account.id,
          number: generatePhone(),
          type: randomElement(PHONE_TYPES),
          region: randomElement(['Southwest', 'Southeast', 'Midwest']),
          state: randomElement(['AZ', 'TX', 'FL', 'GA']),
          areaCode: `${randomBetween(200, 999)}`,
          status: randomElement(PHONE_STATUSES),
          spamScore: randomFloat(0, 0.3),
          expectedCallsPerThousand: randomFloat(8, 25),
          isSynthetic: true,
        },
      });
      phoneNumbers.push(phone);

      // Add health logs
      for (let h = 0; h < 5; h++) {
        await prisma.phoneHealthLog.create({
          data: {
            phoneNumberId: phone.id,
            checkType: randomElement(HEALTH_CHECK_TYPES),
            timestamp: randomDate(new Date('2024-09-01'), new Date()),
            isHealthy: Math.random() < 0.85,
            spamScore: randomFloat(0, 0.3),
            testCallSuccess: Math.random() < 0.9,
            latencyMs: randomBetween(100, 500),
            issues: [],
            isSynthetic: true,
          },
        });
      }
    }
  }

  // Create design templates
  console.log('Creating design templates...');
  const templates: Awaited<ReturnType<typeof prisma.designTemplate.create>>[] = [];
  const templateNames = ['Yellow Letter Classic', 'Postcard Bold', 'Check Letter Pro', 'Handwritten Style'];

  for (const account of accounts) {
    for (const name of templateNames) {
      const template = await prisma.designTemplate.create({
        data: {
          accountId: account.id,
          name: name,
          format: name.includes('Postcard') ? 'STANDARD_POSTCARD' : name.includes('Check') ? 'CHECK_LETTER' : 'YELLOW_LETTER',
          description: `${name} design template`,
          supportsOffer: true,
          isActive: true,
          isSynthetic: true,
        },
      });
      templates.push(template);

      // Add design versions
      for (let v = 1; v <= 2; v++) {
        await prisma.designVersion.create({
          data: {
            templateId: template.id,
            versionNumber: v,
            name: `Version ${v}`,
            headline: `We Want to Buy Your House - V${v}`,
            bodyContent: 'We are local investors looking to buy properties...',
            callToAction: 'Call us today!',
            testElements: [],
            isActive: v === 1,
            isSynthetic: true,
          },
        });
      }
    }
  }

  // Create offer strategies
  console.log('Creating offer strategies...');
  const offerStrategies: Awaited<ReturnType<typeof prisma.offerStrategy.create>>[] = [];
  for (const account of accounts) {
    const strategies = [
      { name: 'Conservative', baseOffers: { BAND_0_100K: 0.60, BAND_100_200K: 0.65, BAND_200_300K: 0.68 } },
      { name: 'Balanced', baseOffers: { BAND_0_100K: 0.65, BAND_100_200K: 0.70, BAND_200_300K: 0.72 } },
      { name: 'Aggressive', baseOffers: { BAND_0_100K: 0.70, BAND_100_200K: 0.75, BAND_200_300K: 0.78 } },
    ];
    for (const s of strategies) {
      const strategy = await prisma.offerStrategy.create({
        data: {
          accountId: account.id,
          name: s.name,
          description: `${s.name} offer strategy`,
          baseOffers: s.baseOffers as Prisma.InputJsonValue,
          distressAdjustments: { PRE_FORECLOSURE: -0.05, PROBATE: -0.03 } as Prisma.InputJsonValue,
          dispoAdjustments: { lowDispoScore: -0.05 } as Prisma.InputJsonValue,
          minOfferPercent: 0.50,
          maxOfferPercent: 0.90,
          isActive: true,
          isSynthetic: true,
        },
      });
      offerStrategies.push(strategy);
    }
  }

  // Create talk tracks
  console.log('Creating talk tracks...');
  for (const account of accounts) {
    const tracks = [
      { name: 'Initial Contact', type: 'INITIAL_CONTACT' as const, distress: ['PRE_FORECLOSURE', 'TAX_LIEN'] },
      { name: 'Probate Specialist', type: 'PROBATE_SPECIALIST' as const, distress: ['PROBATE'] },
      { name: 'Follow Up', type: 'FOLLOW_UP' as const, distress: [] },
    ];
    for (const t of tracks) {
      await prisma.talkTrack.create({
        data: {
          accountId: account.id,
          name: t.name,
          type: t.type,
          openingScript: 'Thank you for calling back...',
          qualifyingQuestions: ['Are you the owner?', 'Are you interested in selling?'],
          objectionHandlers: { price_too_low: 'I understand. Let me explain our process...' } as Prisma.InputJsonValue,
          closingScript: 'Great, let me schedule a time to view the property...',
          distressTypes: t.distress,
          isActive: true,
          isSynthetic: true,
        },
      });
    }
  }

  // Create seasonality profiles
  console.log('Creating seasonality profiles...');
  for (const market of markets) {
    await prisma.seasonalityProfile.create({
      data: {
        marketId: market.id,
        year: 2024,
        monthlyIndices: { '1': 0.85, '2': 0.90, '3': 1.0, '4': 1.1, '5': 1.15, '6': 1.1, '7': 1.0, '8': 0.95, '9': 1.0, '10': 1.05, '11': 0.80, '12': 0.70 } as Prisma.InputJsonValue,
        peakMonths: [4, 5, 6],
        troughMonths: [11, 12, 1],
        holidayImpact: -0.15,
        isSynthetic: true,
      },
    });
  }

  // Create cash cycle profiles
  console.log('Creating cash cycle profiles...');
  for (const account of accounts) {
    for (const dealType of ['WHOLESALE', 'FIX_AND_FLIP', 'BUY_AND_HOLD'] as const) {
      await prisma.cashCycleProfile.create({
        data: {
          accountId: account.id,
          dealType,
          avgSpendToLead: dealType === 'WHOLESALE' ? 21 : 28,
          avgLeadToContract: dealType === 'WHOLESALE' ? 7 : 14,
          avgContractToClose: dealType === 'WHOLESALE' ? 14 : dealType === 'FIX_AND_FLIP' ? 45 : 30,
          avgCloseToCase: dealType === 'WHOLESALE' ? 3 : 7,
          avgTotalCycleDays: dealType === 'WHOLESALE' ? 45 : dealType === 'FIX_AND_FLIP' ? 94 : 79,
          dealsAnalyzed: randomBetween(20, 100),
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date(),
          isSynthetic: true,
        },
      });
    }
  }

  // Create campaigns
  console.log('Creating campaigns...');
  const campaigns: Awaited<ReturnType<typeof prisma.campaign.create>>[] = [];

  for (const account of accounts) {
    const accountUsers = users.filter((u) => u.accountId === account.id);
    const accountSegments = segments.filter((s) => s.accountId === account.id);
    const accountTemplates = templates.filter((t) => t.accountId === account.id);
    const accountStrategies = offerStrategies.filter((o) => o.accountId === account.id);

    for (let c = 0; c < randomBetween(3, 6); c++) {
      const creator = randomElement(accountUsers);
      const startDate = randomDate(new Date('2024-03-01'), new Date('2024-10-01'));
      const endDate = addDays(startDate, randomBetween(60, 180));

      const totalMailed = randomBetween(2000, 10000);
      const deliveryRate = randomFloat(0.92, 0.98);
      const responseRate = randomFloat(0.008, 0.025);

      const totalDelivered = Math.floor(totalMailed * deliveryRate);
      const totalCalls = Math.floor(totalDelivered * responseRate);
      const totalQualified = Math.floor(totalCalls * randomFloat(0.3, 0.6));
      const totalContracts = Math.floor(totalQualified * randomFloat(0.15, 0.35));
      const budget = totalMailed * randomFloat(0.45, 0.65);
      const spent = budget * randomFloat(0.7, 1.0);

      const campaign = await prisma.campaign.create({
        data: {
          accountId: account.id,
          createdById: creator.id,
          name: `Campaign ${c + 1} - ${account.name}`,
          description: 'Auto-generated campaign',
          type: randomElement(CAMPAIGN_TYPES),
          goal: randomElement(CAMPAIGN_GOALS),
          status: randomElement(CAMPAIGN_STATUSES),
          totalBudget: budget,
          spentBudget: spent,
          startDate,
          endDate,
          isMultiTouch: true,
          touchCount: randomBetween(2, 4),
          totalMailed,
          totalDelivered,
          totalCalls,
          totalQualifiedLeads: totalQualified,
          totalContracts,
          responseRate: responseRate,
          contractRate: totalDelivered > 0 ? totalContracts / totalDelivered : 0,
          grossProfit: totalContracts * randomBetween(15000, 45000),
          isSynthetic: true,
        },
      });
      campaigns.push(campaign);

      // Link campaign to segments
      const segment = randomElement(accountSegments);
      await prisma.campaignSegment.create({
        data: {
          campaignId: campaign.id,
          segmentId: segment.id,
          budgetPercent: 100,
        },
      });

      // Create campaign steps
      const touchCount = campaign.touchCount;
      const steps: Awaited<ReturnType<typeof prisma.campaignStep.create>>[] = [];
      for (let step = 0; step < touchCount; step++) {
        const template = randomElement(accountTemplates);
        const strategy = randomElement(accountStrategies);
        const campaignStep = await prisma.campaignStep.create({
          data: {
            campaignId: campaign.id,
            stepNumber: step + 1,
            name: `Touch ${step + 1}`,
            daysSincePrevious: step === 0 ? 0 : randomBetween(14, 28),
            designTemplateId: template.id,
            offerStrategyId: strategy.id,
          },
        });
        steps.push(campaignStep);
      }

      // Create variants
      const variants: Awaited<ReturnType<typeof prisma.variant.create>>[] = [];
      const variantCount = randomBetween(2, 3);
      for (let v = 0; v < variantCount; v++) {
        const variantMailed = Math.floor(totalMailed / variantCount);
        const variantCalls = Math.floor(variantMailed * responseRate * randomFloat(0.7, 1.3));

        const variant = await prisma.variant.create({
          data: {
            campaignId: campaign.id,
            stepId: steps[0]?.id,
            name: `Variant ${String.fromCharCode(65 + v)}`,
            description: `Test variant ${v + 1}`,
            allocationPercent: 100 / variantCount,
            piecesMailed: variantMailed,
            piecesDelivered: Math.floor(variantMailed * deliveryRate),
            calls: variantCalls,
            qualifiedCalls: Math.floor(variantCalls * 0.4),
            contracts: Math.floor(variantCalls * 0.15),
            isControl: v === 0,
            isActive: true,
            isSynthetic: true,
          },
        });
        variants.push(variant);
      }

      // Create batches
      const batchCount = randomBetween(2, 5);
      for (let b = 0; b < batchCount; b++) {
        const batchDate = addDays(startDate, b * 14);
        const batchSize = Math.floor(totalMailed / batchCount);

        const batch = await prisma.batch.create({
          data: {
            campaignId: campaign.id,
            batchNumber: b + 1,
            name: `Batch ${b + 1}`,
            status: randomElement(BATCH_STATUSES),
            scheduledDate: batchDate,
            sentDate: addDays(batchDate, 1),
            targetQuantity: batchSize,
            actualQuantity: batchSize,
            totalDelivered: Math.floor(batchSize * deliveryRate),
            isSynthetic: true,
          },
        });

        // Link batch to variants
        for (const variant of variants) {
          await prisma.batchVariant.create({
            data: {
              batchId: batch.id,
              variantId: variant.id,
              quantity: Math.floor(batchSize / variants.length),
            },
          });
        }

        // Create mail pieces for this batch (limited for seed)
        const mailPieceCount = Math.min(50, batchSize);
        const batchProperties = randomElements(properties, mailPieceCount);
        const accountPhones = phoneNumbers.filter((p) => p.accountId === account.id);

        for (const property of batchProperties) {
          const variant = randomElement(variants);
          const phone = randomElement(accountPhones);

          const mailPiece = await prisma.mailPiece.create({
            data: {
              batchId: batch.id,
              variantId: variant.id,
              propertyId: property.id,
              phoneNumberId: phone.id,
              offerAmount: Number(property.avmValue) * randomFloat(0.65, 0.75),
              offerPercent: randomFloat(0.65, 0.75),
              status: randomElement(MAIL_STATUSES),
              printCost: randomFloat(0.15, 0.25),
              postageCost: randomFloat(0.30, 0.45),
              totalCost: randomFloat(0.45, 0.70),
              isSynthetic: true,
            },
          });

          // Some mail pieces generate calls (2%)
          if (Math.random() < 0.02 && campaign.status === 'COMPLETED') {
            const callDate = addDays(batchDate, randomBetween(3, 21));
            const callEvent = await prisma.callEvent.create({
              data: {
                phoneNumberId: phone.id,
                mailPieceId: mailPiece.id,
                callerNumber: generatePhone(),
                startTime: callDate,
                endTime: addDays(callDate, 0),
                duration: randomBetween(30, 600),
                status: randomElement(CALL_STATUSES),
                outcome: randomElement(CALL_OUTCOMES),
                isQualified: Math.random() < 0.4,
                isSynthetic: true,
              },
            });

            // Some calls convert to deals (20%)
            if (callEvent.isQualified && Math.random() < 0.2) {
              const contractDate = addDays(callDate, randomBetween(7, 30));
              const closeDate = Math.random() < 0.6 ? addDays(contractDate, randomBetween(14, 60)) : null;
              const contractPrice = Number(property.avmValue) * randomFloat(0.55, 0.75);
              const grossProfit = contractPrice * randomFloat(0.1, 0.25);

              await prisma.deal.create({
                data: {
                  accountId: account.id,
                  createdById: creator.id,
                  propertyId: property.id,
                  type: randomElement(DEAL_TYPES),
                  status: closeDate ? 'CLOSED' : randomElement(['PENDING', 'UNDER_CONTRACT', 'DUE_DILIGENCE']),
                  contractPrice,
                  arvAtContract: property.arvValue,
                  grossProfit,
                  netProfit: grossProfit * 0.85,
                  contractDate,
                  closeDate,
                  daysToClose: closeDate ? Math.ceil((closeDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
                  attributedCampaignId: campaign.id,
                  attributedVariantId: variant.id,
                  isSynthetic: true,
                },
              });
            }
          }
        }
      }
    }
  }

  // Create trigger rules
  console.log('Creating trigger rules...');
  for (const account of accounts) {
    const triggers = [
      { name: 'New Pre-Foreclosure Alert', type: 'NEW_DISTRESS_FLAG' as const, conditions: { distressTypes: ['PRE_FORECLOSURE'] } },
      { name: 'Price Drop Alert', type: 'PRICE_DROP' as const, conditions: { changePercent: -10 } },
    ];

    for (const t of triggers) {
      await prisma.triggerRule.create({
        data: {
          accountId: account.id,
          name: t.name,
          triggerType: t.type,
          conditions: t.conditions as Prisma.InputJsonValue,
          actionType: 'ADD_TO_CAMPAIGN',
          actionConfig: { notify: true } as Prisma.InputJsonValue,
          isActive: true,
          isSynthetic: true,
        },
      });
    }
  }

  // Create diagnostic snapshots
  console.log('Creating diagnostic snapshots...');
  for (const account of accounts) {
    const accountUsers = users.filter((u) => u.accountId === account.id);
    const accountCampaigns = campaigns.filter((c) => c.accountId === account.id);
    const creator = randomElement(accountUsers);

    for (let i = 0; i < 3; i++) {
      const periodEnd = addDays(new Date(), -i * 30);
      const periodStart = addDays(periodEnd, -30);

      const snapshot = await prisma.diagnosticSnapshot.create({
        data: {
          campaignId: accountCampaigns[0]?.id,
          accountId: account.id,
          createdById: creator.id,
          snapshotType: randomElement(SNAPSHOT_TYPES),
          periodStart,
          periodEnd,
          metrics: {
            responseRate: randomFloat(0.01, 0.025),
            contractRate: randomFloat(0.002, 0.005),
            roi: randomFloat(1.5, 4.0),
          } as Prisma.InputJsonValue,
          dimensionBreakdowns: {},
          status: 'COMPLETED',
          isSynthetic: true,
        },
      });

      // Add hypotheses
      if (Math.random() < 0.6) {
        await prisma.diagnosticHypothesis.create({
          data: {
            snapshotId: snapshot.id,
            category: randomElement(HYPOTHESIS_CATEGORIES),
            title: 'Performance change detected',
            description: 'Analysis identified potential factors affecting performance.',
            confidence: randomFloat(0.5, 0.9),
            impactScore: randomFloat(0.3, 0.8),
            supportingMetrics: [],
            recommendations: ['Review targeting criteria', 'Test new creative'],
            rank: 1,
            isSynthetic: true,
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
  console.log(`Created:`);
  console.log(`  - ${accounts.length} accounts`);
  console.log(`  - ${users.length} users`);
  console.log(`  - ${markets.length} markets`);
  console.log(`  - ${zipCodes.length} zip codes`);
  console.log(`  - ${properties.length} properties`);
  console.log(`  - ${segments.length} segments`);
  console.log(`  - ${campaigns.length} campaigns`);
}

function getPriceBand(value: number): 'BAND_0_100K' | 'BAND_100_200K' | 'BAND_200_300K' | 'BAND_300_500K' | 'BAND_500K_PLUS' {
  if (value < 100000) return 'BAND_0_100K';
  if (value < 200000) return 'BAND_100_200K';
  if (value < 300000) return 'BAND_200_300K';
  if (value < 500000) return 'BAND_300_500K';
  return 'BAND_500K_PLUS';
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
