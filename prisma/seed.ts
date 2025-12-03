import { PrismaClient, DealType, DealStatus, CampaignStatus, DistressType } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
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

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Data generators
const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Stephanie', 'Matthew', 'Jennifer', 'Daniel', 'Nicole', 'Andrew', 'Elizabeth'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const STREET_NAMES = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm Blvd', 'Washington St', 'Park Ave', 'Lake Dr', 'Hill Rd', 'Valley View', 'Sunset Blvd', 'River Rd', 'Forest Ave', 'Church St'];
const CITIES = ['Phoenix', 'Dallas', 'Houston', 'Atlanta', 'Tampa', 'Orlando', 'Charlotte', 'Nashville', 'Austin', 'Denver', 'Las Vegas', 'San Antonio', 'Jacksonville', 'Columbus', 'Indianapolis'];
const STATES = ['AZ', 'TX', 'TX', 'GA', 'FL', 'FL', 'NC', 'TN', 'TX', 'CO', 'NV', 'TX', 'FL', 'OH', 'IN'];

function generateName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function generateEmail(name: string): string {
  return `${name.toLowerCase().replace(' ', '.')}@example.com`;
}

function generatePhone(): string {
  return `+1${randomBetween(200, 999)}${randomBetween(100, 999)}${randomBetween(1000, 9999)}`;
}

function generateAddress(): { address: string; city: string; state: string; zipCode: string } {
  const cityIndex = randomBetween(0, CITIES.length - 1);
  return {
    address: `${randomBetween(100, 9999)} ${randomElement(STREET_NAMES)}`,
    city: CITIES[cityIndex],
    state: STATES[cityIndex],
    zipCode: `${randomBetween(10000, 99999)}`,
  };
}

