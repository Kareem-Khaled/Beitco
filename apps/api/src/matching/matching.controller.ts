import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';

// Renter matches (preference scoring). Auth-required: it reads the caller's own
// saved preferences. Preferences themselves are saved via PATCH /users/me.
@Controller({ path: '', version: '1' })
@ApiTags('Matching')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('me/matches')
  @ApiOperation({ summary: 'Ranked, explainable matches for my saved preferences' })
  matches(@CurrentUser() me: AuthUser, @Query('limit') limit?: string) {
    const n = limit ? Math.min(50, Math.max(1, parseInt(limit, 10) || 24)) : 24;
    return this.matching.getMatches(me.id, n);
  }
}
