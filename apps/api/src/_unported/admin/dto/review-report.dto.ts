import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus, ReportAction } from '@prisma/client';

/**
 * DTO for reviewing a report (approve action or dismiss).
 */
export class ReviewReportDto {
  @ApiProperty({
    description: 'New report status',
    enum: ['resolved', 'dismissed'],
    example: 'resolved',
  })
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @ApiProperty({
    description: 'Action taken',
    enum: ReportAction,
    example: 'content_removed',
  })
  @IsEnum(ReportAction)
  actionTaken!: ReportAction;
}
