import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness check (process is up)' })
  check() {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check — pings Postgres + Redis (503 if down)' })
  async ready(@Res({ passthrough: true }) res: Response) {
    const result = await this.health.checkReadiness();
    res.status(result.ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
