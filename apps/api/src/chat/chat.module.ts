import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

// REST chat (CHAT-1). PrismaModule + TrustModule are global, so no imports
// needed. A Socket.io gateway for live delivery is a follow-up (CHAT-2).
@Module({
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
