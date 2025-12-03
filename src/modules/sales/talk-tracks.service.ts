import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { TalkTrackType, DistressType, Prisma } from '@prisma/client';

export interface CreateTalkTrackDto {
  accountId: string;
  name: string;
  type: TalkTrackType;
  openingScript?: string;
  qualifyingQuestions?: string[];
  objectionHandlers?: Record<string, string>;
  closingScript?: string;
  renegotiationTriggers?: string[];
  renegotiationScript?: string;
  maxDiscount?: number;
  distressTypes?: DistressType[];
}

export interface LeadViewDto {
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    avmValue: number;
    arvValue?: number;
  };
  owner: {
    name: string;
    isAbsentee: boolean;
  };
  distressContext: Array<{
    type: DistressType;
    severity: string;
    daysSinceStart: number;
    metadata: Record<string, unknown>;
  }>;
  mailHistory: Array<{
    date: Date;
    format: string;
    offerAmount: number;
  }>;
  offer: {
    mailedAmount: number;
    mailedPercent: number;
    explanation: string[];
  };
  dispoScore: number;
  recommendedTalkTrack?: {
    id: string;
    name: string;
    type: TalkTrackType;
  };
  renegotiationGuidance?: {
    maxDiscountAmount: number;
    maxDiscountPercent: number;
    triggers: string[];
  };
}

@Injectable()
export class TalkTracksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTalkTrackDto) {
    return this.prisma.talkTrack.create({
      data: {
        accountId: dto.accountId,
        name: dto.name,
        type: dto.type,
        openingScript: dto.openingScript,
        qualifyingQuestions: dto.qualifyingQuestions || [],
        objectionHandlers: dto.objectionHandlers || {},
        closingScript: dto.closingScript,
        renegotiationTriggers: dto.renegotiationTriggers || [],
        renegotiationScript: dto.renegotiationScript,
        maxDiscount: dto.maxDiscount,
        distressTypes: dto.distressTypes || [],
      },
    });
  }

  async findAll(accountId: string, pagination: PaginationDto, filters?: { type?: TalkTrackType }) {
    const where: Prisma.TalkTrackWhereInput = { accountId, isActive: true };
    if (filters?.type) where.type = filters.type;

    const [tracks, total] = await Promise.all([
      this.prisma.talkTrack.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { calls: true } },
        },
      }),
      this.prisma.talkTrack.count({ where }),
    ]);

    return new PaginatedResponseDto(tracks, total, pagination);
  }

  async findOne(id: string) {
    const track = await this.prisma.talkTrack.findUnique({
      where: { id },
      include: {
        calls: {
          take: 10,
          orderBy: { startTime: 'desc' },
          select: {
            id: true,
            outcome: true,
            duration: true,
            isQualified: true,
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException(`Talk track ${id} not found`);
    }

    return track;
  }

  async update(id: string, updates: Partial<CreateTalkTrackDto>) {
    await this.findOne(id);
    return this.prisma.talkTrack.update({
      where: { id },
      data: updates,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.talkTrack.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getLeadView(mailPieceId: string): Promise<LeadViewDto> {
    const mailPiece = await this.prisma.mailPiece.findUnique({
      where: { id: mailPieceId },
      include: {
        property: {
          include: {
            owner: true,
            distressFlags: { where: { isActive: true } },
            mailPieces: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: {
                designVersion: { include: { template: true } },
              },
            },
          },
        },
        offerStrategy: true,
      },
    });

    if (!mailPiece) {
      throw new NotFoundException(`Mail piece ${mailPieceId} not found`);
    }

    const property = mailPiece.property;
    const now = new Date();

    // Find best matching talk track
    const distressTypes = property.distressFlags.map((f) => f.type);
    const recommendedTrack = await this.findBestTalkTrack(
      mailPiece.offerStrategyId ? mailPiece.offerStrategy?.accountId || '' : '',
      distressTypes,
    );

    return {
      property: {
        id: property.id,
        address: property.streetAddress,
        city: property.city,
        state: property.state,
        avmValue: Number(property.avmValue),
        arvValue: property.arvValue ? Number(property.arvValue) : undefined,
      },
      owner: {
        name: property.owner?.fullName || 'Unknown',
        isAbsentee: property.owner?.isAbsentee || false,
      },
      distressContext: property.distressFlags.map((f) => ({
        type: f.type,
        severity: f.severity,
        daysSinceStart: Math.ceil((now.getTime() - f.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        metadata: f.metadata as Record<string, unknown>,
      })),
      mailHistory: property.mailPieces.map((mp) => ({
        date: mp.createdAt,
        format: mp.designVersion?.template?.format || 'Unknown',
        offerAmount: Number(mp.offerAmount) || 0,
      })),
      offer: {
        mailedAmount: Number(mailPiece.offerAmount) || 0,
        mailedPercent: Number(mailPiece.offerPercent) || 0,
        explanation: [], // Would come from offer calculation
      },
      dispoScore: Number(property.dispoScore) || 0,
      recommendedTalkTrack: recommendedTrack
        ? {
            id: recommendedTrack.id,
            name: recommendedTrack.name,
            type: recommendedTrack.type,
          }
        : undefined,
      renegotiationGuidance: {
        maxDiscountAmount: Number(mailPiece.offerAmount) * 0.1 || 0,
        maxDiscountPercent: 0.1,
        triggers: ['Price objection', 'Competing offer', 'Timeline urgency'],
      },
    };
  }

  private async findBestTalkTrack(accountId: string, distressTypes: DistressType[]) {
    // Priority: specific distress type match, then general
    const typeMatches: Partial<Record<DistressType, TalkTrackType>> = {
      [DistressType.PRE_FORECLOSURE]: TalkTrackType.PRE_FORECLOSURE_URGENT,
      [DistressType.PROBATE]: TalkTrackType.PROBATE_SPECIALIST,
      [DistressType.TIRED_LANDLORD]: TalkTrackType.LANDLORD_TIRED,
    };

    for (const distressType of distressTypes) {
      const trackType = typeMatches[distressType];
      if (trackType) {
        const track = await this.prisma.talkTrack.findFirst({
          where: { accountId, type: trackType, isActive: true },
        });
        if (track) return track;
      }
    }

    // Fall back to initial contact
    return this.prisma.talkTrack.findFirst({
      where: { accountId, type: TalkTrackType.INITIAL_CONTACT, isActive: true },
    });
  }
}
