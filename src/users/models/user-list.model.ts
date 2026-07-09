import { Field, Float, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType()
export class UserListModel {
  @Field(() => [UserModel])
  users!: UserModel[];

  @Field(() => Float)
  usersCount!: number;

  @Field(() => Float)
  deletedUserCount!: number;
}
