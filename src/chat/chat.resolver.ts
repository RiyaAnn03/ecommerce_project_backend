import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatInput } from './dto/chat.input';
import { ChatReplyModel } from './models/chat-reply.model';

@Resolver()
export class ChatResolver {
  constructor(private readonly chat: ChatService) {}

  @Mutation(() => ChatReplyModel)
  chatWithBot(@Args('input') input: ChatInput): Promise<ChatReplyModel> {
    return this.chat.chat(input);
  }
}
