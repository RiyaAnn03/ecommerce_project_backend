import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role } from '@prisma/client';

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field()
  mobile!: string;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => Role)
  role!: Role;

  @Field()
  createdAt!: Date;
}
