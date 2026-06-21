import type { ReportReason, ReportStatus, ReportAction } from './enums';

export interface ReportSummary {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'user' | 'group' | 'listing';
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  actionTaken: ReportAction;
  aiSeverityScore: number;
  createdAt: string;
  reviewedAt: string | null;
}
