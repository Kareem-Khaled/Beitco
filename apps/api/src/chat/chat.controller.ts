import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateConversationDto, SendMessageDto } from './dto';

/**
 * Chat endpoints — REST fallback for real-time messaging.
 * All endpoints require authentication.
 */
@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List my conversations' })
  async getConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.chatService.getConversations(user.id, query);
    return { success: true, ...result };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation (or reuse existing)' })
  async createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    const conversation = await this.chatService.createConversation(user.id, dto);
    return { success: true, data: conversation };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a single conversation' })
  async getConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const conversation = await this.chatService.getConversation(id, user.id);
    return { success: true, data: conversation };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.chatService.getMessages(id, user.id, query);
    return { success: true, ...result };
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(id, user.id, dto);
    return { success: true, data: message };
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.chatService.markAsRead(id, user.id);
    return { success: true, data: result };
  }
}
