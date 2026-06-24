import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { PresignUploadDto } from './dto/presign-upload.dto';

// PROD-1: direct-to-storage image uploads. Auth-required; keys are namespaced
// by the caller's user id.
@Controller({ path: 'uploads', version: '1' })
@ApiTags('Uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Whether direct uploads are configured (else use base64 fallback)' })
  config() {
    return { configured: this.uploads.isConfigured };
  }

  @Post('presign')
  @ApiOperation({ summary: 'Get a presigned PUT URL for a listing image' })
  presign(@CurrentUser() me: AuthUser, @Body() dto: PresignUploadDto) {
    return this.uploads.presign(me.id, dto.contentType, dto.contentLength);
  }
}
