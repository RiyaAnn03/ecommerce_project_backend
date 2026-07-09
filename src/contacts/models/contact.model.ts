import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ContactStatus } from '@prisma/client';

@ObjectType()
export class ContactModel {
  @Field(() => ID)
  id!: string;

  @Field()
  fullName!: string;

  @Field()
  email!: string;

  @Field()
  mobile!: string;

  @Field()
  message!: string;

  @Field(() => ContactStatus)
  status!: ContactStatus;

  @Field()
  createdAt!: Date;
}
