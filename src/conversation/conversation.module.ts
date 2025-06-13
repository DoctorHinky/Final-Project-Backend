import { forwardRef, Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ChatModule } from 'src/chat/chat.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FriendModule } from 'src/friend/friend.module';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
  imports: [forwardRef(() => ChatModule), PrismaModule, FriendModule],
})
export class ConversationModule {}
