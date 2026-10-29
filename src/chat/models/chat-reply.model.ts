import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChatReplyModel {
  @Field()
  reply!: string;
}
