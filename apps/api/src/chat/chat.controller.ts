import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { CreateThreadDto, SendMessageDto } from './dto/chat.dto';

// Direct messaging between a renter and an owner about a listing ("kallem
// sahib el-sha2a"). Auth-required; every action is participant-checked.
@Controller({ path: '', version: '1' })
@ApiTags('Chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('me/threads')
  @ApiOperation({ summary: 'My conversations (owner or renter), newest first' })
  myThreads(@CurrentUser() me: AuthUser) {
    return this.chat.listThreads(me.id);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'A thread with its full message history (marks read)' })
  thread(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.chat.getThread(me.id, id);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Start (or re-open) a thread about a listing' })
  create(@CurrentUser() me: AuthUser, @Body() dto: CreateThreadDto) {
    return this.chat.findOrCreate(me.id, dto);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send a message into a thread' })
  send(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chat.sendMessage(me.id, id, dto);
  }
}
