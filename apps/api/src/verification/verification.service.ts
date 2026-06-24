import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { SubmitVerificationDto } from './dto/verification.dto';

// PROD-5: KYC verification. A user submits identity (+ ownership) docs → a
// pending VerificationRequest + User.verificationStatus='pending'. An admin
// approves (→ verified + verificationStatus='verified', recompute trust so the
// verification bonus/cap applies + an in-feed notification) or rejects (reason).

interface RequestRow {
  id: string;
  userId: string;
  status: string;
  idDocUrl: string | null;
  selfieUrl: string | null;
  ownershipDocUrl: string | null;
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  user?: { name: string; phone: string; role: string } | null;
}

function serialize(r: RequestRow): Record<string, unknown> {
  return {
    id: r.id,
    userId: r.userId,
    status: r.status,
    idDocUrl: r.idDocUrl ?? undefined,
    selfieUrl: r.selfieUrl ?? undefined,
    ownershipDocUrl: r.ownershipDocUrl ?? undefined,
    rejectionReason: r.rejectionReason ?? undefined,
    submittedAt: r.submittedAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString(),
    ...(r.user
      ? { user: { name: r.user.name, phone: r.user.phone, role: r.user.role } }
      : {}),
  };
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
  ) {}

  // Submit (or re-submit) for verification. Replaces any prior non-approved
  // request, and flips the user to 'pending'.
  async submit(userId: string, dto: SubmitVerificationDto): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true },
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'الحساب مش موجود.' });
    if (user.verificationStatus === 'verified') {
      throw new ForbiddenException({ code: 'ALREADY_VERIFIED', message: 'حسابك موثّق بالفعل.' });
    }

    // One active request per user: clear previous non-verified ones (a rejected
    // request is stored as 'unverified' + a rejectionReason).
    await this.prisma.verificationRequest.deleteMany({
      where: { userId, status: { in: ['pending', 'unverified'] } },
    });

    const created = await this.prisma.verificationRequest.create({
      data: {
        userId,
        status: 'pending',
        idDocUrl: dto.idDocUrl,
        selfieUrl: dto.selfieUrl,
        ownershipDocUrl: dto.ownershipDocUrl ?? null,
      },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { verificationStatus: 'pending' } });
    return serialize(created as unknown as RequestRow);
  }

  // The caller's latest request (+ derived status), or null.
  async mine(userId: string): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
    return row ? serialize(row as unknown as RequestRow) : null;
  }

  // ── Admin ──
  async pending(): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.verificationRequest.findMany({
      where: { status: 'pending' },
      orderBy: { submittedAt: 'asc' },
      include: { user: { select: { name: true, phone: true, role: true } } },
    });
    return rows.map((r) => serialize(r as unknown as RequestRow));
  }

  async pendingCount(): Promise<{ count: number }> {
    const count = await this.prisma.verificationRequest.count({ where: { status: 'pending' } });
    return { count };
  }

  async approve(requestId: string): Promise<{ ok: true }> {
    const req = await this.prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND', message: 'الطلب ده مش موجود.' });

    await this.prisma.$transaction([
      this.prisma.verificationRequest.update({
        where: { id: requestId },
        data: { status: 'verified', reviewedAt: new Date(), rejectionReason: null },
      }),
      this.prisma.user.update({
        where: { id: req.userId },
        data: { verified: true, verificationStatus: 'verified' },
      }),
      this.prisma.notification.create({
        data: {
          userId: req.userId,
          type: 'verification',
          title: 'حسابك اتوثّق',
          body: 'مبروك! بقى عندك علامة موثّق، وإعلاناتك هتنزل على طول من غير مراجعة.',
        },
      }),
    ]);

    // Verification feeds trust (T-2 cap/bonus): recompute the owner + their listings.
    await this.trust.recomputeOwner(req.userId);
    return { ok: true };
  }

  async reject(requestId: string, reason: string): Promise<{ ok: true }> {
    const req = await this.prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND', message: 'الطلب ده مش موجود.' });

    await this.prisma.$transaction([
      this.prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'unverified',
          reviewedAt: new Date(),
          rejectionReason: reason.trim() || 'مستندات غير مكتملة أو غير واضحة.',
        },
      }),
      this.prisma.user.update({
        where: { id: req.userId },
        data: { verificationStatus: 'unverified' },
      }),
      this.prisma.notification.create({
        data: {
          userId: req.userId,
          type: 'verification',
          title: 'محتاجين نراجع توثيقك تاني',
          body: reason.trim() || 'مستنداتك مش مكتملة أو مش واضحة. ابعتها تاني من فضلك.',
        },
      }),
    ]);
    return { ok: true };
  }
}
