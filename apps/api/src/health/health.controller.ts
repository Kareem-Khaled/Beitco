import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @Public()
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
