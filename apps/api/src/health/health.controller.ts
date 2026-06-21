import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  // Public by default: the global JwtAuthGuard returns with the auth module (A-1).
  @Get()
  @ApiOperation({ summary: 'Health check' })
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
}
