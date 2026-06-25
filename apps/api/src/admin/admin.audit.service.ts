import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

// ADMIN-12: append-only audit log. Every operator mutation calls log(); writes
// are best-effort (a logging failure must never break the action it records).
export interface AuditActor {
  id: string;
  name: string;
}

interface AuditLogRow {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  meta: unknown;
  createdAt: Date;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Record an admin action. `admin` is the AuthUser (or a {id,name}); meta holds
  // the reason + any before/after. Never throws.
  async log(
    admin: AuthUser | AuditActor,
    action: string,
    targetType: string,
    targetId?: string | null,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action,
          targetType,
          targetId: targetId ?? null,
          meta: (meta as object) ?? undefined,
        },
      });
    } catch (err) {
      this.logger.error(`audit log failed for ${action}/${targetType}: ${String(err)}`);
    }
  }

  // Read the log, newest first. Optional filters by admin / target / action.
  async list(query: {
    adminId?: string;
    targetType?: string;
    targetId?: string;
    action?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ data: Record<string, unknown>[]; meta: { cursor: string | null; hasMore: boolean } }> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const where = {
      ...(query.adminId ? { adminId: query.adminId } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
      ...(query.action ? { action: { contains: query.action } } : {}),
    };
    const rows = (await this.prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })) as unknown as AuditLogRow[];

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      data: page.map((r) => ({
        id: r.id,
        adminId: r.adminId,
        adminName: r.adminName,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId ?? undefined,
        meta: r.meta ?? undefined,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { cursor: hasMore ? (page[page.length - 1]?.id ?? null) : null, hasMore },
    };
  }
}
