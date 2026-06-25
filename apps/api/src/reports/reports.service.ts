import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../admin/admin.audit.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDto, AdminReportsQueryDto, UpdateReportDto } from './dto/reports.dto';

interface ReportRow {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

function serialize(r: ReportRow, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: r.id,
    reporterId: r.reporterId,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    details: r.details ?? undefined,
    status: r.status,
    resolution: r.resolution ?? undefined,
    resolvedById: r.resolvedById ?? undefined,
    resolvedAt: r.resolvedAt?.toISOString(),
    createdAt: r.createdAt.toISOString(),
    ...extra,
  };
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  // Any authenticated user can file a report. We validate the target exists and
  // block a user from spamming duplicate open reports on the same target.
  async create(reporter: AuthUser, dto: CreateReportDto): Promise<Record<string, unknown>> {
    await this.assertTargetExists(dto.targetType, dto.targetId);

    const dup = await this.prisma.report.findFirst({
      where: {
        reporterId: reporter.id,
        targetType: dto.targetType as ReportTargetType,
        targetId: dto.targetId,
        status: { in: ['open', 'reviewing'] },
      },
    });
    if (dup) {
      throw new BadRequestException({
        code: 'ALREADY_REPORTED',
        message: 'بلّغت عن ده قبل كده وإحنا بنراجعه.',
      });
    }

    const created = await this.prisma.report.create({
      data: {
        reporterId: reporter.id,
        targetType: dto.targetType as ReportTargetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details ?? null,
      },
    });
    return serialize(created as unknown as ReportRow);
  }

  // ── Admin triage ──
  async list(query: AdminReportsQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 50);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    else where.status = { in: ['open', 'reviewing'] }; // default: the active queue
    if (query.targetType) where.targetType = query.targetType as ReportTargetType;

    const rows = (await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })) as unknown as ReportRow[];

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    // Enrich with reporter name + a target label so the queue is readable.
    const reporterIds = [...new Set(page.map((r) => r.reporterId))];
    const reporters = reporterIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: reporterIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameMap = new Map(reporters.map((u) => [u.id, u.name]));
    const labels = await this.targetLabels(page);

    return {
      data: page.map((r) =>
        serialize(r, {
          reporterName: nameMap.get(r.reporterId) ?? undefined,
          targetLabel: labels.get(`${r.targetType}:${r.targetId}`) ?? undefined,
        }),
      ),
      meta: { cursor: hasMore ? (page[page.length - 1]?.id ?? null) : null, hasMore },
    };
  }

  async count(): Promise<{ count: number }> {
    const count = await this.prisma.report.count({ where: { status: { in: ['open', 'reviewing'] } } });
    return { count };
  }

  async updateStatus(admin: AuthUser, id: string, dto: UpdateReportDto): Promise<Record<string, unknown>> {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException({ code: 'REPORT_NOT_FOUND', message: 'البلاغ ده مش موجود.' });

    const resolving = dto.status === 'resolved' || dto.status === 'dismissed';
    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: dto.status as ReportStatus,
        resolution: dto.resolution ?? report.resolution,
        ...(resolving ? { resolvedById: admin.id, resolvedAt: new Date() } : {}),
      },
    });
    await this.audit.log(admin, `report.${dto.status}`, 'report', id, {
      targetType: report.targetType,
      targetId: report.targetId,
      resolution: dto.resolution,
    });
    return serialize(updated as unknown as ReportRow);
  }

  // ── Helpers ──
  private async assertTargetExists(type: string, id: string): Promise<void> {
    const exists = await (type === 'listing'
      ? this.prisma.property.findFirst({ where: { id, deletedAt: null }, select: { id: true } })
      : type === 'review'
        ? this.prisma.review.findUnique({ where: { id }, select: { id: true } })
        : type === 'question'
          ? this.prisma.question.findUnique({ where: { id }, select: { id: true } })
          : this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true } }));
    if (!exists) {
      throw new NotFoundException({ code: 'TARGET_NOT_FOUND', message: 'الحاجة اللي بتبلّغ عنها مش موجودة.' });
    }
  }

  private async targetLabels(rows: ReportRow[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    const byType = (t: string) => rows.filter((r) => r.targetType === t).map((r) => r.targetId);

    const [listings, users, reviews] = await Promise.all([
      this.prisma.property.findMany({ where: { id: { in: byType('listing') } }, select: { id: true, title: true } }),
      this.prisma.user.findMany({ where: { id: { in: byType('user') } }, select: { id: true, name: true } }),
      this.prisma.review.findMany({ where: { id: { in: byType('review') } }, select: { id: true, authorName: true } }),
    ]);
    for (const l of listings) out.set(`listing:${l.id}`, l.title);
    for (const u of users) out.set(`user:${u.id}`, u.name);
    for (const r of reviews) out.set(`review:${r.id}`, `رأي ${r.authorName}`);
    return out;
  }
}
