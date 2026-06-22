import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import {
  AnswerQuestionDto,
  AskQuestionDto,
  CreateLeadDto,
  CreateSavedSearchDto,
  UpdateLeadStatusDto,
} from './dto/engagement.dto';

// Authenticated write/read endpoints for the renter↔owner journey (B-2).
@Controller({ path: '', version: '1' })
@ApiTags('Engagement')
export class EngagementController {
  constructor(private readonly svc: EngagementService) {}

  // ── Saved listings ──
  @Get('me/saved')
  @ApiOperation({ summary: 'My saved listings (summaries)' })
  listSaved(@CurrentUser() me: AuthUser) {
    return this.svc.listSaved(me.id);
  }

  @Post('properties/:id/save')
  @ApiOperation({ summary: 'Toggle saving a listing (returns new state)' })
  toggleSaved(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.svc.toggleSaved(me.id, id);
  }

  // ── Saved searches ──
  @Get('me/searches')
  @ApiOperation({ summary: 'My saved searches' })
  listSearches(@CurrentUser() me: AuthUser) {
    return this.svc.listSearches(me.id);
  }

  @Post('me/searches')
  @ApiOperation({ summary: 'Save a search' })
  createSearch(@CurrentUser() me: AuthUser, @Body() dto: CreateSavedSearchDto) {
    return this.svc.createSearch(me.id, dto);
  }

  @Delete('me/searches/:id')
  @ApiOperation({ summary: 'Delete a saved search' })
  deleteSearch(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.svc.deleteSearch(me.id, id);
  }

  // ── Leads ──
  @Post('properties/:id/leads')
  @ApiOperation({ summary: 'Request a viewing or book bed(s)/room(s)' })
  createLead(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: CreateLeadDto) {
    return this.svc.createLead(id, me.id, me.name, dto);
  }

  @Get('me/leads')
  @ApiOperation({ summary: 'My (renter) viewing/booking requests' })
  myLeads(@CurrentUser() me: AuthUser) {
    return this.svc.listRenterLeads(me.id);
  }

  @Get('me/owner-leads')
  @ApiOperation({ summary: 'Incoming requests on my listings (owner)' })
  ownerLeads(@CurrentUser() me: AuthUser) {
    return this.svc.listOwnerLeads(me.id);
  }

  @Patch('leads/:id/status')
  @ApiOperation({ summary: 'Approve / decline / complete a request (owner)' })
  updateLead(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.svc.updateLeadStatus(me.id, id, dto);
  }

  // ── Q&A ──
  @Post('properties/:id/questions')
  @ApiOperation({ summary: 'Ask a public question on a listing' })
  ask(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: AskQuestionDto) {
    return this.svc.ask(id, me.id, me.name, dto);
  }

  @Post('questions/:id/answer')
  @ApiOperation({ summary: 'Answer a question (owner)' })
  answer(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: AnswerQuestionDto) {
    return this.svc.answer(me.id, me.name, id, dto);
  }
}