async function main() {
  console.log('Seeding database with synthetic data...');

  // Clear existing data (in reverse dependency order)
  console.log('Clearing existing data...');
  await prisma.$executeRaw`TRUNCATE TABLE "DiagnosticHypothesis" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "DiagnosticSnapshot" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "TriggerExecution" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "TriggerRule" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Deal" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ConversionEvent" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CallEvent" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "MailEvent" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "MailPiece" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "BatchVariant" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Batch" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Variant" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CampaignStep" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Campaign" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "SegmentMember" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Segment" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "PhoneHealthLog" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "PhoneNumberAssignment" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "PhoneNumber" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "DistressFlag" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Owner" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Property" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ZipCode" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "SeasonalityProfile" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CashCycleProfile" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "OfferStrategy" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "DesignVersion" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "DesignTemplate" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "TalkTrack" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "MarketAssignment" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Market" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Account" CASCADE`;

  // Create accounts
  console.log('Creating accounts...');
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        id: generateUUID(),
        name: 'Apex Property Solutions',
        subscriptionTier: 'ENTERPRISE',
        settings: { timezone: 'America/Phoenix', currency: 'USD' },
      },
    }),
    prisma.account.create({
      data: {
        id: generateUUID(),
        name: 'Texas Home Buyers',
        subscriptionTier: 'PROFESSIONAL',
        settings: { timezone: 'America/Chicago', currency: 'USD' },
      },
    }),
    prisma.account.create({
      data: {
        id: generateUUID(),
        name: 'Sunshine State Investors',
        subscriptionTier: 'PROFESSIONAL',
        settings: { timezone: 'America/New_York', currency: 'USD' },
      },
    }),
  ]);

  // Create users for each account
  console.log('Creating users...');
  const users: any[] = [];
  for (const account of accounts) {
    const ownerName = generateName();
    const owner = await prisma.user.create({
      data: {
        id: generateUUID(),
        accountId: account.id,
        email: generateEmail(ownerName),
        name: ownerName,
        role: 'OWNER',
      },
    });
    users.push(owner);

    for (let i = 0; i < randomBetween(2, 5); i++) {
      const memberName = generateName();
      const member = await prisma.user.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          email: generateEmail(memberName),
          name: memberName,
          role: randomElement(['ADMIN', 'MEMBER', 'MEMBER', 'VIEWER']),
        },
      });
      users.push(member);
    }
  }

  // Create markets
  console.log('Creating markets...');
  const markets: any[] = [];
  const marketData = [
    { name: 'Phoenix Metro', state: 'AZ', counties: ['Maricopa'] },
    { name: 'Dallas-Fort Worth', state: 'TX', counties: ['Dallas', 'Tarrant', 'Collin'] },
    { name: 'Houston Metro', state: 'TX', counties: ['Harris', 'Fort Bend', 'Montgomery'] },
    { name: 'Tampa Bay', state: 'FL', counties: ['Hillsborough', 'Pinellas'] },
    { name: 'Atlanta Metro', state: 'GA', counties: ['Fulton', 'DeKalb', 'Gwinnett'] },
    { name: 'Orlando', state: 'FL', counties: ['Orange', 'Seminole'] },
    { name: 'Charlotte', state: 'NC', counties: ['Mecklenburg'] },
    { name: 'Nashville', state: 'TN', counties: ['Davidson', 'Williamson'] },
  ];

  for (const account of accounts) {
    const assignedMarkets = randomElements(marketData, randomBetween(2, 4));
    for (const md of assignedMarkets) {
      const market = await prisma.market.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          name: md.name,
          state: md.state,
          counties: md.counties,
          avgArv: randomBetween(250000, 450000),
          avgDiscount: randomFloat(0.15, 0.35),
          competitionLevel: randomElement(['LOW', 'MEDIUM', 'HIGH']),
          settings: {},
        },
      });
      markets.push(market);
    }
  }

  // Create zip codes for markets
  console.log('Creating zip codes...');
  for (const market of markets) {
    const zipCount = randomBetween(5, 15);
    for (let i = 0; i < zipCount; i++) {
      await prisma.zipCode.create({
        data: {
          id: generateUUID(),
          marketId: market.id,
          code: `${randomBetween(10000, 99999)}`,
          avgArv: market.avgArv + randomBetween(-50000, 50000),
          avgRent: randomBetween(1200, 2500),
          investorActivityScore: randomBetween(1, 100),
          dispoScore: randomBetween(40, 95),
        },
      });
    }
  }

  // Create properties with distress flags
  console.log('Creating properties...');
  const properties: any[] = [];
  const distressTypes: DistressType[] = ['PRE_FORECLOSURE', 'FORECLOSURE', 'PROBATE', 'TAX_LIEN', 'DIVORCE', 'CODE_VIOLATION', 'EVICTION', 'BANKRUPTCY', 'VACANT', 'ABSENTEE'];

  for (const account of accounts) {
    const accountMarkets = markets.filter((m) => m.accountId === account.id);
    const propertyCount = randomBetween(500, 1500);

    for (let i = 0; i < propertyCount; i++) {
      const addr = generateAddress();
      const market = randomElement(accountMarkets);
      const arv = market.avgArv + randomBetween(-100000, 100000);

      const property = await prisma.property.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          marketId: market.id,
          address: addr.address,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
          county: randomElement(market.counties),
          propertyType: randomElement(['SINGLE_FAMILY', 'TOWNHOUSE', 'CONDO', 'MULTI_FAMILY']),
          bedrooms: randomBetween(2, 5),
          bathrooms: randomBetween(1, 3),
          sqft: randomBetween(1000, 3500),
          lotSize: randomBetween(3000, 15000),
          yearBuilt: randomBetween(1960, 2015),
          avm: arv * randomFloat(0.6, 0.85),
          arv: arv,
          motivationScore: randomBetween(30, 95),
          dispoScore: randomBetween(40, 95),
          doNotMail: Math.random() < 0.05,
        },
      });
      properties.push(property);

      // Add 1-3 distress flags per property
      const flagCount = randomBetween(1, 3);
      const selectedTypes = randomElements(distressTypes, flagCount);
      for (const dtype of selectedTypes) {
        await prisma.distressFlag.create({
          data: {
            id: generateUUID(),
            propertyId: property.id,
            type: dtype,
            severity: randomElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            sourceSystem: randomElement(['CountyRecords', 'CourtSystem', 'TaxOffice', 'DataProvider']),
            firstDetected: randomDate(new Date('2023-01-01'), new Date('2024-06-01')),
            lastVerified: randomDate(new Date('2024-06-01'), new Date()),
            isActive: Math.random() < 0.85,
          },
        });
      }

      // Add owner
      await prisma.owner.create({
        data: {
          id: generateUUID(),
          propertyId: property.id,
          name: generateName(),
          mailingAddress: `${randomBetween(100, 9999)} ${randomElement(STREET_NAMES)}`,
          mailingCity: addr.city,
          mailingState: addr.state,
          mailingZip: addr.zipCode,
          phone: Math.random() < 0.3 ? generatePhone() : null,
          email: Math.random() < 0.2 ? generateEmail(generateName()) : null,
          ownershipType: randomElement(['INDIVIDUAL', 'TRUST', 'LLC', 'ESTATE']),
        },
      });
    }
  }

  // Create segments
  console.log('Creating segments...');
  const segments: any[] = [];
  const segmentTemplates = [
    { name: 'High Motivation Pre-Foreclosure', filters: { distressTypes: ['PRE_FORECLOSURE'], motivationMin: 70 } },
    { name: 'Probate + Tax Lien Combo', filters: { distressTypes: ['PROBATE', 'TAX_LIEN'], motivationMin: 50 } },
    { name: 'Absentee Owners High Equity', filters: { distressTypes: ['ABSENTEE'], equityMin: 50 } },
    { name: 'Code Violations Quick Flip', filters: { distressTypes: ['CODE_VIOLATION'], dispoMin: 70 } },
    { name: 'Divorce Motivated Sellers', filters: { distressTypes: ['DIVORCE'], motivationMin: 60 } },
    { name: 'Vacant Properties', filters: { distressTypes: ['VACANT'] } },
    { name: 'Tax Lien Hot List', filters: { distressTypes: ['TAX_LIEN'], severityMin: 'HIGH' } },
  ];

  for (const account of accounts) {
    for (const template of segmentTemplates) {
      const segment = await prisma.segment.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          name: template.name,
          description: `Auto-generated segment for ${template.name}`,
          filterCriteria: template.filters,
          estimatedSize: randomBetween(50, 500),
          lastRefreshed: randomDate(new Date('2024-10-01'), new Date()),
          isActive: true,
          maxMailsPerProperty: 6,
          minDaysBetweenMails: 21,
        },
      });
      segments.push(segment);
    }
  }

  // Create phone numbers
  console.log('Creating phone numbers...');
  const phoneNumbers: any[] = [];
  for (const account of accounts) {
    const phoneCount = randomBetween(5, 15);
    for (let i = 0; i < phoneCount; i++) {
      const phone = await prisma.phoneNumber.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          number: generatePhone(),
          type: randomElement(['LOCAL', 'TOLL_FREE']),
          carrier: randomElement(['Twilio', 'Bandwidth', 'Telnyx']),
          status: randomElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'WARMING']),
          reputationScore: randomBetween(60, 100),
          monthlyRent: randomFloat(1.0, 5.0),
          purchasedAt: randomDate(new Date('2023-01-01'), new Date('2024-06-01')),
        },
      });
      phoneNumbers.push(phone);

      // Add health logs
      for (let h = 0; h < 10; h++) {
        await prisma.phoneHealthLog.create({
          data: {
            id: generateUUID(),
            phoneNumberId: phone.id,
            checkedAt: randomDate(new Date('2024-09-01'), new Date()),
            reputationScore: phone.reputationScore + randomBetween(-10, 5),
            answerRate: randomFloat(0.3, 0.8),
            isSpamFlagged: Math.random() < 0.1,
            carrierStatus: 'ACTIVE',
          },
        });
      }
    }
  }

  // Create design templates
  console.log('Creating design templates...');
  const templates: any[] = [];
  const templateNames = ['Yellow Letter Classic', 'Postcard Bold', 'Handwritten Style', 'Professional Letter', 'Urgent Notice', 'Friendly Offer'];

  for (const account of accounts) {
    for (const name of templateNames) {
      const template = await prisma.designTemplate.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          name: name,
          type: name.includes('Postcard') ? 'POSTCARD' : 'LETTER',
          category: randomElement(['INITIAL_CONTACT', 'FOLLOW_UP', 'URGENCY', 'PERSONAL']),
          thumbnailUrl: `https://example.com/templates/${name.toLowerCase().replace(/ /g, '-')}.png`,
          isActive: true,
        },
      });
      templates.push(template);
    }
  }

  // Create offer strategies
  console.log('Creating offer strategies...');
  const offerStrategies: any[] = [];
  for (const account of accounts) {
    const strategies = [
      { name: 'Conservative', pct: 0.65, adj: { distress: 0.02, dispo: 0.01 } },
      { name: 'Balanced', pct: 0.70, adj: { distress: 0.03, dispo: 0.02 } },
      { name: 'Aggressive', pct: 0.75, adj: { distress: 0.04, dispo: 0.03 } },
    ];
    for (const s of strategies) {
      const strategy = await prisma.offerStrategy.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          name: s.name,
          offerPercentage: s.pct,
          adjustments: s.adj,
          isActive: true,
        },
      });
      offerStrategies.push(strategy);
    }
  }

  // Create talk tracks
  console.log('Creating talk tracks...');
  for (const account of accounts) {
    const tracks = [
      { name: 'Pre-Foreclosure Empathy', distress: 'PRE_FORECLOSURE', script: 'I understand this is a difficult time...' },
      { name: 'Probate Sensitivity', distress: 'PROBATE', script: 'First, I want to express my condolences...' },
      { name: 'Tax Lien Solution', distress: 'TAX_LIEN', script: 'We can help you avoid losing your property...' },
      { name: 'General Discovery', distress: null, script: 'Thank you for calling back! I reached out because...' },
    ];
    for (const t of tracks) {
      await prisma.talkTrack.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          name: t.name,
          distressType: t.distress as DistressType | null,
          scriptContent: t.script,
          keyPoints: ['Build rapport', 'Identify motivation', 'Present solution', 'Close'],
          objectionHandlers: { 'too_low': 'I understand. Let me explain our process...', 'need_to_think': 'Of course. When would be a good time...' },
          isActive: true,
        },
      });
    }
  }

  // Create seasonality profiles
  console.log('Creating seasonality profiles...');
  for (const account of accounts) {
    const profiles = [
      { start: 11, end: 12, mult: 0.7, desc: 'Holiday slowdown', strategy: 'Reduce volume, focus on hot leads' },
      { start: 1, end: 2, mult: 0.85, desc: 'Post-holiday recovery', strategy: 'Ramp up gradually' },
      { start: 3, end: 5, mult: 1.2, desc: 'Spring surge', strategy: 'Maximize volume, test new creatives' },
      { start: 6, end: 8, mult: 1.0, desc: 'Summer steady', strategy: 'Maintain consistent pace' },
      { start: 9, end: 10, mult: 1.1, desc: 'Fall push', strategy: 'Increase urgency messaging' },
    ];
    for (const p of profiles) {
      await prisma.seasonalityProfile.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          monthStart: p.start,
          monthEnd: p.end,
          activityMultiplier: p.mult,
          description: p.desc,
          recommendedStrategy: p.strategy,
        },
      });
    }
  }

  // Create campaigns with variants, batches, and mail pieces
  console.log('Creating campaigns...');
  const campaigns: any[] = [];
  const campaignNames = ['Q4 Pre-Foreclosure Blitz', 'Probate Outreach 2024', 'Tax Lien Rescue', 'Absentee Owner Multi-Touch', 'High Motivation Sprint', 'Year-End Push'];

  for (const account of accounts) {
    const accountSegments = segments.filter((s) => s.accountId === account.id);
    const accountMarkets = markets.filter((m) => m.accountId === account.id);
    const accountTemplates = templates.filter((t) => t.accountId === account.id);

    for (let c = 0; c < randomBetween(4, 8); c++) {
      const segment = randomElement(accountSegments);
      const market = randomElement(accountMarkets);
      const startDate = randomDate(new Date('2024-03-01'), new Date('2024-10-01'));
      const endDate = addDays(startDate, randomBetween(60, 180));

      const totalMailed = randomBetween(2000, 15000);
      const deliveryRate = randomFloat(0.92, 0.98);
      const responseRate = randomFloat(0.008, 0.025);
      const contractRate = randomFloat(0.15, 0.35);

      const totalDelivered = Math.floor(totalMailed * deliveryRate);
      const totalCalls = Math.floor(totalDelivered * responseRate);
      const totalQualified = Math.floor(totalCalls * randomFloat(0.3, 0.6));
      const totalContracts = Math.floor(totalQualified * contractRate);
      const budget = totalMailed * randomFloat(0.45, 0.65);
      const spent = budget * randomFloat(0.7, 1.0);

      const campaign = await prisma.campaign.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          segmentId: segment.id,
          marketId: market.id,
          name: randomElement(campaignNames) + ` - ${market.name}`,
          status: randomElement(['COMPLETED', 'COMPLETED', 'ACTIVE', 'PAUSED']) as CampaignStatus,
          startDate,
          endDate,
          totalBudget: budget,
          spentBudget: spent,
          costPerPiece: spent / totalMailed,
          totalMailed,
          totalDelivered,
          totalCalls,
          totalQualifiedLeads: totalQualified,
          totalContracts,
          grossProfit: totalContracts * randomBetween(15000, 45000),
        },
      });
      campaigns.push(campaign);

      // Create campaign steps (multi-touch)
      const touchCount = randomBetween(2, 4);
      for (let step = 0; step < touchCount; step++) {
        await prisma.campaignStep.create({
          data: {
            id: generateUUID(),
            campaignId: campaign.id,
            stepNumber: step + 1,
            daysAfterPrevious: step === 0 ? 0 : randomBetween(14, 28),
            templateId: randomElement(accountTemplates).id,
            isActive: true,
          },
        });
      }

      // Create variants for A/B testing
      const variantCount = randomBetween(2, 4);
      const variants: any[] = [];
      for (let v = 0; v < variantCount; v++) {
        const variantMailed = Math.floor(totalMailed / variantCount);
        const variantCalls = Math.floor((variantMailed * responseRate) * randomFloat(0.7, 1.3));

        const variant = await prisma.variant.create({
          data: {
            id: generateUUID(),
            campaignId: campaign.id,
            templateId: randomElement(accountTemplates).id,
            name: `Variant ${String.fromCharCode(65 + v)}`,
            description: `Test variant ${v + 1}`,
            trafficSplit: 1 / variantCount,
            piecesMailed: variantMailed,
            calls: variantCalls,
            contracts: Math.floor(variantCalls * 0.2 * randomFloat(0.5, 1.5)),
          },
        });
        variants.push(variant);
      }

      // Create batches
      const batchCount = randomBetween(3, 8);
      for (let b = 0; b < batchCount; b++) {
        const batchDate = addDays(startDate, b * 14);
        const batchSize = Math.floor(totalMailed / batchCount);

        const batch = await prisma.batch.create({
          data: {
            id: generateUUID(),
            campaignId: campaign.id,
            batchNumber: b + 1,
            scheduledDate: batchDate,
            status: 'COMPLETED',
            totalPieces: batchSize,
            printedAt: batchDate,
            mailedAt: addDays(batchDate, 1),
          },
        });

        // Link batch to variants
        for (const variant of variants) {
          await prisma.batchVariant.create({
            data: {
              id: generateUUID(),
              batchId: batch.id,
              variantId: variant.id,
              pieceCount: Math.floor(batchSize / variants.length),
            },
          });
        }
      }
    }
  }

  // Create mail pieces, call events, and deals
  console.log('Creating mail pieces and events...');
  const deals: any[] = [];

  for (const campaign of campaigns) {
    const campaignVariants = await prisma.variant.findMany({
      where: { campaignId: campaign.id },
    });

    const accountProperties = properties.filter((p) => p.accountId === campaign.accountId);
    const accountPhones = phoneNumbers.filter((ph) => ph.accountId === campaign.accountId);

    // Create mail pieces
    const mailPieceCount = Math.min(campaign.totalMailed, 500); // Limit for seeding
    for (let i = 0; i < mailPieceCount; i++) {
      const property = randomElement(accountProperties);
      const variant = randomElement(campaignVariants);
      const mailDate = randomDate(campaign.startDate, campaign.endDate);

      const mailPiece = await prisma.mailPiece.create({
        data: {
          id: generateUUID(),
          accountId: campaign.accountId,
          campaignId: campaign.id,
          propertyId: property.id,
          variantId: variant.id,
          status: randomElement(['DELIVERED', 'DELIVERED', 'DELIVERED', 'RETURNED', 'IN_TRANSIT']),
          touchNumber: randomBetween(1, 4),
          printedAt: mailDate,
          mailedAt: addDays(mailDate, 1),
          deliveredAt: Math.random() < 0.95 ? addDays(mailDate, randomBetween(3, 7)) : null,
          cost: randomFloat(0.45, 0.65),
        },
      });

      // Some mail pieces generate calls (1-2%)
      if (Math.random() < 0.015) {
        const phone = randomElement(accountPhones);
        const callDate = addDays(mailDate, randomBetween(3, 21));

        const callEvent = await prisma.callEvent.create({
          data: {
            id: generateUUID(),
            accountId: campaign.accountId,
            mailPieceId: mailPiece.id,
            phoneNumberId: phone.id,
            propertyId: property.id,
            callerId: generatePhone(),
            eventType: 'INBOUND_CALL',
            duration: randomBetween(30, 600),
            disposition: randomElement(['QUALIFIED', 'QUALIFIED', 'NOT_INTERESTED', 'CALLBACK', 'WRONG_NUMBER']),
            recordingUrl: `https://recordings.example.com/${generateUUID()}.mp3`,
            transcript: 'Sample call transcript...',
            occurredAt: callDate,
          },
        });

        // Some calls convert to deals (20-30%)
        if (callEvent.disposition === 'QUALIFIED' && Math.random() < 0.25) {
          const contractDate = addDays(callDate, randomBetween(7, 30));
          const closeDate = Math.random() < 0.6 ? addDays(contractDate, randomBetween(14, 60)) : null;
          const arv = property.arv || 300000;
          const contractPrice = arv * randomFloat(0.55, 0.75);
          const grossProfit = contractPrice * randomFloat(0.1, 0.25);

          const deal = await prisma.deal.create({
            data: {
              id: generateUUID(),
              accountId: campaign.accountId,
              propertyId: property.id,
              type: randomElement(['WHOLESALE', 'WHOLESALE', 'FLIP', 'RENTAL']) as DealType,
              status: closeDate ? 'CLOSED' : randomElement(['PENDING', 'UNDER_CONTRACT', 'DUE_DILIGENCE']) as DealStatus,
              contractPrice,
              arv,
              repairEstimate: arv * randomFloat(0.05, 0.2),
              grossProfit,
              netProfit: grossProfit * 0.85,
              contractDate,
              closeDate,
              daysToClose: closeDate ? Math.ceil((closeDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
              cashReceivedDate: closeDate ? addDays(closeDate, randomBetween(1, 5)) : null,
              attributedCampaignId: campaign.id,
              attributedVariantId: variant.id,
            },
          });
          deals.push(deal);
        }
      }
    }
  }

  // Create trigger rules
  console.log('Creating trigger rules...');
  for (const account of accounts) {
    const triggers = [
      { name: 'New Pre-Foreclosure Alert', event: 'DISTRESS_DETECTED', conditions: { distressType: 'PRE_FORECLOSURE' } },
      { name: 'High Motivation Score', event: 'SCORE_CHANGED', conditions: { motivationMin: 80 } },
      { name: 'Multiple Distress Flags', event: 'DISTRESS_DETECTED', conditions: { flagCountMin: 2 } },
      { name: 'Price Drop Alert', event: 'AVM_CHANGED', conditions: { changePercent: -10 } },
    ];

    for (const t of triggers) {
      await prisma.triggerRule.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          name: t.name,
          eventType: t.event,
          conditions: t.conditions,
          actions: [{ type: 'ADD_TO_SEGMENT' }, { type: 'NOTIFY' }],
          priority: randomBetween(1, 10),
          isActive: true,
        },
      });
    }
  }

  // Create cash cycle profiles
  console.log('Creating cash cycle profiles...');
  for (const account of accounts) {
    for (const dealType of ['WHOLESALE', 'FLIP', 'RENTAL'] as DealType[]) {
      await prisma.cashCycleProfile.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          dealType,
          avgSpendToLead: dealType === 'WHOLESALE' ? 21 : 28,
          avgLeadToContract: dealType === 'WHOLESALE' ? 7 : 14,
          avgContractToClose: dealType === 'WHOLESALE' ? 14 : dealType === 'FLIP' ? 45 : 30,
          avgCloseToCase: dealType === 'WHOLESALE' ? 3 : 7,
          avgTotalCycleDays: dealType === 'WHOLESALE' ? 45 : dealType === 'FLIP' ? 94 : 79,
          dealsAnalyzed: randomBetween(20, 100),
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date(),
        },
      });
    }
  }

  // Create diagnostic snapshots
  console.log('Creating diagnostic snapshots...');
  for (const account of accounts) {
    for (let i = 0; i < 4; i++) {
      const periodEnd = addDays(new Date(), -i * 30);
      const periodStart = addDays(periodEnd, -30);

      const snapshot = await prisma.diagnosticSnapshot.create({
        data: {
          id: generateUUID(),
          accountId: account.id,
          periodStart,
          periodEnd,
          responseRate: randomFloat(0.01, 0.025),
          contractRate: randomFloat(0.002, 0.005),
          closeRate: randomFloat(0.5, 0.8),
          roi: randomFloat(1.5, 4.0),
          avgDaysToClose: randomBetween(25, 50),
          totalSpend: randomBetween(10000, 50000),
          grossProfit: randomBetween(50000, 200000),
        },
      });

      // Add hypotheses
      if (Math.random() < 0.5) {
        await prisma.diagnosticHypothesis.create({
          data: {
            id: generateUUID(),
            snapshotId: snapshot.id,
            category: randomElement(['TELEPHONY_ISSUE', 'CREATIVE_FATIGUE', 'LIST_SHIFT', 'SEASONAL_PATTERN']),
            title: 'Performance change detected',
            description: 'Analysis identified potential factors affecting performance.',
            confidence: randomFloat(0.5, 0.9),
            impact: randomElement(['HIGH', 'MEDIUM', 'LOW']),
            suggestedAction: 'Review and optimize based on findings.',
            evidenceData: {},
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
  console.log(`  - ${properties.length} properties`);
  console.log(`  - ${segments.length} segments`);
  console.log(`  - ${campaigns.length} campaigns`);
  console.log(`  - ${deals.length} deals`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
