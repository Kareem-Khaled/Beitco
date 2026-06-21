import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public, RequireTier } from '../auth/decorators';
import { VideosService } from './videos.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { RecordWatchDto } from './dto/record-watch.dto';

@ApiTags('Videos')
@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // ── POST /videos/upload-url — get upload URL (Tier 2) ──
  @Post('upload-url')
  @RequireTier(2)
  @HttpCode(HttpStatus.CREATED)
  async createUploadUrl(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateUploadUrlDto,
  ) {
    const result = await this.videosService.createUploadUrl(userId, dto);
    return { success: true, data: result };
  }

  // ── GET /videos/:id/status — video processing status ──
  @Get(':id/status')
  @Public()
  async getStatus(@Param('id', ParseUUIDPipe) id: string) {
    const status = await this.videosService.getStatus(id);
    return { success: true, data: status };
  }

  // ── GET /videos/:id — full video detail ───────────────
  @Get(':id')
  @Public()
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const video = await this.videosService.findById(id);
    return { success: true, data: video };
  }

  // ── POST /videos/:id/watch — record watch event ──────
  @Post(':id/watch')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordWatch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RecordWatchDto,
  ) {
    await this.videosService.recordWatch(id, userId, dto);
  }

  // ── POST /videos/webhooks/mux — Mux webhook (no auth) ─
  @Post('webhooks/mux')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: Record<string, unknown>) {
    await this.videosService.handleWebhook(payload);
    return { success: true };
  }

  // ── POST /videos/:id/dev-ready — dev: simulate ready ──
  @Post(':id/dev-ready')
  @Public()
  @HttpCode(HttpStatus.OK)
  async devSimulateReady(@Param('id', ParseUUIDPipe) id: string) {
    const video = await this.videosService.devSimulateReady(id);
    return { success: true, data: video };
  }
}
