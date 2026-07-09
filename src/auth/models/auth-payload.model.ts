import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType()
export class AuthPayloadModel {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field()
  userId!: string;

  @Field(() => UserModel)
  user!: UserModel;
}

